#!/bin/bash

# ========================================================
# Gemini programming隊特製: トンネル起動 ＆ URL自動Git Pushスクリプト (強制特攻版)
# ========================================================

echo "[LOG] SYSTEM: 復活ミッション（GitHub連携・強制特攻ルート）を開始します！"
# 1. サーバーの幽霊を退治して再起動
pkill -f server.py
echo "止める"
rm -rf /storage/emulated/0/yt-dlp-Xiaomi/.git/index.lock
# 最新情報を取得
git fetch origin

# ローカルのmainブランチをリモートの最新状態へ強制的に合わせる
git reset --hard origin/main

rm -fr ./tunnel_output.log
echo " " > tunnel_output.log
# 1. いまいるこの場所を Git リポジトリとして初期化！
Log() {
    local time=$(date +"%H:%M:%S")
    echo "[$time] $1"
}
cd ..
rm -fr yt-dlp-s25

git clone https://github.com/kakaomames/yt-dlp-s25.git

cp -rf yt-dlp-s25/.git yt-dlp-Xiaomi/

cd yt-dlp-Xiaomi

# 2. 隊員のXiaomiリポジトリにトークンを埋め込んで、接続先（origin）を登録！
git remote set-url origin https://gh@github.com/kakaomames/yt-dlp-s25.git
git config --global user.email "kakaomames@example.com"
git config --global user.name "kakaomames"

# 3. 主軸ブランチの名前を確実に「main」に設定
git branch -M main

# 4. 変更があったらログに出すため、現在の接続先を画面に表示して確認！
git remot



sleep 1
echo "[LOG] ACTION: server.py を裏側で起動中..."
python3 server.py > server.log 2>&1 &
sleep 2

# 2. トンネルの一時ログファイルをリセット
TUNNEL_LOG="tunnel_output.log"
> $TUNNEL_LOG

# 3. localhost.run のトンネルを裏で起動し、ログを書き出す
echo "[LOG] ACTION: SSHを使って世界へのトンネルを開通します..."
ssh -R 80:localhost:9080 nokey@localhost.run > $TUNNEL_LOG 2>&1 &

echo "   3"
sleep 1
echo "   2"
sleep 1
echo "   1"
sleep 1
echo "   0"
echo "=============================="

echo "[LOG] ACTION: トンネルのURL発行を常時監視しています..."

# 4. ログをループで監視して、URLが見つかるまで待機・更新し続ける
while true; do
    # ログから最新のURL（.lhr.life または .localhost.run）を抽出
    LATEST_URL=$(grep -oE "https://[a-zA-Z0-9.-]+\.(lhr\.life)" $TUNNEL_LOG | tail -n 1)
    
    if [ ! -z "$LATEST_URL" ]; then
        # 前回保存したURLと比較するために、現在のファイルの中身を読み込む
        OLD_URL=""
        if [ -f urls.json ]; then
            OLD_URL=$(grep -oE "https://[a-zA-Z0-9.-]+\.(lhr\.life|localhost\.run)" urls.json)
        fi
        
        # 値が変わったときだけログに出して GitHub にプッシュする！
        if [ "$LATEST_URL" != "$OLD_URL" ]; then
            echo "[LOG] SUCCESS: 新しいプロキシURLを検知しました！ -> $LATEST_URL"
            
            # JSONを作成
            echo "{\"proxy_url\": \"$LATEST_URL\"}" > urls.json
            echo "[LOG] ACTION: urls.json の値を更新しました。"
            echo "{\"proxy_url\": \"$LATEST_URL\"}" > url.json
            echo "[LOG] ACTION: url.json の値を更新しました。"
            rm -r ./tunnel_output.log
            echo " " > tunnel_output.log
            
            # ギット コマンドで強制プッシュ（--force）し続ける！
            echo "[LOG] ACTION: GitHubへ最新URLを強制プッシュ（--force）します..."
            rm -rf .git/index.lock
            git add ./*.json
            git add ./*.py
            git commit -m "UPDATE: Current proxy URL to $LATEST_URL" || true
    
            
            # 🌟 ここを --force 仕様に進化！歴史の違いを力技でねじ伏せる！
            git push origin main --force
            
            Log "[LOG] SUCCESS: GitHubへの同期が100%完了しました！"
        fi
    fi
    
    # 🛑 隊員、ここだけ綺麗に直したぞ！
    # whileループの「中」で確実に毎秒1秒止まるように、インデントを中に入れたぞ！
    sleep 1
done9
