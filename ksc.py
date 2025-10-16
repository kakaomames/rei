import sys
import os
from flask import Flask

# --- KVM 命令セット (今回未使用だが、構造維持のため定義) ---
PUSH_NUMBER = 1
STORE_VAR = 3
JUMP_IF_FALSE = 4
JUMP = 5
OP_EQUAL = 6
PUSH_BOOL_TRUE = 7
PUSH_BOOL_FALSE = 8
RECORD = 9

# --- KSC Webサーバーの初期設定 ---
# Flaskアプリのインスタンスを作成（Vercelが探している「app」オブジェクト）
app = Flask(__name__) 

# KSCの関数（職人技）のKVM命令を格納する場所
KSC_FUNCTIONS = {} 


# --- KSCの路地割り当て命令を処理する関数 ---
def assign_route(path, function_name):
    """
    KSCの路地割り当て命令（職人技 $名前 を 路地 "/" に 割り当てる 〆）を処理する。
    Flaskのエンドポイント重複を防ぐため、職人技名をユニークなエンドポイントとして利用する。
    """
    
    # KSCの職人技名から $ を取り、エンドポイント名として利用
    endpoint_name = function_name.strip('$') 
    
    # KVMに登録する職人技のID (実際にはKVM命令の開始アドレス)
    ksc_function_id = function_name 
    
    print(f"KSCサーバー: 路地 '{path}' に '{endpoint_name}' 職人技を割り当てます。")
    
    # Flaskのadd_url_ruleを使って、動的にリクエストハンドラを登録
    # @app.route(path)の代替手法
    def ksc_dynamic_handler():
        """リクエストを受けたときにKSCコード（職人技）を実行するハンドラ"""
        
        # 実際には、ここでKSC_FUNCTIONSからksc_function_idのKVM命令を取り出し実行する
        
        # --- 現時点では、KSC構文「お返しする」のダミー処理を実装 ---
        ksc_response = f"<h1>KSCが路地 {path} で動いています! 職人技: {endpoint_name}</h1>"
        print(f"KSCログ: 職人技 {endpoint_name} を実行し、レスポンスを「お返し」しました。")
        return ksc_response

    # Flaskにadd_url_ruleメソッドを使い、エンドポイント名を指定して登録
    # これにより、ksc_dynamic_handlerという名前が重複しても、endpoint_nameが一意ならOK
    app.add_url_rule(path, endpoint_name, ksc_dynamic_handler)


# --- KSCの実行エンジン（ParserとKVMの呼び出し元） ---
def run_ksc_program():
    """KSCファイル全体を読み込み、ParserとKVMを実行する（想定）"""
    
    # 実際にはここでKSCファイルを読み込み、Parserを実行する
    
    print("KSCサーバー: KSCコードを解析・実行します。")
    
    # --- ダミーのKSCプログラム実行 (路地割り当てのテスト) ---
    # KSCコード: 職人技 $メイン処理 を 路地 "/" に 割り当てる 〆
    assign_route("/", "$メイン処理") 
    
    # KSCコード: 職人技 $API処理 を 路地 "/api" に 割り当てる 〆
    assign_route("/api", "$API処理")

# --- Flaskの実行環境要件を満たす ---

# Vercelなどの本番環境で import された時の処理 (appオブジェクトが自動的に使われる)
run_ksc_program()

# 1. コマンドライン実行時の処理
if __name__ == '__main__':
    # 開発環境で実行する場合
    print("\n--- 開発用サーバー起動 ---")
    # PORTは環境変数から取得、なければ5000を使う
    app.run(debug=True, host='0.0.0.0', port=os.environ.get("PORT", 5000))
