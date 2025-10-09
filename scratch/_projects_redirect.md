---
# 必須設定: レイアウトを空に設定し、Jekyllが通常のページとして処理しないようにします。
layout: null 
# 必須設定: パーマリンク（このファイルの実際のURL）を設定しますが、リダイレクトではあまり重要ではありません。
permalink: /rei/scratch/projects/redirect-handler/ 

# 👇 ここが核心です！
# /projects/ のパスから始まる全てのアクセスを、
# このファイルのディレクトリパス (/rei/scratch/projects/) を起点とした
# 同じ相対パスにリダイレクトさせます。
redirect_from: /projects/
---
