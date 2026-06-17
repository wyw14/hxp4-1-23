type ColorName = string;

interface ColorOption {
  name: ColorName;
  hex: string;
  label: string;
}

const COLOR_POOL: ColorOption[] = [
  { name: 'red', hex: '#e74c3c', label: '红色' },
  { name: 'coral', hex: '#ff7f50', label: '珊瑚色' },
  { name: 'orange', hex: '#e67e22', label: '橙色' },
  { name: 'gold', hex: '#ffd700', label: '金色' },
  { name: 'yellow', hex: '#f1c40f', label: '黄色' },
  { name: 'lime', hex: '#a3d617', label: '青柠色' },
  { name: 'olive', hex: '#808000', label: '橄榄色' },
  { name: 'green', hex: '#2ecc71', label: '绿色' },
  { name: 'mint', hex: '#98ff98', label: '薄荷色' },
  { name: 'teal', hex: '#1abc9c', label: '青色' },
  { name: 'cyan', hex: '#3498db', label: '天蓝色' },
  { name: 'sky', hex: '#87ceeb', label: '淡蓝色' },
  { name: 'blue', hex: '#2980b9', label: '蓝色' },
  { name: 'navy', hex: '#000080', label: '海军蓝' },
  { name: 'indigo', hex: '#667eea', label: '靛蓝色' },
  { name: 'purple', hex: '#9b59b6', label: '紫色' },
  { name: 'lavender', hex: '#b57edc', label: '薰衣草色' },
  { name: 'plum', hex: '#dda0dd', label: '梅红色' },
  { name: 'pink', hex: '#e91e63', label: '粉红色' },
  { name: 'magenta', hex: '#c71585', label: '洋红色' },
  { name: 'maroon', hex: '#800000', label: '褐红色' },
  { name: 'salmon', hex: '#fa8072', label: '鲑鱼色' },
  { name: 'peach', hex: '#ffdab9', label: '桃色' },
  { name: 'tan', hex: '#d2b48c', label: '棕褐色' },
];

const DEFAULT_SELECTED_COLORS: ColorName[] = ['red', 'yellow', 'blue', 'green'];

interface HighScoreResponse {
  highScore: number;
  isNewRecord?: boolean;
}

class ColorMemoryGame {
  private sequence: ColorName[] = [];
  private playerIndex: number = 0;
  private isPlaying: boolean = false;
  private isShowingSequence: boolean = false;
  private level: number = 0;
  private highScore: number = 0;
  private selectedColors: ColorName[] = [...DEFAULT_SELECTED_COLORS];

  private readonly buttons: NodeListOf<HTMLButtonElement>;
  private readonly startBtn: HTMLButtonElement;
  private readonly currentLevelEl: HTMLElement;
  private readonly highScoreEl: HTMLElement;
  private readonly gameStatusEl: HTMLElement;
  private readonly colorPoolEl: HTMLElement;
  private readonly selectedColorsInfoEl: HTMLElement;

  private readonly lightOnDuration: number = 600;
  private readonly lightOffDuration: number = 300;

  constructor() {
    this.buttons = document.querySelectorAll('.color-btn');
    this.startBtn = document.getElementById('start-btn') as HTMLButtonElement;
    this.currentLevelEl = document.getElementById('current-level') as HTMLElement;
    this.highScoreEl = document.getElementById('high-score') as HTMLElement;
    this.gameStatusEl = document.getElementById('game-status') as HTMLElement;
    this.colorPoolEl = document.getElementById('color-pool') as HTMLElement;
    this.selectedColorsInfoEl = document.getElementById('selected-colors-info') as HTMLElement;

    this.init();
  }

  private async init(): Promise<void> {
    this.setupEventListeners();
    this.renderColorPool();
    this.updateGameBoardColors();
    this.updateSelectedColorsInfo();
    await this.fetchHighScore();
  }

  private setupEventListeners(): void {
    this.startBtn.addEventListener('click', () => this.startGame());

    this.buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = (e.target as HTMLButtonElement).dataset.color as ColorName;
        this.handlePlayerInput(color);
      });
    });
  }

  private async fetchHighScore(): Promise<void> {
    try {
      const response = await fetch('/api/highscore');
      const data = await response.json() as HighScoreResponse;
      this.highScore = data.highScore;
      this.highScoreEl.textContent = this.highScore.toString();
    } catch (error) {
      console.error('获取最高分失败:', error);
    }
  }

  private async saveHighScore(score: number): Promise<void> {
    try {
      const response = await fetch('/api/highscore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score }),
      });
      const data = await response.json() as HighScoreResponse;
      this.highScore = data.highScore;
      this.highScoreEl.textContent = this.highScore.toString();

      if (data.isNewRecord) {
        this.showStatus('🎉 新纪录！', 'success');
      }
    } catch (error) {
      console.error('保存最高分失败:', error);
    }
  }

  private startGame(): void {
    this.sequence = [];
    this.playerIndex = 0;
    this.level = 0;
    this.isPlaying = true;
    this.currentLevelEl.textContent = '0';
    
    this.setButtonsDisabled(true);
    this.startBtn.disabled = true;
    this.setColorPoolDisabled(true);
    
    this.showStatus('游戏开始！', 'playing');
    this.nextRound();
  }

  private nextRound(): void {
    this.level++;
    this.currentLevelEl.textContent = this.level.toString();
    this.playerIndex = 0;

    const randomColor = this.selectedColors[Math.floor(Math.random() * this.selectedColors.length)];
    this.sequence.push(randomColor);

    this.showStatus(`第 ${this.level} 关 - 记住序列`, 'playing');
    this.showSequence();
  }

  private async showSequence(): Promise<void> {
    this.isShowingSequence = true;
    this.setButtonsDisabled(true);

    await this.delay(500);

    for (let i = 0; i < this.sequence.length; i++) {
      const color = this.sequence[i];
      await this.lightUpButton(color);
      
      if (i < this.sequence.length - 1) {
        await this.delay(this.lightOffDuration);
      }
    }

    this.isShowingSequence = false;
    this.setButtonsDisabled(false);
    this.showStatus('请按顺序点击按钮', 'playing');
  }

  private async lightUpButton(color: ColorName): Promise<void> {
    const button = this.getButtonByColor(color);
    if (!button) return;

    button.classList.add('active');
    await this.delay(this.lightOnDuration);
    button.classList.remove('active');
  }

  private getButtonByColor(color: ColorName): HTMLButtonElement | null {
    return document.querySelector(`.color-btn[data-color="${color}"]`);
  }

  private async handlePlayerInput(color: ColorName): Promise<void> {
    if (!this.isPlaying || this.isShowingSequence) return;

    const expectedColor = this.sequence[this.playerIndex];
    const button = this.getButtonByColor(color);

    if (color === expectedColor) {
      button?.classList.add('correct');
      await this.delay(200);
      button?.classList.remove('correct');

      this.playerIndex++;

      if (this.playerIndex === this.sequence.length) {
        this.showStatus('正确！准备下一关...', 'success');
        this.setButtonsDisabled(true);
        await this.delay(1000);
        this.nextRound();
      }
    } else {
      button?.classList.add('wrong');
      await this.delay(500);
      button?.classList.remove('wrong');

      this.gameOver();
    }
  }

  private async gameOver(): Promise<void> {
    this.isPlaying = false;
    this.setButtonsDisabled(true);
    this.startBtn.disabled = false;
    this.setColorPoolDisabled(false);

    const finalScore = this.level - 1;
    this.showStatus(`游戏结束！你完成了 ${finalScore} 关`, 'gameover');

    if (finalScore > this.highScore) {
      await this.saveHighScore(finalScore);
    }
  }

  private setButtonsDisabled(disabled: boolean): void {
    this.buttons.forEach(btn => {
      btn.disabled = disabled;
    });
  }

  private setColorPoolDisabled(disabled: boolean): void {
    const poolButtons = this.colorPoolEl.querySelectorAll('.pool-color-btn');
    poolButtons.forEach(btn => {
      (btn as HTMLButtonElement).disabled = disabled;
      if (disabled) {
        (btn as HTMLButtonElement).style.opacity = '0.5';
        (btn as HTMLButtonElement).style.cursor = 'not-allowed';
      } else {
        (btn as HTMLButtonElement).style.opacity = '1';
        (btn as HTMLButtonElement).style.cursor = 'pointer';
      }
    });
  }

  private showStatus(message: string, type: 'playing' | 'gameover' | 'success' | '' = ''): void {
    this.gameStatusEl.textContent = message;
    this.gameStatusEl.className = 'game-status';
    if (type) {
      this.gameStatusEl.classList.add(type);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private renderColorPool(): void {
    this.colorPoolEl.innerHTML = '';
    COLOR_POOL.forEach(colorOption => {
      const colorBtn = document.createElement('button');
      colorBtn.className = 'pool-color-btn';
      colorBtn.dataset.color = colorOption.name;
      colorBtn.style.backgroundColor = colorOption.hex;
      colorBtn.title = colorOption.label;

      if (this.selectedColors.includes(colorOption.name)) {
        colorBtn.classList.add('selected');
      }

      colorBtn.addEventListener('click', () => this.toggleColorSelection(colorOption.name));
      this.colorPoolEl.appendChild(colorBtn);
    });
  }

  private toggleColorSelection(colorName: ColorName): void {
    if (this.isPlaying) return;

    const index = this.selectedColors.indexOf(colorName);
    if (index > -1) {
      if (this.selectedColors.length > 2) {
        this.selectedColors.splice(index, 1);
      } else {
        this.showStatus('至少需要选择2种颜色', 'gameover');
        return;
      }
    } else {
      if (this.selectedColors.length < 4) {
        this.selectedColors.push(colorName);
      } else {
        this.showStatus('最多选择4种颜色', 'gameover');
        return;
      }
    }

    this.renderColorPool();
    this.updateGameBoardColors();
    this.updateSelectedColorsInfo();
  }

  private updateGameBoardColors(): void {
    const buttons = document.querySelectorAll('.color-btn');
    buttons.forEach((btn, index) => {
      const colorName = this.selectedColors[index];
      if (colorName) {
        const colorOption = COLOR_POOL.find(c => c.name === colorName);
        if (colorOption) {
          (btn as HTMLButtonElement).dataset.color = colorName;
          (btn as HTMLButtonElement).style.backgroundColor = colorOption.hex;
          (btn as HTMLButtonElement).style.boxShadow = `0 4px 15px ${colorOption.hex}66`;
        }
      }
    });
  }

  private updateSelectedColorsInfo(): void {
    this.selectedColorsInfoEl.textContent = `已选择 ${this.selectedColors.length}/4 种颜色`;
  }
}

new ColorMemoryGame();
