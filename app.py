import flask
import subprocess
import os
import shutil
import uuid
import tempfile
from flask_cors import CORS # CORS対応
import json

app = flask.Flask(__name__)
# Vercelからのアクセスを許可するため、CORSを設定
CORS(app, resources={r"/api/*": {"origins": "*"}}) 

# 🚨 注意: このRenderサーバーのURLをVercel側で環境変数として設定する必要があります。

# 進捗表示のためのステータス管理 (ポーリング導入時に使用する場所の仮置き)
# 実際のRender環境では、複数のインスタンスが立ち上がる可能性があるため、
# Redisなどの外部キャッシュサービスで管理する必要がありますが、
# 単一インスタンスでのデモのために辞書を仮置きします。
task_status = {}



@app.route('/', methods=['GET'])
def health_check():
    """
    Renderのヘルスチェックに応答するためのルート
    """
    return flask.jsonify({'status': 'ok', 'service': 'wasm_compiler'}), 200



@app.route('/api/compile', methods=['POST'])
def compile_rust_to_wasm():
    data = flask.request.get_json()
    rust_code = data.get('code')
    
    if not rust_code:
        return flask.jsonify({'status': 'error', 'message': 'Code is missing'}), 400

    # 1. 一時作業ディレクトリの設定 (tempfileモジュールで /tmp 配下に作成)
    temp_dir = tempfile.mkdtemp()
    task_id = os.path.basename(temp_dir) # ディレクトリ名を task_id として利用
    print(f"Task ID: {task_id}, Temporary directory: {temp_dir}")
    
    # 状態を初期化 (ポーリング対応のために追記)
    task_status[task_id] = {'progress': 10, 'message': 'Compilation started...'}
    
    try:
        # 2. Rustプロジェクトファイルの作成 (Cargo.tomlとlib.rs)
        cargo_toml_content = f"""
[package]
name = "wasm_project_{task_id}"
version = "0.1.0"
edition = "2021"
[lib]
crate-type = ["cdylib"]
[dependencies]
wasm-bindgen = "0.2.92" 
"""
        with open(os.path.join(temp_dir, 'Cargo.toml'), 'w') as f:
            f.write(cargo_toml_content)
        
        src_dir = os.path.join(temp_dir, 'src')
        os.makedirs(src_dir, exist_ok=True)
        with open(os.path.join(src_dir, 'lib.rs'), 'w') as f:
            f.write(rust_code)
            
        task_status[task_id]['progress'] = 30
        task_status[task_id]['message'] = 'Running wasm-pack...'

        # 3. wasm-packの実行
        subprocess.run(
            ['wasm-pack', 'build', '--target', 'web', '--out-dir', 'pkg'],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            check=True,
            timeout=120
        )
        
        task_status[task_id]['progress'] = 100
        task_status[task_id]['message'] = 'Compilation successful! Ready to download.'
        print("Compilation successful! 🎉")
        
        # 4. 成功応答とダウンロード情報
        return flask.jsonify({
            'status': 'success', 
            'message': 'Compilation finished.', 
            'download_url': f'/api/download/{task_id}',
            'task_id': task_id
        })

    except subprocess.CalledProcessError as e:
        task_status[task_id]['progress'] = -1 # 失敗ステータス
        task_status[task_id]['message'] = 'Compilation failed.'
        shutil.rmtree(temp_dir, ignore_errors=True) # 失敗したら即時クリーンアップ
        return flask.jsonify({
            'status': 'error', 
            'message': 'Compilation failed', 
            'details': e.stderr
        }), 500
    except Exception as e:
        task_status[task_id]['progress'] = -1
        task_status[task_id]['message'] = 'Server error.'
        shutil.rmtree(temp_dir, ignore_errors=True)
        return flask.jsonify({'status': 'error', 'message': f'Server error: {e}'}), 500


@app.route('/api/status/<task_id>')
def get_status(task_id):
    """
    ポーリングのためのステータス確認エンドポイント
    """
    status = task_status.get(task_id)
    if status:
        return flask.jsonify(status)
    else:
        return flask.jsonify({'progress': 0, 'message': 'Task not found or finished.'}), 404


@app.route('/api/download/<task_id>')
def download_wasm(task_id):
    # 1. パスの構築 (/tmp 配下を想定)
    temp_dir = os.path.join(tempfile.gettempdir(), task_id) 
    pkg_dir = os.path.join(temp_dir, 'pkg')
    
    if not os.path.isdir(pkg_dir):
        return flask.jsonify({'status': 'error', 'message': 'Wasm package not found.'}), 404

    # 2. ZIPファイルを作成
    zip_path_base = os.path.join(tempfile.gettempdir(), f'{task_id}_wasm_pkg')
    shutil.make_archive(zip_path_base, 'zip', root_dir=pkg_dir)
    final_zip_path = zip_path_base + '.zip'
    
    # 3. ZIPファイルをクライアントに送信
    response = flask.send_file(
        final_zip_path, 
        as_attachment=True, 
        download_name=f'wasm_package_{task_id}.zip', 
        mimetype='application/zip'
    )
    
    # 4. ファイル送信後にクリーンアップを予約
    @response.call_on_close
    def remove_files():
        print(f"Cleaning up task: {task_id}")
        shutil.rmtree(temp_dir, ignore_errors=True)
        os.remove(final_zip_path)
        if task_id in task_status:
            del task_status[task_id] # ステータスも削除
    
    return response

if __name__ == '__main__':
    # Gunicorn を使用するため、このブロックはローカル実行用
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
