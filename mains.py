from flask import Flask, request, jsonify
import subprocess

app = Flask(__name__)

@app.route('/test', methods=['POST'])
def test_echo():
    # JSONまたはFormデータから 'id' または 'url' を取得
    data = request.get_json(silent=True) or request.form
    
    target_id = data.get('id')
    target_url = data.get('url')
    
    # どちらの値を使用するか決定（urlを優先、なければid）
    input_value = target_url or target_id
    
    if not input_value:
        return jsonify({"error": "ID or URL is required"}), 400
        
    try:
        # 安全のため shell=True は使わず、リスト形式で引数を渡します
        # echo コマンドを実行して、その結果を取得
        result = subprocess.run(
            ['echo', str(input_value)], 
            capture_output=True, 
            text=True, 
            check=True
        )
        
        # 標準出力を取得（末尾の改行を削除）
        output = result.stdout.strip()
        
        return jsonify({
            "status": "success",
            "command_output": output
        }), 200

    except subprocess.CalledProcessError as e:
        return jsonify({
            "status": "error",
            "message": f"Command failed: {e.stderr}"
        }), 500
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
