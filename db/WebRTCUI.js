// WE WebRTC UI Control Layer
document.addEventListener("DOMContentLoaded", () => {
    const rtc = new WebRTCManager();
    let html5QrcodeScanner = null;
    let isHost = false;

    // DOM要素一括マッピング
    const btnInitiate = document.getElementById("btn-initiate");
    const btnJoin = document.getElementById("btn-join");
    const panelSetup = document.getElementById("panel-setup");
    const panelLocalOutput = document.getElementById("panel-local-output");
    const localTitle = document.getElementById("local-title");
    const textLocalSdp = document.getElementById("text-local-sdp");
    const btnCopyLocal = document.getElementById("btn-copy-local");
    const panelRemoteInput = document.getElementById("panel-remote-input");
    const btnScanRemote = document.getElementById("btn-scan-remote");
    const textRemoteSdp = document.getElementById("text-remote-sdp");
    const btnApplyRemote = document.getElementById("btn-apply-remote");
    const panelChat = document.getElementById("panel-chat");
    const chatBox = document.getElementById("chat-box");
    const inputMsg = document.getElementById("input-msg");
    const btnSend = document.getElementById("btn-send");
    const logArea = document.getElementById("log-area");

    // 統一ミッションログ出力システム（値の変動はここに集約！）
    function missionLog(type, message) {
        const time = new Date().toLocaleTimeString();
        const logLine = document.createElement("div");
        logLine.textContent = `[${time}] [${type}] ${message}`;
        
        // SF風カラーリングパッチ
        if (type === "ERROR") logLine.style.color = "#ff3333";
        if (type === "STATE_CHANGE") logLine.style.color = "#00e676";
        if (type === "RECEIVE") logLine.style.color = "#00b0ff";
        if (type === "SEND") logLine.style.color = "#ff9100";
        
        logArea.appendChild(logLine);
        logArea.scrollTop = logArea.scrollHeight;
    }

    // ロジック層からの出力を画面のログパネルへブリッジ
    rtc.onLogCallback = (type, msg) => {
        missionLog(type, msg);
    };

    // ローカルSDP構築完了時にQRコードとコピペエリアをアクティベート
    rtc.onLocalDescriptionCreated = (sdpText) => {
        const sdpObj = {
            type: rtc.peerConnection.localDescription.type,
            sdp: sdpText
        };
        const sdpString = JSON.stringify(sdpObj);
        textLocalSdp.value = sdpString;

        // QRコード生成実行
        const qrContainer = document.getElementById("qrcode");
        qrContainer.innerHTML = "";
        QRCode.toCanvas(sdpString, { width: 220, errorCorrectionLevel: 'L' }, (error, canvas) => {
            if (error) {
                missionLog("ERROR", `QRコード生成失敗: ${error}`);
                return;
            }
            qrContainer.appendChild(canvas);
            missionLog("STATE_CHANGE", "セッションコード(QR/TEXT)の暗号エクスポートが完了。");
        });
    };

    // 暗号復号済みメッセージのチャット欄投影
    rtc.onMessageReceived = (text) => {
        appendMessage("peer", text);
    };

    // 接続成立によるUIの動的トランスフォーム
    rtc.onConnectionStateChanged = (state) => {
        if (state === "connected") {
            panelLocalOutput.style.opacity = "0.25";
            panelRemoteInput.style.display = "none";
            panelChat.style.display = "block";
            panelSetup.style.display = "none";
            
            // パネルのネオンカラーをアクティブグリーンに変更
            panelChat.style.borderColor = "#00e676";
            panelChat.style.boxShadow = "inset 0 0 15px rgba(0,230,118,0.05), 0 0 15px rgba(0,230,118,0.3)";
            
            if(html5QrcodeScanner) {
                html5QrcodeScanner.clear().catch(err => console.error(err));
            }
        }
    };

    // X25519鍵共有完了フック ➔ チャットタイトルの表記を暗号化済みに変更
    rtc.onKeyExchangeComplete = (fingerprint) => {
        missionLog("STATE_CHANGE", `【E2EE暗号化開通】秘密鍵共有完了。FINGERPRINT: ${fingerprint}`);
        const chatTitle = document.querySelector("#panel-chat h3");
        if (chatTitle) {
            chatTitle.innerHTML = `<span>🔐</span> E2EE ENCRYPTED CHANNEL // KEY: ${fingerprint}`;
            chatTitle.style.color = "#00e676";
            chatTitle.style.textShadow = "0 0 8px rgba(0,230,118,0.5)";
        }
    };

    function appendMessage(sender, text) {
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("msg", sender);
        msgDiv.textContent = text;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // クリップボードインジェクション
    btnCopyLocal.addEventListener("click", () => {
        navigator.clipboard.writeText(textLocalSdp.value)
            .then(() => missionLog("ACTION", "ローカルノードデータをクリップボードへ複写しました。"))
            .catch(() => missionLog("ERROR", "複写権限が拒否されました。"));
    });

    // --- シグナリングフローコントローラー ---

    // ホストモード起動
    btnInitiate.addEventListener("click", () => {
        isHost = true;
        btnInitiate.disabled = true;
        btnJoin.disabled = true;
        localTitle.innerHTML = "<span>📡</span> 1. LOCAL OFFER KEY (SEND TO PEER)";
        panelLocalOutput.style.display = "block";
        panelRemoteInput.style.display = "block";
        panelRemoteInput.classList.add("active-neon-blue"); // 待ち受け状態を青色ネオンで明示
        rtc.createOffer();
    });

    // ピアモード起動
    btnJoin.addEventListener("click", () => {
        isHost = false;
        btnInitiate.disabled = true;
        btnJoin.disabled = true;
        panelRemoteInput.style.display = "block";
        panelRemoteInput.classList.add("active-neon-blue");
        missionLog("ACTION", "ホストデータのインプット待機状態へ移行。");
    });

    // 光学カメラスキャナーアクティベート
    btnScanRemote.addEventListener("click", () => {
        html5QrcodeScanner = new Html5Qrcode("reader");
        html5QrcodeScanner.start(
            { facingMode: "environment" },
            { fps: 12, qrbox: { width: 220, height: 220 } },
            async (decodedText) => {
                textRemoteSdp.value = decodedText;
                await html5QrcodeScanner.stop();
                missionLog("STATE_CHANGE", "光学スキャン成功。データをパケットスロットへ充填しました。");
            },
            (err) => {}
        ).catch(err => missionLog("ERROR", `カメラ初期化失敗: ${err}`));
    });

    // 同期データのバインド・インプット確定
    btnApplyRemote.addEventListener("click", async () => {
        const rawValue = textRemoteSdp.value.trim();
        if (!rawValue) {
            missionLog("ERROR", "データパケットが空です。");
            return;
        }

        try {
            const remoteSdp = JSON.parse(rawValue);
            
            if (isHost) {
                if (remoteSdp.type !== "answer") {
                    missionLog("ERROR", "ホストノードは『answer』パケットを受け付ける必要があります。");
                    return;
                }
                await rtc.acceptAnswer(remoteSdp.sdp);
            } else {
                if (remoteSdp.type !== "offer") {
                    missionLog("ERROR", "ピアノードは『offer』パケットを受け付ける必要があります。");
                    return;
                }
                localTitle.innerHTML = "<span>📡</span> 2. LOCAL ANSWER KEY (RETURN TO HOST)";
                panelLocalOutput.style.display = "block"; 
                await rtc.createAnswer(remoteSdp.sdp);
            }
        } catch (e) {
            missionLog("ERROR", `データパケットの解析・同期に失敗: ${e.message}`);
        }
    });

    // シグナルパケット送信
    btnSend.addEventListener("click", () => {
        const text = inputMsg.value.trim();
        if (!text) return;
        if (rtc.sendMessage(text)) {
            appendMessage("me", text);
            inputMsg.value = "";
        }
    });

    inputMsg.addEventListener("keypress", (e) => {
        if (e.key === "Enter") btnSend.click();
    });
});
