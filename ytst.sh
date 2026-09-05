#!/bin/bash

# 1. もし引数の1つ目が「u」なら、自分自身(ytst.sh)とPythonコードを最新に更新
if [ "$1" = "u" ]; then
    echo "--- スクリプトを最新版にアップデート中... ---"
    curl -L "https://raw.githubusercontent.com/kakaomames/rei/refs/heads/main/ytst.sh" -o ytst.sh
    curl -L "https://raw.githubusercontent.com/kakaomames/rei/refs/heads/main/main.v4.py" -o main.py
    curl -L "https://github.com/kakaomames/rei/archive/refs/heads/main.zip" -o main.zip
    unzip main.zip ytst.sh
    unzip main.zip main.py
    echo "✨ アップデートが完了しました！"
    echo "動画のURLを指定してもう一度実行してください（例: ./ytst.sh URL）"
    exit 0 # アップデート時はここで処理を終了する
fi

# 2. 通常の動画解析処理
echo "解析対象: $@"
sleep 2
curl -c cookies.txt "$1"

# ※ PythonコードがGitHubから落とせていない場合のために、実行前に一応最新を落とす
if [ ! -f "main.py" ]; then
    curl -L "https://raw.githubusercontent.com/kakaomames/rei/refs/heads/main/main.v4.py" -o main.py
fi

# 💡ボット検知対策：curl -c で上書きせず、手動で置いた cookies.txt をそのままPythonに読ませる
python main.py "$1" 
