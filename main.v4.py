import sys
import os
import io
import urllib.request
import json
import zipfile

def start_process(request=None):
    print("--- 【全フォーマット列挙モード】すべてのURLを自動抽出します ---")
    print("実際に受け取った引数の一覧:", request)
    
    # カレントディレクトリの設定
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)
        
    # 1. yt-dlpのインポート確認
    try:
        import yt_dlp
    except ModuleNotFoundError:
        print("--- yt-dlpをダウンロード中... ---")
        api_p = ["https:", "", "pypi.org", "pypi", "yt-dlp", "json"]
        with urllib.request.urlopen("/".join(api_p)) as response:
            data = json.loads(response.read().decode())
        latest_url = next(f['url'] for f in data['urls'] if f['filename'].endswith('.whl'))
        dl_parts = latest_url.split('/')
        wheel_path = os.path.join(current_dir, "yt_dlp_local.whl")
        urllib.request.urlretrieve("/".join(dl_parts), wheel_path)
        with zipfile.ZipFile(wheel_path, 'r') as zip_ref:
            zip_ref.extractall(current_dir)
        import yt_dlp
    
    # 2. Denoのパス設定
    deno_bin_path = os.path.join(current_dir, "deno")
    if not os.path.exists(deno_bin_path):
        try:
            deno_p = ["https:", "", "github.com", "denoland", "deno", "releases", "latest", "download", "deno-x86_64-unknown-linux-gnu.zip"]
            with urllib.request.urlopen("/".join(deno_p)) as response:
                deno_zip_data = io.BytesIO(response.read())
            with zipfile.ZipFile(deno_zip_data) as z:
                z.extract("deno", current_dir)
            os.chmod(deno_bin_path, 0o755)
        except Exception:
            pass
    os.environ["PATH"] = current_dir + os.path.pathsep + os.environ.get("PATH", "")
    
    # 3. JSON抽出処理
    try:
        final_yt_url = None

        # 【判定パターンA】Webリクエスト（Cloud Functions等）から呼ばれた場合
        if request is not None:
            # クエリパラメータ（?url=xxx）をチェック
            if hasattr(request, "args") and request.args.get("url"):
                final_yt_url = request.args.get("url")
            # JSONボディ（{"url": "xxx"}）をチェック
            elif hasattr(request, "get_json") and request.get_json(silent=True):
                final_yt_url = request.get_json(silent=True).get("url")

        # 【判定パターンB】シェル経由でURL文字列が直接渡された場合（__main__から転送）
        if not final_yt_url and isinstance(request, str) and request.startswith("http"):
            final_yt_url = request

        # 【判定パターンC】どこからもURLが取得できなかった場合は、デフォルトの固定URLにする
        if not final_yt_url:
            yt_p = ["https:", "", "youtube.com", "watch?v=dQw4w9WgXcQ"]
            final_yt_url = "/".join(yt_p)
        
        print(f"🎬 解析対象のURL: {final_yt_url}")
        
        # 💡 基本的なyt-dlpのオプション設定
        ydl_opts = {
            'skip_download': True, # 動画は保存しない
            'extract_flat': False,
            'quiet': True,
            'no_warnings': True,
        }

        # 💡 【追加機能】クッキーファイル（cookies.txt）があれば自動で読み込む
        cookie_file_path = os.path.join(current_dir, "cookies.txt")
        if os.path.exists(cookie_file_path):
            print(f"🍪 クッキーファイルを適用します: {cookie_file_path}")
            ydl_opts['cookiefile'] = cookie_file_path
        else:
            print("💡 cookies.txt が見つからないため、クッキーなしで解析します。")
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            video_json_data = ydl.extract_info(final_yt_url, download=False)
            
        print("🎉 JSONデータの抽出に成功しました！")
        print(f"📄 タイトル: {video_json_data.get('title')}\n")
        print("=================== 配信URL一覧 (formatsの全データ) ===================")
    
        # formatsリストから1つずつデータ（fmt）を取り出してループ処理
        for fmt in video_json_data.get('formats', []):
            
            # 必要な情報を辞書から安全に抜き出す
            fmt_id = fmt.get('format_id')         # フォーマット番号
            ext = fmt.get('ext')                 # 拡張子
            resolution = fmt.get('resolution')   # 解像度
            direct_url = fmt.get('url')         # 動画の生URL
            
            # 画面にスッキリ見やすく表示する
            print(f"🔹 ID: {fmt_id} | 拡張子: {ext} | 画質: {resolution}")
            print(f"🔗 URL: {direct_url}")
            print("-" * 70) # 見やすくするための区切り線
        
        print("=======================================================================")
        print("✨ formatsに含まれるすべての直リンクURLの全自動列挙が完了しました！")
    
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")

# =======================================================================
# スクリプトが直接「シェル」から実行された場合の処理
# =======================================================================
if __name__ == '__main__':
    # コマンドライン引数（sys.argv）にURLが指定されているかチェック
    if len(sys.argv) > 1:
        # 1つ目の引数（動画URLの文字列）を関数に渡して実行
        print("実際に受け取った引数の一覧:", sys.argv)
        start_process(sys.argv[1])
    else:
        # 引数がない場合は、デフォルトURLで実行
        start_process()
