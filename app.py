import flask
from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import base64
import shutil
import tempfile
import json
import concurrent.futures
import time
from typing import Dict, Any

# --- 1. アプリケーション設定 ---
app = Flask(__name__)
CORS(app) # VercelからのCORSリクエストを許可

# --- 2. 非同期処理とタスク管理 ---
# タスクステータスを保持するためのグローバル辞書
# 実際の本番環境では Redis やデータベースを使用すべきだが、デバッグと PoC のためメモリに保持
TASK_STATUS: Dict[str, Any] = {}
executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)

# --- 3. バックグラウンドコンパイル処理 ---
def run_compilation_in_background(rust_code: str, task_id: str):
    """
    wasm-packコンパイルを実行し、TASK_STATUSを更新するバックグラウンド関数。
    """
    print(f"[{task_id}] Background compilation started.")
    
    # ステータスを更新 (進捗初期化)
    TASK_STATUS[task_id]['progress'] = 5
    TASK_STATUS[task_id]['message'] = 'Creating temporary directory...'
    
    temp_dir = None
    try:
        # 一時ディレクトリを作成
        temp_dir = tempfile.mkdtemp()
        
        # Cargo.tomlとRustソースファイル (src/lib.rs) のパスを定義
        os.makedirs(os.path.join(temp_dir, 'src'), exist_ok=True)
        
        # Cargo.tomlを書き込む
        cargo_toml_content = f"""
[package]
name = "wasm-project"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2.92"
"""
        with open(os.path.join(temp_dir, 'Cargo.toml'), 'w') as f:
            f.write(cargo_toml_content)
        
        # Rustコードを lib.rs に書き込む
        with open(os.path.join(temp_dir, 'src', 'lib.rs'), 'w') as f:
            f.write(rust_code)
            
        TASK_STATUS[task_id]['progress'] = 20
        TASK_STATUS[task_id]['message'] = 'Wasm-pack build starting...'
        
        # wasm-pack を実行
        # check=True により、コンパイル失敗時に CalledProcessError が発生する
        result = subprocess.run(
            ['wasm-pack', 'build', '--target', 'web', '--out-dir', 'pkg', '--release'], # リリースビルドで速度とサイズを最適化
            cwd=temp_dir,
            capture_output=True,
            text=True,
            check=True,
            timeout=500 # Gunicornタイムアウトより短く設定 (万が一のデッドロック防止)
        )
        
        # コンパイル成功: pkgディレクトリから必要なファイルを読み込む
        pkg_dir = os.path.join(temp_dir, 'pkg')
        
        # wasmバイナリ (wasm-project_bg.wasm) を読み込む
        wasm_file = 'wasm_project_bg.wasm'
        with open(os.path.join(pkg_dir, wasm_file), 'rb') as f:
            wasm_binary = f.read()
            
        # JSバインディングファイル (wasm_project.js) を読み込む
        js_file = 'wasm_project.js'
        with open(os.path.join(pkg_dir, js_file), 'r') as f:
            js_code = f.read()
        
        # 成功ステータスと結果を保存
        TASK_STATUS[task_id]['progress'] = 100
        TASK_STATUS[task_id]['status'] = 'completed'
        TASK_STATUS[task_id]['wasm_base64'] = base64.b64encode(wasm_binary).decode('utf-8')
        TASK_STATUS[task_id]['js_code'] = js_code
        TASK_STATUS[task_id]['message'] = "Compilation successful!"
        
        print(f"[{task_id}] Background compilation finished successfully.")

    except subprocess.CalledProcessError as e:
        # コンパイルエラーが発生した場合
        error_message = f"Rust compilation error. Stderr: {e.stderr[:500]}..."
        TASK_STATUS[task_id]['status'] = 'error'
        TASK_STATUS[task_id]['message'] = error_message
        TASK_STATUS[task_id]['progress'] = 0
        print(f"[{task_id}] Compilation failed: {e.stderr}")
        
    except Exception as e:
        # その他の予期せぬエラーが発生した場合
        error_message = f"Internal server error during compilation: {e}"
        TASK_STATUS[task_id]['status'] = 'error'
        TASK_STATUS[task_id]['message'] = error_message
        TASK_STATUS[task_id]['progress'] = 0
        print(f"[{task_id}] Internal error: {e}")
        
    finally:
        # 一時ディレクトリを必ず削除
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


# --- 4. ルート定義 ---

@app.route('/', methods=['GET'])
def health_check():
    """
    Renderのヘルスチェックに応答するためのルート
    """
    return jsonify({'status': 'ok', 'service': 'wasm_compiler'}), 200
    print(r"{'status': 'ok', 'service': 'wasm_compiler'}")

@app.route('/api/compile', methods=['POST'])
def compile_proxy_requests():
    """
    リクエストを受け付け、即座にタスクIDを返し、コンパイルをバックグラウンドで開始する。
    """
    try:
        rust_code = request.get_json().get('code')
    except Exception:
        return jsonify({'status': 'error', 'message': 'Invalid JSON or missing "code" field.'}), 400

    # 独自のタスクIDを生成
    task_id = os.urandom(8).hex()

    print(f"{task_id}")
    
    # ステータスを初期化し、即座にTASK_STATUSに登録
    TASK_STATUS[task_id] = {
        'status': 'in_progress', 
        'progress': 0, 
        'message': 'Task received and queued.',
        'result': None 
    }
    
    # コンパイルをバックグラウンドスレッドに投げる
    # submit は即座に Future オブジェクトを返すため、リクエストをブロックしない
    executor.submit(run_compilation_in_background, rust_code, task_id)
    
    # Vercelに即座にタスクIDを返す (202 Accepted)
    return jsonify({'status': 'received', 'task_id': task_id}), 202

@app.route('/api/status/<task_id>', methods=['GET'])
def get_compilation_status(task_id):
    """
    タスクIDの進捗と最終結果を返すポーリングルート。
    """
    status = TASK_STATUS.get(task_id)
    print(f"{status}")
    
    if not status:
        return jsonify({'status': 'error', 'message': 'Task ID not found.'}), 404
        
    # 結果が完了またはエラーの場合、メモリから削除してリソースを解放する (必須)
    if status['status'] in ('completed', 'error'):
        # 応答をコピーしてから削除
        response = status.copy() 
        print(f"{response}")
        # メモリリソースを解放するためタスクを削除
        TASK_STATUS.pop(task_id, None) 
        return jsonify(response), 200
        
    # 処理中の場合は進捗を返す
    return jsonify(status), 200

# if __name__ == '__main__':
#     # ローカルテスト用 (RenderではGunicornが使用するため不要)
#     app.run(debug=True, port=8000)
