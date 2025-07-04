class BingoLottery {
    constructor() {
        this.numbers = Array.from({length: 75}, (_, i) => i + 1); // 01〜75の番号
        this.drawnNumbers = []; // 既に抽選された番号
        this.currentNumber = null;
        this.isSpinning = false; // ルーレット回転中フラグ
        
        this.currentNumberElement = document.getElementById('currentNumber');
        this.drawButton = document.getElementById('drawButton');
        this.resetButton = document.getElementById('resetButton');
        this.historyList = document.getElementById('historyList');
        
        this.initializeEventListeners();
        this.updateDisplay();
    }
    
    initializeEventListeners() {
        this.drawButton.addEventListener('click', () => this.startRoulette());
        this.resetButton.addEventListener('click', () => this.reset());
    }
    
    startRoulette() {
        if (this.isSpinning || this.numbers.length === 0) {
            return;
        }
        
        this.isSpinning = true;
        this.drawButton.disabled = true;
        this.drawButton.textContent = '抽選中...';
        
        // スピン中の視覚効果を適用
        this.currentNumberElement.classList.add('spinning');
        
        // ルーレットアニメーション開始
        this.spinRoulette();
    }
    
    spinRoulette() {
        // 設定値を取得
        const config = window.BINGO_CONFIG || {};
        let duration = config.DURATION ?? 3000;
        let interval = config.INTERVAL ?? 50;
        let elapsed = 0;
        const slowdownStart = config.SLOWDOWN_START ?? 0.7;
        const slowdownStep = config.SLOWDOWN_STEP ?? 20;
        const slowdownMax = config.SLOWDOWN_MAX ?? 200;
        
        const spinInterval = setInterval(() => {
            elapsed += interval;
            
            // ランダムな番号を表示（まだ抽選されていない番号から）
            const availableNumbers = this.numbers.filter(num => !this.drawnNumbers.includes(num));
            if (availableNumbers.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableNumbers.length);
                const tempNumber = availableNumbers[randomIndex];
                this.currentNumberElement.textContent = tempNumber.toString().padStart(2, '0');
            }
            
            // 徐々にスローダウン
            if (elapsed > duration * slowdownStart) {
                interval = Math.min(interval + slowdownStep, slowdownMax); // 間隔を徐々に長く
            }
            
            // アニメーション終了
            if (elapsed >= duration) {
                clearInterval(spinInterval);
                this.finishRoulette();
            }
        }, interval);
    }
    
    finishRoulette() {
        // 最終的な当選番号を決定
        const randomIndex = Math.floor(Math.random() * this.numbers.length);
        const drawnNumber = this.numbers.splice(randomIndex, 1)[0];
        
        this.currentNumber = drawnNumber;
        this.drawnNumbers.push(drawnNumber);
        
        // スピン中の視覚効果を削除
        this.currentNumberElement.classList.remove('spinning');
        
        // 最終番号を表示
        this.currentNumberElement.textContent = drawnNumber.toString().padStart(2, '0');
        
        // アニメーション効果
        this.currentNumberElement.classList.remove('number-appear');
        void this.currentNumberElement.offsetWidth; // リフロー
        this.currentNumberElement.classList.add('number-appear');
        
        this.updateDisplay();
        
        // 状態をリセット
        this.isSpinning = false;
        this.drawButton.disabled = this.numbers.length === 0;
        this.drawButton.textContent = '抽選開始';
        
        // 抽選音効果（オプション）
        this.playDrawSound();
    }
    
    drawNumber() {
        if (this.numbers.length === 0) {
            alert('すべての番号が抽選されました！');
            this.drawButton.disabled = true;
            return;
        }
        
        // ランダムに番号を選択
        const randomIndex = Math.floor(Math.random() * this.numbers.length);
        const drawnNumber = this.numbers.splice(randomIndex, 1)[0];
        
        this.currentNumber = drawnNumber;
        this.drawnNumbers.push(drawnNumber);
        
        // アニメーション効果
        this.currentNumberElement.classList.remove('number-appear');
        void this.currentNumberElement.offsetWidth; // リフロー
        this.currentNumberElement.classList.add('number-appear');
        
        this.updateDisplay();
        
        // 抽選音効果（オプション）
        this.playDrawSound();
    }
    
    updateDisplay() {
        // 現在の番号を表示
        if (this.currentNumber) {
            this.currentNumberElement.textContent = this.currentNumber.toString().padStart(2, '0');
        } else {
            this.currentNumberElement.textContent = '-';
        }
        
        // 履歴を更新
        this.updateHistory();
        
        // ボタンの状態を更新（スピン中でない場合のみ）
        if (!this.isSpinning) {
            this.drawButton.disabled = this.numbers.length === 0;
        }
    }
    
    updateHistory() {
        if (this.drawnNumbers.length === 0) {
            this.historyList.innerHTML = '<p class="no-history">まだ抽選されていません</p>';
            return;
        }
        
        let historyHTML = '';
        this.drawnNumbers.forEach((number) => {
            historyHTML += `
                <div class="history-item">
                    <span class="history-number">${number.toString().padStart(2, '0')}</span>
                </div>
            `;
        });
        
        this.historyList.innerHTML = historyHTML;
        
        // 履歴エリアを最新の項目までスクロール
        this.historyList.scrollTop = this.historyList.scrollHeight;
    }
    
    reset() {
        if (confirm('すべての抽選履歴をリセットしますか？')) {
            this.numbers = Array.from({length: 75}, (_, i) => i + 1);
            this.drawnNumbers = [];
            this.currentNumber = null;
            this.isSpinning = false;
            this.drawButton.disabled = false;
            this.drawButton.textContent = '抽選開始';
            this.updateDisplay();
        }
    }
    
    playDrawSound() {
        // 簡単な音効果（オプション）
        // 実際の音声ファイルがある場合は以下のように実装できます
        /*
        const audio = new Audio('draw-sound.mp3');
        audio.play().catch(e => console.log('音声再生エラー:', e));
        */
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    new BingoLottery();
});

// キーボードショートカット
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.target.matches('button, input, textarea')) {
        e.preventDefault();
        const drawButton = document.getElementById('drawButton');
        if (!drawButton.disabled) {
            drawButton.click();
        }
    }
    
    if (e.code === 'KeyR' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        document.getElementById('resetButton').click();
    }
});
