import sys
import os
from flask import Flask, send_from_directory, abort



# --- KVM 命令セット (四則演算を追加) ---
PUSH_NUMBER = 1
STORE_VAR = 3
JUMP_IF_FALSE = 4
JUMP = 5
OP_EQUAL = 6
RECORD = 9
OP_ADD = 10       # 足し算を追加
OP_SUBTRACT = 11  # 引き算を追加
OP_MULTIPLY = 12  # 掛け算を更新
OP_DIVIDE = 13    # 割り算を更新

# --- KVMの中核要素 ---
class KVM:
    def __init__(self, memory=None):
        self.stack = [] 
        self.memory = memory if memory is not None else {}
        self.pc = 0

    def _execute_instruction(self, instruction):
        """単一の命令を実行する"""
        
        # スタックからオペランドをポップし、計算を実行するヘルパー関数
        def binary_op(op):
            operand_b = self.stack.pop()
            operand_a = self.stack.pop()
            result = op(operand_a, operand_b)
            self.stack.append(result)

        if instruction == PUSH_NUMBER:
            value = self.program[self.pc]
            self.stack.append(value)
            self.pc += 1
        elif instruction == STORE_VAR:
            var_name = self.program[self.pc]
            value = self.stack.pop()
            self.memory[var_name] = value
            self.pc += 1
        
        # --- 四則演算のKVMロジック ---
        elif instruction == OP_ADD:
            binary_op(lambda a, b: a + b)
        elif instruction == OP_SUBTRACT:
            binary_op(lambda a, b: a - b)
        elif instruction == OP_MULTIPLY:
            binary_op(lambda a, b: a * b)
        elif instruction == OP_DIVIDE:
            binary_op(lambda a, b: a / b)
        
        # (JUMP, JUMP_IF_FALSE, OP_EQUAL, RECORD などの他の命令処理は省略)
        # (今回のテストでは使用しないため、コードを簡略化しています)
        
        else:
            # 実際のKVMではここでエラー処理
            pass 

    def run(self, program):
        """KVM命令を実行するメインループ (テスト用)"""
        self.program = program
        self.pc = 0
        while self.pc < len(self.program):
            self._execute_instruction(self.program[self.pc])
            self.pc += 1
            
# --- KSC Webサーバーの初期設定 ---
app = Flask(__name__) 

# --- KSCの路地割り当て命令を処理する関数 ---
# (前回のWebサーバーのエラーを修正したバージョンを使用)
def assign_route(path, function_name):
    # KSCの職人技名から $ を取り、エンドポイント名として利用
    endpoint_name = function_name.strip('$') 
    
    print(f"KSCサーバー: 路地 '{path}' に '{endpoint_name}' 職人技を割り当てます。")

    def ksc_dynamic_handler():
        # KSCコードの実行と、四則演算のテストを行う
        ksc_response = run_kvm_logic()
        print(f"KSCログ: 職人技 {endpoint_name} を実行し、レスポンスを「お返し」しました。")
        return ksc_response

    # Flaskにadd_url_ruleメソッドを使い、エンドポイント名を指定して登録
    app.add_url_rule(path, endpoint_name, ksc_dynamic_handler)


# --- KSCの実行エンジン（テストロジック） ---
def run_kvm_logic():
    """
    KSCの四則演算テストを KVM命令として手動で生成し、実行する。
    KSCコード: $R1 を 1 を 足す 1 に する 〆  ...など
    """
    kvm = KVM()
    
    # 1. 足し算: 1 + 1 = 2
    # KVM命令: [PUSH 1, PUSH 1, OP_ADD, STORE "$R1"]
    kvm_add = [PUSH_NUMBER, 1, PUSH_NUMBER, 1, OP_ADD, STORE_VAR, "$R1"]
    kvm.run(kvm_add)
    r1 = kvm.memory.get("$R1", "未定義")

    # 2. 引き算: 2 - 1 = 1
    # KVM命令: [PUSH 2, PUSH 1, OP_SUBTRACT, STORE "$R2"]
    kvm_sub = [PUSH_NUMBER, 2, PUSH_NUMBER, 1, OP_SUBTRACT, STORE_VAR, "$R2"]
    kvm.run(kvm_sub)
    r2 = kvm.memory.get("$R2", "未定義")

    # 3. 掛け算: 2 * 2 = 4
    # KVM命令: [PUSH 2, PUSH 2, OP_MULTIPLY, STORE "$R3"]
    kvm_mul = [PUSH_NUMBER, 2, PUSH_NUMBER, 2, OP_MULTIPLY, STORE_VAR, "$R3"]
    kvm.run(kvm_mul)
    r3 = kvm.memory.get("$R3", "未定義")

    # 4. 割り算: 4 / 2 = 2.0
    # KVM命令: [PUSH 4, PUSH 2, OP_DIVIDE, STORE "$R4"]
    kvm_div = [PUSH_NUMBER, 4, PUSH_NUMBER, 2, OP_DIVIDE, STORE_VAR, "$R4"]
    kvm.run(kvm_div)
    r4 = kvm.memory.get("$R4", "未定義")

    # KSC構文「お返しする」の処理 (Webレスポンスとして結果を返す)
    response = f"""
    <h1>KSC 四則演算テスト実行結果</h1>
    <p>1. 足し算 (1 を 足す 1): <strong>{r1}</strong></p>
    <p>2. 引き算 (2 を 引く 1): <strong>{r2}</strong></p>
    <p>3. 掛け算 (2 を 掛ける 2): <strong>{r3}</strong></p>
    <p>4. 割り算 (4 を 割る 2): <strong>{r4}</strong></p>
    """
    return response


# --- Flaskの実行環境要件を満たす ---
def run_ksc_program():
    print("KSCサーバー: KSCコードを解析・実行します。")
    # KSCコード: 職人技 $メイン処理 を 路地 "/" に 割り当てる 〆
    assign_route("/", "$メイン処理") 

# Vercelなどの本番環境で import された時の処理
run_ksc_program()





# Flaskアプリの実行ファイル(app.py)があるディレクトリの絶対パスを取得
# Vercel環境でも、このパスがリポジトリのルートになります
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# -----------------------------------------------
# 1. ルート ('/') の処理
# -----------------------------------------------
@app.route('/home')
def root_index():
    # app.pyと同じ階層にある index.html を返す
    try:
        return send_from_directory(BASE_DIR, 'index.html')
    except FileNotFoundError:
        return "Main Index file not found.", 404

# -----------------------------------------------
# 2. すべてのサブディレクトリとファイルのリクエストを処理
# -----------------------------------------------
# <path:asset_path> で、ルート以下の全てのパスを asset_path に格納します
@app.route('/<path:asset_path>')
def serve_all_assets(asset_path):
    
    # 1. asset_path がフォルダ名として存在するかチェック
    # 例: '/2048' や '/db' へのアクセスの場合
    full_target_path = os.path.join(BASE_DIR, asset_path)
    
    if os.path.isdir(full_target_path):
        # フォルダが存在する場合、そのフォルダから 'index.html' を返す
        # 例: フォルダ '2048' の中から 'index.html' を返す
        directory = full_target_path
        filename = 'index.html'
        
        try:
            return send_from_directory(directory, filename)
        except FileNotFoundError:
            # index.html が見つからなければ 404
            abort(404)

    # 2. asset_path がファイルパスとして存在する場合をチェック
    # 例: '2048/style.css' や 'db/ksc.html' の場合
    
    # パスをディレクトリ名とファイル名に分割
    # 'db/ksc.html' -> directory_name='db', filename='ksc.html'
    directory_name, filename = os.path.split(asset_path)
    
    # ディレクトリパスの絶対パスを作成
    directory = os.path.join(BASE_DIR, directory_name)
    
    # 該当ファイルが実際に存在するかチェック
    if os.path.exists(os.path.join(directory, filename)):
        # ディレクトリとファイル名を指定してファイルを返す
        # send_from_directory がセキュリティチェックを自動で行います
        try:
            return send_from_directory(directory, filename)
        except FileNotFoundError:
             # send_from_directory の内部チェックで失敗した場合など
             abort(404)
    
    # 3. どちらのパターンにも該当しない場合は 404 Not Found
    abort(404)





# 1. コマンドライン実行時の処理
if __name__ == '__main__':
    print("\n--- 開発用サーバー起動 ---")
    app.run(debug=True, host='0.0.0.0', port=os.environ.get("PORT", 5000))
    
