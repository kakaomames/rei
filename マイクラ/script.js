/**
 * スプラッシュテキストを読み込み、ランダムに表示する処理
 */
document.addEventListener('DOMContentLoaded', () => {
    const splashTextElement = document.getElementById('splash-text');
    const titleTextUrl = 'title-text.txt';

    // 外部のテキストファイルをフェッチして読み込む
    fetch(titleTextUrl)
        .then(response => {
            if (!response.ok) {
                // ファイルが見つからないなどのエラー処理
                throw new Error(`ファイルが見つかりません: ${response.status}`);
            }
            return response.text();
        })
        .then(textData => {
            // テキストデータをカンマまたは改行で分割する
            // \r?\n は改行コード (CRLFまたはLF) に対応
            const texts = textData.split(/,?\s*[\r\n,]\s*/).filter(t => t.trim() !== '');

            if (texts.length > 0) {
                // ランダムに一つのテキストを選択
                const randomIndex = Math.floor(Math.random() * texts.length);
                const selectedText = texts[randomIndex].trim();
                
                // ページに表示
                splashTextElement.textContent = selectedText;
            } else {
                splashTextElement.textContent = 'テキストがありません。';
            }
        })
        .catch(error => {
            console.error('スプラッシュテキストの読み込みエラー:', error);
            splashTextElement.textContent = '読み込みに失敗しました。';
        });
});
