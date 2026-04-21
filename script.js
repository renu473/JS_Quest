/**
 * JS Quest — Main Script
 * Interactive JavaScript Learning Platform
 * Sections: Home, Learn, Practice, Games, Quiz
 */

/* ============================================================
   1. STATE & PROGRESS (localStorage backed)
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

function loadState() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) state = { ...state, ...JSON.parse(saved) };
  } catch (e) {}
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

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
  document.getElementById(section).classList.add('active');
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
  currentSection = section;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Close panels when navigating
  closeConceptPanel();
  closeChallengePanel();
  closeGameArena();

  if (section === 'home') updateDashboard();
  if (section === 'quiz') renderQuizSetup();
}

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
  const el = document.getElementById('typing-code');
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
  { id: 'first_topic', icon: '📖', name: 'First Steps', desc: 'Complete your first topic', check: s => s.completedTopics.length >= 1 },
  { id: 'all_topics', icon: '🎓', name: 'Scholar', desc: 'Complete all 8 topics', check: s => s.completedTopics.length >= 8 },
  { id: 'first_challenge', icon: '💪', name: 'Code Warrior', desc: 'Solve your first challenge', check: s => s.completedChallenges.length >= 1 },
  { id: 'all_challenges', icon: '🏆', name: 'Challenge Master', desc: 'Solve all 12 challenges', check: s => s.completedChallenges.length >= 12 },
  { id: 'quiz_100', icon: '🧠', name: 'Quiz Genius', desc: 'Score 100% in a quiz', check: s => s.quizBestScore >= 100 },
  { id: 'xp_100', icon: '⚡', name: 'XP Collector', desc: 'Earn 100 XP', check: s => s.xp >= 100 },
  { id: 'xp_500', icon: '🌟', name: 'XP Legend', desc: 'Earn 500 XP', check: s => s.xp >= 500 },
  { id: 'level_3', icon: '🚀', name: 'Level Up!', desc: 'Reach Level 3', check: s => s.level >= 3 },
];

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
  const chPct = (state.completedChallenges.length / 12) * 100;
  setBar('pb-challenges', chPct);
  setText('pct-challenges', `${state.completedChallenges.length} / 12`);

  // quiz
  setBar('pb-quiz', state.quizBestScore || 0);
  setText('pct-quiz', `${state.quizBestScore || 0}%`);

  // xp
  const xpPct = Math.min((state.xp / 500) * 100, 100);
  setBar('pb-xp', xpPct);
  setText('pct-xp', `${state.xp} / 500 XP`);

  // level
  const lb = document.getElementById('level-badge');
  if (lb) lb.textContent = `Level ${state.level}`;

  renderAchievements();
  updateNavXP();
}

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
   13. PRACTICE — CHALLENGES DATA
============================================================ */
const CHALLENGES = [
  {
    id: 'ch1', num: '#01', diff: 'easy', title: 'Hello World',
    desc: 'Write a function that returns "Hello, World!"',
    task: 'Create a function called `hello` that returns the string "Hello, World!"',
    requirements: ['Function is named `hello`', 'Returns "Hello, World!" exactly', 'No parameters needed'],
    tags: ['functions', 'strings'],
    hint: 'Use the `return` keyword inside your function to send back a value.',
    solution: `function hello() {\n  return "Hello, World!";\n}\nconsole.log(hello());`,
    starter: `function hello() {\n  // your code here\n}\n\nconsole.log(hello()); // should print "Hello, World!"`,
    test: code => { try { const fn = new Function(code + '; return hello();'); return fn() === 'Hello, World!'; } catch(e) { return false; } }
  },
  {
    id: 'ch2', num: '#02', diff: 'easy', title: 'Sum of Two Numbers',
    desc: 'Create a function that adds two numbers together',
    task: 'Write a function called `sum` that takes two numbers and returns their sum.',
    requirements: ['Function named `sum`', 'Takes two parameters', 'Returns the sum'],
    tags: ['functions', 'math'],
    hint: 'Use the `+` operator to add two values.',
    solution: `function sum(a, b) {\n  return a + b;\n}\nconsole.log(sum(3, 7)); // 10`,
    starter: `function sum(a, b) {\n  // your code here\n}\n\nconsole.log(sum(3, 7));  // should print 10\nconsole.log(sum(10, 5)); // should print 15`,
    test: code => { try { const fn = new Function(code + '; return sum(3,7) === 10 && sum(10,5) === 15;'); return fn(); } catch(e) { return false; } }
  },
  {
    id: 'ch3', num: '#03', diff: 'easy', title: 'Even or Odd?',
    desc: 'Determine if a number is even or odd',
    task: 'Write a function `isEven(n)` that returns true if n is even, false if odd.',
    requirements: ['Function named `isEven`', 'Uses modulo operator %', 'Returns a boolean'],
    tags: ['functions', 'conditionals'],
    hint: 'A number is even if `n % 2 === 0`.',
    solution: `function isEven(n) {\n  return n % 2 === 0;\n}\nconsole.log(isEven(4)); // true\nconsole.log(isEven(7)); // false`,
    starter: `function isEven(n) {\n  // your code here\n}\n\nconsole.log(isEven(4)); // true\nconsole.log(isEven(7)); // false\nconsole.log(isEven(0)); // true`,
    test: code => { try { const fn = new Function(code + '; return isEven(4)===true && isEven(7)===false;'); return fn(); } catch(e) { return false; } }
  },
  {
    id: 'ch4', num: '#04', diff: 'easy', title: 'Reverse a String',
    desc: 'Return a string in reverse order',
    task: 'Write a function `reverseStr(s)` that returns the string reversed.',
    requirements: ['Function named `reverseStr`', 'Returns reversed string', 'Handle empty string'],
    tags: ['strings', 'arrays'],
    hint: 'Try: split("") → reverse() → join("")',
    solution: `function reverseStr(s) {\n  return s.split("").reverse().join("");\n}\nconsole.log(reverseStr("hello")); // "olleh"`,
    starter: `function reverseStr(s) {\n  // your code here\n}\n\nconsole.log(reverseStr("hello")); // "olleh"\nconsole.log(reverseStr("JS"));    // "SJ"`,
    test: code => { try { const fn = new Function(code + '; return reverseStr("hello")==="olleh";'); return fn(); } catch(e) { return false; } }
  },
  {
    id: 'ch5', num: '#05', diff: 'easy', title: 'Count Items',
    desc: 'Count how many items are in an array',
    task: 'Write `countItems(arr)` that returns the length of an array.',
    requirements: ['Function named `countItems`', 'Returns a number', 'Use .length property'],
    tags: ['arrays'],
    hint: 'Arrays have a `.length` property.',
    solution: `function countItems(arr) {\n  return arr.length;\n}\nconsole.log(countItems([1,2,3])); // 3`,
    starter: `function countItems(arr) {\n  // your code here\n}\n\nconsole.log(countItems([1,2,3]));       // 3\nconsole.log(countItems(["a","b"]));    // 2\nconsole.log(countItems([]));           // 0`,
    test: code => { try { const fn = new Function(code + '; return countItems([1,2,3])===3 && countItems([])=== 0;'); return fn(); } catch(e) { return false; } }
  },
  {
    id: 'ch6', num: '#06', diff: 'easy', title: 'Find Maximum',
    desc: 'Find the largest number in an array',
    task: 'Write `findMax(arr)` that returns the largest number from an array.',
    requirements: ['Function named `findMax`', 'Works with any array of numbers', 'Returns a number'],
    tags: ['arrays', 'math'],
    hint: 'Try `Math.max(...arr)` or use reduce().',
    solution: `function findMax(arr) {\n  return Math.max(...arr);\n}\nconsole.log(findMax([1,5,3,9,2])); // 9`,
    starter: `function findMax(arr) {\n  // your code here\n}\n\nconsole.log(findMax([1,5,3,9,2])); // 9\nconsole.log(findMax([10,2,30,4])); // 30`,
    test: code => { try { const fn = new Function(code + '; return findMax([1,5,3,9,2])===9;'); return fn(); } catch(e) { return false; } }
  },
  {
    id: 'ch7', num: '#07', diff: 'medium', title: 'FizzBuzz',
    desc: 'Classic interview problem with loops',
    task: 'Write `fizzBuzz(n)` that returns an array of strings 1 to n. For multiples of 3: "Fizz", 5: "Buzz", both: "FizzBuzz", else the number as string.',
    requirements: ['Returns an array', 'Multiples of 3 → "Fizz"', 'Multiples of 5 → "Buzz"', 'Both → "FizzBuzz"'],
    tags: ['loops', 'conditionals'],
    hint: 'Check for FizzBuzz first (divisible by BOTH 3 AND 5), then check individually.',
    solution: `function fizzBuzz(n) {\n  const result = [];\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) result.push("FizzBuzz");\n    else if (i % 3 === 0) result.push("Fizz");\n    else if (i % 5 === 0) result.push("Buzz");\n    else result.push(String(i));\n  }\n  return result;\n}\nconsole.log(fizzBuzz(15));`,
    starter: `function fizzBuzz(n) {\n  // your code here\n}\n\nconsole.log(fizzBuzz(15));\n// Expected: ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]`,
    test: code => { try { const fn = new Function(code + '; const r=fizzBuzz(15); return r[2]==="Fizz"&&r[4]==="Buzz"&&r[14]==="FizzBuzz";'); return fn(); } catch(e) { return false; } }
  },
  {
    id: 'ch8', num: '#08', diff: 'medium', title: 'Palindrome Check',
    desc: 'Check if a string reads the same backwards',
    task: 'Write `isPalindrome(s)` that returns true if the string is a palindrome (ignore case).',
    requirements: ['Case insensitive comparison', 'Returns boolean', '"racecar" → true'],
    tags: ['strings', 'arrays'],
    hint: 'Convert to lowercase, then compare with reversed version.',
    solution: `function isPalindrome(s) {\n  const clean = s.toLowerCase();\n  return clean === clean.split("").reverse().join("");\n}\nconsole.log(isPalindrome("racecar")); // true`,
    starter: `function isPalindrome(s) {\n  // your code here\n}\n\nconsole.log(isPalindrome("racecar")); // true\nconsole.log(isPalindrome("hello"));   // false\nconsole.log(isPalindrome("Madam"));   // true`,
    test: code => { try { const fn = new Function(code + '; return isPalindrome("racecar")===true && isPalindrome("hello")===false;'); return fn(); } catch(e) { return false; } }
  },
  {
    id: 'ch9', num: '#09', diff: 'medium', title: 'Flatten Array',
    desc: 'Flatten a nested array one level deep',
    task: 'Write `flattenOnce(arr)` that flattens a nested array one level deep.',
    requirements: ['Returns flat array', 'Only one level', '[[1,2],[3,4]] → [1,2,3,4]'],
    tags: ['arrays'],
    hint: 'Try Array.prototype.flat(1) or use reduce with concat.',
    solution: `function flattenOnce(arr) {\n  return arr.flat(1);\n}\nconsole.log(flattenOnce([[1,2],[3,4]]));`,
    starter: `function flattenOnce(arr) {\n  // your code here\n}\n\nconsole.log(flattenOnce([[1,2],[3,4]]));        // [1,2,3,4]\nconsole.log(flattenOnce([[1],[2,3],[4,5,6]])); // [1,2,3,4,5,6]`,
    test: code => { try { const fn = new Function(code + '; const r=flattenOnce([[1,2],[3,4]]); return r.join(",")===\\"1,2,3,4\\";'); return fn(); } catch(e) { return false; } }
  },
  {
    id: 'ch10', num: '#10', diff: 'medium', title: 'Object from Arrays',
    desc: 'Combine two arrays into an object',
    task: 'Write `zipToObject(keys, values)` that creates an object pairing keys[i] with values[i].',
    requirements: ['Returns an object', 'keys and values are arrays', 'keys[0] maps to values[0]'],
    tags: ['objects', 'arrays'],
    hint: 'Use reduce() or a for loop with bracket notation: obj[key] = value.',
    solution: `function zipToObject(keys, values) {\n  return keys.reduce((obj, key, i) => {\n    obj[key] = values[i];\n    return obj;\n  }, {});\n}\nconsole.log(zipToObject(["a","b","c"],[1,2,3]));`,
    starter: `function zipToObject(keys, values) {\n  // your code here\n}\n\nconsole.log(zipToObject(["a","b","c"], [1,2,3]));\n// { a: 1, b: 2, c: 3 }`,
    test: code => { try { const fn = new Function(code + '; const r=zipToObject(["a","b"],[1,2]); return r.a===1&&r.b===2;'); return fn(); } catch(e) { return false; } }
  },
  {
    id: 'ch11', num: '#11', diff: 'medium', title: 'Count Occurrences',
    desc: 'Count how many times each item appears',
    task: 'Write `countOccurrences(arr)` that returns an object with each element as a key and its count as the value.',
    requirements: ['Returns an object', 'Each key is an array element', 'Value is the count'],
    tags: ['objects', 'arrays', 'loops'],
    hint: 'Loop through array, use obj[item] = (obj[item] || 0) + 1.',
    solution: `function countOccurrences(arr) {\n  return arr.reduce((acc, item) => {\n    acc[item] = (acc[item] || 0) + 1;\n    return acc;\n  }, {});\n}\nconsole.log(countOccurrences(["a","b","a","c","b","a"]));`,
    starter: `function countOccurrences(arr) {\n  // your code here\n}\n\nconsole.log(countOccurrences(["a","b","a","c","b","a"]));\n// { a: 3, b: 2, c: 1 }`,
    test: code => { try { const fn = new Function(code + '; const r=countOccurrences(["a","b","a"]); return r.a===2&&r.b===1;'); return fn(); } catch(e) { return false; } }
  },
  {
    id: 'ch12', num: '#12', diff: 'medium', title: 'Debounce Function',
    desc: 'Create a classic utility function used everywhere in JS',
    task: 'Write a `debounce(fn, delay)` function that returns a new function that only calls fn after delay ms of inactivity.',
    requirements: ['Returns a new function', 'Delays execution', 'Cancels previous timer on re-call'],
    tags: ['functions', 'closures', 'timers'],
    hint: 'Use setTimeout and clearTimeout. Store the timer in a closure variable.',
    solution: `function debounce(fn, delay) {\n  let timer;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}\nconst log = debounce((msg) => console.log(msg), 300);\nlog("typing..."); log("typing..."); log("done!");`,
    starter: `function debounce(fn, delay) {\n  // your code here\n}\n\nconst log = debounce((msg) => console.log(msg), 300);\nlog("typing...");\nlog("typing...");\nlog("done!"); // only this should execute`,
    test: code => { try { new Function(code)(); return true; } catch(e) { return false; } }
  },
];

/* ============================================================
   14. RENDER CHALLENGES
============================================================ */
function renderChallenges() {
  const list = document.getElementById('challenges-list');
  list.innerHTML = CHALLENGES.map((ch, i) => `
    <div class="challenge-card ${state.completedChallenges.includes(ch.id) ? 'done' : ''}"
         onclick="openChallenge('${ch.id}')" style="animation-delay:${i*0.05}s">
      <div class="challenge-header">
        <span class="challenge-num">${ch.num}</span>
        <span class="challenge-diff ch-${ch.diff}">${ch.diff}</span>
      </div>
      <div class="challenge-title">${ch.title} ${state.completedChallenges.includes(ch.id) ? '✅' : ''}</div>
      <div class="challenge-desc">${ch.desc}</div>
      <div class="challenge-tags">${ch.tags.map(t => `<span class="challenge-tag">${t}</span>`).join('')}</div>
    </div>
  `).join('');
}

function openChallenge(id) {
  const ch = CHALLENGES.find(c => c.id === id);
  if (!ch) return;
  playSound('click');

  document.getElementById('challenges-list').style.display = 'none';
  const panel = document.getElementById('challenge-panel');
  panel.classList.add('open');

  panel.querySelector('#challenge-content').innerHTML = `
    <div class="challenge-header" style="margin-bottom:1rem">
      <span class="challenge-num" style="font-size:1rem">${ch.num}</span>
      <span class="challenge-diff ch-${ch.diff}">${ch.diff}</span>
    </div>
    <h2 style="font-family:Syne;font-size:1.8rem;font-weight:800;margin-bottom:1.5rem">${ch.title}</h2>
    <div class="challenge-layout">
      <div class="challenge-left">
        <div class="ch-task">
          <h4>📋 Task</h4>
          <p>${ch.task}</p>
        </div>
        <div class="ch-task">
          <h4>✅ Requirements</h4>
          <ul>${ch.requirements.map(r => `<li>${r}</li>`).join('')}</ul>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="toggleHint('hint-${id}')">💡 Show Hint</button>
          <button class="btn btn-ghost btn-sm" onclick="toggleSolution('sol-${id}')">👁 Show Solution</button>
        </div>
        <div class="hint-section" id="hint-${id}">
          <div class="ch-task"><h4>💡 Hint</h4><p>${ch.hint}</p></div>
        </div>
        <div class="solution-section" id="sol-${id}">
          <div class="code-example">
            <div class="code-example-header">
              <span class="code-lang">solution</span>
            </div>
            <pre class="code-block">${ch.solution}</pre>
          </div>
        </div>
      </div>
      <div class="challenge-right">
        <div class="try-it-section">
          <div class="try-it-header">
            <span class="try-it-title">✏️ Your Code</span>
            <div class="try-it-actions">
              <button class="btn btn-sm btn-primary" onclick="runChallenge('${id}')">▶ Run & Test</button>
              <button class="btn btn-sm btn-ghost" onclick="resetChallenge('${id}')">↺ Reset</button>
            </div>
          </div>
          <textarea class="code-editor" id="ch-editor-${id}" spellcheck="false">${ch.starter}</textarea>
          <div class="output-panel" id="ch-out-${id}">// Click Run & Test to check your solution...</div>
        </div>
      </div>
    </div>
  `;
}

function closeChallengePanel() {
  document.getElementById('challenges-list').style.display = '';
  document.getElementById('challenge-panel').classList.remove('open');
}

document.getElementById('back-to-challenges').addEventListener('click', () => {
  closeChallengePanel(); playSound('click');
});

function toggleHint(id) {
  document.getElementById(id)?.classList.toggle('open');
}

function toggleSolution(id) {
  document.getElementById(id)?.classList.toggle('open');
}

function runChallenge(id) {
  const ch = CHALLENGES.find(c => c.id === id);
  const code = document.getElementById(`ch-editor-${id}`)?.value || '';
  const out = document.getElementById(`ch-out-${id}`);
  if (!out) return;
  let logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  let passed = false;
  try {
    new Function(code)();
    passed = ch.test(code);
    out.className = `output-panel ${passed ? '' : 'error'}`;
    out.textContent = (logs.length ? logs.join('\n') + '\n\n' : '') + (passed ? '✅ Tests passed! Great job!' : '❌ Tests failed. Check your logic.');
  } catch(e) {
    out.textContent = '❌ Error: ' + e.message;
    out.className = 'output-panel error';
  }
  console.log = orig;

  if (passed && !state.completedChallenges.includes(id)) {
    state.completedChallenges.push(id);
    addXP(25, ch.title);
    saveState();
    playSound('success');
    showToast(`✅ Challenge "${ch.title}" solved!`, 'success');
    renderChallenges();
    addConfetti();
  } else if (passed) {
    playSound('click');
  } else {
    playSound('wrong');
  }
}

function resetChallenge(id) {
  const ch = CHALLENGES.find(c => c.id === id);
  if (ch) document.getElementById(`ch-editor-${id}`).value = ch.starter;
}

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
   21. QUIZ SECTION
============================================================ */
const QUIZ_QUESTIONS = {
  all: [
    { topic: 'variables', q: 'Which keyword cannot be reassigned?', options: ['var','let','const','function'], ans: 2, exp: 'const creates a read-only reference. Once assigned, it cannot be reassigned.' },
    { topic: 'variables', q: 'What is the scope of a let variable?', options: ['Global','Function','Block','Module'], ans: 2, exp: 'let is block-scoped, meaning it is limited to the block it is declared in.' },
    { topic: 'datatypes', q: 'What does typeof null return?', options: ['"null"','"undefined"','"object"','"boolean"'], ans: 2, exp: 'This is a well-known JS quirk! typeof null returns "object" due to a historic bug.' },
    { topic: 'datatypes', q: 'Which is NOT a primitive type?', options: ['String','Number','Array','Boolean'], ans: 2, exp: 'Arrays are objects (reference types), not primitives.' },
    { topic: 'functions', q: 'Arrow functions do NOT have their own:', options: ['return','arguments','this','none'], ans: 2, exp: 'Arrow functions do not have their own `this` context — they inherit it from the surrounding scope.' },
    { topic: 'functions', q: 'What is a closure?', options: ['A broken function','A function + its outer scope','A class method','An IIFE'], ans: 1, exp: 'A closure is a function that retains access to variables from its outer (enclosing) scope.' },
    { topic: 'loops', q: 'Which loop always executes at least once?', options: ['for','while','do...while','for...of'], ans: 2, exp: 'do...while checks the condition AFTER execution, so it always runs at least once.' },
    { topic: 'loops', q: 'What does break do in a loop?', options: ['Pauses','Skips current iteration','Exits the loop','Throws error'], ans: 2, exp: 'break immediately terminates the loop and continues after the loop block.' },
    { topic: 'arrays', q: 'Which method creates a new array without modifying the original?', options: ['push','pop','map','splice'], ans: 2, exp: 'map() returns a new array; it does not modify the original array.' },
    { topic: 'arrays', q: 'What does arr.indexOf("x") return if "x" is not found?', options: ['0','null','undefined','-1'], ans: 3, exp: 'indexOf() returns -1 when the element is not found in the array.' },
    { topic: 'objects', q: 'How do you access property "name" of object obj?', options: ['obj->name','obj::name','obj.name or obj["name"]','get(obj, name)'], ans: 2, exp: 'Object properties can be accessed with dot notation (obj.name) or bracket notation (obj["name"]).' },
    { topic: 'objects', q: 'What does Object.keys(obj) return?', options: ['Object values','Object methods','Array of property names','Object entries'], ans: 2, exp: 'Object.keys() returns an array containing all enumerable property names of the object.' },
    { topic: 'dom', q: 'Which method selects the FIRST matching element?', options: ['getElementById','querySelectorAll','querySelector','getElementByClass'], ans: 2, exp: 'querySelector() returns the first element matching the given CSS selector.' },
    { topic: 'dom', q: 'How do you add HTML to an element?', options: ['element.textContent','element.innerHTML','element.text','element.html'], ans: 1, exp: 'innerHTML allows you to get or set the HTML content inside an element.' },
    { topic: 'events', q: 'Which is the correct way to add an event listener?', options: ['element.on("click", fn)','element.click = fn','element.addEventListener("click", fn)','element.listen("click", fn)'], ans: 2, exp: 'addEventListener() is the modern, correct way to attach event handlers to DOM elements.' },
    { topic: 'events', q: 'What does event.preventDefault() do?', options: ['Stops bubbling','Stops default browser action','Removes listener','Pauses event'], ans: 1, exp: 'preventDefault() stops the default action associated with the event (e.g., form submit, link navigation).' },
  ]
};

let selectedQuizTopic = 'all';
let currentQuiz = { questions: [], idx: 0, score: 0, answers: [] };

function renderQuizSetup() {
  const topics = [{ id: 'all', name: '🎯 All Topics' }, ...TOPICS.map(t => ({ id: t.id, name: `${t.icon} ${t.name}` }))];
  const container = document.getElementById('quiz-topics');
  if (!container) return;
  container.innerHTML = topics.map(t => `
    <button class="quiz-topic-btn ${selectedQuizTopic === t.id ? 'selected' : ''}"
            onclick="selectQuizTopic('${t.id}', this)">${t.name}</button>
  `).join('');
  document.getElementById('quiz-setup').classList.remove('hidden');
  document.getElementById('quiz-game').classList.add('hidden');
  document.getElementById('quiz-results').classList.add('hidden');
}

window.selectQuizTopic = function(id, btn) {
  selectedQuizTopic = id;
  document.querySelectorAll('.quiz-topic-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
};

document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);

function startQuiz() {
  const allQ = QUIZ_QUESTIONS.all;
  const pool = selectedQuizTopic === 'all' ? allQ : allQ.filter(q => q.topic === selectedQuizTopic);
  if (!pool.length) { showToast('No questions for this topic yet!', 'info'); return; }
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(10, pool.length));
  currentQuiz = { questions: shuffled, idx: 0, score: 0, answers: [] };
  document.getElementById('quiz-setup').classList.add('hidden');
  document.getElementById('quiz-results').classList.add('hidden');
  document.getElementById('quiz-game').classList.remove('hidden');
  renderQuizQuestion();
  playSound('click');
}

function renderQuizQuestion() {
  const { questions, idx } = currentQuiz;
  if (idx >= questions.length) { showQuizResults(); return; }
  const q = questions[idx];
  const pct = (idx / questions.length) * 100;
  document.getElementById('quiz-game').innerHTML = `
    <div class="quiz-game-card">
      <div class="quiz-progress">
        <div class="quiz-progress-bar-wrap">
          <div class="quiz-progress-bar" style="width:${pct}%"></div>
        </div>
        <span class="quiz-count">${idx+1} / ${questions.length}</span>
      </div>
      <div class="quiz-question">${q.q}</div>
      <div class="quiz-options">
        ${q.options.map((o, i) => `<button class="quiz-option" onclick="answerQuiz(${i})">${o}</button>`).join('')}
      </div>
      <div class="quiz-explanation" id="quiz-exp">${q.exp}</div>
      <div class="quiz-nav">
        <button class="btn btn-primary btn-sm" id="next-btn" onclick="nextQuestion()" style="display:none">Next →</button>
      </div>
    </div>
  `;
}

window.answerQuiz = function(idx) {
  const q = currentQuiz.questions[currentQuiz.idx];
  const opts = document.querySelectorAll('.quiz-option');
  opts.forEach(o => o.disabled = true);
  opts[q.ans].classList.add('correct');
  const isCorrect = idx === q.ans;
  if (!isCorrect) opts[idx].classList.add('wrong');
  else currentQuiz.score++;
  currentQuiz.answers.push({ q: q.q, chosen: idx, correct: q.ans, right: isCorrect, exp: q.exp, options: q.options });
  document.getElementById('quiz-exp').classList.add('show');
  document.getElementById('next-btn').style.display = 'block';
  playSound(isCorrect ? 'success' : 'wrong');
};

window.nextQuestion = function() {
  currentQuiz.idx++;
  renderQuizQuestion();
  playSound('click');
};

function showQuizResults() {
  const { questions, score, answers } = currentQuiz;
  const pct = Math.round((score / questions.length) * 100);
  if (pct > (state.quizBestScore || 0)) {
    state.quizBestScore = pct;
    state.quizTotalPlayed++;
    saveState();
  }
  addXP(score * 5, 'Quiz');

  let emoji = pct === 100 ? '🏆' : pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '📖';
  let title = pct === 100 ? 'Perfect Score!' : pct >= 70 ? 'Great Job!' : pct >= 40 ? 'Good Try!' : 'Keep Learning!';

  document.getElementById('quiz-game').classList.add('hidden');
  document.getElementById('quiz-results').classList.remove('hidden');
  document.getElementById('quiz-results').innerHTML = `
    <div class="quiz-results-card">
      <div class="results-emoji">${emoji}</div>
      <div class="results-title">${title}</div>
      <div class="results-score">${score}/${questions.length}</div>
      <div class="results-sub">${pct}% accuracy${pct === 100 ? ' — You aced it!' : ''}</div>
      <div class="results-actions">
        <button class="btn btn-primary" onclick="startQuiz()">Try Again ↺</button>
        <button class="btn btn-ghost" onclick="renderQuizSetup()">Change Topic</button>
      </div>
      <div class="results-breakdown" style="margin-top:2rem">
        <h4 style="margin-bottom:1rem;font-size:0.95rem">Answer Breakdown:</h4>
        ${answers.map(a => `
          <div class="result-item ${a.right ? 'right' : 'wrong-r'}">
            <span class="result-icon">${a.right ? '✅' : '❌'}</span>
            <div>
              <div style="font-weight:600;font-size:0.88rem">${a.q}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.2rem">
                ${a.right ? 'Correct' : `Your answer: ${a.options[a.chosen]} · Correct: ${a.options[a.correct]}`}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  updateDashboard();
  if (pct === 100) addConfetti();
}

/* ============================================================
   22. INIT
============================================================ */
function init() {
  loadState();
  renderTopics();
  renderChallenges();
  renderGamesGrid();
  renderQuizSetup();
  updateDashboard();
  checkAchievements();

  // Fade in sections with staggered delays
  document.querySelectorAll('.topic-card, .challenge-card, .game-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      el.style.opacity = '';
      el.style.transform = '';
    }, 100 + i * 50);
  });
}

document.addEventListener('DOMContentLoaded', init);
