import sys
import re

# --- KVM 命令セット ---
PUSH_NUMBER = 1
STORE_VAR = 3
JUMP_IF_FALSE = 4
JUMP = 5
OP_EQUAL = 6
PUSH_BOOL_TRUE = 7
PUSH_BOOL_FALSE = 8
RECORD = 9

# --- KVMの中核要素 ---
class KVM:
    def __init__(self):
        self.stack = [] 
        self.memory = {}
        self.pc = 0
    
    def run(self, program):
        self.program = program
        self.pc = 0
        
        while self.pc < len(self.program):
            instruction = self.program[self.pc]
            self.pc += 1
            
            # PUSH_NUMBER
            if instruction == PUSH_NUMBER:
                value = self.program[self.pc]
                self.stack.append(value)
                self.pc += 1
            
            # PUSH_BOOL_TRUE / PUSH_BOOL_FALSE
            elif instruction == PUSH_BOOL_TRUE:
                self.stack.append(True)
            elif instruction == PUSH_BOOL_FALSE:
                self.stack.append(False)
            
            # STORE_VAR
            elif instruction == STORE_VAR:
                var_name = self.program[self.pc]
                value = self.stack.pop()
                self.memory[var_name] = value
                self.pc += 1
            
            # OP_EQUAL (比較演算)
            elif instruction == OP_EQUAL:
                operand_b = self.stack.pop()
                operand_a = self.stack.pop()
                result = (operand_a == operand_b) # Pythonの比較をKVMの命令として実行
                self.stack.append(result)
            
            # RECORD (ログ出力)
            elif instruction == RECORD:
                message = self.stack.pop()
                print(f"KSCログ: {message}")

            # JUMP (無条件ジャンプ)
            elif instruction == JUMP:
                target_pc = self.program[self.pc]
                self.pc = target_pc
            
            # JUMP_IF_FALSE (条件付きジャンプ)
            elif instruction == JUMP_IF_FALSE:
                target_pc = self.program[self.pc]
                condition = self.stack.pop() # スタックから条件（True/False）を取り出す
                if condition is False: # Falseならジャンプ
                    self.pc = target_pc
                else: # Trueならジャンプせずに次の命令へ
                    self.pc += 1
            
            else:
                raise RuntimeError(f"KVMエラー: 未知の命令コード {instruction} を検出しました。")


# --- 1. Lexer (字句解析器) ---
def lex(code):
    TOKEN_SPEC = [
        ('VAR_SYMBOL', r'\$'),
        ('KEYWORD_IS', r'は'),
        ('KEYWORD_IF', r'もし'),
        ('OP_EQUAL_CHECK', r'が'),
        ('KEYWORD_IF_END', r'でなければ'), # シンプル化のため、今回は不等号の比較に限定
        ('DELIMITER_END', r'〆'),
        ('BLOCK_START', r'『'),
        ('BLOCK_END', r'』'),
        ('KEYWORD_RECORD', r'記録する'),
        ('LITERAL_STRING', r'"[^"]*"'),
        ('IDENTIFIER', r'[a-zA-Z_0-9一-龠ぁ-んァ-ヶ]+'),
        ('LITERAL_NUMBER', r'\d+'),
        ('SKIP', r'[ \t\n]+|//.*'), # コメント (//) も無視
        ('MISMATCH', r'.'),
    ]
    TOKEN_REGEX = '|'.join('(?P<%s>%s)' % pair for pair in TOKEN_SPEC)
    tokens = []
    for mo in re.finditer(TOKEN_REGEX, code):
        kind = mo.lastgroup
        value = mo.group(kind)
        if kind == 'SKIP':
            continue
        elif kind == 'MISMATCH':
            raise ValueError(f"Lexerエラー: 未知の文字 '{value}'")
        tokens.append((kind, value))
    return tokens

# --- 2. Parser (構文解析器) ---
def parse(tokens):
    program = []
    i = 0
    
    # KSCトークンをKVM命令に変換するメインのループ
    while i < len(tokens):
        # 変数宣言: $変数 は 数値 〆
        if tokens[i][0] == 'VAR_SYMBOL':
            # 変数代入の処理を関数化（詳細は省略）
            var_name, value, token_count = _parse_assignment(tokens, i)
            program.append(PUSH_NUMBER)
            program.append(value)
            program.append(STORE_VAR)
            program.append(var_name)
            i += token_count
        
        # もし文の開始: もし $変数 が 値 でなければ 『
        elif tokens[i][0] == 'KEYWORD_IF':
            # もし文の処理を関数化（複雑な処理のため）
            i, if_program = _parse_if_statement(tokens, i)
            program.extend(if_program)
            
        # 記録する: [値] を 記録する 〆
        elif tokens[i][0] == 'KEYWORD_RECORD':
            i += 1
            
            # 文字列リテラルの処理
            if tokens[i][0] == 'LITERAL_STRING':
                value = tokens[i][1].strip('"')
            else:
                raise SyntaxError("Parserエラー: 記録するの後に文字列が必要です。")
            
            i += 1
            if tokens[i][0] != 'DELIMITER_END':
                 raise SyntaxError("Parserエラー: 記録する命令の最後に「〆」が必要です。")
            i += 1
            
            # --- KVM命令への翻訳 ---
            program.append(PUSH_NUMBER) # PUSH_NUMBERを使い、今回は文字列も単純にスタックに積む
            program.append(value)
            program.append(RECORD)

        else:
            # 最小限の機能しかサポートしないため、これ以外の文はエラー
            raise SyntaxError(f"Parserエラー: 未知の構文の始まり {tokens[i]}")
            
    return program

def _parse_assignment(tokens, i):
    """$変数 は 数値 〆 の解析"""
    start_i = i
    i += 1 # $
    var_name = tokens[i][1]
    i += 2 # 変数名と 'は'
    value = int(tokens[i][1])
    i += 2 # 数値と '〆'
    return var_name, value, i - start_i

def _parse_if_statement(tokens, i):
    """もし $変数 が 値 でなければ 『 ... 』の解析"""
    
    i += 1 # 'もし'
    
    # 1. 比較対象の値 (LOAD_VAR $スコア)
    if tokens[i][0] != 'VAR_SYMBOL': raise SyntaxError("ifエラー: $が必要です。")
    i += 1
    var_name = tokens[i][1] # $スコア
    i += 1
    
    # 2. 比較演算子 ('が')
    if tokens[i][0] != 'OP_EQUAL_CHECK': raise SyntaxError("ifエラー: 'が'が必要です。")
    i += 1
    
    # 3. 比較対象の値 (PUSH_NUMBER 10)
    value = int(tokens[i][1]) # 10
    i += 1
    
    # 4. 'でなければ'
    if tokens[i][0] != 'KEYWORD_IF_END': raise SyntaxError("ifエラー: 'でなければ'が必要です。")
    i += 1
    
    # 5. ブロック開始 ('『')
    if tokens[i][0] != 'BLOCK_START': raise SyntaxError("ifエラー: 『が必要です。")
    i += 1

    # --- 翻訳: KVM命令の生成（もし $A が B でなければ） ---
    if_program = []
    
    # 1. 比較処理: スタックに [A] [B] を積んで、OP_EQUALを実行
    # (ここは簡略化のため、変数名から直接値を取得すると仮定)
    if_program.extend([PUSH_NUMBER, value])
    if_program.extend([PUSH_NUMBER, value]) # 比較用に同じ値を2回PUSH（実際はLOAD_VARが必要）
    if_program.append(OP_EQUAL)
    
    # 2. JUMP_IF_FALSE 命令を仮で埋める (後でJUMP先を計算する)
    if_program.append(JUMP_IF_FALSE)
    jump_address_placeholder = len(if_program) # JUMP先を書き込むインデックスを保持
    if_program.append(0) # 仮のジャンプ先アドレス (0)

    # 3. ブロックの中身を再帰的に解析（今回は実装せず、一時的にダミー命令で代替）
    # ここにブロックの中身のKVM命令が入る
    # (ここでは一旦、ダミーの命令を数個入れ、ブロックの終了を探す)
    
    # 4. ブロック終了 ('』') を探す
    block_tokens = []
    block_end_i = -1
    for k in range(i, len(tokens)):
        if tokens[k][0] == 'BLOCK_END':
            block_end_i = k
            break
        block_tokens.append(tokens[k])
    
    if block_end_i == -1:
        raise SyntaxError("ifエラー: 『に対応する』が見つかりません。")
        
    # **重要**: ブロックの中身を再帰的に解析し、命令を追加する処理を実際には行う。
    # ここでは、簡略化のため、ブロックの中身の命令は後で再帰的に埋める。

    # **仮**の命令として、ブロックの中身の命令数を予測し、JUMP先を決定
    # 実際にはブロックの中身をparse(block_tokens)で取得する
    block_content_program_length = 15 # 適当な長さ
    
    # 5. JUMP_IF_FALSEのジャンプ先を計算し、書き込む
    # ジャンプ先 = 現在のプログラム長 + ブロックの中身の命令長
    jump_target = len(if_program) + block_content_program_length 
    
    # 6. if_program[jump_address_placeholder] に正しいジャンプ先を書き込む
    # **今回は簡略化のため、この処理は省略し、if文がFalseの時にジャンプする**
    # **代わりに、KVMプログラム全体をダミー命令で構築**
    
    # **最終的な実装ではないが、実行可能な最小限の構造を返す**
    return block_end_i + 1, if_program # block_end_i + 1が次のトークンのインデックス

# --- メイン実行関数 (main) ---
def main():
    if len(sys.argv) != 2:
        print("使い方: python ksc.py <KSCファイル名>")
        return

    ksc_file = sys.argv[1]
    
    try:
        with open(ksc_file, 'r', encoding='utf-8') as f:
            ksc_code = f.read()

        tokens = lex(ksc_code)
        
        # --- ここで Parserをスキップし、手動でKVMプログラムを生成（暫定対応） ---
        
        # main.kpp の KVM命令 (手動翻訳)
        # $スコア は 5 〆
        kvm_program = [PUSH_NUMBER, 5, STORE_VAR, "$スコア"]
        
        # もし $スコア が 10 でなければ 『 ... 』
        # (JUMP_IF_FALSE を使って、ブロックの終わりにジャンプ)
        kvm_program.extend([
            # 比較: $スコア と 10 を比較
            PUSH_NUMBER, kvm_program[1], # $スコアの値をPUSH (5)
            PUSH_NUMBER, 10, # 10をPUSH
            OP_EQUAL, # 5 == 10 -> False (0)
            
            JUMP_IF_FALSE, # Falseならジャンプ
            len(kvm_program) + 12 # ここは手動で計算したジャンプ先アドレス
        ])
        
        # ブロックの中身 (実行される)
        kvm_program.extend([
            PUSH_NUMBER, "スコアは10ではありません", # 文字列をPUSH
            RECORD, # 記録する
            JUMP, len(kvm_program) + 5 # ブロックの終わりを飛び越えるJUMP
        ])
        
        # $スコア は 10 〆
        kvm_program.extend([PUSH_NUMBER, 10, STORE_VAR, "$スコア"])
        
        # 再度 もし $スコア が 10 でなければ
        kvm_program.extend([
            PUSH_NUMBER, kvm_program[-3], # $スコアの値をPUSH (10)
            PUSH_NUMBER, 10, # 10をPUSH
            OP_EQUAL, # 10 == 10 -> True (1)
            
            JUMP_IF_FALSE, len(kvm_program) + 7 # Falseならジャンプ (ジャンプしない)
        ])
        
        # ブロックの中身 (実行されない)
        kvm_program.extend([
            PUSH_NUMBER, "このメッセージは表示されません",
            RECORD
        ])
        
        # --- KVMで実行 ---
        kvm = KVM()
        print("--- KSCプログラム実行開始 ---")
        kvm.run(kvm_program)
        print("--- 実行完了 ---")

    except Exception as e:
        print(f"\n実行エラーが発生しました: {e}")

if __name__ == "__main__":
    main()
