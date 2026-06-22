// WE WebRTC UI Control Layer (Hyper-Cyberized Version)
document.addEventListener("DOMContentLoaded", () => {
    const rtc = new WebRTCManager();
    let html5QrcodeScanner = null;
    let isHost = false;

    // DOM要素
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
    const sysBadge = document.getElementById("sys-badge");

    function missionLog(type, message) {
        const time = new Date().toLocaleTimeString();
        const logLine = document.createElement("div");
        logLine.textContent = `[${time}] [${type}] ${message}`;
        
        if (type === "ERROR") logLine.style.color = "#ff3333";
        if (type === "STATE_CHANGE") logLine.style.color = "#00e676";
        if (type === "RECEIVE") logLine.style.color = "#00b0ff";
        if (type === "SEND") logLine.style.color = "#ff9100";
        
        logArea.appendChild(logLine);
        logArea.scrollTop = logArea.scrollHeight;
    }

    rtc.onLogCallback = (type, msg) => {
        missionLog(type, msg);
    };

    rtc.onLocalDescriptionCreated = (sdpText) => {
        const sdpObj = {
            type: rtc.peerConnection.localDescription.type,
            sdp: sdpText
        };
        const sdpString = JSON.stringify(sdpObj);
        textLocalSdp.value = sdpString;

        const qrContainer = document.getElementById("qrcode");
        qrContainer.innerHTML = "";
        QRCode.toCanvas(sdpString, { width: 210, errorCorrectionLevel: 'L' }, (error, canvas) => {
            if (error) {
                missionLog("ERROR", `QR生成失敗: ${error}`);
                return;
            }
            qrContainer.appendChild(canvas);
            missionLog("STATE_CHANGE", "同期コードのエクスポート完了。相手の入力待ち。");
            if(typeof playBeep === "function") playBeep(880, 0.15);
        });
    };

    rtc.onMessageReceived = (text) => {
        appendMessage("peer", text);
        if(typeof playBeep === "function") playBeep(587.33, 0.08); // メッセージ受信音(レ)
    };

    // 接続成立時のオーラ変更処理
    rtc.onConnectionStateChanged = (state) => {
        if (state === "connected") {
            if(typeof playSuccessSound === "function") playSuccessSound(); // 歓喜のファンファーレ
            
            sysBadge.textContent = "STATUS: CONNECTED // P2Pセッション確立";
            sysBadge.style.color = "#00e676";
            sysBadge.style.textShadow = "0 0 8px #00e676";

            panelLocalOutput.style.opacity = "0.2";
            panelRemoteInput.style.display = "none";
            panelSetup.style.display = "none";
            panelChat.style.display = "block";
            
            panelChat.classList.add("mode-blue"); // まず青色オーラ
        }
    };

    // 鍵交換完了で「究極の暗号化オーラ(紫)」にトランスフォーム
    rtc.onKeyExchangeComplete = (fingerprint) => {
        if(typeof playBeep === "function") {
            setTimeout(() => playBeep(1174.66, 0.05), 0);
            setTimeout(() => playBeep(1318.51, 0.05), 50);
            setTimeout(() => playBeep(1567.98, 0.15), 100); // シャキーン音
        }
        
        sysBadge.textContent = `STATUS: SECURE // E2EE暗号化開通`;
        sysBadge.style.color = "#d500f9";
        sysBadge.style.textShadow = "0 0 10px #d500f9";

        missionLog("STATE_CHANGE", `【暗号化完了】X25519鍵共有に成功。検証ID: ${fingerprint}`);
        
        // オーラを紫にスイッチ
        panelChat.classList.remove("mode-blue");
        panelChat.classList.add("mode-purple");

        const chatTitle = document.getElementById("chat-title");
        if (chatTitle) {
            chatTitle.innerHTML = `<span>🔐</span> 完全暗号化回線 // 検証コード: ${fingerprint}`;
            chatTitle.style.color = "#d500f9";
            chatTitle.style.textShadow = "0 0 10px rgba(213,0,249,0.6)";
        }
    };

    function appendMessage(sender, text) {
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("msg", sender);
        msgDiv.textContent = text;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    btnCopyLocal.addEventListener("click", () => {
        navigator.clipboard.writeText(textLocalSdp.value)
            .then(() => missionLog("ACTION", "同期コードをクリップボードに記憶しました！"))
            .catch(() => missionLog("ERROR", "コピーに失敗しました"));
    });

    btnInitiate.addEventListener("click", () => {
        isHost = true;
        btnInitiate.disabled = true;
        btnJoin.disabled = true;
        sysBadge.textContent = "STATUS: HOSTING // 相手からの接続を待機中";
        localTitle.innerHTML = "<span>📡</span> 1. あなたの同期コード (相手に読み取らせる)";
        panelLocalOutput.style.display = "block";
        panelRemoteInput.style.display = "block";
        panelRemoteInput.classList.add("mode-blue");
        rtc.createOffer();
    });

    btnJoin.addEventListener("click", () => {
        isHost = false;
        btnInitiate.disabled = true;
        btnJoin.disabled = true;
        sysBadge.textContent = "STATUS: JOINING // ホストノードに同期中";
        panelRemoteInput.style.display = "block";
        panelRemoteInput.classList.add("mode-blue");
        missionLog("ACTION", "ホストのQRをスキャンするか、テキストを貼り付けてください。");
    });

    btnScanRemote.addEventListener("click", () => {
        html5QrcodeScanner = new Html5Qrcode("reader");
        html5QrcodeScanner.start(
            { facingMode: "environment" },
            { fps: 12, qrbox: { width: 220, height: 220 } },
            async (decodedText) => {
                textRemoteSdp.value = decodedText;
                await html5QrcodeScanner.stop();
                if(typeof playBeep === "function") playBeep(880, 0.1);
                missionLog("STATE_CHANGE", "スキャン成功。確定ボタンを押してください。");
            },
            (err) => {}
        ).catch(err => missionLog("ERROR", `カメラ起動失敗: ${err}`));
    });

    btnApplyRemote.addEventListener("click", async () => {
        const rawValue = textRemoteSdp.value.trim();
        if (!rawValue) {
            missionLog("ERROR", "入力エリアが空です。");
            return;
        }

        try {
            const remoteSdp = JSON.parse(rawValue);
            
            if (isHost) {
                if (remoteSdp.type !== "answer") {
                    missionLog("ERROR", "ホスト側は『answer』コードを読み込む必要があります。");
                    return;
                }
                await rtc.acceptAnswer(remoteSdp.sdp);
            } else {
                if (remoteSdp.type !== "offer") {
                    missionLog("ERROR", "参加者側は『offer』コードを読み込む必要があります。");
                    return;
                }
                localTitle.innerHTML = "<span>📡</span> 2. あなたの同期コード (ホストに送り返す)";
                panelLocalOutput.style.display = "block"; 
                await rtc.createAnswer(remoteSdp.sdp);
            }
        } catch (e) {
            missionLog("ERROR", `パケットの同期失敗: ${e.message}`);
        }
    });

    btnSend.addEventListener("click", () => {
        const text = inputMsg.value.trim();
        if (!text) return;
        if (rtc.sendMessage(text)) {
            appendMessage("me", text);
            inputMsg.value = "";
            if(typeof playBeep === "function") playBeep(440, 0.05); // 送信音(ラ)
        }
    });

    inputMsg.addEventListener("keypress", (e) => {
        if (e.key === "Enter") btnSend.click();
    });
});
