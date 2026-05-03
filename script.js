/**
 * JS Quest — Main Script
 * Interactive JavaScript Learning Platform
 * Sections: Home, Learn, Practice, Games, Quiz, Leaderboard
 */

/* ============================================================
   1. STATE & PROGRESS (localStorage + Firestore backed)
============================================================ */
const STATE_KEY = 'jsquest_progress';

let state = {
  xp: 0,
  completedTopics: [],
  completedChallenges: [],
  quizBestScore: 0,
  quizTotalPlayed: 0,
  achievements: [],
  soundEnabled: true,
  level: 1,
};

// Expose on window so firebase.js can read/write it
window.state = state;

function loadState() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
      window.state = state;
    }
  } catch (e) {}
}

function saveState() {
  saveStateLocal();
  if (typeof window.saveUserToFirestore === 'function') {
    window.saveUserToFirestore().catch(() => {});
  }
}
window.saveState = saveState;

// saveStateLocal — localStorage only, no Firestore upload
// Called by firebase.js after cloud data is loaded (avoids loop)
function saveStateLocal() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch(_) {}
}
window.saveStateLocal = saveStateLocal;

function addXP(amount, label = '') {
  state.xp += amount;
  state.level = Math.floor(state.xp / 100) + 1;
  saveState();
  updateNavXP();
  showXPPopup(`+${amount} XP${label ? ' — ' + label : ''}`);
  checkAchievements();
  updateDashboard();
}

function updateNavXP() {
  document.getElementById('xp-count').textContent = state.xp;
}

/* ============================================================
   2. NAVIGATION + BROWSER BACK BUTTON FIX
============================================================ */
let currentSection = 'home';

// Stack tracking what the user has navigated into
// so browser/phone back button can step back layer by layer
let _navStack = [];
let _handlingPop = false;

function _pushNav(entry) {
  _navStack.push(entry);
  window.history.pushState({ _nav: _navStack.length }, '', window.location.pathname);
}
window._pushNav = _pushNav;

// Browser/phone back button handler
window.addEventListener('popstate', function() {
  if (_handlingPop) return;
  _handlingPop = true;
  setTimeout(function() { _handlingPop = false; }, 50);

  if (_navStack.length === 0) {
    _handlingPop = false;
    return;
  }

  _navStack.pop();
  const prev = _navStack[_navStack.length - 1];

  if (!prev) {
    // No more history — just close whatever is open innermost
    _closeInnermostLayer();
    _handlingPop = false;
    return;
  }

  _restoreNavEntry(prev);
});

function _closeInnermostLayer() {
  const gameArena    = document.getElementById('game-arena');
  const conceptPanel = document.getElementById('concept-panel');
  const challPanel   = document.getElementById('challenge-panel');
  const stageDiv     = document.getElementById('practice-stage-challenges');

  if (gameArena && gameArena.classList.contains('open')) {
    closeGameArena();
  } else if (conceptPanel && conceptPanel.classList.contains('open')) {
    closeConceptPanel();
  } else if (challPanel && challPanel.classList.contains('open')) {
    closeChallengePanel();
  } else if (stageDiv && !stageDiv.classList.contains('hidden')) {
    renderPracticeStageMap();
  }
}

function _restoreNavEntry(entry) {
  if (!entry) return;
  if (entry.type === 'section') {
    _goToInternal(entry.section);
  } else if (entry.type === 'game') {
    _goToInternal('games');
    openGame(entry.gameId, true);
  } else if (entry.type === 'gameScreen') {
    _goToInternal('games');
    openGame(entry.gameId, true);
    if (typeof entry.restore === 'function') entry.restore();
  } else if (entry.type === 'stage') {
    _goToInternal('practice');
    openStage(entry.stageId);
  } else if (entry.type === 'challenge') {
    _goToInternal('practice');
    openStage(entry.stageId);
    openChallenge(entry.challengeId, entry.stageId);
  } else if (entry.type === 'concept') {
    _goToInternal('learn');
    openConcept(entry.topicId);
  }
}

// Internal goTo without pushing history (used when restoring)
function _goToInternal(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const secEl = document.getElementById(section);
  if (secEl) secEl.classList.add('active');
  document.querySelector('[data-section="' + section + '"]')?.classList.add('active');
  currentSection = section;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeConceptPanel(true);
  closeChallengePanel(true);
  closeGameArena(true);
  if (section === 'home') updateDashboard();
  if (section === 'quiz') renderQuizSetup();
  if (section === 'leaderboard' && typeof window.renderLeaderboard === 'function') window.renderLeaderboard();
}

function goTo(section) {
  _navStack = [{ type: 'section', section }];
  window.history.replaceState({ _nav: 1 }, '', window.location.pathname);
  _goToInternal(section);
}
window.goTo = goTo;

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    playSound('click');
    goTo(link.dataset.section);
    // close mobile menu
    document.getElementById('nav-links').classList.remove('open');
  });
});

document.querySelector('.nav-brand').addEventListener('click', () => goTo('home'));

document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('nav-links').classList.toggle('open');
});

/* ============================================================
   3. THEME TOGGLE
============================================================ */
const themeBtn = document.getElementById('theme-toggle');
themeBtn.addEventListener('click', () => {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  themeBtn.textContent = isDark ? '🌞' : '🌙';
  playSound('click');
});

/* ============================================================
   4. PARTICLES BACKGROUND
============================================================ */
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.r = Math.random() * 1.5 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.color = ['#f7c948','#ff6b6b','#4ecdc4','#a855f7'][Math.floor(Math.random()*4)];
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  resize();
  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function loop() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
  window.addEventListener('resize', resize);
})();

/* ============================================================
   5. TYPING ANIMATION (Hero)
============================================================ */
(function initTyping() {
  const el = document.getElementById('typing-code-app') || document.getElementById('typing-code');
  const lines = [
    '// Welcome to JS Quest! 🚀',
    '',
    'const skills = [',
    '  "Variables",',
    '  "Functions",',
    '  "Arrays",',
    '  "DOM Magic"',
    '];',
    '',
    'function learnJS() {',
    '  return skills.map(skill => {',
    '    return `Mastered: ${skill} ✅`;',
    '  });',
    '}',
    '',
    'console.log(learnJS());',
    '// You got this! ⚡',
  ];

  let full = lines.join('\n');
  let idx = 0;

  function type() {
    if (idx <= full.length) {
      el.textContent = full.slice(0, idx);
      idx++;
      setTimeout(type, Math.random() * 35 + 15);
    } else {
      setTimeout(() => { idx = 0; el.textContent = ''; type(); }, 4000);
    }
  }
  type();
})();

/* ============================================================
   6. SOUND EFFECTS
============================================================ */
function playSound(name) {
  if (!state.soundEnabled) return;
  const map = { click: 'snd-click', success: 'snd-success', wrong: 'snd-wrong', complete: 'snd-complete' };
  const el = document.getElementById(map[name]);
  if (el) { el.currentTime = 0; el.play().catch(() => {}); }
}

/* ============================================================
   7. TOAST & XP POPUP
============================================================ */
function showToast(msg, type = 'info', dur = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove('show'), dur);
}

function showXPPopup(msg) {
  const p = document.getElementById('xp-popup');
  p.textContent = '⚡ ' + msg;
  p.classList.add('show');
  setTimeout(() => p.classList.remove('show'), 2000);
}

/* ============================================================
   8. ACHIEVEMENTS
============================================================ */
const ACHIEVEMENTS_DEF = [
  { id: 'first_topic',      icon: '📖', name: 'First Steps',       desc: 'Complete your first topic',   check: s => s.completedTopics.length >= 1 },
  { id: 'all_topics',       icon: '🎓', name: 'Scholar',           desc: 'Complete all 8 topics',        check: s => s.completedTopics.length >= 8 },
  { id: 'first_challenge',  icon: '💪', name: 'Code Warrior',      desc: 'Solve your first challenge',   check: s => s.completedChallenges.length >= 1 },
  { id: 'all_challenges',   icon: '🏆', name: 'Challenge Master',  desc: 'Solve all 16 challenges',      check: s => s.completedChallenges.length >= 16 },
  { id: 'quiz_100',         icon: '🧠', name: 'Quiz Genius',       desc: 'Score 100% in a quiz',          check: s => s.quizBestScore >= 100 },
  { id: 'xp_100',           icon: '⚡', name: 'XP Collector',      desc: 'Earn 100 XP',                   check: s => s.xp >= 100 },
  { id: 'xp_500',           icon: '🌟', name: 'XP Legend',         desc: 'Earn 500 XP',                   check: s => s.xp >= 500 },
  { id: 'level_3',          icon: '🚀', name: 'Level Up!',         desc: 'Reach Level 3',                 check: s => s.level >= 3 },
];
window.ACHIEVEMENTS_DEF = ACHIEVEMENTS_DEF;

function checkAchievements() {
  ACHIEVEMENTS_DEF.forEach(def => {
    if (!state.achievements.includes(def.id) && def.check(state)) {
      state.achievements.push(def.id);
      saveState();
      showToast(`🏆 Achievement Unlocked: ${def.name}!`, 'success', 4000);
      playSound('complete');
      addConfetti();
      renderAchievements();
    }
  });
}

function renderAchievements() {
  const grid = document.getElementById('achievements-grid');
  if (!grid) return;
  grid.innerHTML = ACHIEVEMENTS_DEF.map(def => {
    const unlocked = state.achievements.includes(def.id);
    return `<div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
      <div class="achievement-icon">${def.icon}</div>
      <div class="achievement-name">${def.name}</div>
      <div class="achievement-desc">${def.desc}</div>
    </div>`;
  }).join('');
}

/* ============================================================
   9. DASHBOARD
============================================================ */
function updateDashboard() {
  // topics
  const topicPct = (state.completedTopics.length / 8) * 100;
  setBar('pb-topics', topicPct);
  setText('pct-topics', `${state.completedTopics.length} / 8`);

  // challenges
  const chPct = (state.completedChallenges.length / 16) * 100;
  setBar('pb-challenges', chPct);
  setText('pct-challenges', `${state.completedChallenges.length} / 16`);

  // quiz
  setBar('pb-quiz', state.quizBestScore || 0);
  setText('pct-quiz', `${state.quizBestScore || 0}%`);

  // xp
  const xpPct = Math.min((state.xp / 500) * 100, 100);
  setBar('pb-xp', xpPct);
  setText('pct-xp', `${state.xp} / 500 XP`);

  // level badge
  const lb = document.getElementById('level-badge');
  if (lb) lb.textContent = `Level ${state.level}`;

  // ── User Welcome Card ──
  const user = window.currentUser;
  if (user) {
    const name     = user.displayName || user.email?.split('@')[0] || 'Player';
    const initial  = name[0].toUpperCase();
    const hour     = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    setText('uwc-greeting', `${greeting},`);
    setText('uwc-name', name);
    setText('uwc-level', `Level ${state.level}`);
    setText('uwc-xp', `${state.xp} XP`);

    const avatarEls = ['uwc-avatar','nav-avatar'];
    avatarEls.forEach(id => { const el=document.getElementById(id); if(el) el.textContent=initial; });
    setText('nav-user-name', name.split(' ')[0]);

    // Nav XP
    updateNavXP();
  }

  renderAchievements();
  updateNavXP();
}
window.updateDashboard = updateDashboard;

function setBar(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.min(pct, 100) + '%';
}
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ============================================================
   10. CONFETTI
============================================================ */
function addConfetti() {
  let canvas = document.getElementById('confetti-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const pieces = Array.from({length: 80}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -100,
    r: Math.random() * 8 + 4,
    color: ['#f7c948','#ff6b6b','#4ecdc4','#a855f7','#50fa7b'][Math.floor(Math.random()*5)],
    vy: Math.random() * 4 + 2,
    vx: (Math.random() - 0.5) * 3,
    rot: Math.random() * 360,
    rv: (Math.random() - 0.5) * 5,
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r);
      ctx.restore();
      p.y += p.vy; p.x += p.vx; p.rot += p.rv;
    });
    frame++;
    if (frame < 120) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

/* ============================================================
   11. LEARN — TOPICS DATA
============================================================ */
const TOPICS = [
  {
    id: 'variables',
    icon: '📦',
    name: 'Variables',
    desc: 'Store and manage data with var, let, and const',
    diff: 'Beginner',
    xp: 15,
    explanation: `Variables are <strong>containers for storing data</strong>. JavaScript has three ways to declare variables:<br><br>
    • <strong>var</strong> — old way, function-scoped (avoid in modern JS)<br>
    • <strong>let</strong> — block-scoped, can be reassigned<br>
    • <strong>const</strong> — block-scoped, cannot be reassigned<br><br>
    Think of variables like labelled boxes 📦 — you put something inside, give it a name, and use that name to access it later.`,
    example: `<span class="cmt">// Using let — value can change</span>
<span class="kw">let</span> <span class="var">name</span> <span class="op">=</span> <span class="str">"Alex"</span>;
<span class="var">name</span> <span class="op">=</span> <span class="str">"Jordan"</span>; <span class="cmt">// ✅ OK</span>

<span class="cmt">// Using const — value is locked</span>
<span class="kw">const</span> <span class="var">PI</span> <span class="op">=</span> <span class="num">3.14159</span>;
<span class="cmt">// PI = 3; ❌ Error!</span>

<span class="cmt">// Multiple variables</span>
<span class="kw">let</span> <span class="var">score</span> <span class="op">=</span> <span class="num">0</span>, <span class="var">level</span> <span class="op">=</span> <span class="num">1</span>, <span class="var">lives</span> <span class="op">=</span> <span class="num">3</span>;
<span class="fn">console</span>.<span class="fn">log</span>(<span class="var">score</span>, <span class="var">level</span>, <span class="var">lives</span>);`,
    starter: `// Try creating your own variables!\nlet myName = "Your Name";\nlet myAge = 20;\nconst CITY = "New York";\n\nconsole.log("Name:", myName);\nconsole.log("Age:", myAge);\nconsole.log("City:", CITY);`,
  },
  {
    id: 'datatypes',
    icon: '🔢',
    name: 'Data Types',
    desc: 'Numbers, strings, booleans, null, undefined, and more',
    diff: 'Beginner',
    xp: 15,
    explanation: `JavaScript has <strong>7 primitive data types</strong>:<br><br>
    • <strong>String</strong> — text: "hello", 'world'<br>
    • <strong>Number</strong> — integers and decimals: 42, 3.14<br>
    • <strong>Boolean</strong> — true or false<br>
    • <strong>Null</strong> — intentional empty value<br>
    • <strong>Undefined</strong> — variable declared but not assigned<br>
    • <strong>Symbol</strong> — unique identifiers<br>
    • <strong>BigInt</strong> — huge integers<br><br>
    And one complex type: <strong>Object</strong> (includes Arrays, Functions, etc.)`,
    example: `<span class="kw">let</span> <span class="var">str</span>    <span class="op">=</span> <span class="str">"Hello, World!"</span>;   <span class="cmt">// String</span>
<span class="kw">let</span> <span class="var">num</span>    <span class="op">=</span> <span class="num">42</span>;               <span class="cmt">// Number</span>
<span class="kw">let</span> <span class="var">bool</span>   <span class="op">=</span> <span class="kw">true</span>;             <span class="cmt">// Boolean</span>
<span class="kw">let</span> <span class="var">empty</span>  <span class="op">=</span> <span class="kw">null</span>;             <span class="cmt">// Null</span>
<span class="kw">let</span> <span class="var">idk</span>;                        <span class="cmt">// Undefined</span>

<span class="cmt">// typeof checks the type</span>
<span class="fn">console</span>.<span class="fn">log</span>(<span class="kw">typeof</span> <span class="var">str</span>);    <span class="cmt">// "string"</span>
<span class="fn">console</span>.<span class="fn">log</span>(<span class="kw">typeof</span> <span class="var">num</span>);    <span class="cmt">// "number"</span>
<span class="fn">console</span>.<span class="fn">log</span>(<span class="kw">typeof</span> <span class="var">bool</span>);   <span class="cmt">// "boolean"</span>`,
    starter: `// Explore data types!\nlet myString = "JavaScript";\nlet myNumber = 2024;\nlet myBool = true;\nlet myNull = null;\nlet myUndefined;\n\nconsole.log(typeof myString);\nconsole.log(typeof myNumber);\nconsole.log(typeof myBool);\nconsole.log(typeof myNull);     // surprise!\nconsole.log(typeof myUndefined);`,
  },
  {
    id: 'functions',
    icon: '⚙️',
    name: 'Functions',
    desc: 'Reusable blocks of code that perform tasks',
    diff: 'Beginner',
    xp: 20,
    explanation: `Functions are <strong>reusable blocks of code</strong> that perform a specific task. You define a function once, then <strong>call</strong> it whenever needed.<br><br>
    There are several ways to create functions:<br>
    • <strong>Function Declaration</strong> — traditional way, hoisted<br>
    • <strong>Function Expression</strong> — stored in a variable<br>
    • <strong>Arrow Function</strong> — concise modern syntax (=>)`,
    example: `<span class="cmt">// Function Declaration</span>
<span class="kw">function</span> <span class="fn">greet</span>(<span class="var">name</span>) {
  <span class="kw">return</span> <span class="str">\`Hello, \${</span><span class="var">name</span><span class="str">}!\`</span>;
}

<span class="cmt">// Arrow Function</span>
<span class="kw">const</span> <span class="var">add</span> <span class="op">=</span> (<span class="var">a</span>, <span class="var">b</span>) <span class="op">=></span> <span class="var">a</span> <span class="op">+</span> <span class="var">b</span>;

<span class="cmt">// Default Parameters</span>
<span class="kw">const</span> <span class="var">power</span> <span class="op">=</span> (<span class="var">base</span>, <span class="var">exp</span> <span class="op">=</span> <span class="num">2</span>) <span class="op">=></span> <span class="var">base</span> <span class="op">**</span> <span class="var">exp</span>;

<span class="fn">console</span>.<span class="fn">log</span>(<span class="fn">greet</span>(<span class="str">"Alex"</span>));   <span class="cmt">// Hello, Alex!</span>
<span class="fn">console</span>.<span class="fn">log</span>(<span class="fn">add</span>(<span class="num">3</span>, <span class="num">7</span>));       <span class="cmt">// 10</span>
<span class="fn">console</span>.<span class="fn">log</span>(<span class="fn">power</span>(<span class="num">4</span>));        <span class="cmt">// 16</span>`,
    starter: `// Create your own functions!\nfunction sayHello(name) {\n  return "Hello, " + name + "!";\n}\n\nconst multiply = (a, b) => a * b;\n\nconst square = n => n ** 2;\n\nconsole.log(sayHello("World"));\nconsole.log(multiply(4, 5));\nconsole.log(square(7));`,
  },
  {
    id: 'loops',
    icon: '🔄',
    name: 'Loops',
    desc: 'Repeat actions with for, while, and forEach',
    diff: 'Beginner',
    xp: 20,
    explanation: `Loops let you <strong>repeat code</strong> multiple times without rewriting it. JavaScript has several loop types:<br><br>
    • <strong>for</strong> — runs a set number of times<br>
    • <strong>while</strong> — runs while a condition is true<br>
    • <strong>for...of</strong> — iterates over arrays/strings<br>
    • <strong>for...in</strong> — iterates over object keys<br>
    • <strong>forEach</strong> — array method for iteration`,
    example: `<span class="cmt">// for loop</span>
<span class="kw">for</span> (<span class="kw">let</span> <span class="var">i</span> <span class="op">=</span> <span class="num">1</span>; <span class="var">i</span> <span class="op"><=</span> <span class="num">5</span>; <span class="var">i</span><span class="op">++</span>) {
  <span class="fn">console</span>.<span class="fn">log</span>(<span class="var">i</span>);
}

<span class="cmt">// for...of loop (arrays)</span>
<span class="kw">const</span> <span class="var">fruits</span> <span class="op">=</span> [<span class="str">"🍎"</span>, <span class="str">"🍊"</span>, <span class="str">"🍇"</span>];
<span class="kw">for</span> (<span class="kw">const</span> <span class="var">fruit</span> <span class="kw">of</span> <span class="var">fruits</span>) {
  <span class="fn">console</span>.<span class="fn">log</span>(<span class="var">fruit</span>);
}

<span class="cmt">// while loop</span>
<span class="kw">let</span> <span class="var">count</span> <span class="op">=</span> <span class="num">3</span>;
<span class="kw">while</span> (<span class="var">count</span> <span class="op">></span> <span class="num">0</span>) {
  <span class="fn">console</span>.<span class="fn">log</span>(<span class="str">"Countdown:"</span>, <span class="var">count</span><span class="op">--</span>);
}`,
    starter: `// Try different loops!\nfor (let i = 1; i <= 5; i++) {\n  console.log("Count:", i);\n}\n\nconst colors = ["red", "green", "blue"];\ncolors.forEach((color, index) => {\n  console.log(index + ":", color);\n});`,
  },
  {
    id: 'arrays',
    icon: '📋',
    name: 'Arrays',
    desc: 'Store lists of items and use powerful array methods',
    diff: 'Beginner',
    xp: 25,
    explanation: `Arrays are <strong>ordered lists</strong> that can hold multiple values. They are one of the most used data structures in JavaScript.<br><br>
    Key array methods:<br>
    • <strong>push/pop</strong> — add/remove from end<br>
    • <strong>shift/unshift</strong> — remove/add from start<br>
    • <strong>map</strong> — transform each element<br>
    • <strong>filter</strong> — keep matching elements<br>
    • <strong>reduce</strong> — accumulate to single value<br>
    • <strong>find/findIndex</strong> — search array`,
    example: `<span class="kw">const</span> <span class="var">nums</span> <span class="op">=</span> [<span class="num">1</span>, <span class="num">2</span>, <span class="num">3</span>, <span class="num">4</span>, <span class="num">5</span>];

<span class="cmt">// map — double each number</span>
<span class="kw">const</span> <span class="var">doubled</span> <span class="op">=</span> <span class="var">nums</span>.<span class="fn">map</span>(<span class="var">n</span> <span class="op">=></span> <span class="var">n</span> <span class="op">*</span> <span class="num">2</span>);
<span class="cmt">// [2, 4, 6, 8, 10]</span>

<span class="cmt">// filter — only evens</span>
<span class="kw">const</span> <span class="var">evens</span> <span class="op">=</span> <span class="var">nums</span>.<span class="fn">filter</span>(<span class="var">n</span> <span class="op">=></span> <span class="var">n</span> <span class="op">%</span> <span class="num">2</span> <span class="op">===</span> <span class="num">0</span>);
<span class="cmt">// [2, 4]</span>

<span class="cmt">// reduce — sum all</span>
<span class="kw">const</span> <span class="var">sum</span> <span class="op">=</span> <span class="var">nums</span>.<span class="fn">reduce</span>((<span class="var">acc</span>, <span class="var">n</span>) <span class="op">=></span> <span class="var">acc</span> <span class="op">+</span> <span class="var">n</span>, <span class="num">0</span>);
<span class="cmt">// 15</span>

<span class="fn">console</span>.<span class="fn">log</span>(<span class="var">doubled</span>, <span class="var">evens</span>, <span class="var">sum</span>);`,
    starter: `const fruits = ["apple", "banana", "cherry", "date", "elderberry"];\n\n// Get fruits with more than 5 characters\nconst longFruits = fruits.filter(f => f.length > 5);\nconsole.log("Long fruits:", longFruits);\n\n// Capitalize each fruit\nconst capitalized = fruits.map(f => f.toUpperCase());\nconsole.log("Capitalized:", capitalized);\n\n// Count total characters\nconst totalChars = fruits.reduce((acc, f) => acc + f.length, 0);\nconsole.log("Total chars:", totalChars);`,
  },
  {
    id: 'objects',
    icon: '🗂️',
    name: 'Objects',
    desc: 'Key-value pairs, destructuring, and methods',
    diff: 'Intermediate',
    xp: 25,
    explanation: `Objects store data as <strong>key-value pairs</strong> (like a dictionary). They can hold any type of value — strings, numbers, arrays, even other objects and functions!<br><br>
    Key concepts:<br>
    • <strong>Dot notation</strong> — obj.property<br>
    • <strong>Bracket notation</strong> — obj["property"]<br>
    • <strong>Destructuring</strong> — extract values easily<br>
    • <strong>Spread operator</strong> — copy/merge objects<br>
    • <strong>Methods</strong> — functions inside objects`,
    example: `<span class="kw">const</span> <span class="var">player</span> <span class="op">=</span> {
  <span class="prop">name</span>: <span class="str">"Hero"</span>,
  <span class="prop">level</span>: <span class="num">5</span>,
  <span class="prop">skills</span>: [<span class="str">"JS"</span>, <span class="str">"CSS"</span>],
  <span class="prop">greet</span>() {
    <span class="kw">return</span> <span class="str">\`I'm \${<span class="kw">this</span>.<span class="prop">name</span>}, lvl \${<span class="kw">this</span>.<span class="prop">level</span>}\`</span>;
  }
};

<span class="cmt">// Destructuring</span>
<span class="kw">const</span> { <span class="var">name</span>, <span class="var">level</span> } <span class="op">=</span> <span class="var">player</span>;

<span class="cmt">// Spread to copy</span>
<span class="kw">const</span> <span class="var">hero2</span> <span class="op">=</span> { <span class="op">...</span><span class="var">player</span>, <span class="prop">level</span>: <span class="num">10</span> };

<span class="fn">console</span>.<span class="fn">log</span>(<span class="var">player</span>.<span class="fn">greet</span>());`,
    starter: `const car = {\n  brand: "Tesla",\n  model: "Model S",\n  year: 2024,\n  electric: true,\n  describe() {\n    return this.year + " " + this.brand + " " + this.model;\n  }\n};\n\n// Destructure brand and model\nconst { brand, model, year } = car;\nconsole.log(brand, model, year);\nconsole.log(car.describe());\n\n// Add a property\ncar.color = "red";\nconsole.log(Object.keys(car));`,
  },
  {
    id: 'dom',
    icon: '🌐',
    name: 'DOM',
    desc: 'Manipulate HTML elements with JavaScript',
    diff: 'Intermediate',
    xp: 30,
    explanation: `The <strong>Document Object Model (DOM)</strong> is a tree representation of your HTML page. JavaScript can read and change the DOM to update what users see.<br><br>
    Key DOM methods:<br>
    • <strong>querySelector</strong> — select one element<br>
    • <strong>querySelectorAll</strong> — select multiple<br>
    • <strong>createElement</strong> — create new elements<br>
    • <strong>textContent / innerHTML</strong> — change content<br>
    • <strong>classList</strong> — add/remove CSS classes<br>
    • <strong>style</strong> — change inline styles`,
    example: `<span class="cmt">// Select elements</span>
<span class="kw">const</span> <span class="var">btn</span> <span class="op">=</span> document.<span class="fn">querySelector</span>(<span class="str">"#myBtn"</span>);
<span class="kw">const</span> <span class="var">title</span> <span class="op">=</span> document.<span class="fn">querySelector</span>(<span class="str">"h1"</span>);

<span class="cmt">// Change content</span>
<span class="var">title</span>.<span class="prop">textContent</span> <span class="op">=</span> <span class="str">"New Title!"</span>;

<span class="cmt">// Create element</span>
<span class="kw">const</span> <span class="var">li</span> <span class="op">=</span> document.<span class="fn">createElement</span>(<span class="str">"li"</span>);
<span class="var">li</span>.<span class="prop">textContent</span> <span class="op">=</span> <span class="str">"New item"</span>;
document.<span class="fn">querySelector</span>(<span class="str">"ul"</span>).<span class="fn">append</span>(<span class="var">li</span>);

<span class="cmt">// Toggle a CSS class</span>
<span class="var">btn</span>.<span class="prop">classList</span>.<span class="fn">toggle</span>(<span class="str">"active"</span>);`,
    starter: `// DOM demo (runs in this sandbox)\nconst output = document.getElementById('try-output');\nif (output) {\n  output.textContent = "";\n}\n\nfunction addItem(text) {\n  const div = document.createElement("div");\n  div.textContent = "• " + text;\n  div.style.padding = "4px 0";\n  div.style.color = "#4ecdc4";\n  if (output) output.appendChild(div);\n  console.log("Created:", text);\n}\n\naddItem("DOM manipulation works!");\naddItem("Created with createElement");\naddItem("Appended to container");`,
  },
  {
    id: 'events',
    icon: '🎯',
    name: 'Events',
    desc: 'Handle user interactions with event listeners',
    diff: 'Intermediate',
    xp: 30,
    explanation: `<strong>Events</strong> are things that happen in the browser — clicking, typing, scrolling, etc. You can listen for these and respond with code.<br><br>
    Common events:<br>
    • <strong>click</strong> — mouse/touch click<br>
    • <strong>keydown/keyup</strong> — keyboard input<br>
    • <strong>input</strong> — form input changes<br>
    • <strong>submit</strong> — form submission<br>
    • <strong>mouseover/mouseout</strong> — hover<br>
    • <strong>DOMContentLoaded</strong> — page loaded`,
    example: `<span class="kw">const</span> <span class="var">btn</span> <span class="op">=</span> document.<span class="fn">querySelector</span>(<span class="str">"#btn"</span>);

<span class="cmt">// Add an event listener</span>
<span class="var">btn</span>.<span class="fn">addEventListener</span>(<span class="str">"click"</span>, (<span class="var">event</span>) <span class="op">=></span> {
  <span class="fn">console</span>.<span class="fn">log</span>(<span class="str">"Button clicked!"</span>);
  <span class="fn">console</span>.<span class="fn">log</span>(<span class="str">"Target:"</span>, <span class="var">event</span>.<span class="prop">target</span>);
});

<span class="cmt">// Keyboard events</span>
document.<span class="fn">addEventListener</span>(<span class="str">"keydown"</span>, (<span class="var">e</span>) <span class="op">=></span> {
  <span class="fn">console</span>.<span class="fn">log</span>(<span class="str">"Key pressed:"</span>, <span class="var">e</span>.<span class="prop">key</span>);
});

<span class="cmt">// Removing a listener</span>
<span class="kw">const</span> <span class="var">handler</span> <span class="op">=</span> () <span class="op">=></span> <span class="fn">console</span>.<span class="fn">log</span>(<span class="str">"Once!"</span>);
<span class="var">btn</span>.<span class="fn">addEventListener</span>(<span class="str">"click"</span>, <span class="var">handler</span>, { <span class="prop">once</span>: <span class="kw">true</span> });`,
    starter: `// Event demo\nconst clicks = [];\n\nfunction recordClick(label) {\n  clicks.push({ label, time: new Date().toLocaleTimeString() });\n  console.log("Events recorded:", clicks.length);\n  clicks.forEach(c => console.log(" -", c.label, "@", c.time));\n}\n\nrecordClick("manual test 1");\nrecordClick("manual test 2");\nrecordClick("manual test 3");\nconsole.log("Total clicks:", clicks.length);`,
  },
];

/* ============================================================
   12. RENDER TOPICS
============================================================ */
function renderTopics() {
  const grid = document.getElementById('topics-grid');
  grid.innerHTML = TOPICS.map((t, i) => `
    <div class="topic-card ${state.completedTopics.includes(t.id) ? 'completed' : ''}"
         onclick="openConcept('${t.id}')" style="animation-delay:${i*0.05}s">
      <div class="topic-icon">${t.icon}</div>
      <div class="topic-name">${t.name}</div>
      <div class="topic-desc">${t.desc}</div>
      <div class="topic-meta">
        <span class="topic-diff">${t.diff}</span>
        <span class="topic-check">✓</span>
      </div>
    </div>
  `).join('');
}

function openConcept(id) {
  const topic = TOPICS.find(t => t.id === id);
  if (!topic) return;
  playSound('click');
  _pushNav({ type: 'concept', topicId: id });

  document.getElementById('topics-grid').style.display = 'none';
  const panel = document.getElementById('concept-panel');
  panel.classList.add('open');

  panel.querySelector('#concept-content').innerHTML = `
    <div class="concept-header">
      <span class="concept-icon-big">${topic.icon}</span>
      <div>
        <div class="concept-title">${topic.name}</div>
        <span class="concept-diff-badge diff-${topic.diff.toLowerCase()}">${topic.diff} · ${topic.xp} XP</span>
      </div>
    </div>

    <div class="concept-explanation">${topic.explanation}</div>

    <div class="concept-section-title">💡 Example Code</div>
    <div class="code-example">
      <div class="code-example-header">
        <span class="code-lang">javascript</span>
        <button class="code-copy" onclick="copyCode(this)">Copy</button>
      </div>
      <pre class="code-block">${topic.example}</pre>
    </div>

    <div class="concept-section-title">✏️ Try It Yourself</div>
    <div class="try-it-section">
      <div class="try-it-header">
        <span class="try-it-title">⚡ Live Editor</span>
        <div class="try-it-actions">
          <button class="btn btn-sm btn-primary" onclick="runCode('editor-${id}','out-${id}')">▶ Run</button>
          <button class="btn btn-sm btn-ghost" onclick="resetCode('editor-${id}','${id}')">↺ Reset</button>
        </div>
      </div>
      <textarea class="code-editor" id="editor-${id}" spellcheck="false">${topic.starter}</textarea>
      <div class="output-panel" id="out-${id}">// Output will appear here...</div>
    </div>

    <button class="btn btn-success" onclick="markTopicDone('${id}')">
      ${state.completedTopics.includes(id) ? '✅ Completed!' : '✔ Mark as Completed (+' + topic.xp + ' XP)'}
    </button>
    <div id="try-output" style="display:none"></div>
  `;
}

function closeConceptPanel(_silent) {
  document.getElementById('topics-grid').style.display = '';
  document.getElementById('concept-panel').classList.remove('open');
}

document.getElementById('back-to-topics').addEventListener('click', () => {
  closeConceptPanel(); playSound('click');
});

function markTopicDone(id) {
  if (!state.completedTopics.includes(id)) {
    state.completedTopics.push(id);
    const topic = TOPICS.find(t => t.id === id);
    addXP(topic.xp, topic.name);
    saveState();
    playSound('success');
    showToast(`✅ ${topic.name} completed!`, 'success');
    renderTopics();
    const btn = document.querySelector(`#concept-content .btn-success`);
    if (btn) btn.textContent = '✅ Completed!';
  }
}

function runCode(editorId, outputId) {
  const code = document.getElementById(editorId)?.value || '';
  const out = document.getElementById(outputId);
  if (!out) return;
  let logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  try {
    // eslint-disable-next-line no-new-func
    new Function(code)();
    out.textContent = logs.length ? logs.join('\n') : '(no output)';
    out.className = 'output-panel';
  } catch (e) {
    out.textContent = '❌ Error: ' + e.message;
    out.className = 'output-panel error';
  }
  console.log = orig;
  playSound('click');
}

function resetCode(editorId, topicId) {
  const topic = TOPICS.find(t => t.id === topicId);
  if (topic) document.getElementById(editorId).value = topic.starter;
}

function copyCode(btn) {
  const pre = btn.closest('.code-example').querySelector('.code-block');
  navigator.clipboard.writeText(pre.innerText).then(() => { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); });
}

/* ============================================================
   13. PRACTICE — STAGE-BASED CHALLENGE SYSTEM
============================================================ */

// ---- Stage definitions ----
const PRACTICE_STAGES = [
  {
    id: 'stage1', num: 1, icon: '🌱', name: 'Foundations',
    desc: 'Variables, data types & basic functions',
    color: '#4ecdc4', colorBg: 'rgba(78,205,196,0.12)',
    challengeIds: ['ch1','ch2','ch3','ch4'],
    unlockAfter: null, // always open
  },
  {
    id: 'stage2', num: 2, icon: '⚙️', name: 'Functions & Logic',
    desc: 'Real-world function problems and conditionals',
    color: '#f7c948', colorBg: 'rgba(247,201,72,0.12)',
    challengeIds: ['ch5','ch6','ch7','ch8'],
    unlockAfter: 'stage1',
  },
  {
    id: 'stage3', num: 3, icon: '📋', name: 'Arrays & Objects',
    desc: 'Data transformation and aggregation challenges',
    color: '#a855f7', colorBg: 'rgba(168,85,247,0.12)',
    challengeIds: ['ch9','ch10','ch11','ch12'],
    unlockAfter: 'stage2',
  },
  {
    id: 'stage4', num: 4, icon: '🚀', name: 'Advanced Patterns',
    desc: 'Closures, async-style problems & real app scenarios',
    color: '#ff6b6b', colorBg: 'rgba(255,107,107,0.12)',
    challengeIds: ['ch13','ch14','ch15','ch16'],
    unlockAfter: 'stage3',
  },
];

// ---- All challenges ----
const CHALLENGES = [
  /* ── STAGE 1: Foundations ── */
  {
    id: 'ch1', diff: 'easy', xp: 15,
    title: 'Shopping Cart Total',
    scenario: '🛒 You\'re building a checkout page. Calculate the total price of items in a cart.',
    task: 'Write `cartTotal(prices)` that takes an array of prices and returns their sum.',
    requirements: [
      'Function named `cartTotal`',
      'Takes an array of numbers',
      'Returns the numerical sum',
      'Return 0 for an empty cart',
    ],
    hint: 'Use reduce() to accumulate the total. Start with 0 as initial value.',
    solution: `function cartTotal(prices) {\n  return prices.reduce((sum, p) => sum + p, 0);\n}\nconsole.log(cartTotal([9.99, 4.99, 14.99])); // 29.97`,
    starter: `function cartTotal(prices) {\n  // Add up all prices and return the total\n}\n\nconsole.log(cartTotal([9.99, 4.99, 14.99])); // 29.97\nconsole.log(cartTotal([100, 50, 25]));        // 175\nconsole.log(cartTotal([]));                   // 0`,
    tests: [
      { input: '[9.99, 4.99, 14.99]', fn: c => { try { return Math.abs(new Function(c+';return cartTotal([9.99,4.99,14.99]);')() - 29.97) < 0.01; } catch(e){return false;} } },
      { input: '[100, 50, 25]', fn: c => { try { return new Function(c+';return cartTotal([100,50,25]);')() === 175; } catch(e){return false;} } },
      { input: '[]', fn: c => { try { return new Function(c+';return cartTotal([]);')() === 0; } catch(e){return false;} } },
    ],
  },
  {
    id: 'ch2', diff: 'easy', xp: 15,
    title: 'Username Validator',
    scenario: '🔐 You\'re building a sign-up form. Usernames must be 3–15 chars and contain only letters/numbers.',
    task: 'Write `isValidUsername(name)` that returns true if the username is valid.',
    requirements: [
      'Length must be 3–15 characters',
      'Only letters (a-z, A-Z) and digits (0-9)',
      'No spaces or special characters',
      'Returns a boolean',
    ],
    hint: 'Use a regex: /^[a-zA-Z0-9]{3,15}$/.test(name)',
    solution: `function isValidUsername(name) {\n  return /^[a-zA-Z0-9]{3,15}$/.test(name);\n}\nconsole.log(isValidUsername("alex123")); // true`,
    starter: `function isValidUsername(name) {\n  // Validate the username and return true/false\n}\n\nconsole.log(isValidUsername("alex123"));  // true\nconsole.log(isValidUsername("ab"));       // false (too short)\nconsole.log(isValidUsername("hello world")); // false (has space)\nconsole.log(isValidUsername("super_user")); // false (underscore)`,
    tests: [
      { input: '"alex123"', fn: c => { try { return new Function(c+';return isValidUsername("alex123");')() === true; } catch(e){return false;} } },
      { input: '"ab"', fn: c => { try { return new Function(c+';return isValidUsername("ab");')() === false; } catch(e){return false;} } },
      { input: '"hello world"', fn: c => { try { return new Function(c+';return isValidUsername("hello world");')() === false; } catch(e){return false;} } },
    ],
  },
  {
    id: 'ch3', diff: 'easy', xp: 15,
    title: 'Temperature Converter',
    scenario: '🌡️ A weather app needs to show both Celsius and Fahrenheit. Build the conversion function.',
    task: 'Write `toCelsius(f)` that converts Fahrenheit to Celsius. Formula: C = (F − 32) × 5/9. Round to 1 decimal.',
    requirements: [
      'Function named `toCelsius`',
      'Takes Fahrenheit value',
      'Returns Celsius rounded to 1 decimal',
      '32°F → 0°C, 212°F → 100°C',
    ],
    hint: 'Use Math.round or .toFixed(1). Formula: (f - 32) * 5/9',
    solution: `function toCelsius(f) {\n  return Math.round((f - 32) * 5/9 * 10) / 10;\n}\nconsole.log(toCelsius(32));  // 0\nconsole.log(toCelsius(212)); // 100`,
    starter: `function toCelsius(f) {\n  // Convert Fahrenheit to Celsius, rounded to 1 decimal\n}\n\nconsole.log(toCelsius(32));   // 0\nconsole.log(toCelsius(212));  // 100\nconsole.log(toCelsius(98.6)); // 37`,
    tests: [
      { input: '32', fn: c => { try { return new Function(c+';return toCelsius(32);')() === 0; } catch(e){return false;} } },
      { input: '212', fn: c => { try { return new Function(c+';return toCelsius(212);')() === 100; } catch(e){return false;} } },
      { input: '98.6', fn: c => { try { return new Function(c+';return toCelsius(98.6);')() === 37; } catch(e){return false;} } },
    ],
  },
  {
    id: 'ch4', diff: 'easy', xp: 15,
    title: 'Capitalize Words',
    scenario: '✍️ A blog editor needs to format post titles by capitalizing the first letter of each word.',
    task: 'Write `titleCase(str)` that capitalizes the first letter of each word.',
    requirements: [
      'First letter of each word → uppercase',
      'Rest of each word → lowercase',
      '"hello world" → "Hello World"',
      'Handle single words too',
    ],
    hint: 'Split on spaces, map each word, use word[0].toUpperCase() + word.slice(1).toLowerCase()',
    solution: `function titleCase(str) {\n  return str.split(' ').map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');\n}\nconsole.log(titleCase("hello world")); // "Hello World"`,
    starter: `function titleCase(str) {\n  // Capitalize the first letter of each word\n}\n\nconsole.log(titleCase("hello world"));   // "Hello World"\nconsole.log(titleCase("javascript is fun")); // "Javascript Is Fun"\nconsole.log(titleCase("REACT"));         // "React"`,
    tests: [
      { input: '"hello world"', fn: c => { try { return new Function(c+';return titleCase("hello world");')() === 'Hello World'; } catch(e){return false;} } },
      { input: '"REACT"', fn: c => { try { return new Function(c+';return titleCase("REACT");')() === 'React'; } catch(e){return false;} } },
    ],
  },

  /* ── STAGE 2: Functions & Logic ── */
  {
    id: 'ch5', diff: 'easy', xp: 20,
    title: 'Age Category',
    scenario: '🎂 A streaming platform shows different content based on user age. Categorize the user.',
    task: 'Write `ageCategory(age)` returning: "child" (<13), "teen" (13-17), "adult" (18-64), "senior" (65+).',
    requirements: [
      'Returns "child" for age < 13',
      'Returns "teen" for 13–17',
      'Returns "adult" for 18–64',
      'Returns "senior" for 65+',
    ],
    hint: 'Use if/else if/else chain. Check from lowest to highest.',
    solution: `function ageCategory(age) {\n  if (age < 13) return "child";\n  if (age < 18) return "teen";\n  if (age < 65) return "adult";\n  return "senior";\n}`,
    starter: `function ageCategory(age) {\n  // Return the correct age category string\n}\n\nconsole.log(ageCategory(8));  // "child"\nconsole.log(ageCategory(15)); // "teen"\nconsole.log(ageCategory(30)); // "adult"\nconsole.log(ageCategory(70)); // "senior"`,
    tests: [
      { input: '8', fn: c => { try { return new Function(c+';return ageCategory(8);')() === 'child'; } catch(e){return false;} } },
      { input: '15', fn: c => { try { return new Function(c+';return ageCategory(15);')() === 'teen'; } catch(e){return false;} } },
      { input: '30', fn: c => { try { return new Function(c+';return ageCategory(30);')() === 'adult'; } catch(e){return false;} } },
      { input: '70', fn: c => { try { return new Function(c+';return ageCategory(70);')() === 'senior'; } catch(e){return false;} } },
    ],
  },
  {
    id: 'ch6', diff: 'easy', xp: 20,
    title: 'FizzBuzz Pro',
    scenario: '🎯 The classic interview question — but now in a real context: a game that prints special messages.',
    task: 'Write `fizzBuzz(n)` returning an array 1..n: multiples of 3 → "Fizz", 5 → "Buzz", both → "FizzBuzz", else number as string.',
    requirements: [
      'Returns an array of strings',
      'Multiples of 3 → "Fizz"',
      'Multiples of 5 → "Buzz"',
      'Multiples of both → "FizzBuzz"',
    ],
    hint: 'Check FizzBuzz (n%15===0) first, then Fizz, then Buzz.',
    solution: `function fizzBuzz(n) {\n  const r = [];\n  for (let i = 1; i <= n; i++) {\n    if (i%15===0) r.push("FizzBuzz");\n    else if (i%3===0) r.push("Fizz");\n    else if (i%5===0) r.push("Buzz");\n    else r.push(String(i));\n  }\n  return r;\n}`,
    starter: `function fizzBuzz(n) {\n  // Build and return the FizzBuzz array\n}\n\nconsole.log(fizzBuzz(15));\n// ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]`,
    tests: [
      { input: 'n=15, [2]==="Fizz"', fn: c => { try { const r=new Function(c+';return fizzBuzz(15);')(); return r[2]==='Fizz'&&r[4]==='Buzz'&&r[14]==='FizzBuzz'; } catch(e){return false;} } },
      { input: 'fizzBuzz(3)[2]', fn: c => { try { return new Function(c+';return fizzBuzz(3)[2];')() === 'Fizz'; } catch(e){return false;} } },
    ],
  },
  {
    id: 'ch7', diff: 'medium', xp: 30,
    title: 'Discount Calculator',
    scenario: '🏷️ An e-commerce site needs a discount engine. Different thresholds = different discounts.',
    task: 'Write `applyDiscount(price, code)` — codes: "SAVE10" (10%), "HALF" (50%), "VIP" (30%). Unknown code → no discount.',
    requirements: [
      'Takes price (number) and code (string)',
      '"SAVE10" → 10% off',
      '"HALF" → 50% off',
      '"VIP" → 30% off',
      'Unknown code → original price',
    ],
    hint: 'Use a switch statement or an object map of discount rates.',
    solution: `function applyDiscount(price, code) {\n  const discounts = { SAVE10: 0.1, HALF: 0.5, VIP: 0.3 };\n  const rate = discounts[code] || 0;\n  return Math.round(price * (1 - rate) * 100) / 100;\n}`,
    starter: `function applyDiscount(price, code) {\n  // Apply the discount and return new price\n}\n\nconsole.log(applyDiscount(100, "SAVE10")); // 90\nconsole.log(applyDiscount(100, "HALF"));   // 50\nconsole.log(applyDiscount(100, "VIP"));    // 70\nconsole.log(applyDiscount(100, "FAKE"));   // 100`,
    tests: [
      { input: '(100,"SAVE10")', fn: c => { try { return new Function(c+';return applyDiscount(100,"SAVE10");')() === 90; } catch(e){return false;} } },
      { input: '(100,"HALF")', fn: c => { try { return new Function(c+';return applyDiscount(100,"HALF");')() === 50; } catch(e){return false;} } },
      { input: '(100,"FAKE")', fn: c => { try { return new Function(c+';return applyDiscount(100,"FAKE");')() === 100; } catch(e){return false;} } },
    ],
  },
  {
    id: 'ch8', diff: 'medium', xp: 30,
    title: 'Password Strength',
    scenario: '🔒 Build the password strength checker for a security-focused app.',
    task: 'Write `passwordStrength(pwd)` returning "weak", "medium", or "strong". Weak: <6 chars. Medium: 6+ with letters+numbers. Strong: 8+ with upper, lower, number AND special char.',
    requirements: [
      '"weak" if length < 6',
      '"medium" if 6+ chars with letters and numbers',
      '"strong" if 8+ chars with uppercase, lowercase, number, special char',
      'Returns a string',
    ],
    hint: 'Use regex tests: /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^a-zA-Z0-9]/.test(pwd)',
    solution: `function passwordStrength(pwd) {\n  if (pwd.length < 6) return "weak";\n  const hasUpper = /[A-Z]/.test(pwd);\n  const hasLower = /[a-z]/.test(pwd);\n  const hasNum = /[0-9]/.test(pwd);\n  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);\n  if (pwd.length >= 8 && hasUpper && hasLower && hasNum && hasSpecial) return "strong";\n  if (/[a-zA-Z]/.test(pwd) && hasNum) return "medium";\n  return "weak";\n}`,
    starter: `function passwordStrength(pwd) {\n  // Determine password strength\n}\n\nconsole.log(passwordStrength("abc"));         // "weak"\nconsole.log(passwordStrength("hello123"));     // "medium"\nconsole.log(passwordStrength("Secure1!"));     // "strong"`,
    tests: [
      { input: '"abc"', fn: c => { try { return new Function(c+';return passwordStrength("abc");')() === 'weak'; } catch(e){return false;} } },
      { input: '"hello123"', fn: c => { try { return new Function(c+';return passwordStrength("hello123");')() === 'medium'; } catch(e){return false;} } },
      { input: '"Secure1!"', fn: c => { try { return new Function(c+';return passwordStrength("Secure1!");')() === 'strong'; } catch(e){return false;} } },
    ],
  },

  /* ── STAGE 3: Arrays & Objects ── */
  {
    id: 'ch9', diff: 'medium', xp: 35,
    title: 'Product Filter',
    scenario: '🛍️ An online store needs to filter products by category and max price.',
    task: 'Write `filterProducts(products, category, maxPrice)` returning matching products.',
    requirements: [
      'Takes array of {name, category, price} objects',
      'Filter by matching category (case-insensitive)',
      'Filter by price <= maxPrice',
      'Returns filtered array',
    ],
    hint: 'Use .filter() and check both category.toLowerCase() and price conditions.',
    solution: `function filterProducts(products, category, maxPrice) {\n  return products.filter(p =>\n    p.category.toLowerCase() === category.toLowerCase() && p.price <= maxPrice\n  );\n}`,
    starter: `function filterProducts(products, category, maxPrice) {\n  // Return filtered products\n}\n\nconst products = [\n  { name: "Laptop", category: "Electronics", price: 999 },\n  { name: "Shirt", category: "Clothing", price: 25 },\n  { name: "Phone", category: "Electronics", price: 499 },\n  { name: "Jeans", category: "Clothing", price: 60 },\n];\n\nconsole.log(filterProducts(products, "Electronics", 500));\n// [{ name: "Phone", ... }]`,
    tests: [
      { input: 'Electronics ≤ 500', fn: c => { try { const p=[{name:"L",category:"Electronics",price:999},{name:"Ph",category:"Electronics",price:499}]; return new Function(c+`;return filterProducts(${JSON.stringify(p)},"Electronics",500).length;`)() === 1; } catch(e){return false;} } },
      { input: 'Clothing ≤ 100', fn: c => { try { const p=[{name:"S",category:"Clothing",price:25},{name:"J",category:"Clothing",price:60}]; return new Function(c+`;return filterProducts(${JSON.stringify(p)},"Clothing",100).length;`)() === 2; } catch(e){return false;} } },
    ],
  },
  {
    id: 'ch10', diff: 'medium', xp: 35,
    title: 'Grade Book',
    scenario: '📊 A teacher wants a summary of student grades — average, highest, and lowest.',
    task: 'Write `gradeBook(students)` returning {average, highest, lowest} from an array of {name, score}.',
    requirements: [
      'Takes array of {name, score} objects',
      'Returns object with average, highest, lowest',
      'Average rounded to 1 decimal',
      'highest/lowest are the score values',
    ],
    hint: 'Use .map() to extract scores, then Math.max/min and reduce for average.',
    solution: `function gradeBook(students) {\n  const scores = students.map(s => s.score);\n  return {\n    average: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length * 10)/10,\n    highest: Math.max(...scores),\n    lowest: Math.min(...scores)\n  };\n}`,
    starter: `function gradeBook(students) {\n  // Return { average, highest, lowest }\n}\n\nconst class1 = [\n  { name: "Alice", score: 92 },\n  { name: "Bob", score: 78 },\n  { name: "Carol", score: 85 },\n];\n\nconsole.log(gradeBook(class1));\n// { average: 85, highest: 92, lowest: 78 }`,
    tests: [
      { input: 'average of [92,78,85]', fn: c => { try { const r=new Function(c+';return gradeBook([{name:"A",score:92},{name:"B",score:78},{name:"C",score:85}]);')(); return r.average===85&&r.highest===92&&r.lowest===78; } catch(e){return false;} } },
    ],
  },
  {
    id: 'ch11', diff: 'medium', xp: 35,
    title: 'Word Frequency',
    scenario: '📝 A text analysis tool needs to count how often each word appears in a sentence.',
    task: 'Write `wordFrequency(text)` returning an object with each word as key and its count as value. Case-insensitive.',
    requirements: [
      'Split text by spaces',
      'Case-insensitive (convert to lowercase)',
      'Returns {word: count, ...} object',
      'Ignore punctuation is optional (bonus)',
    ],
    hint: 'Split on spaces, lowercase each word, build object: obj[word] = (obj[word] || 0) + 1',
    solution: `function wordFrequency(text) {\n  return text.toLowerCase().split(' ').reduce((obj, word) => {\n    obj[word] = (obj[word] || 0) + 1;\n    return obj;\n  }, {});\n}`,
    starter: `function wordFrequency(text) {\n  // Count word occurrences\n}\n\nconst text = "the cat sat on the mat the cat";\nconsole.log(wordFrequency(text));\n// { the: 3, cat: 2, sat: 1, on: 1, mat: 1 }`,
    tests: [
      { input: '"the cat the"', fn: c => { try { const r=new Function(c+';return wordFrequency("the cat the");')(); return r.the===2&&r.cat===1; } catch(e){return false;} } },
    ],
  },
  {
    id: 'ch12', diff: 'hard', xp: 50,
    title: 'Inventory Manager',
    scenario: '📦 A warehouse app needs to manage stock. Implement add, remove, and total-value functions.',
    task: 'Write a `createInventory()` factory that returns an object with: add(item), remove(name), totalValue(), list().',
    requirements: [
      'add({name, price, qty}) — adds or updates item',
      'remove(name) — removes item by name',
      'totalValue() — returns sum of (price * qty)',
      'list() — returns array of all items',
    ],
    hint: 'Store items in a closure array. Use find() to check for existing items.',
    solution: `function createInventory() {\n  const items = [];\n  return {\n    add(item) {\n      const ex = items.find(i => i.name === item.name);\n      if (ex) { ex.qty += item.qty; } else { items.push({...item}); }\n    },\n    remove(name) {\n      const idx = items.findIndex(i => i.name === name);\n      if (idx > -1) items.splice(idx, 1);\n    },\n    totalValue() { return items.reduce((s,i) => s + i.price*i.qty, 0); },\n    list() { return [...items]; }\n  };\n}`,
    starter: `function createInventory() {\n  // Return an object with add, remove, totalValue, list\n}\n\nconst inv = createInventory();\ninv.add({ name: "Widget", price: 5, qty: 10 });\ninv.add({ name: "Gadget", price: 20, qty: 3 });\nconsole.log(inv.totalValue()); // 110\nconsole.log(inv.list().length); // 2\ninv.remove("Widget");\nconsole.log(inv.list().length); // 1`,
    tests: [
      { input: 'totalValue after add', fn: c => { try { const r=new Function(c+';const i=createInventory();i.add({name:"A",price:5,qty:10});i.add({name:"B",price:20,qty:3});return i.totalValue();')(); return r===110; } catch(e){return false;} } },
      { input: 'list after remove', fn: c => { try { const r=new Function(c+';const i=createInventory();i.add({name:"A",price:5,qty:2});i.remove("A");return i.list().length;')(); return r===0; } catch(e){return false;} } },
    ],
  },

  /* ── STAGE 4: Advanced Patterns ── */
  {
    id: 'ch13', diff: 'medium', xp: 40,
    title: 'Memoize Function',
    scenario: '⚡ A data-heavy app runs expensive calculations. Caching results speeds it up dramatically.',
    task: 'Write `memoize(fn)` that returns a version of fn that caches results by its arguments.',
    requirements: [
      'Returns a new function',
      'Calls fn only once per unique input',
      'Returns cached result on repeated calls',
      'Works with single argument',
    ],
    hint: 'Use a closure with a Map or plain object as cache. Key = String(arg).',
    solution: `function memoize(fn) {\n  const cache = {};\n  return function(arg) {\n    if (arg in cache) return cache[arg];\n    cache[arg] = fn(arg);\n    return cache[arg];\n  };\n}`,
    starter: `function memoize(fn) {\n  // Cache results\n}\n\nlet callCount = 0;\nconst expensiveDouble = memoize(n => { callCount++; return n * 2; });\n\nconsole.log(expensiveDouble(5));  // 10\nconsole.log(expensiveDouble(5));  // 10 (from cache)\nconsole.log(expensiveDouble(3));  // 6\nconsole.log("fn called:", callCount); // 2 (not 3!)`,
    tests: [
      { input: 'caches repeated calls', fn: c => { try { let n=0; const m=new Function(c+';return memoize(x=>{n++;return x*2;});')(); m(5);m(5);m(3); return n===2; } catch(e){return false;} } },
      { input: 'returns correct values', fn: c => { try { const m=new Function(c+';return memoize(x=>x*2);')(); return m(5)===10&&m(3)===6; } catch(e){return false;} } },
    ],
  },
  {
    id: 'ch14', diff: 'medium', xp: 40,
    title: 'Event Emitter',
    scenario: '📡 Build a simple pub/sub system — the foundation of event-driven JavaScript.',
    task: 'Write `createEmitter()` returning an object with on(event, fn), off(event, fn), emit(event, data).',
    requirements: [
      'on(event, fn) — registers listener',
      'emit(event, data) — calls all listeners',
      'off(event, fn) — removes listener',
      'Multiple listeners per event',
    ],
    hint: 'Store listeners as { eventName: [fn1, fn2] }. Use filter() in off().',
    solution: `function createEmitter() {\n  const listeners = {};\n  return {\n    on(event, fn) { (listeners[event] = listeners[event]||[]).push(fn); },\n    off(event, fn) { if(listeners[event]) listeners[event]=listeners[event].filter(f=>f!==fn); },\n    emit(event, data) { (listeners[event]||[]).forEach(fn=>fn(data)); }\n  };\n}`,
    starter: `function createEmitter() {\n  // Build the event emitter\n}\n\nconst emitter = createEmitter();\nconst log = (data) => console.log("Received:", data);\n\nemitter.on("message", log);\nemitter.emit("message", "Hello!"); // "Received: Hello!"\nemitter.off("message", log);\nemitter.emit("message", "Ignored"); // nothing printed`,
    tests: [
      { input: 'emits events', fn: c => { try { let got=null; const e=new Function(c+';return createEmitter();')(); e.on("x",d=>{got=d;}); e.emit("x","hi"); return got==="hi"; } catch(e){return false;} } },
      { input: 'off removes listener', fn: c => { try { let count=0; const e=new Function(c+';return createEmitter();')(); const fn=()=>count++; e.on("x",fn);e.emit("x");e.off("x",fn);e.emit("x"); return count===1; } catch(e){return false;} } },
    ],
  },
  {
    id: 'ch15', diff: 'hard', xp: 50,
    title: 'Deep Clone',
    scenario: '🔬 State management requires deep cloning objects so mutations don\'t affect the original.',
    task: 'Write `deepClone(obj)` that creates a full deep copy — no shared references for nested objects/arrays.',
    requirements: [
      'Handles nested objects',
      'Handles arrays',
      'Handles primitives',
      'Original is not modified by changes to clone',
    ],
    hint: 'Recursively check: if Array.isArray → map+recurse; if object → reduce keys+recurse; else return value.',
    solution: `function deepClone(obj) {\n  if (obj === null || typeof obj !== 'object') return obj;\n  if (Array.isArray(obj)) return obj.map(deepClone);\n  return Object.fromEntries(Object.entries(obj).map(([k,v]) => [k, deepClone(v)]));\n}`,
    starter: `function deepClone(obj) {\n  // Create a deep copy of obj\n}\n\nconst original = { name: "Alice", scores: [90, 85], address: { city: "NYC" } };\nconst clone = deepClone(original);\n\nclone.name = "Bob";\nclone.scores.push(100);\nclone.address.city = "LA";\n\nconsole.log(original.name);         // "Alice" (unchanged)\nconsole.log(original.scores.length); // 2 (unchanged)\nconsole.log(original.address.city);  // "NYC" (unchanged)`,
    tests: [
      { input: 'nested object unchanged', fn: c => { try { const r=new Function(c+';const o={a:{b:1}};const cl=deepClone(o);cl.a.b=99;return o.a.b;')(); return r===1; } catch(e){return false;} } },
      { input: 'nested array unchanged', fn: c => { try { const r=new Function(c+';const o={arr:[1,2,3]};const cl=deepClone(o);cl.arr.push(4);return o.arr.length;')(); return r===3; } catch(e){return false;} } },
    ],
  },
  {
    id: 'ch16', diff: 'hard', xp: 50,
    title: 'Promise Chain',
    scenario: '🌐 API calls return promises. Build a mini pipeline that processes data through async steps.',
    task: 'Write `pipeline(...fns)` that takes functions and returns one function that runs them in sequence (left to right) passing each result to the next.',
    requirements: [
      'Takes any number of functions',
      'Returns a single function',
      'Output of each fn = input of next',
      'Works like: pipeline(f, g, h)(x) = h(g(f(x)))',
    ],
    hint: 'Use reduce: fns.reduce((v, fn) => fn(v), initialValue)',
    solution: `function pipeline(...fns) {\n  return (value) => fns.reduce((v, fn) => fn(v), value);\n}`,
    starter: `function pipeline(...fns) {\n  // Return a function that chains the provided functions\n}\n\nconst process = pipeline(\n  x => x * 2,\n  x => x + 10,\n  x => x.toString()\n);\n\nconsole.log(process(5));  // "20"  (5*2=10, 10+10=20, "20")\nconsole.log(process(0));  // "10"`,
    tests: [
      { input: 'pipeline(x=>x*2, x=>x+10)(5)', fn: c => { try { return new Function(c+';return pipeline(x=>x*2, x=>x+10)(5);')() === 20; } catch(e){return false;} } },
      { input: 'pipeline(x=>x.toString())(42)', fn: c => { try { return new Function(c+';return pipeline(x=>x.toString())(42);')() === "42"; } catch(e){return false;} } },
    ],
  },
];

/* ============================================================
   14. RENDER PRACTICE (Stage Map + Challenges)
============================================================ */

// Track which stage is currently open
let currentStageId = null;

function isStageUnlocked(stage) {
  if (!stage.unlockAfter) return true;
  const prev = PRACTICE_STAGES.find(s => s.id === stage.unlockAfter);
  if (!prev) return true;
  return prev.challengeIds.every(id => state.completedChallenges.includes(id));
}

function stageProgress(stage) {
  return stage.challengeIds.filter(id => state.completedChallenges.includes(id)).length;
}

function renderPracticeStageMap() {
  document.getElementById('practice-stage-challenges').classList.add('hidden');
  document.getElementById('challenge-panel').classList.remove('open');
  currentStageId = null;

  const container = document.getElementById('practice-stage-map');
  container.classList.remove('hidden');

  const total = CHALLENGES.length;
  const done = state.completedChallenges.length;

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem">
      <div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.3rem">Overall Progress</div>
        <div style="display:flex;align-items:center;gap:0.75rem">
          <div style="width:200px;height:8px;background:var(--bg3);border-radius:4px;overflow:hidden">
            <div style="width:${(done/total)*100}%;height:100%;background:linear-gradient(90deg,var(--accent3),var(--accent));border-radius:4px;transition:width 0.6s"></div>
          </div>
          <span style="font-size:0.85rem;font-weight:700;color:var(--accent)">${done}/${total} solved</span>
        </div>
      </div>
      <div style="font-size:0.85rem;color:var(--text-muted)">⚡ Earn XP by solving challenges</div>
    </div>
    <div class="stage-map">
      ${PRACTICE_STAGES.map((stage, i) => {
        const unlocked = isStageUnlocked(stage);
        const progress = stageProgress(stage);
        const total = stage.challengeIds.length;
        const completed = progress === total;
        const statusClass = !unlocked ? 'stage-locked' : completed ? 'stage-completed' : 'stage-active';
        const badge = !unlocked ? '🔒 Locked' : completed ? '✅ Done' : `${progress}/${total}`;
        const badgeClass = !unlocked ? 'badge-locked' : completed ? 'badge-done' : 'badge-active';
        return `
          ${i > 0 ? '<div class="stage-connector"></div>' : ''}
          <div class="stage-row ${statusClass}"
               style="--stage-color:${stage.color};--stage-color-bg:${stage.colorBg}"
               onclick="${unlocked ? `openStage('${stage.id}')` : `showToast('🔒 Complete Stage ${i} first!','info')`}">
            <div class="stage-num">${stage.icon}</div>
            <div class="stage-info">
              <div class="stage-name">Stage ${stage.num}: ${stage.name}</div>
              <div class="stage-desc">${stage.desc}</div>
              <div class="stage-meta">
                <span class="stage-pill ${completed?'done':''}">${total} challenges</span>
                <div class="stage-progress-mini">
                  ${stage.challengeIds.map(id => `<div class="stage-dot ${state.completedChallenges.includes(id)?'done':id===stage.challengeIds[progress]&&unlocked?'active':''}"></div>`).join('')}
                </div>
              </div>
            </div>
            <span class="stage-badge ${badgeClass}">${badge}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function openStage(stageId) {
  currentStageId = stageId;
  playSound('click');
  _pushNav({ type: 'stage', stageId });
  const stage = PRACTICE_STAGES.find(s => s.id === stageId);
  if (!stage) return;

  document.getElementById('practice-stage-map').classList.add('hidden');
  const stageDiv = document.getElementById('practice-stage-challenges');
  stageDiv.classList.remove('hidden');

  const challenges = stage.challengeIds.map(id => CHALLENGES.find(c => c.id === id)).filter(Boolean);

  stageDiv.innerHTML = `
    <button class="back-btn" onclick="renderPracticeStageMap()">← Back to Stages</button>
    <div class="stage-challenges-header">
      <div class="stage-challenges-icon">${stage.icon}</div>
      <div>
        <div class="stage-challenges-title">Stage ${stage.num}: ${stage.name}</div>
        <div class="stage-challenges-sub">${stage.desc} · ${stageProgress(stage)}/${stage.challengeIds.length} completed</div>
      </div>
    </div>
    <div class="challenges-grid-new">
      ${challenges.map(ch => {
        const solved = state.completedChallenges.includes(ch.id);
        return `
          <div class="ch-card-new ${solved?'ch-solved':''}"
               style="--ch-color:${stage.color}"
               onclick="openChallenge('${ch.id}','${stageId}')">
            <div class="ch-card-top">
              <div class="ch-card-title">${ch.title}</div>
              ${solved ? '<div class="ch-solved-badge">✓</div>' : ''}
            </div>
            <div class="ch-card-scenario">${ch.scenario}</div>
            <div class="ch-card-footer">
              <span class="ch-diff-tag diff-${ch.diff}">${ch.diff}</span>
              <span class="ch-xp-tag">⚡ ${ch.xp} XP</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function openChallenge(id, stageId) {
  const ch = CHALLENGES.find(c => c.id === id);
  const stage = PRACTICE_STAGES.find(s => s.id === stageId);
  if (!ch || !stage) return;
  playSound('click');
  _pushNav({ type: 'challenge', challengeId: id, stageId });

  document.getElementById('practice-stage-challenges').classList.add('hidden');
  const panel = document.getElementById('challenge-panel');
  panel.classList.add('open');

  const solved = state.completedChallenges.includes(id);

  panel.querySelector('#challenge-content').innerHTML = `
    <div class="solver-header">
      <div class="solver-title">${ch.title}</div>
      <div class="solver-meta">
        <span class="ch-diff-tag diff-${ch.diff}">${ch.diff}</span>
        <span class="ch-xp-tag">⚡ ${ch.xp} XP</span>
        ${solved ? '<span style="background:rgba(78,205,196,0.12);color:var(--accent3);padding:0.2rem 0.65rem;border-radius:10px;font-size:0.78rem;font-weight:700">✅ Solved</span>' : ''}
      </div>
    </div>
    <div class="solver-layout">
      <div class="solver-left">
        <!-- Scenario -->
        <div class="solver-card">
          <div class="solver-card-title">🎬 Scenario</div>
          <div class="scenario-box">${ch.scenario}</div>
        </div>
        <!-- Task -->
        <div class="solver-card">
          <div class="solver-card-title">📋 Your Task</div>
          <p>${ch.task}</p>
        </div>
        <!-- Requirements -->
        <div class="solver-card">
          <div class="solver-card-title">✅ Requirements</div>
          <ul>${ch.requirements.map(r => `<li>${r}</li>`).join('')}</ul>
        </div>
        <!-- Test Cases -->
        <div class="solver-card">
          <div class="solver-card-title">🧪 Test Cases</div>
          <div class="test-cases" id="tc-list-${id}">
            ${ch.tests.map((t, i) => `
              <div class="test-case" id="tc-${id}-${i}">
                <span class="test-case-input">${t.input}</span>
                <span class="test-case-status" id="ts-${id}-${i}">⏳</span>
              </div>
            `).join('')}
          </div>
        </div>
        <!-- Hint & Solution -->
        <div class="solver-card">
          <div class="solver-card-title">🛠️ Help</div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
            <button class="hint-toggle-btn" onclick="togglePracticeHint('ph-${id}')">💡 Show Hint</button>
            <button class="solution-toggle-btn" onclick="togglePracticeHint('ps-${id}')">👁 Show Solution</button>
          </div>
          <div class="hint-content" id="ph-${id}">${ch.hint}</div>
          <div class="hint-content" id="ps-${id}" style="border-color:rgba(168,85,247,0.2);background:rgba(168,85,247,0.06)">
            <pre style="font-family:'Fira Code';font-size:0.82rem;white-space:pre-wrap;color:var(--text-muted)">${ch.solution}</pre>
          </div>
        </div>
      </div>
      <div class="solver-right">
        <div class="editor-wrapper">
          <div class="editor-header">
            <span class="editor-label">✏️ Code Editor</span>
            <div class="editor-actions">
              <button class="btn btn-sm btn-primary" onclick="runPracticeChallenge('${id}')">▶ Run & Test</button>
              <button class="btn btn-sm btn-ghost" onclick="resetPracticeChallenge('${id}')">↺ Reset</button>
            </div>
          </div>
          <textarea class="code-editor" id="pe-editor-${id}" spellcheck="false" style="min-height:280px">${ch.starter}</textarea>
          <div class="run-result" id="pe-out-${id}">// Output appears here after running...</div>
        </div>
      </div>
    </div>
  `;
}

function closeChallengePanel(_silent) {
  const stageDiv = document.getElementById('practice-stage-challenges');
  if (currentStageId) {
    stageDiv.classList.remove('hidden');
  } else {
    document.getElementById('practice-stage-map').classList.remove('hidden');
  }
  document.getElementById('challenge-panel').classList.remove('open');
}

document.getElementById('back-to-challenges').addEventListener('click', () => {
  closeChallengePanel(); playSound('click');
});

function togglePracticeHint(id) {
  document.getElementById(id)?.classList.toggle('open');
}

function safeRunCode(code) {
  let logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  let error = null;
  try { new Function(code)(); } catch(e) { error = e.message; }
  console.log = orig;
  return { logs, error };
}

function runPracticeChallenge(id) {
  const ch = CHALLENGES.find(c => c.id === id);
  if (!ch) return;
  const code = document.getElementById(`pe-editor-${id}`)?.value || '';
  const outEl = document.getElementById(`pe-out-${id}`);

  const { logs, error } = safeRunCode(code);

  if (error) {
    outEl.textContent = '❌ Error: ' + error;
    outEl.className = 'run-result error';
    playSound('wrong');
    return;
  }

  // Run tests
  let passCount = 0;
  ch.tests.forEach((t, i) => {
    const tcEl = document.getElementById(`tc-${id}-${i}`);
    const tsEl = document.getElementById(`ts-${id}-${i}`);
    const passed = t.fn(code);
    if (tcEl) tcEl.className = `test-case ${passed ? 'pass' : 'fail'}`;
    if (tsEl) tsEl.textContent = passed ? '✅' : '❌';
    if (passed) passCount++;
  });

  const allPassed = passCount === ch.tests.length;
  outEl.textContent = (logs.length ? logs.join('\n') + '\n\n' : '')
    + (allPassed ? `✅ All ${ch.tests.length} tests passed! Amazing work!` : `⚠️ ${passCount}/${ch.tests.length} tests passed. Keep going!`);
  outEl.className = `run-result ${allPassed ? 'success' : 'error'}`;

  if (allPassed) {
    playSound('success');
    if (!state.completedChallenges.includes(id)) {
      state.completedChallenges.push(id);
      addXP(ch.xp, ch.title);
      saveState();
      showToast(`🎉 "${ch.title}" solved! +${ch.xp} XP`, 'success');
      addConfetti();
      // Re-render stage map dots
      if (currentStageId) openStage(currentStageId);
    }
  } else {
    playSound('wrong');
  }
}

function resetPracticeChallenge(id) {
  const ch = CHALLENGES.find(c => c.id === id);
  if (ch) document.getElementById(`pe-editor-${id}`).value = ch.starter;
}

// Legacy alias kept so init() doesn't break
function renderChallenges() { renderPracticeStageMap(); }

/* ============================================================
   15. GAMES SECTION
============================================================ */
const GAMES_DEF = [
  { id: 'memory',     icon: '🃏', name: 'Memory Match',   desc: 'Match JS keyword pairs — 3 difficulties, 4 themes!',      tag: 'Memory',     color: '#f7c948' },
  { id: 'dragdrop',   icon: '🖱️', name: 'DOM Builder',    desc: '5 levels — drag JS concepts to correct definitions!',     tag: 'DOM Events', color: '#4ecdc4' },
  { id: 'clickspeed', icon: '⚡', name: 'Event Loop',      desc: '3 rounds: click, keydown, mouseover — learn events!',     tag: 'Events',     color: '#ff6b6b' },
  { id: 'debug',      icon: '🐛', name: 'Bug Hunter',      desc: '3 rounds, 21 bugs — syntax, logic & runtime errors!',    tag: 'Debugging',  color: '#a855f7' },
  { id: 'quizgame',   icon: '🏆', name: 'Knowledge Blitz', desc: '10 questions, lifelines, streak multiplier — fast!',      tag: 'All Topics', color: '#50fa7b' },
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
   21. QUIZ SECTION — REVAMPED
============================================================ */

// ---- Rich question bank with difficulty + code snippets ----
const QUIZ_BANK = [
  // EASY
  { id:'q1', topic:'variables', diff:'easy', xp:5,
    q:'Which keyword declares a variable that cannot be reassigned?',
    options:['var','let','const','function'], ans:2,
    exp:'`const` creates a read-only binding. Attempting to reassign it throws a TypeError at runtime.' },
  { id:'q2', topic:'variables', diff:'easy', xp:5,
    q:'What is the scope of a `let` variable declared inside an if-block?',
    options:['Global scope','Function scope','Block scope','Module scope'], ans:2,
    exp:'`let` (and `const`) are block-scoped — they only exist within the {} block they are declared in.' },
  { id:'q3', topic:'datatypes', diff:'easy', xp:5,
    q:'What does `typeof null` return in JavaScript?',
    options:['"null"','"undefined"','"object"','"boolean"'], ans:2,
    exp:'A classic JS quirk — `typeof null` returns "object". This is a historical bug in the language that was never fixed for backward compatibility.' },
  { id:'q4', topic:'datatypes', diff:'easy', xp:5,
    q:'Which of these is NOT a primitive type in JavaScript?',
    options:['String','Number','Array','Boolean'], ans:2,
    exp:'Arrays are objects (reference types), not primitives. The 7 primitives are: String, Number, BigInt, Boolean, Symbol, Null, Undefined.' },
  { id:'q5', topic:'functions', diff:'easy', xp:5,
    q:'What does a function return if there is no `return` statement?',
    options:['0','null','undefined','false'], ans:2,
    exp:'Functions with no return statement implicitly return `undefined`.' },
  { id:'q6', topic:'loops', diff:'easy', xp:5,
    q:'Which loop always executes its body at least once?',
    options:['for','while','do...while','for...of'], ans:2,
    exp:'`do...while` checks the condition AFTER executing the body — so it always runs at least once.' },
  { id:'q7', topic:'arrays', diff:'easy', xp:5,
    q:'Which array method does NOT modify the original array?',
    options:['push()','pop()','map()','splice()'], ans:2,
    exp:'`map()` returns a brand-new array. push, pop, and splice all mutate the original.' },
  { id:'q8', topic:'arrays', diff:'easy', xp:5,
    q:'What does `arr.indexOf("x")` return if "x" is not in the array?',
    options:['0','null','undefined','-1'], ans:3,
    exp:'`indexOf()` returns -1 when the element is not found. This is the standard sentinel value.' },
  { id:'q9', topic:'objects', diff:'easy', xp:5,
    q:'Which notation accesses a property when the key is stored in a variable?',
    options:['obj.key','obj->key','obj[key]','obj::key'], ans:2,
    exp:'Bracket notation `obj[variable]` evaluates the expression inside. Dot notation requires a literal property name.' },
  { id:'q10', topic:'dom', diff:'easy', xp:5,
    q:'Which method returns the FIRST element matching a CSS selector?',
    options:['getElementById()','querySelectorAll()','querySelector()','getElementByClass()'], ans:2,
    exp:'`querySelector()` returns the first matching element or null. `querySelectorAll()` returns a NodeList of all matches.' },

  // MEDIUM
  { id:'q11', topic:'functions', diff:'medium', xp:10,
    q:'Arrow functions differ from regular functions because they:',
    options:['Cannot return values','Have no `this` of their own','Cannot have parameters','Run faster'], ans:1,
    exp:'Arrow functions inherit `this` from the enclosing lexical context. They do not create their own `this` binding — a key difference when used as methods.' },
  { id:'q12', topic:'functions', diff:'medium', xp:10,
    q:'What is a closure?',
    options:['A sealed object','A function that retains access to its outer scope','A way to terminate loops','An ES6 class feature'], ans:1,
    exp:'A closure is a function that "closes over" variables from its outer (enclosing) scope — even after that outer function has returned.' },
  { id:'q13', topic:'arrays', diff:'medium', xp:10,
    q:'What does this code output?\n`[1,2,3].reduce((acc, n) => acc + n, 0)`',
    code:'[1, 2, 3].reduce((acc, n) => acc + n, 0)',
    options:['[1,2,3]','123','6','undefined'], ans:2,
    exp:'`reduce` accumulates values. Starting at 0: 0+1=1, 1+2=3, 3+3=6. The result is 6.' },
  { id:'q14', topic:'objects', diff:'medium', xp:10,
    q:'What does `Object.keys(obj)` return?',
    options:['Object values array','Object methods only','Array of own enumerable property names','An iterator'], ans:2,
    exp:'`Object.keys()` returns an array of a given object\'s own enumerable string-keyed property names.' },
  { id:'q15', topic:'variables', diff:'medium', xp:10,
    q:'What is "hoisting" in JavaScript?',
    options:['Moving imports to top','var/function declarations moved to top of scope','A type coercion','A CSS property'], ans:1,
    exp:'Hoisting means `var` declarations and function declarations are conceptually moved to the top of their scope during compilation — allowing them to be used before they appear in the code.' },
  { id:'q16', topic:'loops', diff:'medium', xp:10,
    q:'Which statement skips the current iteration and moves to the next?',
    options:['break','return','continue','skip'], ans:2,
    exp:'`continue` jumps to the next loop iteration, skipping the rest of the current body. `break` would exit the loop entirely.' },
  { id:'q17', topic:'dom', diff:'medium', xp:10,
    q:'What does `event.stopPropagation()` do?',
    options:['Prevents default action','Stops event bubbling up','Removes the listener','Pauses all JS'], ans:1,
    exp:'`stopPropagation()` prevents the event from bubbling up (or capturing down) to parent elements. It does not affect the default browser action — that is `preventDefault()`.' },
  { id:'q18', topic:'events', diff:'medium', xp:10,
    q:'Which addEventListener option makes a listener fire only once?',
    options:['{ limit: 1 }','{ once: true }','{ single: true }','{ times: 1 }'], ans:1,
    exp:'Passing `{ once: true }` as the third argument to addEventListener automatically removes the listener after it fires once.' },
  { id:'q19', topic:'datatypes', diff:'medium', xp:10,
    q:'What is the result of `"5" + 3` in JavaScript?',
    options:['8','"53"','NaN','TypeError'], ans:1,
    exp:'The `+` operator with a string triggers string concatenation. "5" + 3 → "53". To get 8, you would need `Number("5") + 3` or `+"5" + 3`.' },
  { id:'q20', topic:'functions', diff:'medium', xp:10,
    q:'What does the spread operator `...` do when used in a function call?',
    code:'Math.max(...[1, 5, 3])',
    options:['Creates a copy','Expands iterable into individual args','Merges objects','Destructures'], ans:1,
    exp:'`...arr` in a function call spreads the array elements as individual arguments. `Math.max(...[1,5,3])` is equivalent to `Math.max(1, 5, 3)` → 5.' },

  // HARD
  { id:'q21', topic:'functions', diff:'hard', xp:20,
    q:'What does this code output?',
    code:`function makeCounter() {
  let n = 0;
  return () => ++n;
}
const c = makeCounter();
console.log(c(), c(), c());`,
    options:['0 1 2','1 1 1','1 2 3','undefined'], ans:2,
    exp:'Each call to `c()` increments `n` via closure and returns the new value. n starts at 0 → 1 → 2 → 3.' },
  { id:'q22', topic:'arrays', diff:'hard', xp:20,
    q:'What is the output of this code?',
    code:`const a = [1, 2, 3];
const b = [...a];
b.push(4);
console.log(a.length, b.length);`,
    options:['4 4','3 3','3 4','undefined'], ans:2,
    exp:'`[...a]` creates a shallow copy of the array. Pushing to `b` does not affect `a`. a.length=3, b.length=4.' },
  { id:'q23', topic:'objects', diff:'hard', xp:20,
    q:'What logs to the console?',
    code:`const obj = { x: 1 };
const copy = Object.assign({}, obj);
copy.x = 99;
console.log(obj.x);`,
    options:['99','1','undefined','Error'], ans:1,
    exp:'`Object.assign` creates a shallow copy. Since `x` is a primitive (number), modifying `copy.x` does not affect `obj.x`. It remains 1.' },
  { id:'q24', topic:'variables', diff:'hard', xp:20,
    q:'What is the output?',
    code:`console.log(typeof undeclaredVar);`,
    options:['ReferenceError','"undefined"','"null"','"object"'], ans:1,
    exp:'`typeof` is special — it does NOT throw a ReferenceError for undeclared variables. Instead it returns the string "undefined".' },
  { id:'q25', topic:'dom', diff:'hard', xp:20,
    q:'What is event delegation?',
    options:[
      'Removing event listeners',
      'Listening on a parent to handle events from children',
      'Using setTimeout for events',
      'Preventing default actions'
    ], ans:1,
    exp:'Event delegation attaches a single listener to a parent element and uses `event.target` to detect which child triggered it. Efficient for dynamic lists.' },
  { id:'q26', topic:'functions', diff:'hard', xp:20,
    q:'What does `Function.prototype.bind()` do?',
    options:[
      'Calls the function immediately',
      'Returns a new function with a fixed `this` value',
      'Clones the function object',
      'Makes function async'
    ], ans:1,
    exp:'`bind()` returns a NEW function where `this` is permanently set to the provided value, along with any pre-set arguments. Unlike `call/apply`, it does not invoke the function.' },
];

// ---- Quiz state ----
let quizConfig = { topic: 'all', diff: 'all' };
let activeQuiz = {
  questions: [], idx: 0, score: 0, streak: 0, maxStreak: 0,
  answers: [], timerInterval: null, qStartTime: 0,
};

const QUIZ_UNLOCK_THRESHOLD = 3; // need this many solved challenges

function isQuizUnlocked() {
  return state.completedChallenges.length >= QUIZ_UNLOCK_THRESHOLD;
}

function renderQuizSetup() {
  const lockEl = document.getElementById('quiz-locked');
  const setupEl = document.getElementById('quiz-setup');
  const gameEl = document.getElementById('quiz-game');
  const resultsEl = document.getElementById('quiz-results');

  gameEl.classList.add('hidden');
  resultsEl.classList.add('hidden');

  if (!isQuizUnlocked()) {
    lockEl.classList.remove('hidden');
    setupEl.classList.add('hidden');
    const done = state.completedChallenges.length;
    lockEl.innerHTML = `
      <div class="quiz-lock-card">
        <div class="quiz-lock-icon">🔒</div>
        <div class="quiz-lock-title">Quiz Locked</div>
        <div class="quiz-lock-sub">Solve at least <strong>${QUIZ_UNLOCK_THRESHOLD} Practice challenges</strong> to unlock the Quiz Arena. This ensures you have the fundamentals down first!</div>
        <div class="quiz-lock-progress">
          <div class="quiz-lock-bar-wrap">
            <div class="quiz-lock-bar" style="width:${(done/QUIZ_UNLOCK_THRESHOLD)*100}%"></div>
          </div>
          <span class="quiz-lock-count">${done}/${QUIZ_UNLOCK_THRESHOLD}</span>
        </div>
        <button class="btn btn-primary" onclick="goTo('practice')">Go to Practice ⚡</button>
      </div>
    `;
    return;
  }

  lockEl.classList.add('hidden');
  setupEl.classList.remove('hidden');

  const topicCounts = {};
  QUIZ_BANK.forEach(q => {
    topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
  });
  const allTopics = [
    { id: 'all', name: '🎯 All Topics', count: QUIZ_BANK.length },
    ...TOPICS.map(t => ({ id: t.id, name: `${t.icon} ${t.name}`, count: topicCounts[t.id] || 0 })).filter(t => t.count > 0)
  ];

  setupEl.innerHTML = `
    <div class="quiz-setup-new">
      <div class="quiz-setup-grid">
        <!-- Topic selector -->
        <div class="quiz-config-card">
          <div class="quiz-config-title">📚 Choose Topic</div>
          <div class="quiz-topic-grid">
            ${allTopics.map(t => `
              <button class="quiz-topic-opt ${quizConfig.topic === t.id ? 'selected' : ''}"
                      onclick="setQuizTopic('${t.id}',this)">
                ${t.name}<br><span style="font-size:0.7rem;opacity:0.6">${t.count}q</span>
              </button>
            `).join('')}
          </div>
        </div>
        <!-- Difficulty selector -->
        <div class="quiz-config-card">
          <div class="quiz-config-title">⚔️ Difficulty</div>
          <div class="diff-opts">
            ${[
              { id:'all', icon:'🌟', name:'Mixed', desc:'Easy + Medium + Hard', xp:'5–20 XP/q', color:'#f7c948' },
              { id:'easy', icon:'🌱', name:'Easy', desc:'Fundamentals & basics', xp:'5 XP/q', color:'#4ecdc4' },
              { id:'medium', icon:'⚙️', name:'Medium', desc:'Applied concepts', xp:'10 XP/q', color:'#f7c948' },
              { id:'hard', icon:'🔥', name:'Hard', desc:'Tricky edge cases', xp:'20 XP/q', color:'#ff6b6b' },
            ].map(d => `
              <div class="diff-opt ${quizConfig.diff === d.id ? 'selected' : ''}"
                   style="--diff-color:${d.color}"
                   onclick="setQuizDiff('${d.id}',this)">
                <span class="diff-opt-icon">${d.icon}</span>
                <div class="diff-opt-info">
                  <div class="diff-opt-name">${d.name}</div>
                  <div class="diff-opt-desc">${d.desc}</div>
                </div>
                <span class="diff-opt-xp">${d.xp}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <!-- CTA -->
      <div class="quiz-cta-card">
        <div class="quiz-cta-info">
          <h3>Ready to test yourself?</h3>
          <p>⏱ 20 seconds per question · 🔥 Streak bonuses · ⚡ Earn XP</p>
        </div>
        <button class="btn btn-primary" onclick="startQuiz()" style="white-space:nowrap">Start Quiz ⚡</button>
      </div>
      ${state.quizBestScore > 0 ? `<div style="text-align:center;margin-top:1rem;font-size:0.85rem;color:var(--text-muted)">🏆 Your best score: <strong style="color:var(--accent)">${state.quizBestScore}%</strong></div>` : ''}
    </div>
  `;
}

window.setQuizTopic = function(id, btn) {
  quizConfig.topic = id;
  document.querySelectorAll('.quiz-topic-opt').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
};

window.setQuizDiff = function(id, btn) {
  quizConfig.diff = id;
  document.querySelectorAll('.diff-opt').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
};

function startQuiz() {
  let pool = QUIZ_BANK;
  if (quizConfig.topic !== 'all') pool = pool.filter(q => q.topic === quizConfig.topic);
  if (quizConfig.diff !== 'all') pool = pool.filter(q => q.diff === quizConfig.diff);
  if (!pool.length) { showToast('No questions match that filter!', 'info'); return; }

  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(10, pool.length));
  activeQuiz = { questions: shuffled, idx: 0, score: 0, streak: 0, maxStreak: 0, answers: [], timerInterval: null, qStartTime: 0 };

  document.getElementById('quiz-setup').classList.add('hidden');
  document.getElementById('quiz-results').classList.add('hidden');
  document.getElementById('quiz-game').classList.remove('hidden');
  renderActiveQuestion();
  playSound('click');
}

function renderActiveQuestion() {
  const { questions, idx, score, streak } = activeQuiz;
  if (idx >= questions.length) { endQuiz(); return; }
  const q = questions[idx];
  const pct = (idx / questions.length) * 100;
  const letters = ['A','B','C','D'];
  const TIMER_SECS = 20;

  document.getElementById('quiz-game').innerHTML = `
    <div class="quiz-active-wrap">
      <div class="quiz-hud">
        <div class="hud-item">
          <span class="hud-label">Score</span>
          <span class="hud-value" style="color:var(--accent)">${score}</span>
        </div>
        <div class="hud-item hud-progress">
          <span class="hud-label">${idx+1} / ${questions.length}</span>
          <div class="hud-prog-bar-wrap">
            <div class="hud-prog-bar" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="hud-item">
          <span class="hud-label">⏱ Time</span>
          <span class="hud-value hud-timer" id="q-timer">${TIMER_SECS}</span>
        </div>
        ${streak >= 2 ? `<div class="quiz-streak">🔥 ${streak} streak</div>` : ''}
      </div>

      <div class="quiz-q-card">
        <div class="quiz-q-meta">
          <span class="quiz-q-topic-tag">${q.topic}</span>
          <span class="quiz-q-diff-tag qdiff-${q.diff}">${q.diff}</span>
          <span style="font-size:0.75rem;color:var(--text-muted);margin-left:auto">+${q.xp} XP</span>
        </div>
        <div class="quiz-q-text">${q.q}</div>
        ${q.code ? `<div class="quiz-code-snippet">${q.code}</div>` : ''}
        <div class="quiz-options-grid">
          ${q.options.map((o, i) => `
            <button class="quiz-opt-btn" id="qopt-${i}" onclick="answerActiveQuiz(${i})">
              <span class="quiz-opt-letter">${letters[i]}</span>${o}
            </button>
          `).join('')}
        </div>
        <div class="quiz-feedback-box" id="q-feedback"></div>
        <div class="quiz-q-nav">
          <button class="quiz-q-skip" onclick="skipQuestion()">Skip question →</button>
          <button class="btn btn-primary btn-sm" id="q-next-btn" onclick="nextActiveQuestion()" style="display:none">
            ${idx + 1 < questions.length ? 'Next Question →' : 'See Results 🏆'}
          </button>
        </div>
      </div>
    </div>
  `;

  // Start per-question timer
  if (activeQuiz.timerInterval) clearInterval(activeQuiz.timerInterval);
  let t = TIMER_SECS;
  activeQuiz.qStartTime = Date.now();
  activeQuiz.timerInterval = setInterval(() => {
    t--;
    const el = document.getElementById('q-timer');
    if (el) {
      el.textContent = t;
      if (t <= 5) el.classList.add('danger');
    }
    if (t <= 0) {
      clearInterval(activeQuiz.timerInterval);
      timeOutQuestion();
    }
  }, 1000);
}

window.answerActiveQuiz = function(chosenIdx) {
  clearInterval(activeQuiz.timerInterval);
  const q = activeQuiz.questions[activeQuiz.idx];
  const timeTaken = ((Date.now() - activeQuiz.qStartTime) / 1000).toFixed(1);
  const isCorrect = chosenIdx === q.ans;

  // Disable all options
  document.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = true);
  document.querySelector(`#qopt-${q.ans}`)?.classList.add('opt-correct');
  if (!isCorrect) document.querySelector(`#qopt-${chosenIdx}`)?.classList.add('opt-wrong');

  if (isCorrect) {
    activeQuiz.score += q.xp;
    activeQuiz.streak++;
    activeQuiz.maxStreak = Math.max(activeQuiz.maxStreak, activeQuiz.streak);
    // Streak bonus
    if (activeQuiz.streak >= 3) {
      activeQuiz.score += 5;
      showXPPopup(`🔥 Streak x${activeQuiz.streak}! +5 bonus`);
    }
  } else {
    activeQuiz.streak = 0;
  }

  activeQuiz.answers.push({ q: q.q, chosen: chosenIdx, correct: q.ans, right: isCorrect, exp: q.exp, options: q.options, time: timeTaken, xp: q.xp });

  const fb = document.getElementById('q-feedback');
  if (fb) {
    fb.className = `quiz-feedback-box show ${isCorrect ? 'fb-correct' : 'fb-wrong'}`;
    fb.innerHTML = `
      <div class="fb-head ${isCorrect ? 'fb-correct-head' : 'fb-wrong-head'}">
        ${isCorrect ? '✅ Correct!' : '❌ Not quite!'} ${isCorrect && activeQuiz.streak >= 3 ? '🔥 Streak bonus!' : ''}
      </div>
      <div class="fb-explanation">${q.exp}</div>
    `;
  }

  const nb = document.getElementById('q-next-btn');
  if (nb) nb.style.display = 'block';

  playSound(isCorrect ? 'success' : 'wrong');
};

function skipQuestion() {
  clearInterval(activeQuiz.timerInterval);
  const q = activeQuiz.questions[activeQuiz.idx];
  activeQuiz.streak = 0;
  activeQuiz.answers.push({ q: q.q, chosen: -1, correct: q.ans, right: false, exp: q.exp, options: q.options, time: '—', xp: q.xp, skipped: true });
  activeQuiz.idx++;
  renderActiveQuestion();
}

function timeOutQuestion() {
  const q = activeQuiz.questions[activeQuiz.idx];
  document.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = true);
  document.querySelector(`#qopt-${q.ans}`)?.classList.add('opt-correct');
  activeQuiz.streak = 0;
  activeQuiz.answers.push({ q: q.q, chosen: -1, correct: q.ans, right: false, exp: q.exp, options: q.options, time: '⏱', xp: q.xp, timed_out: true });

  const fb = document.getElementById('q-feedback');
  if (fb) {
    fb.className = 'quiz-feedback-box show fb-wrong';
    fb.innerHTML = `<div class="fb-head fb-wrong-head">⏱ Time's up!</div><div class="fb-explanation">${q.exp}</div>`;
  }
  const nb = document.getElementById('q-next-btn');
  if (nb) nb.style.display = 'block';
  playSound('wrong');
}

window.nextActiveQuestion = function() {
  activeQuiz.idx++;
  renderActiveQuestion();
  playSound('click');
};

function endQuiz() {
  clearInterval(activeQuiz.timerInterval);
  const { questions, score, answers, maxStreak } = activeQuiz;
  const correct = answers.filter(a => a.right).length;
  const pct = Math.round((correct / questions.length) * 100);
  const maxXP = questions.reduce((s, q) => s + q.xp, 0);

  if (pct > (state.quizBestScore || 0)) {
    state.quizBestScore = pct;
  }
  state.quizTotalPlayed = (state.quizTotalPlayed || 0) + 1;
  saveState();
  addXP(score, 'Quiz');

  const grade = pct === 100 ? 'Perfect! 🏆' : pct >= 80 ? 'Excellent! 🎉' : pct >= 60 ? 'Good Job! 👍' : pct >= 40 ? 'Keep Going! 💪' : 'Study More! 📖';
  const ringColor = pct >= 80 ? '#4ecdc4' : pct >= 60 ? '#f7c948' : '#ff6b6b';
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (pct / 100) * circumference;

  document.getElementById('quiz-game').classList.add('hidden');
  document.getElementById('quiz-results').classList.remove('hidden');
  document.getElementById('quiz-results').innerHTML = `
    <div class="quiz-results-new">
      <div class="results-hero">
        <div class="results-ring">
          <svg viewBox="0 0 100 100">
            <circle class="ring-track" cx="50" cy="50" r="44"/>
            <circle class="ring-fill" cx="50" cy="50" r="44"
              stroke="${ringColor}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${dashOffset}"
            />
          </svg>
          <div class="ring-label">
            <span class="ring-pct" style="color:${ringColor}">${pct}%</span>
            <span class="ring-sub">accuracy</span>
          </div>
        </div>
        <div class="results-grade">${grade}</div>
        <div class="results-msg">${correct} correct out of ${questions.length} questions</div>
        <div class="results-stats-row">
          <div class="r-stat"><div class="r-stat-val" style="color:var(--accent)">⚡ ${score}</div><div class="r-stat-lbl">XP Earned</div></div>
          <div class="r-stat"><div class="r-stat-val" style="color:var(--accent3)">${correct}</div><div class="r-stat-lbl">Correct</div></div>
          <div class="r-stat"><div class="r-stat-val" style="color:var(--accent2)">${questions.length - correct}</div><div class="r-stat-lbl">Wrong/Skip</div></div>
          <div class="r-stat"><div class="r-stat-val" style="color:var(--accent4)">${maxStreak}🔥</div><div class="r-stat-lbl">Best Streak</div></div>
        </div>
        ${maxStreak >= 3 ? `<div class="streak-achieved">🔥 ${maxStreak}-answer streak achieved!</div>` : ''}
        <div class="results-actions" style="margin-top:1.5rem">
          <button class="btn btn-primary" onclick="startQuiz()">Play Again ↺</button>
          <button class="btn btn-ghost" onclick="renderQuizSetup()">Change Settings</button>
        </div>
      </div>
      <div class="results-breakdown-new">
        <div class="breakdown-header">📋 Answer Breakdown</div>
        ${answers.map((a, i) => `
          <div class="breakdown-item">
            <span class="bd-icon">${a.right ? '✅' : a.skipped ? '⏭️' : a.timed_out ? '⏱' : '❌'}</span>
            <div style="flex:1">
              <div class="bd-q">${i+1}. ${a.q}</div>
              <div class="bd-detail">
                ${a.right
                  ? `<span class="correct-ans">✓ ${a.options[a.correct]}</span>`
                  : a.skipped
                    ? `Skipped · <span class="correct-ans">Answer: ${a.options[a.correct]}</span>`
                    : `<span class="your-ans">You: ${a.options[a.chosen] || '—'}</span> · <span class="correct-ans">Correct: ${a.options[a.correct]}</span>`
                }
              </div>
              <div class="bd-detail" style="margin-top:0.2rem;font-style:italic">${a.exp}</div>
            </div>
            <span class="bd-time">${a.time}s</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  updateDashboard();
  if (pct === 100) addConfetti();
  else if (pct >= 70) playSound('complete');
}

/* ============================================================
   22. INIT
   Called by firebase.js once auth state is known (user logged in)
   Also bootstraps particle canvas and typing animation immediately.
============================================================ */
function init() {
  loadState();
  window.state = state; // keep window.state in sync after loadState
  renderTopics();
  renderPracticeStageMap();
  renderGamesGrid();
  renderQuizSetup();
  updateDashboard();
  checkAchievements();

  document.querySelectorAll('.topic-card, .game-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      el.style.opacity = '';
      el.style.transform = '';
    }, 100 + i * 50);
  });
}
window.init = init;

// Particles + typing run immediately (they render on the auth screen too)
document.addEventListener('DOMContentLoaded', () => {
  // These are already defined as IIFEs above and run immediately,
  // but we ensure the canvas is visible on the auth screen
  const canvas = document.getElementById('particles-canvas');
  if (canvas) canvas.style.zIndex = '0';
});