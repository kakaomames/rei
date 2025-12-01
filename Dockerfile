# ----------------------------------------------------
# ステージ 1: ベースイメージとシステム依存関係のインストール
# ----------------------------------------------------
# Python 3.11 Slim イメージを使用 (軽量で、aptを使用可能)
FROM python:3.11-slim

# OSのパッケージリストを更新し、必要なシステムツールをインストール
# curl: Rustupのダウンロードに使用
# build-essential: Rustのビルドプロセスに必要
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    pkg-config && \
    rm -rf /var/lib/apt/lists/*

# ----------------------------------------------------
# ステージ 2: Rust および wasm-pack のインストール
# ----------------------------------------------------

# 2.1. Rustup (Rustの公式インストーラ) を使ってRustをインストール
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y

# 2.2. 🚨 エラー対策の最重要ポイント: PATHの設定 🚨
# Rustupは通常、ユーザーのホームディレクトリ（この場合 /root）配下の .cargo/bin に
# バイナリ（rustc, cargo）をインストールする。これをシステムのPATHに追加する。
ENV PATH="/root/.cargo/bin:${PATH}"

# 2.3. wasm-pack をインストール
# PATHが設定されたため、ここで cargo コマンドが実行できる
RUN cargo install wasm-pack

# ----------------------------------------------------
# ステージ 3: Python アプリケーションのセットアップ
# ----------------------------------------------------

# アプリケーションの作業ディレクトリを設定
WORKDIR /usr/src/app

# Pythonの依存関係ファイルをコピー
# (requirements.txtには Flask, flask-cors, gunicorn が含まれている必要がある)
COPY requirements.txt .

# Pythonの依存関係をインストール
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコンテナにコピー
# (app.py など)
COPY . .

# ----------------------------------------------------
# ステージ 4: コンテナ起動コマンド
# ----------------------------------------------------

# RenderのWeb Serviceとして、Gunicornを使ってFlaskアプリケーションを起動
# 環境変数 PORT (render.yamlで8000に設定) を使用する
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
