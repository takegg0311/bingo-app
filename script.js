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

        // タブ・全体画面関連の要素
        this.tabHistory = document.getElementById('tabHistory');
        this.tabOverview = document.getElementById('tabOverview');
        this.viewHistory = document.getElementById('viewHistory');
        this.viewOverview = document.getElementById('viewOverview');
        this.overviewGrid = document.getElementById('overviewGrid');
        this.overviewStats = document.getElementById('overviewStats');
        this.resetButtonOverview = document.getElementById('resetButtonOverview');
        
        // 設定関連の要素
        this.settingsButton = document.getElementById('settingsButton');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettings = document.getElementById('closeSettings');
        this.saveSettings = document.getElementById('saveSettings');
        this.resetSettings = document.getElementById('resetSettings');
        
        // 設定入力フィールド
        this.durationInput = document.getElementById('duration');
        this.intervalInput = document.getElementById('interval');
        this.slowdownStartInput = document.getElementById('slowdownStart');
        this.slowdownStepInput = document.getElementById('slowdownStep');
        this.slowdownMaxInput = document.getElementById('slowdownMax');
        
        this.initializeEventListeners();
        this.loadFromStorage();
        this.loadSettings();
        this.updateDisplay();
        this.buildOverviewGrid();
    }
    
    initializeEventListeners() {
        this.drawButton.addEventListener('click', () => this.startRoulette());
        this.resetButton.addEventListener('click', () => this.reset());
        this.resetButtonOverview.addEventListener('click', () => this.reset());

        // タブ切替
        this.tabHistory.addEventListener('click', () => this.switchTab('history'));
        this.tabOverview.addEventListener('click', () => this.switchTab('overview'));
        
        // 設定関連のイベントリスナー
        this.settingsButton.addEventListener('click', () => this.openSettings());
        this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
        this.saveSettings.addEventListener('click', () => this.saveSettingsToConfig());
        this.resetSettings.addEventListener('click', () => this.resetSettingsToDefault());
        
        // モーダル外クリックで閉じる
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettingsModal();
            }
        });
    }
    
    // 設定画面を開く
    openSettings() {
        this.loadSettings(); // 現在の設定を読み込み
        this.settingsModal.style.display = 'block';
    }
    
    // 設定画面を閉じる
    closeSettingsModal() {
        this.settingsModal.style.display = 'none';
    }
    
    // 設定を読み込み
    loadSettings() {
        const config = window.BINGO_CONFIG || {};
        this.durationInput.value = config.DURATION ?? 3000;
        this.intervalInput.value = config.INTERVAL ?? 50;
        this.slowdownStartInput.value = config.SLOWDOWN_START ?? 0.7;
        this.slowdownStepInput.value = config.SLOWDOWN_STEP ?? 20;
        this.slowdownMaxInput.value = config.SLOWDOWN_MAX ?? 200;
    }
    
    // 設定を保存
    saveSettingsToConfig() {
        const newConfig = {
            DURATION: parseInt(this.durationInput.value),
            INTERVAL: parseInt(this.intervalInput.value),
            SLOWDOWN_START: parseFloat(this.slowdownStartInput.value),
            SLOWDOWN_STEP: parseInt(this.slowdownStepInput.value),
            SLOWDOWN_MAX: parseInt(this.slowdownMaxInput.value)
        };
        
        // 設定値を検証
        if (this.validateSettings(newConfig)) {
            window.BINGO_CONFIG = newConfig;
            this.closeSettingsModal();
            alert('設定を保存しました！');
        }
    }
    
    // 設定をデフォルトに戻す
    resetSettingsToDefault() {
        const defaultConfig = {
            DURATION: 3000,
            INTERVAL: 50,
            SLOWDOWN_START: 0.7,
            SLOWDOWN_STEP: 20,
            SLOWDOWN_MAX: 200
        };
        
        this.durationInput.value = defaultConfig.DURATION;
        this.intervalInput.value = defaultConfig.INTERVAL;
        this.slowdownStartInput.value = defaultConfig.SLOWDOWN_START;
        this.slowdownStepInput.value = defaultConfig.SLOWDOWN_STEP;
        this.slowdownMaxInput.value = defaultConfig.SLOWDOWN_MAX;
        
        window.BINGO_CONFIG = defaultConfig;
        alert('設定をデフォルトに戻しました！');
    }
    
    // 設定値の検証
    validateSettings(config) {
        if (config.DURATION < 1000 || config.DURATION > 10000) {
            alert('アニメーション時間は1000〜10000ミリ秒の間で設定してください。');
            return false;
        }
        if (config.INTERVAL < 10 || config.INTERVAL > 200) {
            alert('初期間隔は10〜200ミリ秒の間で設定してください。');
            return false;
        }
        if (config.SLOWDOWN_START < 0.1 || config.SLOWDOWN_START > 0.9) {
            alert('スローダウン開始タイミングは0.1〜0.9の間で設定してください。');
            return false;
        }
        if (config.SLOWDOWN_STEP < 5 || config.SLOWDOWN_STEP > 50) {
            alert('スローダウン増加量は5〜50ミリ秒の間で設定してください。');
            return false;
        }
        if (config.SLOWDOWN_MAX < 100 || config.SLOWDOWN_MAX > 500) {
            alert('最大インターバルは100〜500ミリ秒の間で設定してください。');
            return false;
        }
        return true;
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
        
        // localStorageに抽選履歴を保存
        this.saveToStorage();
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
        
        // localStorageに抽選履歴を保存
        this.saveToStorage();
    }
    
    updateDisplay() {
        if (this.currentNumber) {
            this.currentNumberElement.textContent = this.currentNumber.toString().padStart(2, '0');
        } else {
            this.currentNumberElement.textContent = '-';
        }

        this.updateHistory();
        this.updateOverviewGrid();

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
            this.deleteFromStorage();
        }
    }

    switchTab(tab) {
        if (tab === 'history') {
            this.viewHistory.classList.remove('view-hidden');
            this.viewOverview.classList.add('view-hidden');
            this.tabHistory.classList.add('tab-active');
            this.tabOverview.classList.remove('tab-active');
        } else {
            this.viewHistory.classList.add('view-hidden');
            this.viewOverview.classList.remove('view-hidden');
            this.tabHistory.classList.remove('tab-active');
            this.tabOverview.classList.add('tab-active');
        }
    }

    buildOverviewGrid() {
        this.overviewGrid.innerHTML = '';
        for (let i = 1; i <= 75; i++) {
            const cell = document.createElement('div');
            cell.className = 'overview-cell';
            cell.id = `cell-${i}`;
            cell.textContent = i.toString().padStart(2, '0');
            this.overviewGrid.appendChild(cell);
        }
        this.updateOverviewGrid();
    }

    updateOverviewGrid() {
        if (!this.overviewGrid) return;
        for (let i = 1; i <= 75; i++) {
            const cell = document.getElementById(`cell-${i}`);
            if (!cell) continue;
            if (this.drawnNumbers.includes(i)) {
                cell.classList.add('overview-cell-drawn');
                if (i === this.currentNumber) {
                    cell.classList.add('overview-cell-latest');
                } else {
                    cell.classList.remove('overview-cell-latest');
                }
            } else {
                cell.classList.remove('overview-cell-drawn', 'overview-cell-latest');
            }
        }
        if (this.overviewStats) {
            this.overviewStats.textContent = `抽選済み：${this.drawnNumbers.length} / 75`;
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
    
    // localStorageから抽選履歴を読み込む
    loadFromStorage() {
        const storageValue = localStorage.getItem('bingoDrawnNumbers');
        console.log('抽選履歴 読み込み:', storageValue)
        if (storageValue) {
            try {
                this.drawnNumbers = JSON.parse(storageValue);
                // 抽選済み番号をnumbers配列から削除
                this.drawnNumbers.forEach(number => {
                    const index = this.numbers.indexOf(number);
                    if (index > -1) {
                        this.numbers.splice(index, 1);
                    }
                });
                
                // 最後に抽選された番号を現在の番号として設定
                if (this.drawnNumbers.length > 0) {
                    this.currentNumber = this.drawnNumbers[this.drawnNumbers.length - 1];
                }
            } catch (e) {
                console.error('localStorageの読み込みエラー:', e);
                this.drawnNumbers = [];
            }
        }
    }
    
    // localStorageに抽選履歴を保存
    saveToStorage() {
        const storageValue = JSON.stringify(this.drawnNumbers);
        localStorage.setItem('bingoDrawnNumbers', storageValue);
        console.log("localStorage 保存:", storageValue)
    }
    
    // localStorageから削除
    deleteFromStorage() {
        localStorage.removeItem('bingoDrawnNumbers');
        console.log("localStorage リセット")
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
