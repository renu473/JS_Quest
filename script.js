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
<<<<<<< HEAD
  saveStateLocal();
=======
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  // Sync to Firestore (non-blocking, defined in firebase.js)
>>>>>>> 50885d639fc7beb3e55c1a60f11acd0f2a1260b9
  if (typeof window.saveUserToFirestore === 'function') {
    window.saveUserToFirestore().catch(() => {});
  }
}
window.saveState = saveState;

<<<<<<< HEAD
// saveStateLocal — localStorage only, no Firestore upload
// Called by firebase.js after cloud data is loaded (avoids loop)
function saveStateLocal() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch(_) {}
}
window.saveStateLocal = saveStateLocal;

=======
>>>>>>> 50885d639fc7beb3e55c1a60f11acd0f2a1260b9
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
   2. NAVIGATION
============================================================ */
let currentSection = 'home';

function goTo(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const secEl = document.getElementById(section);
  if (secEl) secEl.classList.add('active');
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
  currentSection = section;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  closeConceptPanel();
  closeChallengePanel();
  closeGameArena();

  if (section === 'home')        updateDashboard();
  if (section === 'quiz')        renderQuizSetup();
  if (section === 'leaderboard' && typeof window.renderLeaderboard === 'function') {
    window.renderLeaderboard();
  }
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
<<<<<<< HEAD
  const el = document.getElementById('typing-code-app') || document.getElementById('typing-code');
=======
  const el = document.getElementById('typing-code');
>>>>>>> 50885d639fc7beb3e55c1a60f11acd0f2a1260b9
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

function closeConceptPanel() {
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

function closeChallengePanel() {
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
  { id: 'memory', icon: '🃏', name: 'Memory Match', desc: 'Match pairs of JS keywords. Tests your memory!', tag: 'Arrays & DOM', color: '#f7c948' },
  { id: 'dragdrop', icon: '🖱️', name: 'Drag & Drop', desc: 'Drag JS concepts to their definitions.', tag: 'DOM Events', color: '#4ecdc4' },
  { id: 'clickspeed', icon: '⚡', name: 'Click Speed', desc: 'Click as fast as you can in 10 seconds!', tag: 'Events', color: '#ff6b6b' },
  { id: 'debug', icon: '🐛', name: 'Debug the Code', desc: 'Find and fix the bugs in broken JS code.', tag: 'Debugging', color: '#a855f7' },
  { id: 'quizgame', icon: '🏆', name: 'Speed Quiz', desc: 'Answer JS questions as fast as possible!', tag: 'All Topics', color: '#50fa7b' },
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

function openGame(id) {
  playSound('click');
  document.getElementById('games-grid').style.display = 'none';
  const arena = document.getElementById('game-arena');
  arena.classList.add('open');
  const content = document.getElementById('game-content');

  switch(id) {
    case 'memory': renderMemoryGame(content); break;
    case 'dragdrop': renderDragDrop(content); break;
    case 'clickspeed': renderClickSpeed(content); break;
    case 'debug': renderDebugGame(content); break;
    case 'quizgame': renderSpeedQuiz(content); break;
  }
}

function closeGameArena() {
  document.getElementById('games-grid').style.display = '';
  document.getElementById('game-arena').classList.remove('open');
  document.getElementById('game-content').innerHTML = '';
}

document.getElementById('back-to-games').addEventListener('click', () => {
  closeGameArena(); playSound('click');
});

/* ============================================================
   16. GAME: MEMORY MATCH
============================================================ */
function renderMemoryGame(container) {
  const words = ['let', 'const', 'function', 'array', 'object', 'loop', 'event', 'DOM'];
  const cards = [...words, ...words].sort(() => Math.random() - 0.5);
  let flipped = [], matched = 0, moves = 0, canFlip = true;

  container.innerHTML = `
    <div class="game-wrapper">
      <div class="game-title">🃏 Memory Match</div>
      <div class="game-subtitle">Find all matching pairs of JavaScript keywords!</div>
      <div class="game-score-bar">
        <div class="score-item"><span class="score-label">Moves</span><span class="score-value" id="mem-moves">0</span></div>
        <div class="score-item"><span class="score-label">Matched</span><span class="score-value" id="mem-matched">0/8</span></div>
      </div>
      <div class="memory-grid" id="mem-grid"></div>
    </div>
  `;

  const grid = document.getElementById('mem-grid');
  cards.forEach((word, i) => {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.innerHTML = `<div class="memory-inner"><div class="memory-front">?</div><div class="memory-back">${word}</div></div>`;
    card.addEventListener('click', () => {
      if (!canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) return;
      card.classList.add('flipped');
      flipped.push({ card, word });
      playSound('click');

      if (flipped.length === 2) {
        canFlip = false;
        moves++;
        document.getElementById('mem-moves').textContent = moves;
        if (flipped[0].word === flipped[1].word) {
          flipped.forEach(f => f.card.classList.add('matched'));
          matched++;
          document.getElementById('mem-matched').textContent = `${matched}/8`;
          flipped = []; canFlip = true;
          playSound('success');
          if (matched === 8) {
            setTimeout(() => {
              addXP(30, 'Memory Game');
              showToast(`🎉 Memory game completed in ${moves} moves!`, 'success');
              addConfetti();
            }, 300);
          }
        } else {
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
}

/* ============================================================
   17. GAME: DRAG & DROP
============================================================ */
function renderDragDrop(container) {
  const pairs = [
    { term: 'querySelector()', def: 'Selects HTML element' },
    { term: 'addEventListener()', def: 'Listens for events' },
    { term: 'console.log()', def: 'Prints to console' },
    { term: 'Array.map()', def: 'Transforms each item' },
    { term: 'typeof', def: 'Checks data type' },
  ];
  const shuffledTerms = [...pairs].sort(() => Math.random() - 0.5);

  container.innerHTML = `
    <div class="game-wrapper">
      <div class="game-title">🖱️ Drag & Drop</div>
      <div class="game-subtitle">Drag each JavaScript term to its correct definition!</div>
      <div class="game-score-bar">
        <div class="score-item"><span class="score-label">Correct</span><span class="score-value" id="dd-score">0</span></div>
        <div class="score-item"><span class="score-label">Total</span><span class="score-value">5</span></div>
      </div>
      <div class="drag-container">
        <div>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.75rem">📦 Terms (drag these)</p>
          <div class="drag-items-pool" id="drag-pool">
            ${shuffledTerms.map(p => `<div class="drag-item" draggable="true" data-term="${p.term}">${p.term}</div>`).join('')}
          </div>
        </div>
        <div>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.75rem">🎯 Definitions (drop here)</p>
          <div class="drag-targets">
            ${pairs.map(p => `
              <div class="drop-target" data-correct="${p.term}">
                <span class="target-label">${p.def}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" style="margin-top:1rem" onclick="resetDragDrop()">↺ Reset</button>
    </div>
  `;

  let draggedTerm = null;

  document.querySelectorAll('.drag-item').forEach(item => {
    item.addEventListener('dragstart', e => { draggedTerm = item.dataset.term; item.classList.add('dragging'); });
    item.addEventListener('dragend', () => item.classList.remove('dragging'));
  });

  document.querySelectorAll('.drop-target').forEach(target => {
    target.addEventListener('dragover', e => { e.preventDefault(); target.classList.add('over'); });
    target.addEventListener('dragleave', () => target.classList.remove('over'));
    target.addEventListener('drop', e => {
      e.preventDefault();
      target.classList.remove('over');
      if (!draggedTerm || target.classList.contains('correct')) return;
      const isCorrect = target.dataset.correct === draggedTerm;
      if (isCorrect) {
        target.classList.add('correct');
        target.innerHTML = `<span style="color:var(--accent3);font-family:Fira Code;font-size:0.85rem">${draggedTerm}</span><span style="margin-left:auto">✅</span><span class="target-label" style="color:var(--text-muted);font-size:0.8rem;display:block;margin-top:0.25rem">${target.querySelector('.target-label').textContent}</span>`;
        // Remove dragged item
        document.querySelector(`.drag-item[data-term="${draggedTerm}"]`)?.remove();
        const s = parseInt(document.getElementById('dd-score').textContent) + 1;
        document.getElementById('dd-score').textContent = s;
        playSound('success');
        if (s === 5) { setTimeout(() => { addXP(25, 'Drag & Drop'); showToast('🎉 All matched! Amazing!', 'success'); addConfetti(); }, 300); }
      } else {
        target.classList.add('wrong');
        playSound('wrong');
        setTimeout(() => target.classList.remove('wrong'), 800);
      }
    });
  });
}

function resetDragDrop() {
  renderDragDrop(document.getElementById('game-content'));
}

/* ============================================================
   18. GAME: CLICK SPEED
============================================================ */
function renderClickSpeed(container) {
  let count = 0, interval = null, running = false;

  container.innerHTML = `
    <div class="game-wrapper">
      <div class="game-title">⚡ Click Speed</div>
      <div class="game-subtitle">Click the button as many times as possible in 10 seconds!</div>
      <div class="click-game-area">
        <div class="click-timer" id="cs-timer">10</div>
        <button class="click-target" id="cs-btn" onclick="handleClickSpeed()">⚡</button>
        <div class="click-count" id="cs-count">0 clicks</div>
        <div id="cs-result" style="margin-top:1rem;font-size:1.1rem;font-weight:600"></div>
      </div>
    </div>
  `;

  window.handleClickSpeed = function() {
    if (!running) {
      running = true;
      let t = 10;
      interval = setInterval(() => {
        t--;
        document.getElementById('cs-timer').textContent = t;
        if (t <= 0) {
          clearInterval(interval);
          running = false;
          document.getElementById('cs-btn').disabled = true;
          const cps = (count / 10).toFixed(1);
          document.getElementById('cs-result').textContent = `🏁 Done! ${count} clicks @ ${cps}/sec`;
          addXP(10, 'Click Speed');
          playSound('complete');
        }
      }, 1000);
    }
    if (running) {
      count++;
      document.getElementById('cs-count').textContent = `${count} clicks`;
      document.getElementById('cs-btn').style.transform = 'scale(0.92)';
      setTimeout(() => { const b = document.getElementById('cs-btn'); if(b) b.style.transform = 'scale(1)'; }, 80);
      playSound('click');
    }
  };
}

/* ============================================================
   19. GAME: DEBUG THE CODE
============================================================ */
const DEBUG_CHALLENGES = [
  {
    title: 'Fix the function',
    buggy: `function greet(name) {\n  return "Hello, " + Name;\n}`,
    fixed: `function greet(name) {\n  return "Hello, " + name;\n}`,
    hint: 'Variable names are case-sensitive. Check the parameter name.',
    test: code => { try { const fn = new Function(code + '; return greet("World")==="Hello, World";'); return fn(); } catch(e) { return false; } }
  },
  {
    title: 'Fix the loop',
    buggy: `let sum = 0;\nfor (let i = 1; i <= 5; i++) {\n  sum = sum + i\n}\nconsole.log(sum);`,
    fixed: `let sum = 0;\nfor (let i = 1; i <= 5; i++) {\n  sum = sum + i;\n}\nconsole.log(sum);`,
    hint: 'Look for a missing semicolon inside the loop body.',
    test: code => { try { let logs = []; const orig = console.log; console.log = v => logs.push(String(v)); new Function(code)(); console.log = orig; return logs.includes('15'); } catch(e) { return false; } }
  },
  {
    title: 'Fix the array method',
    buggy: `const nums = [1, 2, 3, 4, 5];\nconst doubled = nums.Map(n => n * 2);\nconsole.log(doubled);`,
    fixed: `const nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2);\nconsole.log(doubled);`,
    hint: 'Array methods are lowercase. Check the method name.',
    test: code => { try { let logs = []; const orig = console.log; console.log = v => logs.push(JSON.stringify(v)); new Function(code)(); console.log = orig; return logs[0] === '[2,4,6,8,10]'; } catch(e) { return false; } }
  },
];

let debugIdx = 0;

function renderDebugGame(container) {
  debugIdx = 0;
  renderDebugChallenge(container);
}

function renderDebugChallenge(container) {
  const ch = DEBUG_CHALLENGES[debugIdx];
  container.innerHTML = `
    <div class="game-wrapper">
      <div class="game-title">🐛 Debug the Code</div>
      <div class="game-subtitle">Challenge ${debugIdx+1}/${DEBUG_CHALLENGES.length}: ${ch.title}</div>
      <div class="game-score-bar">
        <div class="score-item"><span class="score-label">Challenge</span><span class="score-value">${debugIdx+1}/${DEBUG_CHALLENGES.length}</span></div>
      </div>
      <div class="debug-game">
        <div class="debug-code-area">
          <div class="debug-instructions">🐛 There's a bug in this code — find it and fix it!</div>
          <textarea class="debug-editor" id="debug-editor" spellcheck="false">${ch.buggy}</textarea>
        </div>
        <div class="output-panel" id="debug-out">// Click "Run & Check" to test your fix...</div>
        <div class="debug-controls">
          <button class="btn btn-primary btn-sm" onclick="checkDebug()">▶ Run & Check</button>
          <button class="btn btn-ghost btn-sm" onclick="showDebugHint()">💡 Hint</button>
          <button class="btn btn-ghost btn-sm" onclick="resetDebug()">↺ Reset</button>
        </div>
        <div id="debug-hint" style="display:none;padding:1rem;background:rgba(247,201,72,0.06);border:1px solid rgba(247,201,72,0.2);border-radius:10px;font-size:0.88rem;color:var(--text-muted)">
          💡 ${ch.hint}
        </div>
      </div>
    </div>
  `;
}

window.checkDebug = function() {
  const code = document.getElementById('debug-editor')?.value || '';
  const out = document.getElementById('debug-out');
  const ch = DEBUG_CHALLENGES[debugIdx];
  let logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  try {
    new Function(code)();
    const passed = ch.test(code);
    out.className = `output-panel ${passed ? '' : 'error'}`;
    out.textContent = (logs.length ? logs.join('\n') + '\n' : '') + (passed ? '✅ Bug fixed! Well done!' : '❌ Not quite right. Try again!');
    if (passed) {
      playSound('success');
      addXP(20, 'Debug Challenge');
      setTimeout(() => {
        debugIdx++;
        if (debugIdx < DEBUG_CHALLENGES.length) {
          showToast('🎉 Fixed! Moving to next bug...', 'success');
          renderDebugChallenge(document.getElementById('game-content'));
        } else {
          showToast('🏆 All bugs squashed!', 'success');
          addConfetti();
          document.getElementById('game-content').innerHTML += '<div style="text-align:center;margin-top:1.5rem;font-size:1.2rem;font-weight:700;color:var(--accent)">🎉 Debug Master! All challenges complete!</div>';
        }
      }, 1200);
    } else {
      playSound('wrong');
    }
  } catch(e) {
    out.textContent = '❌ Error: ' + e.message;
    out.className = 'output-panel error';
    playSound('wrong');
  }
  console.log = orig;
};

window.showDebugHint = function() {
  const h = document.getElementById('debug-hint');
  if (h) h.style.display = h.style.display === 'none' ? 'block' : 'none';
};

window.resetDebug = function() {
  const ch = DEBUG_CHALLENGES[debugIdx];
  const ed = document.getElementById('debug-editor');
  if (ed) ed.value = ch.buggy;
};

/* ============================================================
   20. GAME: SPEED QUIZ
============================================================ */
const SPEED_QUESTIONS = [
  { q: 'What keyword declares a block-scoped variable?', options: ['var','let','define','int'], ans: 1 },
  { q: 'Which method adds to the end of an array?', options: ['push()','pop()','shift()','add()'], ans: 0 },
  { q: 'What does typeof [] return?', options: ['"array"','"object"','"list"','"null"'], ans: 1 },
  { q: 'Which is the arrow function syntax?', options: ['function=>','fn()=>','=>fn','(x) => x'], ans: 3 },
  { q: 'What does === check?', options: ['Value only','Type only','Value and type','Assignment'], ans: 2 },
];

function renderSpeedQuiz(container) {
  let qIdx = 0, score = 0, timers = [];

  function renderQ() {
    if (qIdx >= SPEED_QUESTIONS.length) {
      container.innerHTML = `<div class="game-wrapper" style="text-align:center">
        <div class="game-title">Speed Quiz Done!</div>
        <div class="results-score">${score}/${SPEED_QUESTIONS.length}</div>
        <div class="results-sub">${score === SPEED_QUESTIONS.length ? '🏆 Perfect Score!' : score > 2 ? '👍 Good job!' : '📖 Keep studying!'}</div>
        <button class="btn btn-primary" onclick="openGame('quizgame')">Play Again</button>
      </div>`;
      addXP(score * 5, 'Speed Quiz');
      if (score === SPEED_QUESTIONS.length) addConfetti();
      return;
    }
    const q = SPEED_QUESTIONS[qIdx];
    container.innerHTML = `<div class="game-wrapper">
      <div class="game-title">⚡ Speed Quiz</div>
      <div class="game-score-bar">
        <div class="score-item"><span class="score-label">Score</span><span class="score-value">${score}</span></div>
        <div class="score-item"><span class="score-label">Question</span><span class="score-value">${qIdx+1}/${SPEED_QUESTIONS.length}</span></div>
        <div class="score-item"><span class="score-label">Time</span><span class="score-value" id="sq-timer">10</span></div>
      </div>
      <div class="quiz-question" style="font-size:1.1rem;margin-bottom:1.5rem">${q.q}</div>
      <div class="quiz-options">
        ${q.options.map((o, i) => `<button class="quiz-option" onclick="answerSQ(${i})">${o}</button>`).join('')}
      </div>
    </div>`;

    let t = 10;
    const iv = setInterval(() => {
      t--;
      const te = document.getElementById('sq-timer');
      if (te) te.textContent = t;
      if (t <= 0) { clearInterval(iv); qIdx++; renderQ(); }
    }, 1000);
    timers.push(iv);

    window.answerSQ = function(idx) {
      timers.forEach(clearInterval); timers = [];
      const opts = document.querySelectorAll('.quiz-option');
      opts.forEach((o, i) => { o.disabled = true; if (i === q.ans) o.classList.add('correct'); });
      if (idx === q.ans) { score++; playSound('success'); opts[idx].classList.add('correct'); }
      else { opts[idx].classList.add('wrong'); playSound('wrong'); }
      setTimeout(() => { qIdx++; renderQ(); }, 1000);
    };
  }
  renderQ();
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
