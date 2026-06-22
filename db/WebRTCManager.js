// WE WebRTC & Cryptography Connection Manager (Full E2EE Layer)
class WebRTCManager {
    constructor() {
        // パブリックなSTUNサーバーのみを使い、TURNは排してコスト0円を徹底
        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        this.peerConnection = null;
        this.dataChannel = null;

        // 暗号用ステート
        this.localKeyPair = null;     // 自分のX25519鍵ペア (秘密鍵・公開鍵)
        this.sharedSecretKey = null;   // 計算されたAES-GCM共通鍵 (CryptoKey)
        this.hasExchangedKey = false; // 鍵交換完了フラグ

        // コールバック（UI層へリアクティブに通知）
        this.onLogCallback = null;
        this.onLocalDescriptionCreated = null;
        this.onMessageReceived = null;
        this.onConnectionStateChanged = null;
        this.onKeyExchangeComplete = null;
    }

    // ログ出力トリガー
    log(type, message) {
        if (this.onLogCallback) this.onLogCallback(type, message);
    }

    // ホスト（接続開始側）としてオファーSDPを生成
    async createOffer() {
        this.log("ACTION", "PeerConnectionを初期化します(Host)...");
        this.peerConnection = new RTCPeerConnection(this.config);
        this.setupIceCandidateHandler();

        this.dataChannel = this.peerConnection.createDataChannel("chat-channel");
        this.setupDataChannelHandlers();

        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
    }

    // 参加者側としてアンサーSDPを生成
    async createAnswer(offerSdpText) {
        this.log("ACTION", "PeerConnectionを初期化します(Peer)...");
        this.peerConnection = new RTCPeerConnection(this.config);
        this.setupIceCandidateHandler();

        this.peerConnection.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this.setupDataChannelHandlers();
        };

        const offerDesc = new RTCSessionDescription({ type: 'offer', sdp: offerSdpText });
        await this.peerConnection.setRemoteDescription(offerDesc);

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
    }

    // ホスト側がリモートのAnswerを受け入れて確定
    async acceptAnswer(answerSdpText) {
        this.log("ACTION", "リモートノードのAnswerをシグナリングに適用します...");
        const answerDesc = new RTCSessionDescription({ type: 'answer', sdp: answerSdpText });
        await this.peerConnection.setRemoteDescription(answerDesc);
    }

    // ICE Candidateハンドラ
    setupIceCandidateHandler() {
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.log("ICE", `経路発見: ${event.candidate.candidate.substring(0, 30)}...`);
            } else {
                this.log("STATE_CHANGE", "ICEネットワーク経路の収集が完了しました。");
                if (this.onLocalDescriptionCreated) {
                    this.onLocalDescriptionCreated(this.peerConnection.localDescription.sdp);
                }
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            this.log("STATE_CHANGE", `WEリンク接続状態: ${this.peerConnection.connectionState}`);
            if (this.onConnectionStateChanged) {
                this.onConnectionStateChanged(this.peerConnection.connectionState);
            }
        };
    }

    // データチャンネルのイベントハンドラ群
    setupDataChannelHandlers() {
        this.dataChannel.onopen = async () => {
            this.log("STATE_CHANGE", "P2P DataChannel開通！ただちにX25519鍵交換を開始します。");
            await this.startKeyExchange();
        };

        this.dataChannel.onclose = () => {
            this.log("STATE_CHANGE", "DataChannelセッションが切断されました。");
            this.hasExchangedKey = false;
        };

        this.dataChannel.onmessage = async (event) => {
            // 文字列の場合：鍵交換シグナリング
            if (typeof event.data === "string") {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "KEY_EXCHANGE_X25519") {
                        this.log("RECEIVE", "相手ノードのX25519公開鍵を検知。共通暗号鍵を計算します...");
                        await this.computeSharedSecret(data.publicKeyBytes);
                        return;
                    }
                } catch (e) {
                    this.log("ERROR", "予期せぬテキストパケットを受信しました。");
                }
                return;
            }

            // バイナリの場合：AES-GCM暗号文メッセージ
            if (event.data instanceof ArrayBuffer) {
                if (!this.hasExchangedKey || !this.sharedSecretKey) {
                    this.log("ERROR", "共通鍵が未生成のため、暗号パケットの復号を拒否しました。");
                    return;
                }

                try {
                    this.log("RECEIVE", `暗号化パケット受信 (${event.data.byteLength} bytes)`);
                    const decryptedText = await this.decryptMessage(event.data);
                    
                    if (this.onMessageReceived) {
                        this.onMessageReceived(decryptedText);
                    }
                } catch (e) {
                    this.log("ERROR", `パケットの復号に失敗（改ざん検知または鍵の不一致）: ${e.message}`);
                }
            }
        };
    }

    // --- 🔐 X25519 鍵共有アルゴリズム ---

    async startKeyExchange() {
        this.log("ACTION", "ローカルX25519非対称鍵ペアを生成中...");
        this.localKeyPair = await window.crypto.subtle.generateKey(
            { name: "X25519" },
            true,
            ["deriveKey", "deriveBits"]
        );

        const exportedRawPublic = await window.crypto.subtle.exportKey(
            "raw",
            this.localKeyPair.publicKey
        );

        const publicKeyBytes = Array.from(new Uint8Array(exportedRawPublic));
        this.log("SEND", `自分のX25519公開鍵をインジェクション: [${publicKeyBytes.slice(0, 5).join(',')}...]`);

        this.dataChannel.send(JSON.stringify({
            type: "KEY_EXCHANGE_X25519",
            publicKeyBytes: publicKeyBytes
        }));
    }

    async computeSharedSecret(peerPublicKeyBytes) {
        const peerPublicKeyArray = new Uint8Array(peerPublicKeyBytes);

        const peerPublicKey = await window.crypto.subtle.importKey(
            "raw",
            peerPublicKeyArray,
            { name: "X25519" },
            true,
            []
        );

        // 相手の公開鍵と自分の秘密鍵を合成し、AES-GCM 256bitの鍵を直に導出
        this.sharedSecretKey = await window.crypto.subtle.deriveKey(
            { name: "X25519", public: peerPublicKey },
            this.localKeyPair.privateKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        // お互いの鍵の一致を確認するためのフィンガープリント(SHA-256)を算出
        const exportedKey = await window.crypto.subtle.exportKey("raw", this.sharedSecretKey);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", exportedKey);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const keyFingerprint = hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join(':');

        this.log("STATE_CHANGE", `エンドツーエンドの共通鍵導出に成功しました！✨`);
        this.log("STATE_CHANGE", `KEY FINGERPRINT: ${keyFingerprint}`);

        this.hasExchangedKey = true;
        if (this.onKeyExchangeComplete) {
            this.onKeyExchangeComplete(keyFingerprint);
        }
    }

    // --- 🛡️ AES-GCM 認証付き暗号・復号処理 ---

    async sendMessage(text) {
        if (!this.dataChannel || this.dataChannel.readyState !== "open") {
            this.log("ERROR", "DataChannelが未解放のため送信できません。");
            return false;
        }

        if (!this.hasExchangedKey || !this.sharedSecretKey) {
            this.log("ERROR", "暗号鍵未同期のため送信を緊急停止しました。");
            return false;
        }

        try {
            const encoder = new TextEncoder();
            const encodedText = encoder.encode(text);

            // 毎送信ごとに絶対に重複しないランダムIV(12バイト)を生成
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // AES-GCM 256bit で暗号化
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                this.sharedSecretKey,
                encodedText
            );

            // [IV 12バイト] + [暗号文＆認証タグ] をシームレスに結合
            const encryptedArray = new Uint8Array(encryptedBuffer);
            const packet = new Uint8Array(iv.length + encryptedArray.length);
            packet.set(iv, 0);
            packet.set(encryptedArray, iv.length);

            this.log("SEND", `AES-GCM暗号化完了 ➔ パケットサイズ: ${packet.byteLength} bytes を送信します`);
            
            this.dataChannel.send(packet.buffer);
            return true;
        } catch (e) {
            this.log("ERROR", `暗号化プロセスエラー: ${e.message}`);
            return false;
        }
    }

    async decryptMessage(arrayBuffer) {
        const fullPacket = new Uint8Array(arrayBuffer);

        // 先頭12バイトをIV、残りを暗号ペイロードとして分離
        const iv = fullPacket.slice(0, 12);
        const encryptedData = fullPacket.slice(12);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            this.sharedSecretKey,
            encryptedData
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    }
}
