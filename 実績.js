(function(Scratch) {
  'use strict';

  let normalSound = 'data:audio/mp3;base64,';
  let goalSound = 'https://assets.scratch.mit.edu/internalapi/asset/33890530f637c307324da54f3a4d417a.wav/get/';
  let customIconUrl = '';

  const style = document.createElement('style');
  style.textContent = `
    .mc-container {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 10000;
      pointer-events: none;
    }
    .mc-toast {
      padding: 10px 15px; border-radius: 4px;
      display: flex; align-items: center; gap: 12px;
      font-family: 'Minecraft', 'Courier New', monospace;
      border: 2px solid; color: #fff; box-shadow: 4px 4px 0px rgba(0,0,0,0.5);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      background: #222;
      pointer-events: auto;
    }
    .mc-normal { border-color: #55FF55; }
    .mc-normal .label { color: #55FF55; }
    .mc-goal { border-color: #FF55FF; }
    .mc-goal .label { color: #FF55FF; }
    .mc-toast.hidden { opacity: 0; transform: translateX(120%); }
    .mc-icon { width: 32px; height: 32px; image-rendering: pixelated; object-fit: contain; }
  `;
  document.head.appendChild(style);

  // 通知を入れるためのコンテナを作成
  const container = document.createElement('div');
  container.className = 'mc-container';
  document.body.appendChild(container);

  class MinecraftAchieveFinal {
    getInfo() {
      return {
        id: 'kakaomameMCSoundFinal',
        name: 'マイクラ実績・究極版',
        color1: '#3D3D3D',
        blocks: [
          {
            opcode: 'setNormalSound',
            blockType: Scratch.BlockType.COMMAND,
            text: '進捗（緑）の音を [URL] にする',
            arguments: { URL: { type: Scratch.ArgumentType.STRING, defaultValue: 'default' } }
          },
          {
            opcode: 'setGoalSound',
            blockType: Scratch.BlockType.COMMAND,
            text: '目標（紫）の音を [URL] にする',
            arguments: { URL: { type: Scratch.ArgumentType.STRING, defaultValue: 'default' } }
          },
          {
            opcode: 'seticonimage',
            blockType: Scratch.BlockType.COMMAND,
            text: 'アイコンの画像を [URL] にする',
            arguments: { URL: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://kakaomames.github.io/rei/logo.png' } }
          },
          {
            opcode: 'fireMC',
            blockType: Scratch.BlockType.COMMAND,
            text: '[TYPE] [NAME] を達成！ スプライト [SPRITE]',
            arguments: {
              TYPE: { type: Scratch.ArgumentType.STRING, menu: 'typeMenu', defaultValue: 'normal' },
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: '石器時代' },
              SPRITE: { type: Scratch.ArgumentType.STRING, menu: 'spriteMenu' }
            }
          }
        ],
        menus: {
          typeMenu: {
            acceptReporters: false,
            items: [{ text: '進捗 (緑)', value: 'normal' }, { text: '目標 (紫)', value: 'goal' }]
          },
          spriteMenu: { acceptReporters: true, items: '_getSprites' }
        }
      };
    }

    _getSprites() {
      const sprites = Scratch.vm.runtime.targets.filter(t => !t.isStage).map(t => ({ text: t.sprite.name, value: t.sprite.name }));
      return sprites.length > 0 ? sprites : [{ text: 'なし', value: '' }];
    }

    setNormalSound(args) {
      normalSound = args.URL === 'default' ? 'https://assets.scratch.mit.edu/internalapi/asset/83a9787d4cb6f3b7632b4ddfebf74367.wav/get/' : args.URL;
    }

    setGoalSound(args) {
      goalSound = args.URL === 'default' ? 'https://assets.scratch.mit.edu/internalapi/asset/33890530f637c307324da54f3a4d417a.wav/get/' : args.URL;
    }

    seticonimage(args) {
      customIconUrl = args.URL === 'default' ? '' : args.URL;
    }

    fireMC(args) {
      const type = args.TYPE;
      const name = args.NAME;
      
      let iconSrc = customIconUrl;
      if (!iconSrc) {
        const target = Scratch.vm.runtime.getSpriteTargetByName(args.SPRITE);
        iconSrc = target ? target.getCostumes()[target.currentCostume].asset.encodeDataURI() : '';
      }

      const audio = new Audio(type === 'goal' ? goalSound : normalSound);
      audio.volume = 0.5;
      audio.play().catch(e => console.error("Audio failed:", e));

      const toast = document.createElement('div');
      toast.className = `mc-toast hidden ${type === 'goal' ? 'mc-goal' : 'mc-normal'}`;
      
      toast.innerHTML = `
        <img src="${iconSrc}" class="mc-icon">
        <div>
          <div class="label" style="font-size: 10px; font-weight: bold;">
            ${type === 'goal' ? '目標達成！' : '進捗に。'}
          </div>
          <div style="font-size: 14px;">${name}</div>
        </div>
      `;

      container.appendChild(toast); // コンテナに追加することで自動的に並ぶ！

      setTimeout(() => toast.classList.remove('hidden'), 100);
      setTimeout(() => {
        toast.classList.add('hidden');
        setTimeout(() => toast.remove(), 500);
      }, 4000);
    }
  }

  Scratch.extensions.register(new MinecraftAchieveFinal());
})(Scratch);
