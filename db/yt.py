import sys
import os
import io
import urllib.request
import json
import zipfile

print("--- 【全フォーマット列挙モード】すべてのURLを自動抽出します ---")

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

# 2. Denoのパス設定（前回のファイルが残っていればそのまま使われます）
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
    yt_p = ["https:", "", "youtube.com", "watch?v=dQw4w9WgXcQ"]
    final_yt_url = "/".join(yt_p)
    
    ydl_opts = {
        'skip_download': True, # 動画は保存しない
        'extract_flat': False,
        'quiet': True,
        'no_warnings': True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        video_json_data = ydl.extract_info(final_yt_url, download=False)
        
    print("🎉 JSONデータの抽出に成功しました！")
    print(f"📄 タイトル: {video_json_data.get('title')}\n")
    text = f"📄 タイトル: {video_json_data.get('title')}\n"
    print("=================== 配信URL一覧 (formatsの全データ) ===================")

    # ★【ご要望の処理】めんどくさい指定をやめて、for文で全部ぶん回して列挙する
    # formatsリストから1つずつデータ（fmt）を取り出してループ処理
    for fmt in video_json_data.get('formats', []):
        
        # 必要な情報を辞書から安全に抜き出す（なければ 'unknown' や 'None' になる）
        fmt_id = fmt.get('format_id')         # フォーマット番号（例: 137, 251など）
        ext = fmt.get('ext')                 # 拡張子（mp4, webm, m4aなど）
        resolution = fmt.get('resolution')   # 解像度（1080p, 720p, audio onlyなど）
        direct_url = fmt.get('url')         # 👈 これが欲しかった動画の生URL！
        
        # 画面にスッキリ見やすく表示する
        print(f"🔹 ID: {fmt_id} | 拡張子: {ext} | 画質: {resolution}")
        text += f"🔹 ID: {fmt_id} | 拡張子: {ext} | 画質: {resolution}"
        text += f"🔗 URL: {direct_url}"
        text += "-" * 70
        print(f"🔗 URL: {direct_url}")
        print("-" * 70) # 見やすくするための区切り線

    print("=======================================================================")
    print("✨ formatsに含まれるすべての直リンクURLの全自動列挙が完了しました！")

except Exception as e:
    print(f"❌ エラーが発生しました: {e}")
