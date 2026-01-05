from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
import json
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'gemini_programming_team_secret!'

# 通信の要！CORSを許可して別ドメイン（Vercelなど）からの接続を可能にする
socketio = SocketIO(app, cors_allowed_origins="*")
print(f"socketio_initialized: True")

# --- データ管理：基地のログ (game_data.json) ---
DATA_FILE = 'game_data.json'
print(f"DATA_FILE: {DATA_FILE}")

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            d = json.load(f)
            print(f"loaded_data: {d}")
            return d
    # 初期データ。バックスラッシュはそのまま維持する設定だ！
    init = {"players": {}, "items": []}
    print(f"initial_data_set: {init}")
    return init

# 現在のサーバーメモリ上のデータ
game_state = load_data()
print(f"game_state: {game_state}")

# --- WebSocket部隊：リアルタイム同期任務 ---

@socketio.on('connect')
def handle_connect():
    sid = request.sid
    print(f"connected_sid: {sid}")
    # 接続した隊員に、現在の全プレイヤーの位置を教える
    emit('sync_all_players', game_state['players'])
    print(f"Sent sync_all_players to: {sid}")

@socketio.on('update_move')
def handle_move(data):
    """
    data format: {'id': 'player_name', 'x': 100, 'y': 200, 'direction': 'left'}
    """
    p_id = data.get('id', 'unknown')
    print(f"p_id: {p_id}")
    
    px = data.get('x', 0)
    print(f"px: {px}")
    
    py = data.get('y', 0)
    print(f"py: {py}")
    
    p_dir = data.get('direction', 'down')
    print(f"p_dir: {p_dir}")

    # メモリ上のデータを更新
    game_state['players'][p_id] = {
        'x': px, 
        'y': py, 
        'direction': p_dir,
        'sid': request.sid # 接続識別子も一応保持
    }
    
    # 【重要】自分以外の全隊員に「この隊員がここに動いたぞ！」と通知
    emit('player_moved', {p_id: game_state['players'][p_id]}, broadcast=True, include_self=False)
    # print(f"Broadcasted position of {p_id}") # ログが溢れるので重要時のみ

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    print(f"disconnected_sid: {sid}")
    # 離脱したプレイヤーを探して削除（同期から外す）
    target_id = None
    for p_id, info in game_state['players'].items():
        if info.get('sid') == sid:
            target_id = p_id
            break
    
    if target_id:
        del game_state['players'][target_id]
        print(f"removed_player: {target_id}")
        # 全員に「隊員が離脱した」と伝える
        emit('player_left', {'id': target_id}, broadcast=True)

# --- バックアップ任務 (curl用) ---

@app.route('/backup', methods=['POST'])
def backup():
    print("バックアップ開始！🛰️")
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(game_state, f, indent=4, ensure_ascii=False)
    return jsonify({"status": "saved"}), 200

if __name__ == '__main__':
    print("Gemini programming隊、通信サーバー起動！📡🔥")
    socketio.run(app, host='0.0.0.0', port=5000)
