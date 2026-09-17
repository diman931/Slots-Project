// Balance system
class BalanceSystem {
    constructor() {
        this.balance = 0;
        this.bonusAmount = 2;
        this.bonusCooldown = 60000;
        this.lastBonusTime = null;
        
        this.init();
    }
    
    init() {
        this.loadFromStorage();
        this.updateDisplay();
        this.setupEventListeners();
        this.checkBonusAvailability();
    }
    
    loadFromStorage() {
        const savedBalance = localStorage.getItem('casinoBalance');
        const savedTime = localStorage.getItem('lastBonusTime');
        
        if (savedBalance) {
            this.balance = parseFloat(savedBalance);
        }
        
        if (savedTime) {
            this.lastBonusTime = parseInt(savedTime);
        }
    }
    
    saveToStorage() {
        localStorage.setItem('casinoBalance', this.balance.toString());
        if (this.lastBonusTime) {
            localStorage.setItem('lastBonusTime', this.lastBonusTime.toString());
        }
    }
    
    setupEventListeners() {
        const button = document.getElementById('but');
        if (button) {
            button.addEventListener('click', () => {
                this.claimBonus();
            });
        }
    }
    
    claimBonus() {
        const now = Date.now();
        
        if (this.lastBonusTime && (now - this.lastBonusTime) < this.bonusCooldown) {
            const timeLeft = this.bonusCooldown - (now - this.lastBonusTime);
            this.showMessage('Бонус Доступен: ' + this.formatTime(timeLeft));
            return;
        }
        
        this.balance += this.bonusAmount;
        this.lastBonusTime = now;
        
        this.updateDisplay();
        this.saveToStorage();
        
        this.showMessage('Бонус $' + this.bonusAmount + ' собран! Баланс: $' + this.balance.toFixed(2), 'success');
        this.checkBonusAvailability();
    }
    
    checkBonusAvailability() {
        const button = document.getElementById('but');
        if (!button) return;
        
        const now = Date.now();
        
        if (this.lastBonusTime && (now - this.lastBonusTime) < this.bonusCooldown) {
            const timeLeft = this.bonusCooldown - (now - this.lastBonusTime);
            button.innerHTML = 'Бонус Доступен: ' + this.formatTime(timeLeft);
            button.disabled = true;
            button.style.opacity = '0.7';
            button.style.cursor = 'not-allowed';
            
            setTimeout(() => this.checkBonusAvailability(), 1000);
        } else {
            button.innerHTML = 'Забрать Бонус 🎁';
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
        }
    }
    
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        return [
            hours.toString().padStart(2, '0'),
            (minutes % 60).toString().padStart(2, '0'),
            (seconds % 60).toString().padStart(2, '0')
        ].join(':');
    }
    
    updateDisplay() {
        const balanceElement = document.getElementById('balanceValue');
        if (balanceElement) {
            balanceElement.textContent = '$' + this.balance.toFixed(2);
        }
    }
    
    showMessage(text, type = 'error') {
        console.log('Message:', text, type); // Отладка
        
        let messageContainer = document.getElementById('messageContainer');
        
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'messageContainer';
            messageContainer.style.position = 'fixed';
            messageContainer.style.top = '20px';
            messageContainer.style.right = '20px';
            messageContainer.style.zIndex = '1000';
            messageContainer.style.maxWidth = '300px';
            document.body.appendChild(messageContainer);
        }
        
        const message = document.createElement('div');
        const backgroundColor = type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)';
        
        message.style.background = backgroundColor;
        message.style.color = 'white';
        message.style.padding = '15px 20px';
        message.style.marginBottom = '10px';
        message.style.borderRadius = '10px';
        message.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        message.style.fontFamily = 'Arial, sans-serif';
        message.style.fontSize = '16px';
        message.style.textAlign = 'center';
        
        message.textContent = text;
        messageContainer.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    }
    
    addMoney(amount) {
        this.balance += amount;
        this.updateDisplay();
        this.saveToStorage();
        return this.balance;
    }
    
    subtractMoney(amount) {
        if (this.balance >= amount) {
            this.balance -= amount;
            this.updateDisplay();
            this.saveToStorage();
            return true;
        }
        return false;
    }
    
    getBalance() {
        return this.balance;
    }
}

// Slots system
class SlotsGame {
    constructor(balanceSystem) {
        this.balanceSystem = balanceSystem;
        this.betAmount = 0.10;
        this.symbols = ['7️⃣', '🍓', '🍇', '💰', '🍋'];
        this.multipliers = {
            '7️⃣': 40,
            '🍓': 20,
            '🍇': 10,
            '💰': 7,
            '🍋': 3
        };
        // Множитель за 4 одинаковых (умножается на базовый)
        this.fourMatchBonus = 3;
        this.isSpinning = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateWinDisplay(0);
        this.updateBetDisplay();
    }
    
    setupEventListeners() {
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.addEventListener('click', () => {
                this.spin();
            });
        }
        
        const betButtons = document.querySelectorAll('.bet-btn');
        betButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.setBetAmount(parseFloat(e.target.dataset.bet));
                this.updateActiveBetButton(e.target);
            });
        });
        
        if (betButtons.length > 0) {
            this.updateActiveBetButton(betButtons[0]);
        }
    }
    
    setBetAmount(amount) {
        this.betAmount = amount;
        this.updateBetDisplay();
    }
    
    updateActiveBetButton(activeButton) {
        const betButtons = document.querySelectorAll('.bet-btn');
        betButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }
    
    updateBetDisplay() {
        const betInfo = document.querySelector('.bet-info span');
        if (betInfo) {
            betInfo.textContent = 'Ставка: $' + this.betAmount.toFixed(2);
        }
        this.updatePayoutsDisplay();
    }
    
    updatePayoutsDisplay() {
        const payoutItems = document.querySelectorAll('.payout-item');
        const payouts = [
            { symbol: '7️⃣', multiplier: 40 },
            { symbol: '🍓', multiplier: 20 },
            { symbol: '🍇', multiplier: 10 },
            { symbol: '💰', multiplier: 7 },
            { symbol: '🍋', multiplier: 3 }
        ];
        
        payouts.forEach((payout, index) => {
            const win3 = this.betAmount * payout.multiplier;
            const win4 = win3 * this.fourMatchBonus;
            if (payoutItems[index]) {
                payoutItems[index].textContent = 
                    payout.symbol.repeat(3) + ' - x' + payout.multiplier + 
                    ' ($' + win3.toFixed(2) + ') / 4 шт: $' + win4.toFixed(2);
            }
        });
    }
    
    spin() {
        if (this.isSpinning) {
            console.log('Уже вращается!');
            return;
        }
        
        console.log('Начало вращения. Ставка:', this.betAmount, 'Баланс:', this.balanceSystem.getBalance());
        
        if (!this.balanceSystem.subtractMoney(this.betAmount)) {
            this.balanceSystem.showMessage('Недостаточно денег! Нужно $' + this.betAmount.toFixed(2));
            return;
        }
        
        this.isSpinning = true;
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.disabled = true;
            spinButton.textContent = 'Вращается...';
        }
        
        this.updateWinDisplay(0);
        
        this.animateSpin();
        
        const result = this.generateSpinResult();
        console.log('Результат вращения:', result);
        
        setTimeout(() => {
            this.displayFinalResult(result);
            
            setTimeout(() => {
                const winAmount = this.calculateWin(result);
                console.log('Выигрыш:', winAmount);
                
                if (winAmount > 0) {
                    this.balanceSystem.addMoney(winAmount);
                    this.updateWinDisplay(winAmount);
                    this.balanceSystem.showMessage('Ты выиграл $' + winAmount.toFixed(2) + '!', 'success');
                    this.triggerWinAnimation();
                }
                
                this.isSpinning = false;
                if (spinButton) {
                    spinButton.disabled = false;
                    spinButton.textContent = '🔁 Крутить';
                }
            }, 1000);
            
        }, 2000);
    }
    
    animateSpin() {
        const reels = [
            document.getElementById('reel1'),
            document.getElementById('reel2'), 
            document.getElementById('reel3'),
            document.getElementById('reel4')
        ];
        
        reels.forEach((reel, index) => {
            if (!reel) return;
            
            reel.classList.add('spinning');
            
            let spinCount = 0;
            const maxSpins = 8 + index * 2;
            const spinInterval = setInterval(() => {
                const randomSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
                reel.textContent = randomSymbol;
                spinCount++;
                
                if (spinCount >= maxSpins) {
                    clearInterval(spinInterval);
                }
            }, 100);
        });
    }
    
    generateSpinResult() {
        return [
            this.symbols[Math.floor(Math.random() * this.symbols.length)],
            this.symbols[Math.floor(Math.random() * this.symbols.length)],
            this.symbols[Math.floor(Math.random() * this.symbols.length)],
            this.symbols[Math.floor(Math.random() * this.symbols.length)]
        ];
    }
    
    displayFinalResult(result) {
        const reels = [
            document.getElementById('reel1'),
            document.getElementById('reel2'),
            document.getElementById('reel3'),
            document.getElementById('reel4')
        ];
        
        reels.forEach((reel, index) => {
            if (!reel) return;
            
            setTimeout(() => {
                reel.textContent = result[index];
                reel.classList.remove('spinning');
            }, 300 + index * 200);
        });
    }
    
    calculateWin(result) {
        console.log('Проверка выигрыша для:', result);
        
        const [a, b, c, d] = result;
        
        // 4 одинаковых — самый жирный выигрыш
        if (a === b && b === c && c === d) {
            const multiplier = this.multipliers[a];
            if (multiplier !== undefined) {
                const winAmount = this.betAmount * multiplier * this.fourMatchBonus;
                console.log('4 в ряд! Символ:', a, 'Множитель x' + multiplier, 'Бонус x' + this.fourMatchBonus, 'Сумма:', winAmount);
                return winAmount;
            }
        }
        
        // 3 одинаковых на первых трёх барабанах
        if (a === b && b === c) {
            const multiplier = this.multipliers[a];
            if (multiplier !== undefined) {
                const winAmount = this.betAmount * multiplier;
                console.log('3 в ряд! Символ:', a, 'Множитель:', multiplier, 'Сумма:', winAmount);
                return winAmount;
            }
        }
        
        console.log('Проигрыш');
        return 0;
    }
    
    triggerWinAnimation() {
        const reels = [
            document.getElementById('reel1'),
            document.getElementById('reel2'),
            document.getElementById('reel3'),
            document.getElementById('reel4')
        ];
        
        reels.forEach(reel => {
            if (!reel) return;
            
            reel.classList.add('win-animation');
            setTimeout(() => {
                reel.classList.remove('win-animation');
            }, 1500);
        });
    }
    
    updateWinDisplay(amount) {
        const winElement = document.getElementById('winAmount');
        if (winElement) {
            winElement.textContent = 'Выигрыш: $' + amount.toFixed(2);
            if (amount > 0) {
                winElement.style.color = '#4CAF50';
                winElement.style.textShadow = '0 0 10px #4CAF50';
            } else {
                winElement.style.color = 'white';
                winElement.style.textShadow = 'none';
            }
        }
    }
}
