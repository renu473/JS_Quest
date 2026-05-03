/* ============================================================
   15. GAMES SECTION
============================================================ */
const GAMES_DEF = [
  { id: 'memory',     icon: '🃏', name: 'Memory Match',   desc: 'Match JS keyword pairs — 3 difficulties, 4 themes!',   tag: 'Memory',     color: '#f7c948' },
  { id: 'dragdrop',   icon: '🖱️', name: 'DOM Builder',    desc: '5 levels — drag JS concepts to correct definitions!',  tag: 'DOM Events', color: '#4ecdc4' },
  { id: 'clickspeed', icon: '⚡', name: 'Event Loop',      desc: '3 rounds: click, keydown, mouseover — learn events!',  tag: 'Events',     color: '#ff6b6b' },
  { id: 'debug',      icon: '🐛', name: 'Bug Hunter',      desc: '3 rounds, 21 bugs — syntax, logic & runtime errors!', tag: 'Debugging',  color: '#a855f7' },
  { id: 'quizgame',   icon: '🏆', name: 'Knowledge Blitz', desc: '10 questions, lifelines, streak multiplier — fast!',   tag: 'All Topics', color: '#50fa7b' },
  { id: 'typing',     icon: '⌨️', name: 'Typing Master',   desc: 'JS code type karo — WPM & accuracy improve karo!',       tag: 'Typing',     color: '#4ecdc4' },
];

function renderGamesGrid() {
  const grid = document.getElementById('games-grid');
  grid.innerHTML = GAMES_DEF.map((g, i) => `
    <div class="game-card" onclick="openGame('${g.id}')"
         style="--card-glow:${g.color}20;animation-delay:${i*0.07}s">
      <span class="game-card-icon">${g.icon}</span>
      <div class="game-card-name">${g.name}</div>
      <div class="game-card-desc">${g.desc}</div>
      <span class="game-card-tag" style="background:${g.color}18;color:${g.color}">${g.tag}</span>
    </div>
  `).join('');
}

function openGame(id, _fromPop) {
  playSound('click');
  document.getElementById('games-grid').style.display = 'none';
  const arena = document.getElementById('game-arena');
  arena.classList.add('open');
  const content = document.getElementById('game-content');

  if (!_fromPop) _pushNav({ type: 'game', gameId: id });

  switch(id) {
    case 'memory':     renderMemoryGame(content); break;
    case 'dragdrop':   renderDragDrop(content); break;
    case 'clickspeed': renderClickSpeed(content); break;
    case 'debug':      renderDebugGame(content); break;
    case 'quizgame':   renderSpeedQuiz(content); break;
    case 'typing':     renderTypingMaster(content); break;
  }
}

function closeGameArena(_silent) {
  document.getElementById('games-grid').style.display = '';
  document.getElementById('game-arena').classList.remove('open');
  document.getElementById('game-content').innerHTML = '';
}

document.getElementById('back-to-games').addEventListener('click', () => {
  closeGameArena(); playSound('click');
});

/* ============================================================
   16. GAME: MEMORY MATCH — UPGRADED "Code Memory"
   - 3 difficulty modes: Easy (8 cards, no timer), Medium (12 cards, 60s), Hard (16 cards, 45s)
   - 4 themes: JS Keywords, HTML Tags, CSS Properties, Array Methods
   - Combo system: consecutive matches = bonus XP
   - Personal best score saved per difficulty
   - Polished UI with timer bar, combo display
============================================================ */

const MEMORY_THEMES = {
  js: {
    name: '⚡ JS Keywords',
    words8:  ['let', 'const', 'function', 'array', 'object', 'loop', 'event', 'DOM'],
    words12: ['let', 'const', 'function', 'array', 'object', 'loop', 'event', 'DOM', 'async', 'promise', 'class', 'return'],
    words16: ['let', 'const', 'function', 'array', 'object', 'loop', 'event', 'DOM', 'async', 'promise', 'class', 'return', 'typeof', 'closure', 'scope', 'hoisting'],
  },
  html: {
    name: '🌐 HTML Tags',
    words8:  ['div', 'span', 'form', 'input', 'button', 'table', 'ul', 'li'],
    words12: ['div', 'span', 'form', 'input', 'button', 'table', 'ul', 'li', 'header', 'section', 'article', 'footer'],
    words16: ['div', 'span', 'form', 'input', 'button', 'table', 'ul', 'li', 'header', 'section', 'article', 'footer', 'nav', 'aside', 'main', 'canvas'],
  },
  css: {
    name: '🎨 CSS Props',
    words8:  ['display', 'flex', 'grid', 'margin', 'padding', 'border', 'color', 'font'],
    words12: ['display', 'flex', 'grid', 'margin', 'padding', 'border', 'color', 'font', 'position', 'overflow', 'opacity', 'cursor'],
    words16: ['display', 'flex', 'grid', 'margin', 'padding', 'border', 'color', 'font', 'position', 'overflow', 'opacity', 'cursor', 'transform', 'transition', 'z-index', 'width'],
  },
  array: {
    name: '📋 Array Methods',
    words8:  ['.map()', '.filter()', '.reduce()', '.find()', '.push()', '.pop()', '.slice()', '.sort()'],
    words12: ['.map()', '.filter()', '.reduce()', '.find()', '.push()', '.pop()', '.slice()', '.sort()', '.join()', '.some()', '.every()', '.flat()'],
    words16: ['.map()', '.filter()', '.reduce()', '.find()', '.push()', '.pop()', '.slice()', '.sort()', '.join()', '.some()', '.every()', '.flat()', '.fill()', '.splice()', '.reverse()', '.indexOf()'],
  },
};

const MEMORY_DIFFICULTIES = {
  easy:   { label: 'Easy',   icon: '🌱', pairs: 8,  timer: 0,  xpBase: 20, xpBonus: 5,  gridCols: 4, timerLabel: 'No timer' },
  medium: { label: 'Medium', icon: '⚙️', pairs: 12, timer: 60, xpBase: 40, xpBonus: 10, gridCols: 6, timerLabel: '60s' },
  hard:   { label: 'Hard',   icon: '🔥', pairs: 16, timer: 45, xpBase: 60, xpBonus: 15, gridCols: 8, timerLabel: '45s' },
};

// Best scores stored per difficulty in state
function getMemoryBest(diff) {
  if (!state.memoryBest) state.memoryBest = {};
  return state.memoryBest[diff] || null;
}
function setMemoryBest(diff, moves) {
  if (!state.memoryBest) state.memoryBest = {};
  const prev = state.memoryBest[diff];
  if (prev === null || prev === undefined || moves < prev) {
    state.memoryBest[diff] = moves;
    saveState();
    return true; // new record!
  }
  return false;
}

function renderMemoryGame(container) {
  // Show difficulty + theme selector first
  const themeKeys = Object.keys(MEMORY_THEMES);
  const diffKeys  = Object.keys(MEMORY_DIFFICULTIES);
  let selectedTheme = 'js';
  let selectedDiff  = 'easy';

  function buildSelector() {
    container.innerHTML = `
      <div class="game-wrapper" style="max-width:640px;margin:0 auto">
        <div class="game-title">🃏 Code Memory</div>
        <div class="game-subtitle">Match JS concept pairs — test your memory!</div>

        <div style="margin:1.5rem 0">
          <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.6rem">🎨 Theme</div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap" id="theme-btns">
            ${themeKeys.map(k => `
              <button class="mem-sel-btn ${k === selectedTheme ? 'mem-sel-active' : ''}"
                      onclick="memSelectTheme('${k}',this)">${MEMORY_THEMES[k].name}</button>
            `).join('')}
          </div>
        </div>

        <div style="margin:1.5rem 0">
          <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.6rem">⚔️ Difficulty</div>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap" id="diff-btns">
            ${diffKeys.map(k => {
              const d = MEMORY_DIFFICULTIES[k];
              const best = getMemoryBest(k);
              return `
                <button class="mem-diff-btn ${k === selectedDiff ? 'mem-diff-active' : ''}"
                        data-diff="${k}" onclick="memSelectDiff('${k}',this)">
                  <span style="font-size:1.3rem">${d.icon}</span>
                  <div style="text-align:left">
                    <div style="font-weight:700;font-size:0.9rem">${d.label}</div>
                    <div style="font-size:0.72rem;opacity:0.65">${d.pairs} pairs · ${d.timerLabel}</div>
                    ${best !== null && best !== undefined
                      ? `<div style="font-size:0.7rem;color:var(--accent3);margin-top:0.1rem">🏆 Best: ${best} moves</div>`
                      : `<div style="font-size:0.7rem;opacity:0.4;margin-top:0.1rem">No record yet</div>`
                    }
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <button class="btn btn-primary" style="width:100%;margin-top:0.5rem;font-size:1rem;padding:0.75rem"
                onclick="startMemoryGame()">
          🃏 Start Game
        </button>
      </div>
    `;
  }

  window.memSelectTheme = function(k, btn) {
    selectedTheme = k;
    document.querySelectorAll('.mem-sel-btn').forEach(b => b.classList.remove('mem-sel-active'));
    btn.classList.add('mem-sel-active');
  };

  window.memSelectDiff = function(k, btn) {
    selectedDiff = k;
    document.querySelectorAll('.mem-diff-btn').forEach(b => b.classList.remove('mem-diff-active'));
    btn.classList.add('mem-diff-active');
  };

  window.startMemoryGame = function() {
    const diff   = MEMORY_DIFFICULTIES[selectedDiff];
    const theme  = MEMORY_THEMES[selectedTheme];
    // key is words8 / words12 / words16 based on number of pairs
    const keyMap = { 8: 'words8', 12: 'words12', 16: 'words16' };
    const key    = keyMap[diff.pairs] || 'words8';
    const words  = theme[key] || theme.words8;
    const cards  = [...words, ...words].sort(() => Math.random() - 0.5);

    let flipped = [], matched = 0, moves = 0, combo = 0, totalXP = 0;
    let canFlip = true, timerVal = diff.timer, timerInterval = null, gameOver = false;

    // cols: Easy=4 (4×4 grid), Medium=6 (6×4 grid), Hard=8 (8×4 grid)
    const cols = diff.gridCols || 4;
    const totalPairs = diff.pairs;

    container.innerHTML = `
      <div class="game-wrapper" style="max-width:${diff.pairs<=8?'560px':diff.pairs<=12?'760px':'900px'};margin:0 auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem">
          <div>
            <div class="game-title" style="margin:0;font-size:1.3rem">🃏 Code Memory <span style="font-size:0.8rem;background:var(--bg3);padding:0.2rem 0.6rem;border-radius:8px;margin-left:0.5rem;vertical-align:middle">${diff.icon} ${diff.label}</span></div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.2rem">${theme.name}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="renderMemoryGame(document.getElementById('game-content'))">← Change Mode</button>
        </div>

        <div class="game-score-bar" style="margin-bottom:0.75rem">
          <div class="score-item"><span class="score-label">Moves</span><span class="score-value" id="mem-moves">0</span></div>
          <div class="score-item"><span class="score-label">Matched</span><span class="score-value" id="mem-matched">0/${totalPairs}</span></div>
          <div class="score-item"><span class="score-label">Combo</span><span class="score-value" id="mem-combo" style="color:var(--accent2)">0🔥</span></div>
          ${diff.timer > 0 ? `<div class="score-item"><span class="score-label">⏱ Time</span><span class="score-value" id="mem-timer" style="color:var(--accent)">${diff.timer}</span></div>` : ''}
          <div class="score-item"><span class="score-label">XP</span><span class="score-value" id="mem-xp" style="color:var(--accent3)">0</span></div>
        </div>

        ${diff.timer > 0 ? `
          <div style="height:5px;background:var(--bg3);border-radius:3px;margin-bottom:1rem;overflow:hidden">
            <div id="mem-timebar" style="height:100%;width:100%;background:linear-gradient(90deg,var(--accent3),var(--accent));border-radius:3px;transition:width 0.9s linear"></div>
          </div>
        ` : ''}

        <div class="memory-grid" id="mem-grid" style="grid-template-columns:repeat(${cols},1fr)"></div>
        <div id="mem-result" style="margin-top:1.2rem;text-align:center"></div>
      </div>
    `;

    // Start timer
    if (diff.timer > 0) {
      timerInterval = setInterval(() => {
        if (gameOver) { clearInterval(timerInterval); return; }
        timerVal--;
        const te = document.getElementById('mem-timer');
        if (te) te.textContent = timerVal;
        const bar = document.getElementById('mem-timebar');
        if (bar) bar.style.width = `${(timerVal / diff.timer) * 100}%`;
        if (timerVal <= 0) {
          clearInterval(timerInterval);
          gameOver = true;
          endMemoryGame(false);
        }
      }, 1000);
    }

    function addXPDisplay(amount) {
      totalXP += amount;
      const el = document.getElementById('mem-xp');
      if (el) el.textContent = totalXP;
    }

    function endMemoryGame(won) {
      gameOver = true;
      if (timerInterval) clearInterval(timerInterval);

      if (won) {
        const isNewBest = setMemoryBest(selectedDiff, moves);
        addXP(totalXP, 'Memory Match');
        addConfetti();
        playSound('complete');
        const bestMsg = isNewBest ? `🏆 New personal best: ${moves} moves!` : `🏆 Best: ${getMemoryBest(selectedDiff)} moves`;
        document.getElementById('mem-result').innerHTML = `
          <div style="padding:1.5rem;background:rgba(78,205,196,0.08);border:1px solid rgba(78,205,196,0.2);border-radius:14px">
            <div style="font-size:1.5rem;font-weight:800;color:var(--accent3);margin-bottom:0.3rem">🎉 Completed!</div>
            <div style="color:var(--text-muted);margin-bottom:0.75rem">${moves} moves · ${totalXP} XP earned</div>
            <div style="font-size:0.85rem;color:var(--accent2);margin-bottom:1rem">${bestMsg}</div>
            <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap">
              <button class="btn btn-primary" onclick="window.startMemoryGame()">Play Again 🔁</button>
              <button class="btn btn-ghost" onclick="renderMemoryGame(document.getElementById('game-content'))">Change Mode</button>
            </div>
          </div>
        `;
        showToast(`🃏 Memory game done! +${totalXP} XP`, 'success');
      } else {
        document.getElementById('mem-result').innerHTML = `
          <div style="padding:1.5rem;background:rgba(255,107,107,0.08);border:1px solid rgba(255,107,107,0.2);border-radius:14px">
            <div style="font-size:1.4rem;font-weight:800;color:var(--accent2);margin-bottom:0.3rem">⏱ Time's Up!</div>
            <div style="color:var(--text-muted);margin-bottom:1rem">You matched ${matched}/${totalPairs} pairs</div>
            <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap">
              <button class="btn btn-primary" onclick="window.startMemoryGame()">Try Again 🔁</button>
              <button class="btn btn-ghost" onclick="renderMemoryGame(document.getElementById('game-content'))">Change Mode</button>
            </div>
          </div>
        `;
        playSound('wrong');
      }
    }

    // Build grid
    const grid = document.getElementById('mem-grid');
    cards.forEach((word) => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.innerHTML = `<div class="memory-inner"><div class="memory-front">?</div><div class="memory-back">${word}</div></div>`;
      card.addEventListener('click', () => {
        if (gameOver || !canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) return;
        card.classList.add('flipped');
        flipped.push({ card, word });
        playSound('click');

        if (flipped.length === 2) {
          canFlip = false;
          moves++;
          document.getElementById('mem-moves').textContent = moves;

          if (flipped[0].word === flipped[1].word) {
            // Match!
            flipped.forEach(f => f.card.classList.add('matched'));
            matched++;
            combo++;
            document.getElementById('mem-matched').textContent = `${matched}/${totalPairs}`;
            document.getElementById('mem-combo').textContent = `${combo}🔥`;

            // XP calculation: base + combo bonus
            const matchXP = diff.xpBase / totalPairs;
            const comboBonus = combo >= 3 ? diff.xpBonus : combo >= 2 ? Math.floor(diff.xpBonus * 0.5) : 0;
            addXPDisplay(Math.round(matchXP + comboBonus));

            if (combo >= 3) showXPPopup(`🔥 ${combo}x Combo! +${comboBonus} bonus`);

            flipped = []; canFlip = true;
            playSound('success');

            if (matched === totalPairs) {
              setTimeout(() => endMemoryGame(true), 300);
            }
          } else {
            // No match — reset combo
            combo = 0;
            document.getElementById('mem-combo').textContent = `0🔥`;
            setTimeout(() => {
              flipped.forEach(f => f.card.classList.remove('flipped'));
              flipped = []; canFlip = true;
              playSound('wrong');
            }, 900);
          }
        }
      });
      grid.appendChild(card);
    });
  };

  buildSelector();
}

/* ============================================================
   17. GAME: DRAG & DROP — "DOM Builder" (5 Levels)
   - 5 levels: Arrays, Functions, Objects, DOM, Mixed
   - 10 pairs per level
   - 3 lives system — wrong drop = -1 life
   - 60 second timer per level
   - Level lock: complete level N to unlock N+1
   - XP scales with level
============================================================ */

const DD_LEVELS = [
  {
    id: 1, name: 'Arrays', icon: '📋', color: '#4ecdc4',
    xp: 20, desc: 'Array methods & concepts',
    pairs: [
      { term: '.map()',     def: 'Transform every element' },
      { term: '.filter()', def: 'Keep matching elements' },
      { term: '.reduce()', def: 'Accumulate to one value' },
      { term: '.find()',    def: 'First match in array' },
      { term: '.push()',    def: 'Add item to end' },
      { term: '.pop()',     def: 'Remove last item' },
      { term: '.slice()',   def: 'Copy part of array' },
      { term: '.some()',    def: 'At least one matches?' },
      { term: '.every()',   def: 'All elements match?' },
      { term: '.flat()',    def: 'Flatten nested arrays' },
    ],
  },
  {
    id: 2, name: 'Functions', icon: '⚙️', color: '#f7c948',
    xp: 30, desc: 'Function types & concepts',
    pairs: [
      { term: 'return',          def: 'Send value back to caller' },
      { term: 'arrow function',  def: 'Compact => syntax' },
      { term: 'callback',        def: 'Function passed as argument' },
      { term: 'closure',         def: 'Remembers outer scope' },
      { term: 'default param',   def: 'Fallback when arg missing' },
      { term: 'rest params',     def: '...args collects extras' },
      { term: 'IIFE',            def: 'Immediately invoked function' },
      { term: 'hoisting',        def: 'Declarations moved to top' },
      { term: 'recursion',       def: 'Function calls itself' },
      { term: 'pure function',   def: 'No side effects, same output' },
    ],
  },
  {
    id: 3, name: 'Objects', icon: '🗂️', color: '#a855f7',
    xp: 40, desc: 'Object features & methods',
    pairs: [
      { term: 'Object.keys()',    def: 'Array of property names' },
      { term: 'Object.values()',  def: 'Array of property values' },
      { term: 'Object.assign()',  def: 'Merge / shallow copy' },
      { term: 'destructuring',    def: 'Extract values by name' },
      { term: 'spread {...}',     def: 'Copy/expand an object' },
      { term: 'this',             def: 'Refers to current object' },
      { term: 'prototype',        def: 'Shared method blueprint' },
      { term: 'getter',           def: 'Computed property on read' },
      { term: 'setter',           def: 'Run logic on write' },
      { term: 'JSON.stringify()', def: 'Object to JSON string' },
    ],
  },
  {
    id: 4, name: 'DOM', icon: '🌐', color: '#ff6b6b',
    xp: 50, desc: 'DOM manipulation & events',
    pairs: [
      { term: 'querySelector()',      def: 'Select one element' },
      { term: 'querySelectorAll()',   def: 'Select all matches' },
      { term: 'createElement()',      def: 'Make a new element' },
      { term: 'appendChild()',        def: 'Add child to parent' },
      { term: 'addEventListener()',   def: 'Listen for events' },
      { term: 'classList.toggle()',   def: 'Add or remove class' },
      { term: 'textContent',         def: 'Get/set text only' },
      { term: 'innerHTML',           def: 'Get/set HTML markup' },
      { term: 'event.preventDefault()', def: 'Stop default action' },
      { term: 'event.target',        def: 'Element that triggered' },
    ],
  },
  {
    id: 5, name: 'Mixed', icon: '🚀', color: '#50fa7b',
    xp: 60, desc: 'All topics — final boss!',
    pairs: [
      { term: 'typeof null',      def: '"object" — JS quirk' },
      { term: '=== vs ==',        def: 'Strict vs loose equality' },
      { term: 'NaN',              def: 'Not a Number value' },
      { term: 'null',             def: 'Intentional empty value' },
      { term: 'undefined',        def: 'Declared but not assigned' },
      { term: 'Promise',          def: 'Future async result' },
      { term: 'async/await',      def: 'Cleaner promise syntax' },
      { term: 'try/catch',        def: 'Handle runtime errors' },
      { term: 'localStorage',     def: 'Browser key-value store' },
      { term: 'setTimeout()',     def: 'Run code after delay' },
    ],
  },
];

// Track which levels are unlocked (saved in state)
function getDDUnlocked() {
  if (!state.ddUnlocked) state.ddUnlocked = [1];
  return state.ddUnlocked;
}
function unlockDDLevel(lvl) {
  const ul = getDDUnlocked();
  if (!ul.includes(lvl)) { ul.push(lvl); state.ddUnlocked = ul; saveState(); }
}
function isDDLevelUnlocked(lvlId) {
  return getDDUnlocked().includes(lvlId);
}

function renderDragDrop(container) {
  const unlocked = getDDUnlocked();

  container.innerHTML = `
    <div class="game-wrapper" style="max-width:680px;margin:0 auto">
      <div class="game-title">🖱️ DOM Builder</div>
      <div class="game-subtitle">Match JS terms to their definitions — 5 levels, 10 pairs each!</div>

      <div class="dd-level-map" id="dd-level-map">
        ${DD_LEVELS.map((lvl, i) => {
          const locked = !isDDLevelUnlocked(lvl.id);
          const done   = state.ddCompleted && state.ddCompleted.includes(lvl.id);
          return `
            <div class="dd-level-card ${locked ? 'dd-locked' : done ? 'dd-done' : 'dd-open'}"
                 style="--lvl-color:${lvl.color}"
                 onclick="${locked ? `showToast('🔒 Complete Level ${lvl.id - 1} first!','info')` : `startDDLevel(${lvl.id})`}">
              ${i > 0 ? '<div class="dd-connector"></div>' : ''}
              <div class="dd-lv-inner">
                <div class="dd-lv-num">${locked ? '🔒' : done ? '✅' : lvl.icon}</div>
                <div class="dd-lv-info">
                  <div class="dd-lv-name">Level ${lvl.id}: ${lvl.name}</div>
                  <div class="dd-lv-desc">${lvl.desc}</div>
                </div>
                <div class="dd-lv-right">
                  <span class="dd-lv-xp">⚡ ${lvl.xp} XP</span>
                  <span class="dd-lv-status ${done ? 'done' : locked ? 'locked' : 'open'}">
                    ${done ? 'Done' : locked ? 'Locked' : 'Play'}
                  </span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

window.startDDLevel = function(lvlId) {
  const lvl = DD_LEVELS.find(l => l.id === lvlId);
  if (!lvl) return;
  playSound('click');

  const container = document.getElementById('game-content');
  // Pick 10 pairs (already exactly 10 per level) and shuffle
  const pairs         = [...lvl.pairs].sort(() => Math.random() - 0.5);
  const shuffledTerms = [...pairs].sort(() => Math.random() - 0.5);

  let lives       = 3;
  let correct     = 0;
  let draggedTerm = null;
  let timeLeft    = lvl.id === 1 ? 0 : 60;  // Level 1 (Easy/Arrays): no timer for beginners
  let timerInt    = null;
  let gameActive  = true;
  const total     = pairs.length;

  function renderLevel() {
    container.innerHTML = `
      <div class="game-wrapper" style="max-width:740px;margin:0 auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem">
          <div>
            <div class="game-title" style="margin:0;font-size:1.2rem">
              ${lvl.icon} Level ${lvl.id}: ${lvl.name}
              <span style="font-size:0.75rem;background:var(--bg3);padding:0.2rem 0.6rem;border-radius:8px;margin-left:0.5rem;vertical-align:middle">${lvl.desc}</span>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="renderDragDrop(document.getElementById('game-content'))">← Levels</button>
        </div>

        <div class="game-score-bar" style="margin-bottom:0.75rem">
          <div class="score-item"><span class="score-label">Correct</span><span class="score-value" id="dd-correct" style="color:var(--accent3)">0/${total}</span></div>
          <div class="score-item"><span class="score-label">Lives</span><span class="score-value" id="dd-lives">❤️❤️❤️</span></div>
          ${timeLeft > 0 ? `<div class="score-item"><span class="score-label">⏱ Time</span><span class="score-value" id="dd-timer" style="color:var(--accent)">${timeLeft}</span></div>` : `<div class="score-item"><span class="score-label">⏱ Timer</span><span class="score-value" style="color:var(--accent3)">None</span></div>`}
        </div>
        ${timeLeft > 0 ? `<div style="height:5px;background:var(--bg3);border-radius:3px;margin-bottom:1.2rem;overflow:hidden">
          <div id="dd-timebar" style="height:100%;width:100%;background:linear-gradient(90deg,${lvl.color},var(--accent));border-radius:3px;transition:width 0.9s linear"></div>
        </div>` : '<div style="margin-bottom:1.2rem"></div>'}

        <!-- Terms pool — sticky on left -->
        <div style="display:flex;gap:1.5rem;align-items:flex-start">
          <div style="width:180px;flex-shrink:0;position:sticky;top:80px">
            <div class="dd-pool-label">📦 Terms</div>
            <div class="drag-items-pool" id="drag-pool">
              ${shuffledTerms.map(p => `
                <div class="drag-item" draggable="true" data-term="${p.term}"
                     style="border-color:${lvl.color}30;font-family:'Fira Code',monospace">
                  ${p.term}
                </div>
              `).join('')}
            </div>
          </div>
          <!-- Definitions — natural height, page scrolls -->
          <div style="flex:1;min-width:0">
            <div class="dd-pool-label">🎯 Definitions — drop here</div>
            <div class="drag-targets" id="drag-targets">
              ${pairs.map(p => `
                <div class="drop-target" data-correct="${p.term}">
                  <span class="target-label">${p.def}</span>
                  <span class="dd-drop-hint">drop here</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div id="dd-result" style="margin-top:1rem"></div>
      </div>
    `;

    attachDDEvents();

    // Start timer
    if (timeLeft > 0) timerInt = setInterval(() => {
      if (!gameActive) { clearInterval(timerInt); return; }
      timeLeft--;
      const te  = document.getElementById('dd-timer');
      const bar = document.getElementById('dd-timebar');
      if (te)  te.textContent = timeLeft;
      if (bar) bar.style.width = `${(timeLeft / 60) * 100}%`;
      if (timeLeft <= 10 && te) te.style.color = 'var(--accent2)';
      if (timeLeft <= 0) { clearInterval(timerInt); endDDLevel(false, 'timeout'); }
    }, 1000);
  }

  function updateHUD() {
    const hearts = '❤️'.repeat(lives) + '🖤'.repeat(Math.max(0, 3 - lives));
    const lv = document.getElementById('dd-lives');
    if (lv) lv.textContent = hearts;
    const cv = document.getElementById('dd-correct');
    if (cv) cv.textContent = `${correct}/${total}`;
  }

  function endDDLevel(won, reason) {
    gameActive = false;
    clearInterval(timerInt);

    if (won) {
      // Mark level complete and unlock next
      if (!state.ddCompleted) state.ddCompleted = [];
      if (!state.ddCompleted.includes(lvl.id)) state.ddCompleted.push(lvl.id);
      saveState();
      if (lvl.id < DD_LEVELS.length) unlockDDLevel(lvl.id + 1);

      addXP(lvl.xp, `DOM Builder Lv${lvl.id}`);
      addConfetti();
      playSound('complete');

      const nextLvl = DD_LEVELS.find(l => l.id === lvl.id + 1);
      document.getElementById('dd-result').innerHTML = `
        <div style="padding:1.5rem;background:rgba(80,250,123,0.07);border:1px solid rgba(80,250,123,0.2);border-radius:14px;text-align:center">
          <div style="font-size:1.5rem;font-weight:800;color:#50fa7b;margin-bottom:0.4rem">🎉 Level ${lvl.id} Complete!</div>
          <div style="color:var(--text-muted);margin-bottom:1rem">All ${total} pairs matched! +${lvl.xp} XP earned</div>
          ${nextLvl ? `<div style="font-size:0.85rem;color:var(--accent);margin-bottom:1rem">🔓 Level ${nextLvl.id}: ${nextLvl.name} unlocked!</div>` : ''}
          <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap">
            ${nextLvl ? `<button class="btn btn-primary" onclick="startDDLevel(${nextLvl.id})">Next Level ${nextLvl.icon} →</button>` : '<div style="color:var(--accent3);font-weight:700">🏆 All 5 Levels Complete — DOM Master!</div>'}
            <button class="btn btn-ghost" onclick="renderDragDrop(document.getElementById('game-content'))">Level Map</button>
          </div>
        </div>
      `;
      showToast(`✅ Level ${lvl.id} complete! +${lvl.xp} XP`, 'success');
    } else {
      const msg = reason === 'timeout' ? '⏱ Time\'s Up!' : reason === 'lives' ? '💀 Out of Lives!' : 'Game Over';
      document.getElementById('dd-result').innerHTML = `
        <div style="padding:1.5rem;background:rgba(255,107,107,0.07);border:1px solid rgba(255,107,107,0.2);border-radius:14px;text-align:center">
          <div style="font-size:1.4rem;font-weight:800;color:var(--accent2);margin-bottom:0.4rem">${msg}</div>
          <div style="color:var(--text-muted);margin-bottom:1rem">You matched ${correct}/${total} pairs</div>
          <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="startDDLevel(${lvl.id})">Try Again 🔁</button>
            <button class="btn btn-ghost" onclick="renderDragDrop(document.getElementById('game-content'))">Level Map</button>
          </div>
        </div>
      `;
      playSound('wrong');
    }
  }

  function attachDDEvents() {
    document.querySelectorAll('#drag-pool .drag-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        draggedTerm = item.dataset.term;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));

      // Touch support
      item.addEventListener('touchstart', handleTouchStart, { passive: true });
      item.addEventListener('touchmove', handleTouchMove, { passive: false });
      item.addEventListener('touchend', handleTouchEnd);
    });

    document.querySelectorAll('#drag-targets .drop-target').forEach(target => {
      target.addEventListener('dragover', e => { e.preventDefault(); if (!target.classList.contains('correct')) target.classList.add('over'); });
      target.addEventListener('dragleave', () => target.classList.remove('over'));
      target.addEventListener('drop', e => {
        e.preventDefault();
        target.classList.remove('over');
        handleDrop(target);
      });
    });
  }

  function handleDrop(target) {
    if (!gameActive || !draggedTerm || target.classList.contains('correct')) return;
    const isCorrect = target.dataset.correct === draggedTerm;
    const def = target.querySelector('.target-label')?.textContent || '';

    if (isCorrect) {
      target.classList.add('correct');
      target.innerHTML = `
        <span style="color:var(--accent3);font-family:'Fira Code',monospace;font-size:0.82rem;font-weight:700">${draggedTerm}</span>
        <span style="margin-left:auto;flex-shrink:0">✅</span>
        <span style="display:block;width:100%;font-size:0.75rem;color:var(--text-muted);margin-top:0.15rem">${def}</span>
      `;
      document.querySelector(`#drag-pool .drag-item[data-term="${draggedTerm}"]`)?.remove();
      correct++;
      playSound('success');
      updateHUD();
      if (correct === total) setTimeout(() => endDDLevel(true), 350);
    } else {
      target.classList.add('dd-wrong-flash');
      lives--;
      updateHUD();
      playSound('wrong');
      setTimeout(() => target.classList.remove('dd-wrong-flash'), 600);
      if (lives <= 0) setTimeout(() => endDDLevel(false, 'lives'), 400);
    }
    draggedTerm = null;
  }

  // ---- Touch drag support ----
  let touchDragEl = null, touchClone = null;

  function handleTouchStart(e) {
    touchDragEl = e.currentTarget;
    draggedTerm = touchDragEl.dataset.term;
    touchDragEl.classList.add('dragging');
    touchClone = touchDragEl.cloneNode(true);
    touchClone.style.cssText = `position:fixed;opacity:0.85;pointer-events:none;z-index:9999;width:${touchDragEl.offsetWidth}px;transform:scale(1.05)`;
    document.body.appendChild(touchClone);
  }

  function handleTouchMove(e) {
    if (!touchClone) return;
    e.preventDefault();
    const t = e.touches[0];
    touchClone.style.left = `${t.clientX - touchDragEl.offsetWidth / 2}px`;
    touchClone.style.top  = `${t.clientY - 20}px`;
    document.querySelectorAll('#drag-targets .drop-target').forEach(tgt => {
      const r = tgt.getBoundingClientRect();
      tgt.classList.toggle('over', t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom && !tgt.classList.contains('correct'));
    });
  }

  function handleTouchEnd(e) {
    if (touchClone) { touchClone.remove(); touchClone = null; }
    if (touchDragEl) touchDragEl.classList.remove('dragging');
    const t = e.changedTouches[0];
    document.querySelectorAll('#drag-targets .drop-target.over').forEach(tgt => {
      tgt.classList.remove('over');
      handleDrop(tgt);
    });
    touchDragEl = null;
  }

  renderLevel();
};

function resetDragDrop() {
  renderDragDrop(document.getElementById('game-content'));
}

/* ============================================================
   18. GAME: EVENT CHALLENGE (replaces Click Speed)
   - Round 1: click event   — button click karo (10s)
   - Round 2: keydown event — spacebar/arrow keys press karo (10s)
   - Round 3: mouseover     — targets hover karo bina click ke (15s)
   - Har round ke baad JS explanation
   - Score + best score saved per round
============================================================ */

const EC_ROUNDS = [
  {
    id: 'click',
    icon: '🖱️',
    event: 'click',
    name: 'click event',
    title: 'Round 1 — click',
    subtitle: 'Button ko jitni baar click kar sako 10 seconds mein!',
    duration: 10,
    xp: 15,
    color: '#4ecdc4',
    codeSnippet: `btn.addEventListener('<span style="color:#f7c948">click</span>', () => {\n  console.log('Button clicked!');\n});`,
    explanation: `<strong>click</strong> event tab fire hota hai jab user kisi element pe mouse click kare ya touch kare. Yeh sabse common JS event hai — buttons, links, cards sab pe use hota hai.`,
    instruction: '👇 Button ko click karo!',
  },
  {
    id: 'keydown',
    icon: '⌨️',
    event: 'keydown',
    name: 'keydown event',
    title: 'Round 2 — keydown',
    subtitle: 'Spacebar ya koi bhi key press karo 10 seconds mein!',
    duration: 10,
    xp: 20,
    color: '#f7c948',
    codeSnippet: `document.addEventListener('<span style="color:#f7c948">keydown</span>', (e) => {\n  console.log('Key pressed:', e.key);\n});`,
    explanation: `<strong>keydown</strong> event tab fire hota hai jab user keyboard pe koi key press kare. <code>event.key</code> se pata chalta hai konsi key — "Space", "ArrowUp", "Enter" etc. Games aur shortcuts isi se bante hain!`,
    instruction: '⌨️ Koi bhi key press karte raho!',
  },
  {
    id: 'mouseover',
    icon: '🎯',
    event: 'mouseover',
    name: 'mouseover event',
    title: 'Round 3 — mouseover',
    subtitle: 'Targets pe mouse hover karo — click mat karna! (15 seconds)',
    duration: 15,
    xp: 25,
    color: '#a855f7',
    codeSnippet: `target.addEventListener('<span style="color:#f7c948">mouseover</span>', () => {\n  console.log('Mouse entered element!');\n});`,
    explanation: `<strong>mouseover</strong> event tab fire hota hai jab mouse pointer kisi element ke upar aaye — click ki zaroorat nahi! Tooltips, dropdown menus, aur hover animations isi event se bante hain.`,
    instruction: '🎯 Circles pe mouse le jao bina click kiye!',
  },
];

function getECBest() {
  if (!state.ecBest) state.ecBest = {};
  return state.ecBest;
}
function setECBest(roundId, score) {
  if (!state.ecBest) state.ecBest = {};
  const prev = state.ecBest[roundId];
  if (prev === undefined || score > prev) {
    state.ecBest[roundId] = score;
    saveState();
    return true;
  }
  return false;
}

function renderClickSpeed(container) {
  // Show round selector
  const best = getECBest();

  container.innerHTML = `
    <div class="game-wrapper" style="max-width:640px;margin:0 auto">
      <div class="game-title">⚡ Event Challenge</div>
      <div class="game-subtitle">Teen rounds — teen JS events seekho khelke!</div>

      <div class="ec-rounds-list">
        ${EC_ROUNDS.map((r, i) => `
          <div class="ec-round-card" style="--ec-color:${r.color}" onclick="startECRound(${i})">
            <div class="ec-round-num">${r.icon}</div>
            <div class="ec-round-info">
              <div class="ec-round-name">${r.title}</div>
              <div class="ec-round-sub">${r.subtitle}</div>
              <div class="ec-round-code">${r.name}</div>
            </div>
            <div class="ec-round-right">
              <span class="ec-round-xp">⚡ ${r.xp} XP</span>
              ${best[r.id] !== undefined
                ? `<span class="ec-best-badge">🏆 Best: ${best[r.id]}</span>`
                : `<span class="ec-no-best">No record</span>`
              }
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:1.25rem;padding:1rem;background:var(--bg3);border-radius:12px;border:1px solid var(--glass-border)">
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:0.5rem">💡 Seekhoge kya?</div>
        <div style="font-size:0.83rem;color:var(--text-muted);line-height:1.6">
          Har round ek real JS event demonstrate karta hai —
          <code style="color:var(--accent3)">click</code>,
          <code style="color:var(--accent)">keydown</code>,
          <code style="color:var(--accent2)">mouseover</code>.
          Round khatam hone ke baad actual code explanation milegi!
        </div>
      </div>
    </div>
  `;
}

window.startECRound = function(roundIdx) {
  const round = EC_ROUNDS[roundIdx];
  const container = document.getElementById('game-content');
  let count = 0;
  let timeLeft = round.duration;
  let timerInt = null;
  let active = false;
  let keyHandler = null;
  let mouseHandlers = [];

  function buildRoundUI() {
    let interactiveArea = '';

    if (round.id === 'click') {
      interactiveArea = `
        <div class="ec-click-area">
          <button class="ec-click-btn" id="ec-main-btn" onclick="ecHandleStart()">
            <span id="ec-btn-label">▶ Start</span>
          </button>
        </div>
      `;
    } else if (round.id === 'keydown') {
      interactiveArea = `
        <div class="ec-key-area" id="ec-key-area" onclick="ecHandleStart()" tabindex="0">
          <div class="ec-key-display" id="ec-key-display">
            <span style="font-size:2rem">⌨️</span>
            <div id="ec-key-label" style="margin-top:0.5rem;color:var(--text-muted);font-size:0.9rem">Click here, phir keys press karo</div>
          </div>
          <div id="ec-last-key" style="margin-top:1rem;font-size:0.85rem;color:var(--text-muted)"></div>
        </div>
      `;
    } else if (round.id === 'mouseover') {
      interactiveArea = `
        <div class="ec-hover-area" id="ec-hover-area">
          <div style="text-align:center;margin-bottom:1rem;font-size:0.85rem;color:var(--text-muted)">
            Pehle Start dabao, phir circles pe hover karo!
          </div>
          <div class="ec-targets-grid" id="ec-targets-grid"></div>
          <button class="btn btn-primary" id="ec-start-hover" onclick="ecHandleStart()" style="display:block;margin:1rem auto">▶ Start</button>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="game-wrapper" style="max-width:640px;margin:0 auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <div>
            <div class="game-title" style="margin:0;font-size:1.2rem">${round.icon} ${round.title}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.2rem">${round.subtitle}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="renderClickSpeed(document.getElementById('game-content'))">← Rounds</button>
        </div>

        <div class="game-score-bar" style="margin-bottom:0.75rem">
          <div class="score-item"><span class="score-label">Count</span><span class="score-value" id="ec-count" style="color:${round.color}">0</span></div>
          <div class="score-item"><span class="score-label">⏱ Time</span><span class="score-value" id="ec-timer">${round.duration}</span></div>
          <div class="score-item"><span class="score-label">Status</span><span class="score-value" id="ec-status" style="font-size:0.78rem;color:var(--text-muted)">Ready</span></div>
        </div>

        <div style="height:5px;background:var(--bg3);border-radius:3px;margin-bottom:1.2rem;overflow:hidden">
          <div id="ec-timebar" style="height:100%;width:100%;background:${round.color};border-radius:3px;transition:width 0.9s linear"></div>
        </div>

        ${interactiveArea}

        <div id="ec-result"></div>
      </div>
    `;

    // Attach mouseover targets after render
    if (round.id === 'mouseover') {
      buildHoverTargets();
    }
  }

  function buildHoverTargets() {
    const grid = document.getElementById('ec-targets-grid');
    if (!grid) return;
    const positions = Array.from({length: 12}, (_, i) => i);
    grid.innerHTML = positions.map(i => `
      <div class="ec-hover-target" id="ec-target-${i}" data-idx="${i}">🎯</div>
    `).join('');
  }

  function startTimer() {
    active = true;
    document.getElementById('ec-status').textContent = 'GO!';
    document.getElementById('ec-status').style.color = round.color;

    timerInt = setInterval(() => {
      timeLeft--;
      const te  = document.getElementById('ec-timer');
      const bar = document.getElementById('ec-timebar');
      if (te) {
        te.textContent = timeLeft;
        if (timeLeft <= 3) te.style.color = 'var(--accent2)';
      }
      if (bar) bar.style.width = `${(timeLeft / round.duration) * 100}%`;
      if (timeLeft <= 0) { clearInterval(timerInt); endRound(); }
    }, 1000);
  }

  function incrementCount() {
    if (!active) return;
    count++;
    const el = document.getElementById('ec-count');
    if (el) {
      el.textContent = count;
      el.style.transform = 'scale(1.3)';
      setTimeout(() => { if(el) el.style.transform = 'scale(1)'; }, 100);
    }
  }

  window.ecHandleStart = function() {
    if (active) return;

    // Round-specific setup on start
    if (round.id === 'click') {
      const btn = document.getElementById('ec-main-btn');
      if (btn) {
        btn.onclick = () => { incrementCount(); playSound('click'); };
        document.getElementById('ec-btn-label').textContent = round.icon;
      }
      startTimer();

    } else if (round.id === 'keydown') {
      const area = document.getElementById('ec-key-area');
      if (area) { area.onclick = null; area.focus(); }
      document.getElementById('ec-key-label').textContent = '⌨️ Keys press karo!';
      startTimer();

      keyHandler = (e) => {
        if (!active) return;
        e.preventDefault();
        incrementCount();
        playSound('click');
        const lk = document.getElementById('ec-last-key');
        if (lk) lk.innerHTML = `Last key: <code style="color:${round.color};font-family:'Fira Code'">"${e.key}"</code>`;
      };
      document.addEventListener('keydown', keyHandler);

    } else if (round.id === 'mouseover') {
      const startBtn = document.getElementById('ec-start-hover');
      if (startBtn) startBtn.style.display = 'none';
      startTimer();

      document.querySelectorAll('.ec-hover-target').forEach((target, i) => {
        const handler = () => {
          if (!active || target.classList.contains('ec-target-hit')) return;
          target.classList.add('ec-target-hit');
          incrementCount();
          playSound('click');
          // Respawn after 1.2s
          setTimeout(() => {
            if (target) target.classList.remove('ec-target-hit');
          }, 1200);
        };
        target.addEventListener('mouseover', handler);
        mouseHandlers.push({ el: target, fn: handler });
      });
    }
  };

  function endRound() {
    active = false;

    // Cleanup listeners
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    mouseHandlers.forEach(({ el, fn }) => el.removeEventListener('mouseover', fn));
    mouseHandlers = [];

    const isNewBest = setECBest(round.id, count);
    addXP(round.xp, round.name);
    playSound('complete');

    const best = getECBest();
    document.getElementById('ec-result').innerHTML = `
      <div style="margin-top:1.2rem">
        <!-- Score card -->
        <div style="padding:1.25rem;background:rgba(${round.color === '#4ecdc4' ? '78,205,196' : round.color === '#f7c948' ? '247,201,72' : '168,85,247'},0.08);border:1px solid ${round.color}30;border-radius:14px;text-align:center;margin-bottom:1rem">
          <div style="font-size:2.5rem;font-weight:900;color:${round.color};line-height:1">${count}</div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin:0.3rem 0 0.6rem">
            ${round.id === 'click' ? 'clicks' : round.id === 'keydown' ? 'keypresses' : 'hovers'} in ${round.duration}s
          </div>
          ${isNewBest
            ? `<div style="font-size:0.8rem;color:${round.color};font-weight:700">🏆 New Personal Best!</div>`
            : `<div style="font-size:0.8rem;color:var(--text-muted)">Best: ${best[round.id]}</div>`
          }
          <div style="font-size:0.8rem;color:var(--accent3);margin-top:0.3rem">+${round.xp} XP earned</div>
        </div>

        <!-- JS Explanation -->
        <div class="ec-explanation-card">
          <div class="ec-exp-header">
            <span class="ec-exp-badge">📚 JS Concept</span>
            <span style="font-size:0.8rem;color:var(--text-muted)">Abhi tune yeh event use kiya:</span>
          </div>
          <div class="ec-code-line">${round.codeSnippet}</div>
          <div class="ec-exp-text">${round.explanation}</div>
        </div>

        <!-- Actions -->
        <div style="display:flex;gap:0.75rem;margin-top:1rem;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="startECRound(${roundIdx})">Play Again 🔁</button>
          ${roundIdx < EC_ROUNDS.length - 1
            ? `<button class="btn btn-ghost" onclick="startECRound(${roundIdx + 1})">Next Round → ${EC_ROUNDS[roundIdx + 1].icon}</button>`
            : `<button class="btn btn-ghost" onclick="renderClickSpeed(document.getElementById('game-content'))">All Rounds 🏆</button>`
          }
        </div>
      </div>
    `;
  }

  buildRoundUI();
};

/* ============================================================
   19. GAME: DEBUG THE CODE — "Bug Hunter Mode" UPGRADED
   - 3 Rounds: Easy (syntax), Medium (logic), Hard (runtime)
   - 20+ bugs total across all rounds
   - Timer per bug — faster = more XP bonus
   - Hint penalty: -5 XP per hint used
   - Streak system: 3 consecutive fixes = bonus XP
   - XP varies by difficulty
============================================================ */

const DEBUG_ROUNDS = [
  {
    id: 1, label: 'Round 1', icon: '🟢', name: 'Syntax Bugs',
    desc: 'Typos, wrong case, missing brackets',
    color: '#4ecdc4', timeLimit: 45, xpBase: 15,
    challenges: [
      {
        title: 'Case-sensitive variable',
        category: 'Typo',
        buggy: `function greet(name) {\n  return "Hello, " + Name;\n}`,
        hint: 'JavaScript is case-sensitive. Check the parameter name vs what you\'re returning.',
        explain: '`Name` should be `name` — parameters are case-sensitive in JS.',
        test: c => { try { return new Function(c + '; return greet("World")==="Hello, World";')(); } catch(e) { return false; } }
      },
      {
        title: 'Missing parenthesis',
        category: 'Syntax',
        buggy: `function add(a, b {\n  return a + b;\n}\nconsole.log(add(2, 3));`,
        hint: 'Look at the function signature — something is missing before the {.',
        explain: 'The closing `)` is missing after parameters: `(a, b)` not `(a, b {`.',
        test: c => { try { return new Function(c + '; return add(2,3)===5;')(); } catch(e) { return false; } }
      },
      {
        title: 'Wrong string quotes',
        category: 'Syntax',
        buggy: `const msg = 'Hello World";\nconsole.log(msg);`,
        hint: 'String delimiters must match — opening and closing quotes should be the same.',
        explain: 'String opened with `\'` but closed with `"` — they must match.',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(String(v)); new Function(c)(); console.log=o; return logs[0]==='Hello World'; } catch(e) { return false; } }
      },
      {
        title: 'Missing closing bracket',
        category: 'Syntax',
        buggy: `const nums = [1, 2, 3, 4, 5;\nconsole.log(nums.length);`,
        hint: 'Arrays need both an opening [ and a closing ].',
        explain: 'The array is missing its closing `]` bracket.',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(String(v)); new Function(c)(); console.log=o; return logs[0]==='5'; } catch(e) { return false; } }
      },
      {
        title: 'Wrong method casing',
        category: 'Typo',
        buggy: `const nums = [1, 2, 3, 4, 5];\nconst doubled = nums.Map(n => n * 2);\nconsole.log(doubled);`,
        hint: 'Array methods are all lowercase in JavaScript.',
        explain: '`.Map()` should be `.map()` — JavaScript method names are case-sensitive.',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(JSON.stringify(v)); new Function(c)(); console.log=o; return logs[0]==='[2,4,6,8,10]'; } catch(e) { return false; } }
      },
      {
        title: 'Missing return keyword',
        category: 'Syntax',
        buggy: `function square(n) {\n  n * n;\n}\nconsole.log(square(4));`,
        hint: 'The function computes a value but never sends it back to the caller.',
        explain: '`n * n;` is computed but not returned. Add `return` before it.',
        test: c => { try { return new Function(c + '; return square(4)===16;')(); } catch(e) { return false; } }
      },
      {
        title: 'Assignment vs comparison',
        category: 'Typo',
        buggy: `let x = 10;\nif (x = 5) {\n  console.log("x is 5");\n} else {\n  console.log("x is not 5");\n}`,
        hint: 'In the condition, are you comparing or assigning?',
        explain: '`x = 5` assigns (always truthy). Use `x === 5` to compare.',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(String(v)); new Function(c)(); console.log=o; return logs[0]==='x is not 5'; } catch(e) { return false; } }
      },
    ]
  },
  {
    id: 2, label: 'Round 2', icon: '🟡', name: 'Logic Bugs',
    desc: 'Wrong conditions, off-by-one, bad operators',
    color: '#f7c948', timeLimit: 50, xpBase: 25,
    challenges: [
      {
        title: 'Off-by-one loop',
        category: 'Logic',
        buggy: `let sum = 0;\nfor (let i = 1; i < 5; i++) {\n  sum += i;\n}\nconsole.log(sum); // should be 15`,
        hint: 'The loop should count from 1 to 5 *inclusive*. Check the condition.',
        explain: '`i < 5` stops at 4. Use `i <= 5` to include 5: 1+2+3+4+5 = 15.',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(String(v)); new Function(c)(); console.log=o; return logs[0]==='15'; } catch(e) { return false; } }
      },
      {
        title: 'Wrong comparison operator',
        category: 'Logic',
        buggy: `function isAdult(age) {\n  return age > 18;\n}\nconsole.log(isAdult(18)); // should be true`,
        hint: 'Should 18 year olds be considered adults? Check the operator.',
        explain: '`> 18` excludes 18. Use `>= 18` to include exactly 18.',
        test: c => { try { return new Function(c + '; return isAdult(18)===true;')(); } catch(e) { return false; } }
      },
      {
        title: 'Reversed condition',
        category: 'Logic',
        buggy: `function max(a, b) {\n  if (a < b) {\n    return a;\n  }\n  return b;\n}\nconsole.log(max(3, 7)); // should be 7`,
        hint: 'If a is less than b, which one is the maximum?',
        explain: 'When `a < b`, b is the max — but we\'re returning `a`. Swap: return `b` inside the if, `a` outside.',
        test: c => { try { return new Function(c + '; return max(3,7)===7 && max(10,2)===10;')(); } catch(e) { return false; } }
      },
      {
        title: 'Wrong array index',
        category: 'Logic',
        buggy: `const fruits = ["apple", "banana", "cherry"];\nconsole.log(fruits[3]); // should print "cherry"`,
        hint: 'Arrays are zero-indexed. What index does the last element have?',
        explain: 'Arrays start at index 0. "cherry" is at index 2, not 3.',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(String(v)); new Function(c)(); console.log=o; return logs[0]==='cherry'; } catch(e) { return false; } }
      },
      {
        title: 'String vs number comparison',
        category: 'Logic',
        buggy: `const input = "5";\nif (input === 5) {\n  console.log("equal");\n} else {\n  console.log("not equal");\n}\n// Fix: should print "equal"`,
        hint: '=== checks both value AND type. The types don\'t match here.',
        explain: '"5" (string) !== 5 (number) with ===. Convert: `Number(input) === 5` or use `==`.',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(String(v)); new Function(c)(); console.log=o; return logs[0]==='equal'; } catch(e) { return false; } }
      },
      {
        title: 'Infinite loop risk',
        category: 'Logic',
        buggy: `let count = 0;\nwhile (count < 5) {\n  console.log(count);\n  count--;\n}`,
        hint: 'The loop should eventually end. Is count moving toward or away from the condition?',
        explain: '`count--` decrements — count goes 0,-1,-2... never reaches 5. Use `count++`.',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(String(v)); new Function(c)(); console.log=o; return logs.join(',') === '0,1,2,3,4'; } catch(e) { return false; } }
      },
      {
        title: 'Object property typo',
        category: 'Logic',
        buggy: `const user = { name: "Alice", age: 25 };\nconsole.log(user.nane); // should print "Alice"`,
        hint: 'Check the property name you\'re accessing vs what\'s defined in the object.',
        explain: '`user.nane` should be `user.name` — a typo in the property access.',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(String(v)); new Function(c)(); console.log=o; return logs[0]==='Alice'; } catch(e) { return false; } }
      },
    ]
  },
  {
    id: 3, label: 'Round 3', icon: '🔴', name: 'Runtime Bugs',
    desc: 'Scope errors, type errors, reference errors',
    color: '#ff6b6b', timeLimit: 60, xpBase: 40,
    challenges: [
      {
        title: 'Scope issue — var in block',
        category: 'Scope',
        buggy: `function checkAge() {\n  if (true) {\n    var message = "hello";\n  }\n  // Fix: use let so message is block-scoped\n  // Make message undefined outside the block\n  console.log(typeof message);\n}\ncheckAge(); // should print "undefined"`,
        hint: '`var` leaks out of blocks. Which keyword keeps variables inside their block?',
        explain: 'Replace `var` with `let` — let is block-scoped so `message` won\'t exist outside the if.',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(String(v)); new Function(c)(); console.log=o; return logs[0]==='undefined'; } catch(e) { return false; } }
      },
      {
        title: 'TypeError — calling non-function',
        category: 'TypeError',
        buggy: `const obj = {\n  name: "Bob",\n  greet: "Hello!"\n};\nconsole.log(obj.greet()); // should print "Hello!"`,
        hint: '`greet` is not a function — it\'s a string. How do you make it callable?',
        explain: '`greet` must be a function: `greet: () => "Hello!"` or `greet() { return "Hello!"; }`.',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(String(v)); new Function(c)(); console.log=o; return logs[0]==='Hello!'; } catch(e) { return false; } }
      },
      {
        title: 'Mutating const array wrong way',
        category: 'TypeError',
        buggy: `const arr = [1, 2, 3];\narr = [...arr, 4];\nconsole.log(arr.length); // should be 4`,
        hint: 'You can\'t reassign a const. But you can *mutate* it. Which method adds to an array in-place?',
        explain: 'Use `arr.push(4)` instead. `const` prevents reassignment but allows mutation methods.',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(String(v)); new Function(c)(); console.log=o; return logs[0]==='4'; } catch(e) { return false; } }
      },
      {
        title: 'NaN arithmetic',
        category: 'TypeError',
        buggy: `const price = "100";\nconst tax = 10;\nconst total = price + tax;\nconsole.log(total); // should be 110`,
        hint: 'One of these is a string. What happens when you add a string and a number?',
        explain: '"100" + 10 = "10010" (concatenation). Use `Number(price) + tax` or `+price + tax`.',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(String(v)); new Function(c)(); console.log=o; return logs[0]==='110'; } catch(e) { return false; } }
      },
      {
        title: 'Closure variable capture',
        category: 'Closure',
        buggy: `const funcs = [];\nfor (var i = 0; i < 3; i++) {\n  funcs.push(() => console.log(i));\n}\nfuncs[0](); // should print 0`,
        hint: '`var` is function-scoped — all closures share the same `i`. Which keyword creates a new binding per iteration?',
        explain: 'Replace `var` with `let` — let creates a new `i` for each loop iteration, so closures capture different values.',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(String(v)); new Function(c)(); console.log=o; return logs[0]==='0'; } catch(e) { return false; } }
      },
      {
        title: 'Undefined method on null',
        category: 'TypeError',
        buggy: `function getLength(str) {\n  return str.length;\n}\nconsole.log(getLength(null)); // should return 0 safely`,
        hint: 'Calling `.length` on null throws. Add a guard before accessing the property.',
        explain: 'Add a null check: `if (!str) return 0;` or use optional chaining: `str?.length ?? 0`.',
        test: c => { try { return new Function(c + '; return getLength(null)===0;')(); } catch(e) { return false; } }
      },
      {
        title: 'Async result used synchronously',
        category: 'Async',
        buggy: `function double(n) {\n  return new Promise(resolve => resolve(n * 2));\n}\nconst result = double(5);\nconsole.log(result); // should print 10`,
        hint: 'A Promise doesn\'t give the value directly. You need to unwrap it.',
        explain: 'Use `.then()`: `double(5).then(result => console.log(result));`',
        test: c => { try { let logs=[]; const o=console.log; console.log=v=>logs.push(String(v)); new Function(c)(); console.log=o; return new Promise(res => setTimeout(()=> res(logs[0]==='10'), 50)); } catch(e) { return false; } }
      },
    ]
  }
];

// Debug game state
let debugState = {
  round: 0,         // current round index
  challengeIdx: 0,  // current challenge within round
  score: 0,
  streak: 0,
  hintsUsed: 0,
  timerInterval: null,
  timeLeft: 0,
  gameStarted: false,
};

function renderDebugGame(container) {
  // Show round selector
  container.innerHTML = `
    <div class="game-wrapper" style="max-width:660px;margin:0 auto">
      <div class="game-title">🐛 Bug Hunter Mode</div>
      <div class="game-subtitle">Find and fix bugs across 3 rounds of increasing difficulty!</div>

      <div style="display:flex;flex-direction:column;gap:0.75rem;margin:1.5rem 0">
        ${DEBUG_ROUNDS.map((r, i) => {
          const bestKey = `debugBest_r${r.id}`;
          const best = state[bestKey];
          return `
            <div class="debug-round-card" style="--rc:${r.color}" onclick="startDebugRound(${i})">
              <div style="display:flex;align-items:center;gap:1rem">
                <span style="font-size:1.8rem">${r.icon}</span>
                <div style="flex:1">
                  <div style="font-weight:700;font-size:1rem">${r.label}: ${r.name}</div>
                  <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.15rem">${r.desc} · ${r.challenges.length} bugs · ${r.timeLimit}s per bug</div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:0.75rem;color:var(--text-muted)">Base XP</div>
                  <div style="font-weight:700;color:${r.color}">${r.xpBase} XP</div>
                  ${best !== undefined ? `<div style="font-size:0.7rem;color:var(--accent3);margin-top:0.15rem">✓ Best: ${best}pts</div>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.15);border-radius:12px;padding:1rem;font-size:0.82rem;color:var(--text-muted)">
        ⚡ <strong>Faster fix = more XP</strong> &nbsp;·&nbsp;
        💡 <strong>Hint costs -5 XP</strong> &nbsp;·&nbsp;
        🔥 <strong>3-streak = +15 bonus XP</strong>
      </div>
    </div>
  `;
}

window.startDebugRound = function(roundIdx) {
  debugState = { round: roundIdx, challengeIdx: 0, score: 0, streak: 0, hintsUsed: 0, timerInterval: null, timeLeft: 0, gameStarted: true };
  renderDebugChallenge(document.getElementById('game-content'));
};

function renderDebugChallenge(container) {
  const round = DEBUG_ROUNDS[debugState.round];
  const ch = round.challenges[debugState.challengeIdx];
  const total = round.challenges.length;
  const idx = debugState.challengeIdx;

  if (debugState.timerInterval) clearInterval(debugState.timerInterval);
  debugState.timeLeft = round.timeLimit;

  container.innerHTML = `
    <div class="game-wrapper" style="max-width:700px;margin:0 auto">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;flex-wrap:wrap;gap:0.5rem">
        <div>
          <div class="game-title" style="margin:0;font-size:1.2rem">
            🐛 ${round.label}: ${round.name}
            <span style="font-size:0.75rem;background:${round.color}20;color:${round.color};padding:0.2rem 0.6rem;border-radius:8px;margin-left:0.5rem;vertical-align:middle">${ch.category}</span>
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.2rem">Bug ${idx+1} of ${total}: ${ch.title}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="renderDebugGame(document.getElementById('game-content'))">← Rounds</button>
      </div>

      <!-- HUD -->
      <div class="game-score-bar" style="margin-bottom:0.75rem">
        <div class="score-item"><span class="score-label">Score</span><span class="score-value" id="dbg-score" style="color:var(--accent)">${debugState.score}</span></div>
        <div class="score-item"><span class="score-label">Streak</span><span class="score-value" id="dbg-streak" style="color:var(--accent2)">${debugState.streak}🔥</span></div>
        <div class="score-item"><span class="score-label">⏱ Time</span><span class="score-value" id="dbg-timer" style="color:var(--accent3)">${round.timeLimit}</span></div>
        <div class="score-item"><span class="score-label">Progress</span><span class="score-value">${idx+1}/${total}</span></div>
      </div>

      <!-- Timer bar -->
      <div style="height:4px;background:var(--bg3);border-radius:2px;margin-bottom:1rem;overflow:hidden">
        <div id="dbg-timebar" style="height:100%;width:100%;background:linear-gradient(90deg,${round.color},${round.color}aa);border-radius:2px;transition:width 0.9s linear"></div>
      </div>

      <!-- Bug progress dots -->
      <div style="display:flex;gap:0.4rem;margin-bottom:1rem">
        ${round.challenges.map((_, i) => `
          <div style="height:6px;flex:1;border-radius:3px;background:${i < idx ? round.color : i === idx ? round.color+'60' : 'var(--bg3)'}"></div>
        `).join('')}
      </div>

      <!-- Editor area -->
      <div class="debug-game">
        <div class="debug-code-area">
          <div class="debug-instructions">🐛 Find and fix the bug in this code!</div>
          <textarea class="debug-editor" id="debug-editor" spellcheck="false">${ch.buggy}</textarea>
        </div>
        <div class="output-panel" id="debug-out">// Click "Run & Check" to test your fix...</div>
        <div class="debug-controls">
          <button class="btn btn-primary btn-sm" onclick="checkDebugNew()">▶ Run & Check</button>
          <button class="btn btn-ghost btn-sm" id="dbg-hint-btn" onclick="useDebugHint()">💡 Hint (−5 XP)</button>
          <button class="btn btn-ghost btn-sm" onclick="resetDebugNew()">↺ Reset</button>
        </div>
        <div id="debug-hint-box" style="display:none;margin-top:0.75rem;padding:0.85rem;background:rgba(247,201,72,0.07);border:1px solid rgba(247,201,72,0.25);border-radius:10px;font-size:0.86rem;color:var(--text-muted)">
          💡 ${ch.hint}
        </div>
      </div>
    </div>
  `;

  // Start timer
  debugState.timerInterval = setInterval(() => {
    debugState.timeLeft--;
    const te = document.getElementById('dbg-timer');
    const bar = document.getElementById('dbg-timebar');
    if (te) { te.textContent = debugState.timeLeft; if (debugState.timeLeft <= 10) te.style.color = '#ff6b6b'; }
    if (bar) bar.style.width = `${(debugState.timeLeft / round.timeLimit) * 100}%`;
    if (debugState.timeLeft <= 0) {
      clearInterval(debugState.timerInterval);
      timeOutDebug();
    }
  }, 1000);
}

function timeOutDebug() {
  const round = DEBUG_ROUNDS[debugState.round];
  const ch = round.challenges[debugState.challengeIdx];
  debugState.streak = 0;
  const out = document.getElementById('debug-out');
  if (out) {
    out.textContent = `⏱ Time's up! The fix was:\n${ch.buggy.replace(/(Name|Map|<|=\s*5\b|< 5\b|i--|\[3\]|nane|var message|greet: "Hello!"|arr = \[|"100"|var i|return str\.length|const result = double)/g, m => '→ ' + m)}`;
    out.className = 'output-panel error';
  }
  document.getElementById('dbg-streak').textContent = '0🔥';
  setTimeout(() => advanceDebugChallenge(false), 2000);
}

window.checkDebugNew = function() {
  if (debugState.timerInterval === null) return;
  clearInterval(debugState.timerInterval);
  const round = DEBUG_ROUNDS[debugState.round];
  const ch = round.challenges[debugState.challengeIdx];
  const code = document.getElementById('debug-editor')?.value || '';
  const out = document.getElementById('debug-out');
  let logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  let passed = false;
  try {
    new Function(code)();
    const testResult = ch.test(code);
    if (testResult && typeof testResult.then === 'function') {
      testResult.then(r => {
        console.log = orig;
        handleDebugResult(r, logs, code, round, ch);
      });
      return;
    }
    passed = !!testResult;
  } catch(e) {
    out.textContent = '❌ Error: ' + e.message;
    out.className = 'output-panel error';
    playSound('wrong');
    console.log = orig;
    debugState.timerInterval = null;
    // Restart timer
    setTimeout(() => {
      if (document.getElementById('debug-editor')) {
        debugState.timeLeft = round.timeLimit;
        renderDebugChallenge(document.getElementById('game-content'));
      }
    }, 1500);
    return;
  }
  console.log = orig;
  handleDebugResult(passed, logs, code, round, ch);
};

function handleDebugResult(passed, logs, code, round, ch) {
  const out = document.getElementById('debug-out');
  if (!out) return;
  if (passed) {
    // XP calculation: base + time bonus + streak bonus - hint penalty
    const timeBonus = Math.floor((debugState.timeLeft / round.timeLimit) * 20);
    let earnedXP = round.xpBase + timeBonus - (debugState.hintsUsed * 5);
    earnedXP = Math.max(earnedXP, 5); // minimum 5 XP
    debugState.score += earnedXP;
    debugState.streak++;
    debugState.hintsUsed = 0; // reset hints for next challenge

    const streakBonus = debugState.streak >= 3 ? 15 : 0;
    if (streakBonus) { debugState.score += streakBonus; showXPPopup(`🔥 ${debugState.streak}-Streak! +${streakBonus} bonus XP`); }

    document.getElementById('dbg-score').textContent = debugState.score;
    document.getElementById('dbg-streak').textContent = debugState.streak + '🔥';

    out.innerHTML = (logs.length ? logs.join('\n') + '\n\n' : '') +
      `✅ Bug squashed! +${earnedXP} XP (${timeBonus > 0 ? `+${timeBonus} speed bonus` : 'no speed bonus'})\n💡 ${ch.explain}`;
    out.className = 'output-panel';
    playSound('success');
    setTimeout(() => advanceDebugChallenge(true), 1800);
  } else {
    out.textContent = (logs.length ? logs.join('\n') + '\n\n' : '') + '❌ Not fixed yet — check your logic and try again!';
    out.className = 'output-panel error';
    playSound('wrong');
    debugState.timerInterval = null;
    // Restart timer
    const roundRef = DEBUG_ROUNDS[debugState.round];
    debugState.timeLeft = Math.max(debugState.timeLeft - 5, 5); // penalty: -5s
    let t = debugState.timeLeft;
    debugState.timerInterval = setInterval(() => {
      t--;
      debugState.timeLeft = t;
      const te = document.getElementById('dbg-timer');
      const bar = document.getElementById('dbg-timebar');
      if (te) { te.textContent = t; if (t <= 10) te.style.color = '#ff6b6b'; }
      if (bar) bar.style.width = `${(t / roundRef.timeLimit) * 100}%`;
      if (t <= 0) { clearInterval(debugState.timerInterval); timeOutDebug(); }
    }, 1000);
  }
}

function advanceDebugChallenge(wasCorrect) {
  const round = DEBUG_ROUNDS[debugState.round];
  debugState.challengeIdx++;
  if (debugState.challengeIdx >= round.challenges.length) {
    // Round complete!
    endDebugRound();
  } else {
    showToast(wasCorrect ? '🎉 Bug fixed! Next one...' : '⏭ Moving on...', wasCorrect ? 'success' : 'info');
    renderDebugChallenge(document.getElementById('game-content'));
  }
}

function endDebugRound() {
  if (debugState.timerInterval) clearInterval(debugState.timerInterval);
  const round = DEBUG_ROUNDS[debugState.round];
  const total = round.challenges.length;
  const bestKey = `debugBest_r${round.id}`;
  const prevBest = state[bestKey];
  const isNewBest = prevBest === undefined || debugState.score > prevBest;
  if (isNewBest) { state[bestKey] = debugState.score; saveState(); }

  addXP(debugState.score, `Debug ${round.label}`);
  if (debugState.score > round.xpBase * total * 0.7) addConfetti();

  const isLastRound = debugState.round === DEBUG_ROUNDS.length - 1;
  const nextRoundIdx = debugState.round + 1;

  document.getElementById('game-content').innerHTML = `
    <div class="game-wrapper" style="max-width:560px;margin:0 auto;text-align:center">
      <div style="font-size:2.5rem;margin-bottom:0.5rem">${round.icon}</div>
      <div class="game-title">${round.label} Complete!</div>
      <div style="font-size:3rem;font-weight:900;color:${round.color};margin:0.5rem 0">${debugState.score}</div>
      <div style="color:var(--text-muted);margin-bottom:1rem">points earned ${isNewBest ? '· 🏆 New best!' : ''}</div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin:1.5rem 0">
        <div style="background:var(--bg3);border-radius:10px;padding:0.85rem">
          <div style="font-size:1.3rem;font-weight:700;color:var(--accent)">${total}</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">Bugs Fixed</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:0.85rem">
          <div style="font-size:1.3rem;font-weight:700;color:var(--accent2)">${debugState.streak}🔥</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">Best Streak</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:0.85rem">
          <div style="font-size:1.3rem;font-weight:700;color:var(--accent3)">${debugState.score} XP</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">Total Earned</div>
        </div>
      </div>

      <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-ghost" onclick="startDebugRound(${debugState.round})">Replay Round 🔁</button>
        ${!isLastRound ? `<button class="btn btn-primary" onclick="startDebugRound(${nextRoundIdx})">Next Round ${DEBUG_ROUNDS[nextRoundIdx].icon} →</button>` : `<div style="color:var(--accent3);font-weight:700;padding:0.6rem">🏆 All 3 Rounds Complete — Bug Hunter Master!</div>`}
        <button class="btn btn-ghost" onclick="renderDebugGame(document.getElementById('game-content'))">Round Select</button>
      </div>
    </div>
  `;
}

window.useDebugHint = function() {
  const box = document.getElementById('debug-hint-box');
  const btn = document.getElementById('dbg-hint-btn');
  if (!box) return;
  if (box.style.display === 'none') {
    box.style.display = 'block';
    debugState.hintsUsed++;
    if (btn) btn.textContent = '💡 Hint used (−5 XP)';
    showToast('💡 Hint shown — −5 XP penalty', 'info');
  } else {
    box.style.display = 'none';
  }
};

window.resetDebugNew = function() {
  const round = DEBUG_ROUNDS[debugState.round];
  const ch = round.challenges[debugState.challengeIdx];
  const ed = document.getElementById('debug-editor');
  if (ed) ed.value = ch.buggy;
};

/* ============================================================
   20. GAME: SPEED QUIZ — "Knowledge Blitz" UPGRADED
   - 50+ questions from QUIZ_BANK (shared with main Quiz section)
   - 10 random questions per game
   - Lifelines: 50/50 (removes 2 wrong options), Skip (1 per game)
   - Difficulty progression: easy first, then medium, then hard
   - Subject filter: All / Variables / Functions / Arrays / DOM etc.
   - Streak multiplier, timer bar, answer explanation
============================================================ */

// SQ = Speed Quiz game state (separate from main quiz)
let sqState = {
  questions: [], idx: 0, score: 0, streak: 0,
  skipsLeft: 1, fiftyFiftyLeft: 1,
  timerInterval: null, timePerQ: 12,
  selectedTopic: 'all',
};

function renderSpeedQuiz(container) {
  // Topic filter buttons
  const topicOpts = [
    { id: 'all', label: '🎯 All Topics' },
    { id: 'variables', label: '📦 Variables' },
    { id: 'functions', label: '⚙️ Functions' },
    { id: 'arrays', label: '📋 Arrays' },
    { id: 'objects', label: '🗂️ Objects' },
    { id: 'dom', label: '🌐 DOM' },
    { id: 'loops', label: '🔄 Loops' },
    { id: 'datatypes', label: '🔢 Data Types' },
    { id: 'events', label: '🎯 Events' },
  ].filter(t => t.id === 'all' || QUIZ_BANK.some(q => q.topic === t.id));

  container.innerHTML = `
    <div class="game-wrapper" style="max-width:620px;margin:0 auto">
      <div class="game-title">⚡ Knowledge Blitz</div>
      <div class="game-subtitle">10 questions, 12 seconds each — how fast is your JS knowledge?</div>

      <div style="margin:1.5rem 0">
        <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.6rem">📚 Filter by Topic</div>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap" id="sq-topic-btns">
          ${topicOpts.map(t => `
            <button class="sq-topic-btn ${t.id === sqState.selectedTopic ? 'sq-topic-active' : ''}"
                    onclick="setSQTopic('${t.id}',this)">${t.label}</button>
          `).join('')}
        </div>
      </div>

      <div style="background:var(--bg3);border-radius:12px;padding:1rem;margin-bottom:1.5rem;font-size:0.83rem;color:var(--text-muted);display:flex;flex-wrap:wrap;gap:0.75rem 1.5rem">
        <span>⚡ 12s per question</span>
        <span>💡 1× 50/50 lifeline</span>
        <span>⏭️ 1× skip per game</span>
        <span>🔥 Streak multiplier</span>
        <span>📈 Easy → Hard order</span>
      </div>

      <button class="btn btn-primary" style="width:100%;font-size:1rem;padding:0.75rem"
              onclick="startSQGame()">⚡ Start Blitz!</button>

      ${sqState.score > 0 ? `<div style="text-align:center;margin-top:1rem;font-size:0.85rem;color:var(--text-muted)">Last game: <strong style="color:var(--accent)">${sqState.score} XP</strong></div>` : ''}
    </div>
  `;

  window.setSQTopic = function(id, btn) {
    sqState.selectedTopic = id;
    document.querySelectorAll('.sq-topic-btn').forEach(b => b.classList.remove('sq-topic-active'));
    btn.classList.add('sq-topic-active');
  };
}

window.startSQGame = function() {
  // Build question pool from QUIZ_BANK filtered by topic
  let pool = QUIZ_BANK;
  if (sqState.selectedTopic !== 'all') pool = pool.filter(q => q.topic === sqState.selectedTopic);
  if (pool.length === 0) { showToast('No questions for that topic!', 'info'); return; }

  // Sort by difficulty: easy first, then medium, then hard
  const ordered = [
    ...pool.filter(q => q.diff === 'easy').sort(() => Math.random() - 0.5),
    ...pool.filter(q => q.diff === 'medium').sort(() => Math.random() - 0.5),
    ...pool.filter(q => q.diff === 'hard').sort(() => Math.random() - 0.5),
  ].slice(0, 10);

  sqState = { ...sqState, questions: ordered, idx: 0, score: 0, streak: 0, skipsLeft: 1, fiftyFiftyLeft: 1, timerInterval: null };
  renderSQQuestion(document.getElementById('game-content'));
};

function renderSQQuestion(container) {
  if (sqState.timerInterval) clearInterval(sqState.timerInterval);
  const { questions, idx, score, streak, skipsLeft, fiftyFiftyLeft } = sqState;

  if (idx >= questions.length) { endSQGame(container); return; }

  const q = questions[idx];
  const pct = (idx / questions.length) * 100;
  const letters = ['A','B','C','D'];
  const diffColor = { easy: '#4ecdc4', medium: '#f7c948', hard: '#ff6b6b' }[q.diff] || '#a855f7';

  container.innerHTML = `
    <div class="game-wrapper" style="max-width:620px;margin:0 auto">
      <!-- HUD -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:0.6rem;flex-wrap:wrap">
        <div style="display:flex;gap:1rem">
          <div class="score-item"><span class="score-label">XP</span><span class="score-value" style="color:var(--accent)">${score}</span></div>
          <div class="score-item"><span class="score-label">Streak</span><span class="score-value" style="color:var(--accent2)">${streak}🔥</span></div>
          <div class="score-item"><span class="score-label">Q</span><span class="score-value">${idx+1}/${questions.length}</span></div>
        </div>
        <div style="display:flex;gap:0.4rem">
          <button class="sq-lifeline-btn ${fiftyFiftyLeft === 0 ? 'sq-lifeline-used' : ''}"
                  onclick="useFiftyFifty()" ${fiftyFiftyLeft === 0 ? 'disabled' : ''} title="50/50 — removes 2 wrong answers">
            ${fiftyFiftyLeft > 0 ? '50/50' : '✓used'}
          </button>
          <button class="sq-lifeline-btn ${skipsLeft === 0 ? 'sq-lifeline-used' : ''}"
                  onclick="useSQSkip()" ${skipsLeft === 0 ? 'disabled' : ''} title="Skip this question">
            ${skipsLeft > 0 ? '⏭ Skip' : '✓used'}
          </button>
        </div>
      </div>

      <!-- Progress bar -->
      <div style="height:4px;background:var(--bg3);border-radius:2px;margin-bottom:0.75rem;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--accent3),var(--accent));border-radius:2px;transition:width 0.3s"></div>
      </div>

      <!-- Timer bar -->
      <div style="height:5px;background:var(--bg3);border-radius:3px;margin-bottom:1rem;overflow:hidden">
        <div id="sq-timebar" style="height:100%;width:100%;background:${diffColor};border-radius:3px;transition:width 0.9s linear"></div>
      </div>

      <!-- Question card -->
      <div style="background:var(--bg3);border:1px solid var(--glass-border);border-radius:14px;padding:1.25rem;margin-bottom:1rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">
          <span style="font-size:0.72rem;background:${diffColor}20;color:${diffColor};padding:0.2rem 0.6rem;border-radius:8px;font-weight:700;text-transform:uppercase">${q.diff}</span>
          <span style="font-size:0.72rem;color:var(--text-muted)">${q.topic} · +${q.xp} XP</span>
          <span id="sq-timer-num" style="font-size:1rem;font-weight:700;color:${diffColor}">12</span>
        </div>
        <div style="font-size:1rem;font-weight:600;line-height:1.5;margin-bottom:${q.code ? '0.75rem' : '0'}">${q.q}</div>
        ${q.code ? `<pre style="background:var(--bg2);border-radius:8px;padding:0.75rem;font-family:'Fira Code',monospace;font-size:0.8rem;white-space:pre-wrap;color:var(--accent3);margin:0">${q.code}</pre>` : ''}
      </div>

      <!-- Options -->
      <div class="sq-options-grid" id="sq-opts">
        ${q.options.map((o, i) => `
          <button class="sq-opt" id="sq-opt-${i}" onclick="answerSQNew(${i})">
            <span class="sq-opt-letter">${letters[i]}</span> ${o}
          </button>
        `).join('')}
      </div>

      <!-- Feedback -->
      <div id="sq-feedback" style="display:none;margin-top:0.75rem;padding:0.85rem;border-radius:10px;font-size:0.85rem"></div>
    </div>
  `;

  // Start timer
  let t = sqState.timePerQ;
  sqState.timerInterval = setInterval(() => {
    t--;
    const tn = document.getElementById('sq-timer-num');
    const tb = document.getElementById('sq-timebar');
    if (tn) { tn.textContent = t; if (t <= 3) tn.style.color = '#ff6b6b'; }
    if (tb) tb.style.width = `${(t / sqState.timePerQ) * 100}%`;
    if (t <= 0) {
      clearInterval(sqState.timerInterval);
      timeOutSQ();
    }
  }, 1000);
}

function timeOutSQ() {
  const q = sqState.questions[sqState.idx];
  document.querySelectorAll('.sq-opt').forEach(b => b.disabled = true);
  const correctBtn = document.getElementById(`sq-opt-${q.ans}`);
  if (correctBtn) correctBtn.classList.add('sq-opt-correct');
  sqState.streak = 0;
  showSQFeedback(false, q, true);
  setTimeout(() => { sqState.idx++; renderSQQuestion(document.getElementById('game-content')); }, 2000);
}

window.answerSQNew = function(chosen) {
  if (sqState.timerInterval) clearInterval(sqState.timerInterval);
  const q = sqState.questions[sqState.idx];
  const isCorrect = chosen === q.ans;

  document.querySelectorAll('.sq-opt').forEach(b => b.disabled = true);
  document.getElementById(`sq-opt-${q.ans}`)?.classList.add('sq-opt-correct');
  if (!isCorrect) document.getElementById(`sq-opt-${chosen}`)?.classList.add('sq-opt-wrong');

  if (isCorrect) {
    sqState.streak++;
    const multiplier = sqState.streak >= 4 ? 2 : sqState.streak >= 2 ? 1.5 : 1;
    const earned = Math.round(q.xp * multiplier);
    sqState.score += earned;
    if (multiplier > 1) showXPPopup(`🔥 x${multiplier} streak! +${earned} XP`);
    playSound('success');
  } else {
    sqState.streak = 0;
    playSound('wrong');
  }

  showSQFeedback(isCorrect, q, false);
  setTimeout(() => { sqState.idx++; renderSQQuestion(document.getElementById('game-content')); }, 2000);
};

window.useFiftyFifty = function() {
  if (sqState.fiftyFiftyLeft === 0) return;
  sqState.fiftyFiftyLeft = 0;
  const q = sqState.questions[sqState.idx];
  // Get 2 wrong answer indices and hide them
  const wrongIdxs = [0,1,2,3].filter(i => i !== q.ans).sort(() => Math.random()-0.5).slice(0, 2);
  wrongIdxs.forEach(i => {
    const btn = document.getElementById(`sq-opt-${i}`);
    if (btn) { btn.style.opacity = '0.2'; btn.style.pointerEvents = 'none'; }
  });
  showToast('💡 50/50 used — 2 wrong answers removed!', 'info');
};

window.useSQSkip = function() {
  if (sqState.skipsLeft === 0) return;
  sqState.skipsLeft = 0;
  if (sqState.timerInterval) clearInterval(sqState.timerInterval);
  sqState.streak = 0;
  showToast('⏭ Question skipped!', 'info');
  setTimeout(() => { sqState.idx++; renderSQQuestion(document.getElementById('game-content')); }, 500);
};

function showSQFeedback(correct, q, timedOut) {
  const fb = document.getElementById('sq-feedback');
  if (!fb) return;
  fb.style.display = 'block';
  fb.style.background = correct ? 'rgba(78,205,196,0.08)' : 'rgba(255,107,107,0.08)';
  fb.style.border = `1px solid ${correct ? 'rgba(78,205,196,0.3)' : 'rgba(255,107,107,0.3)'}`;
  fb.innerHTML = `
    <strong style="color:${correct ? 'var(--accent3)' : '#ff6b6b'}">${timedOut ? '⏱ Time\'s up!' : correct ? '✅ Correct!' : '❌ Wrong!'}</strong>
    <span style="color:var(--text-muted);margin-left:0.5rem">${q.exp}</span>
  `;
}

function endSQGame(container) {
  if (sqState.timerInterval) clearInterval(sqState.timerInterval);
  const total = sqState.questions.length;
  const correct = sqState.score > 0 ? Math.round(sqState.score / (QUIZ_BANK.find(q=>q.diff==='easy')?.xp||5)) : 0;

  addXP(sqState.score, 'Knowledge Blitz');
  if (sqState.score >= total * 8) addConfetti();

  const grade = sqState.score >= total * 15 ? '🏆 Genius!' : sqState.score >= total * 10 ? '🎉 Excellent!' : sqState.score >= total * 5 ? '👍 Good Job!' : '📖 Keep Studying!';

  container.innerHTML = `
    <div class="game-wrapper" style="max-width:540px;margin:0 auto;text-align:center">
      <div style="font-size:2.5rem;margin-bottom:0.5rem">⚡</div>
      <div class="game-title">Blitz Complete!</div>
      <div style="font-size:3.5rem;font-weight:900;color:var(--accent);margin:0.5rem 0">${sqState.score}</div>
      <div style="font-size:1.1rem;color:var(--text-muted);margin-bottom:1.5rem">XP earned · ${grade}</div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;margin-bottom:1.5rem">
        <div style="background:var(--bg3);border-radius:10px;padding:0.85rem">
          <div style="font-size:1.4rem;font-weight:700;color:var(--accent)">${sqState.score}</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">Total XP</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:0.85rem">
          <div style="font-size:1.4rem;font-weight:700;color:var(--accent3)">${total}</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">Questions</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:0.85rem">
          <div style="font-size:1.4rem;font-weight:700;color:var(--accent2)">${sqState.streak}🔥</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">Final Streak</div>
        </div>
      </div>

      <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="window.startSQGame()">Play Again ⚡</button>
        <button class="btn btn-ghost" onclick="renderSpeedQuiz(document.getElementById('game-content'))">Change Topic</button>
      </div>
    </div>
  `;
}

/* ============================================================
   GAME: TYPING MASTER — Code Typing Speed Test
   - 3 content modes: JS Keywords, Developer code, Pro snippets
   - User chooses timer: 30 / 60 / 90 seconds
   - Live WPM + accuracy counter
   - Character-by-character color feedback
   - Personal best saved per mode+timer combo
   - XP based on WPM × accuracy
============================================================ */

const TYPING_CONTENT = {
  beginner: {
    label: '🟢 Beginner',
    desc: 'JS keywords & simple expressions',
    color: '#4ecdc4',
    lines: [
      'const name = "Alice";',
      'let age = 25;',
      'const isLoggedIn = true;',
      'var score = 0;',
      'const PI = 3.14159;',
      'let count = 0;',
      'const greeting = "Hello, World!";',
      'let isActive = false;',
      'const maxItems = 100;',
      'let userName = "Reenu";',
      'const apiUrl = "https://api.example.com";',
      'let totalPrice = 0;',
      'const appName = "JS Quest";',
      'let currentLevel = 1;',
      'const darkMode = false;',
      'let attempts = 3;',
      'const version = "1.0.0";',
      'let isVisible = true;',
      'const itemsPerPage = 10;',
      'let selectedIndex = -1;',
    ],
  },
  developer: {
    label: '🟡 Developer',
    desc: 'Functions, loops & array methods',
    color: '#f7c948',
    lines: [
      'function greet(name) { return "Hello, " + name + "!"; }',
      'const double = n => n * 2;',
      'const evens = [1,2,3,4,5].filter(n => n % 2 === 0);',
      'const squared = nums.map(n => n * n);',
      'for (let i = 0; i < 10; i++) { console.log(i); }',
      'const sum = arr.reduce((acc, n) => acc + n, 0);',
      'const found = users.find(u => u.id === targetId);',
      'while (queue.length > 0) { process(queue.shift()); }',
      'const unique = [...new Set(arr)];',
      'const sorted = [...arr].sort((a, b) => a - b);',
      'const obj = { name: "Alice", age: 25, active: true };',
      'const { name, age } = user;',
      'const copy = { ...original, updated: true };',
      'const keys = Object.keys(config);',
      'const entries = Object.entries(data);',
      'arr.forEach((item, index) => console.log(index, item));',
      'const hasAdmin = roles.some(r => r === "admin");',
      'const allValid = items.every(item => item.isValid);',
      'const flat = nested.flat(2);',
      'const joined = words.join(", ");',
    ],
  },
  pro: {
    label: '🔴 Pro Coder',
    desc: 'Async, DOM, closures & real patterns',
    color: '#ff6b6b',
    lines: [
      'const fetchData = async (url) => { const res = await fetch(url); return res.json(); };',
      'document.querySelector("#btn").addEventListener("click", handleClick);',
      'const debounce = (fn, delay) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); }; };',
      'const memoize = (fn) => { const cache = {}; return (n) => cache[n] ?? (cache[n] = fn(n)); };',
      'Promise.all([fetchUser(), fetchPosts()]).then(([user, posts]) => render(user, posts));',
      'const el = document.createElement("div"); el.classList.add("card"); el.textContent = title;',
      'class EventEmitter { constructor() { this.events = {}; } on(e, fn) { (this.events[e] ||= []).push(fn); } }',
      'const [state, setState] = useState({ count: 0, loading: false });',
      'useEffect(() => { fetchData().then(setData); return () => controller.abort(); }, [id]);',
      'const router = { navigate: (path) => window.history.pushState({}, "", path) };',
      'const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);',
      'localStorage.setItem("token", JSON.stringify({ value: token, expires: Date.now() + 3600000 }));',
      'const observer = new IntersectionObserver((entries) => entries.forEach(e => e.isIntersecting && load(e.target)));',
      'async function* paginate(url) { let next = url; while (next) { const { data, nextUrl } = await fetch(next).then(r => r.json()); yield data; next = nextUrl; } }',
      'const schema = z.object({ name: z.string().min(1), age: z.number().min(0).max(120) });',
      'worker.postMessage({ type: "COMPUTE", payload: data }); worker.onmessage = ({ data }) => setResult(data);',
      'const { data, error, loading } = useSWR("/api/user", fetcher);',
      'app.use("/api", cors(), express.json(), rateLimit({ windowMs: 60000, max: 100 }));',
      'const snapshot = await getDoc(doc(db, "users", uid));',
      'cy.get("[data-testid=submit]").click().then(() => cy.contains("Success").should("be.visible"));',
    ],
  },
};

let tmState = {};

function renderTypingMaster(container) {
  const modes = Object.keys(TYPING_CONTENT);
  let selectedMode = 'beginner';
  let selectedTime = 60;

  function buildSelector() {
    container.innerHTML = `
      <div class="game-wrapper" style="max-width:640px;margin:0 auto">
        <div class="game-title">⌨️ Typing Master</div>
        <div class="game-subtitle">JS code type karo — WPM aur accuracy improve karo!</div>

        <div style="margin:1.5rem 0">
          <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.75rem">⚔️ Difficulty</div>
          <div style="display:flex;flex-direction:column;gap:0.6rem">
            ${modes.map(k => {
              const m = TYPING_CONTENT[k];
              const bestKey = `tmBest_${k}`;
              const best = state[bestKey];
              return `
                <button class="tm-mode-btn ${k === selectedMode ? 'tm-mode-active' : ''}"
                        style="--mc:${m.color}" data-mode="${k}" onclick="tmSelectMode('${k}',this)">
                  <div style="display:flex;align-items:center;gap:1rem;width:100%">
                    <span style="font-size:1.4rem">${m.label.split(' ')[0]}</span>
                    <div style="flex:1;text-align:left">
                      <div style="font-weight:700">${m.label.slice(3)}</div>
                      <div style="font-size:0.75rem;opacity:0.6;margin-top:0.1rem">${m.desc}</div>
                    </div>
                    ${best ? `<div style="font-size:0.75rem;color:${m.color};font-weight:700">🏆 ${best} WPM</div>` : ''}
                  </div>
                </button>`;
            }).join('')}
          </div>
        </div>

        <div style="margin:1.5rem 0">
          <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.75rem">⏱ Timer</div>
          <div style="display:flex;gap:0.5rem">
            ${[30, 60, 90].map(t => `
              <button class="tm-time-btn ${t === selectedTime ? 'tm-time-active' : ''}"
                      onclick="tmSelectTime(${t}, this)">
                ${t}s
              </button>
            `).join('')}
          </div>
        </div>

        <div style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.15);border-radius:12px;padding:1rem;font-size:0.82rem;color:var(--text-muted);margin-bottom:1.5rem">
          ⌨️ <strong>Live WPM tracking</strong> &nbsp;·&nbsp;
          🎯 <strong>Accuracy %</strong> &nbsp;·&nbsp;
          🏆 <strong>Personal best save</strong> &nbsp;·&nbsp;
          ✅ <strong>Green/Red feedback</strong>
        </div>

        <button class="btn btn-primary" style="width:100%;font-size:1.05rem;padding:0.8rem"
                onclick="startTypingGame()">⌨️ Start Typing!</button>
      </div>
    `;

    window.tmSelectMode = (k, btn) => {
      selectedMode = k;
      document.querySelectorAll('.tm-mode-btn').forEach(b => b.classList.remove('tm-mode-active'));
      btn.classList.add('tm-mode-active');
    };

    window.tmSelectTime = (t, btn) => {
      selectedTime = t;
      document.querySelectorAll('.tm-time-btn').forEach(b => b.classList.remove('tm-time-active'));
      btn.classList.add('tm-time-active');
    };
  }

  window.startTypingGame = function() {
    const mode   = TYPING_CONTENT[selectedMode];
    const lines  = [...mode.lines].sort(() => Math.random() - 0.5);
    // Build a long paragraph from shuffled lines
    const fullText = lines.slice(0, 12).join('  ');

    tmState = {
      mode: selectedMode,
      modeColor: mode.color,
      text: fullText,
      typed: '',
      timeTotal: selectedTime,
      timeLeft: selectedTime,
      timerInterval: null,
      started: false,
      finished: false,
      errors: 0,
      totalTyped: 0,
    };

    renderTypingScreen(container);
  };

  buildSelector();
}

function renderTypingScreen(container) {
  const { text, timeTotal, modeColor } = tmState;
  const mode = TYPING_CONTENT[tmState.mode];

  container.innerHTML = `
    <div class="game-wrapper" style="max-width:780px;margin:0 auto">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem">
        <div class="game-title" style="margin:0;font-size:1.3rem">⌨️ Typing Master
          <span style="font-size:0.75rem;background:${modeColor}20;color:${modeColor};padding:0.2rem 0.7rem;border-radius:8px;margin-left:0.5rem;vertical-align:middle">${mode.label}</span>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="renderTypingMaster(document.getElementById('game-content'))">← Change Mode</button>
      </div>

      <!-- Stats HUD -->
      <div class="game-score-bar" style="margin-bottom:0.75rem">
        <div class="score-item"><span class="score-label">⏱ Time</span><span class="score-value" id="tm-timer" style="color:${modeColor}">${timeTotal}</span></div>
        <div class="score-item"><span class="score-label">WPM</span><span class="score-value" id="tm-wpm" style="color:var(--accent)">0</span></div>
        <div class="score-item"><span class="score-label">Accuracy</span><span class="score-value" id="tm-acc" style="color:var(--accent3)">100%</span></div>
        <div class="score-item"><span class="score-label">Errors</span><span class="score-value" id="tm-err" style="color:var(--accent2)">0</span></div>
      </div>

      <!-- Timer bar -->
      <div style="height:5px;background:var(--bg3);border-radius:3px;margin-bottom:1.25rem;overflow:hidden">
        <div id="tm-timebar" style="height:100%;width:100%;background:${modeColor};border-radius:3px;transition:width 1s linear"></div>
      </div>

      <!-- Text display -->
      <div id="tm-display"
           style="font-family:'Fira Code',monospace;font-size:1.05rem;line-height:1.9;background:var(--bg3);
                  border:1px solid var(--glass-border);border-radius:14px;padding:1.25rem 1.5rem;
                  margin-bottom:1rem;letter-spacing:0.03em;word-break:break-all;user-select:none;
                  min-height:100px;position:relative">
        <!-- chars rendered here -->
      </div>

      <!-- Input -->
      <textarea id="tm-input"
        placeholder="⌨️ Click here and start typing — timer starts on first keystroke!"
        style="width:100%;padding:0.85rem 1rem;background:var(--bg3);border:2px solid var(--glass-border);
               border-radius:12px;color:var(--text);font-family:'Fira Code',monospace;font-size:0.95rem;
               outline:none;resize:none;height:80px;line-height:1.6;transition:border-color 0.2s;
               box-sizing:border-box"
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
        oninput="handleTyping(this.value)"
        onfocus="this.style.borderColor='${modeColor}'"
        onblur="this.style.borderColor='var(--glass-border)'"
      ></textarea>

      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.5rem;text-align:center">
        Tab key se indent, Enter se newline — sab kuch exact type karo
      </div>

      <div id="tm-result" style="margin-top:1rem"></div>
    </div>
  `;

  renderTMDisplay();

  // Focus input
  setTimeout(() => document.getElementById('tm-input')?.focus(), 100);

  window.handleTyping = function(value) {
    if (tmState.finished) return;
    const inp = document.getElementById('tm-input');

    // Start timer on first keystroke
    if (!tmState.started && value.length > 0) {
      tmState.started = true;
      startTMTimer();
    }

    tmState.typed = value;
    tmState.totalTyped = value.length;

    // Count errors
    let errs = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== tmState.text[i]) errs++;
    }
    tmState.errors = errs;

    // Update accuracy
    const acc = value.length === 0 ? 100 : Math.round(((value.length - errs) / value.length) * 100);
    const accEl = document.getElementById('tm-acc');
    if (accEl) { accEl.textContent = acc + '%'; accEl.style.color = acc >= 90 ? 'var(--accent3)' : acc >= 70 ? '#f7c948' : '#ff6b6b'; }
    const errEl = document.getElementById('tm-err');
    if (errEl) errEl.textContent = errs;

    // Live WPM
    const elapsed = (tmState.timeTotal - tmState.timeLeft) || 1;
    const wpm = Math.round((value.length / 5) / (elapsed / 60));
    const wpmEl = document.getElementById('tm-wpm');
    if (wpmEl) wpmEl.textContent = isFinite(wpm) ? Math.min(wpm, 300) : 0;

    renderTMDisplay();

    // Check completion
    if (value === tmState.text) {
      clearInterval(tmState.timerInterval);
      tmState.finished = true;
      if (inp) inp.disabled = true;
      finishTyping('complete');
    }
  };
}

function renderTMDisplay() {
  const el = document.getElementById('tm-display');
  if (!el) return;
  const { text, typed } = tmState;

  let html = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] === ' ' ? '&nbsp;' : text[i] === '<' ? '&lt;' : text[i] === '>' ? '&gt;' : text[i] === '&' ? '&amp;' : text[i];
    if (i < typed.length) {
      if (typed[i] === text[i]) {
        html += `<span style="color:var(--accent3)">${ch}</span>`;
      } else {
        html += `<span style="color:#ff6b6b;background:rgba(255,107,107,0.15);border-radius:2px">${ch}</span>`;
      }
    } else if (i === typed.length) {
      // Cursor
      html += `<span style="background:var(--accent);color:var(--bg1);border-radius:2px;animation:tmCursor 0.8s infinite">${ch}</span>`;
    } else {
      html += `<span style="color:var(--text-muted);opacity:0.45">${ch}</span>`;
    }
  }
  el.innerHTML = html;

  // Auto-scroll to cursor
  const cursor = el.querySelector('span[style*="tmCursor"], span[style*="var(--accent)"]');
  if (cursor) cursor.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function startTMTimer() {
  tmState.timerInterval = setInterval(() => {
    tmState.timeLeft--;
    const te  = document.getElementById('tm-timer');
    const bar = document.getElementById('tm-timebar');
    if (te) {
      te.textContent = tmState.timeLeft;
      if (tmState.timeLeft <= 10) te.style.color = '#ff6b6b';
    }
    if (bar) bar.style.width = `${(tmState.timeLeft / tmState.timeTotal) * 100}%`;
    if (tmState.timeLeft <= 0) {
      clearInterval(tmState.timerInterval);
      const inp = document.getElementById('tm-input');
      if (inp) inp.disabled = true;
      tmState.finished = true;
      finishTyping('timeout');
    }
  }, 1000);
}

function finishTyping(reason) {
  const { typed, text, errors, timeTotal, timeLeft, mode: modeKey, modeColor } = tmState;
  const mode = TYPING_CONTENT[modeKey];

  const timeTaken   = timeTotal - timeLeft || 1;
  const wpm         = Math.round((typed.length / 5) / (timeTaken / 60));
  const accuracy    = typed.length === 0 ? 0 : Math.round(((typed.length - errors) / typed.length) * 100);
  const completed   = reason === 'complete';
  const charsCorrect = typed.split('').filter((c, i) => c === text[i]).length;

  // XP = WPM × (accuracy/100) × 0.5, min 5
  const earnedXP = Math.max(5, Math.round(wpm * (accuracy / 100) * 0.5));

  // Save personal best
  const bestKey = `tmBest_${modeKey}`;
  const prev = state[bestKey];
  const isNewBest = !prev || wpm > prev;
  if (isNewBest && wpm > 0) { state[bestKey] = wpm; saveState(); }

  addXP(earnedXP, 'Typing Master');
  if (accuracy >= 95 && wpm >= 30) addConfetti();
  playSound(accuracy >= 70 ? 'complete' : 'wrong');

  const grade = wpm >= 80 ? '🏆 Speed Demon!' : wpm >= 60 ? '🔥 Fast Coder!' : wpm >= 40 ? '👍 Decent Typist' : wpm >= 20 ? '📖 Keep Practicing' : '🐢 Slow & Steady';
  const accGrade = accuracy >= 95 ? '🎯 Perfect' : accuracy >= 85 ? '✅ Good' : accuracy >= 70 ? '⚠️ Needs work' : '❌ Too many errors';

  const result = document.getElementById('tm-result');
  if (!result) return;

  result.innerHTML = `
    <div style="background:${completed ? 'rgba(78,205,196,0.06)' : 'rgba(168,85,247,0.06)'};
                border:1px solid ${completed ? 'rgba(78,205,196,0.2)' : 'rgba(168,85,247,0.2)'};
                border-radius:14px;padding:1.5rem;text-align:center">
      <div style="font-size:1.4rem;font-weight:800;color:${modeColor};margin-bottom:0.25rem">
        ${completed ? '✅ Completed!' : '⏱ Time\'s Up!'}
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem;margin:1.25rem 0">
        <div style="background:var(--bg3);border-radius:10px;padding:0.85rem">
          <div style="font-size:1.8rem;font-weight:900;color:var(--accent)">${wpm}</div>
          <div style="font-size:0.7rem;color:var(--text-muted)">WPM</div>
          <div style="font-size:0.65rem;color:${modeColor};margin-top:0.2rem">${grade}</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:0.85rem">
          <div style="font-size:1.8rem;font-weight:900;color:var(--accent3)">${accuracy}%</div>
          <div style="font-size:0.7rem;color:var(--text-muted)">Accuracy</div>
          <div style="font-size:0.65rem;color:var(--accent3);margin-top:0.2rem">${accGrade}</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:0.85rem">
          <div style="font-size:1.8rem;font-weight:900;color:var(--accent2)">${errors}</div>
          <div style="font-size:0.7rem;color:var(--text-muted)">Errors</div>
          <div style="font-size:0.65rem;color:var(--text-muted);margin-top:0.2rem">${charsCorrect} correct</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:0.85rem">
          <div style="font-size:1.8rem;font-weight:900;color:var(--accent3)">${earnedXP}</div>
          <div style="font-size:0.7rem;color:var(--text-muted)">XP Earned</div>
          <div style="font-size:0.65rem;color:${isNewBest ? modeColor : 'var(--text-muted)'};margin-top:0.2rem">${isNewBest ? '🏆 New Best!' : `Best: ${prev || wpm} WPM`}</div>
        </div>
      </div>

      <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:1rem">
        ${timeTaken}s typed &nbsp;·&nbsp; ${typed.length} characters &nbsp;·&nbsp; ${mode.label} mode
      </div>

      <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="window.startTypingGame()">Try Again ⌨️</button>
        <button class="btn btn-ghost" onclick="renderTypingMaster(document.getElementById('game-content'))">Change Mode</button>
      </div>
    </div>
  `;
}