/* ========================================
   Sudoku Game — Complete Implementation
   ======================================== */

// ---- State ----
const state = {
  puzzle: [],
  solution: [],
  given: [],
  notes: [],
  selected: null,
  notesMode: false,
  mistakes: 0,
  maxMistakes: 3,
  hints: 3,
  difficulty: 'easy',
  history: [],
  timer: 0,
  timerInterval: null,
  gameOver: false,
  won: false,
};

// ---- DOM refs ----
const gridEl = document.getElementById('grid');
const numpadEl = document.getElementById('numpad');
const timerEl = document.getElementById('timer');
const mistakesEl = document.getElementById('mistakes');
const diffBadge = document.getElementById('diff-badge');
const hintCountEl = document.getElementById('hint-count');
const btnUndo = document.getElementById('btn-undo');
const btnErase = document.getElementById('btn-erase');
const btnNotes = document.getElementById('btn-notes');
const btnHint = document.getElementById('btn-hint');
const btnNewGame = document.getElementById('btn-new-game');
const modalNewGame = document.getElementById('modal-new-game');
const modalWin = document.getElementById('modal-win');
const modalGameover = document.getElementById('modal-gameover');

// ---- Sudoku Generator ----
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isValidPlacement(board, row, col, num) {
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

function solveSudoku(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValidPlacement(board, r, c, num)) {
            board[r][c] = num;
            if (solveSudoku(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generateBoard(difficulty) {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  for (let box = 0; box < 9; box += 3) {
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let idx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        board[box + r][box + c] = nums[idx++];
      }
    }
  }
  solveSudoku(board);

  const solution = board.map((r) => [...r]);

  const removeCounts = { easy: 36, medium: 46, hard: 54 };
  const toRemove = removeCounts[difficulty] || 36;
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9]),
  );
  for (let i = 0; i < toRemove; i++) {
    const [r, c] = positions[i];
    board[r][c] = 0;
  }

  return { puzzle: board, solution };
}

// ---- Timer ----
function startTimer() {
  stopTimer();
  state.timer = 0;
  updateTimerDisplay();
  state.timerInterval = setInterval(() => {
    if (!state.gameOver && !state.won) {
      state.timer++;
      updateTimerDisplay();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function updateTimerDisplay() {
  const m = String(Math.floor(state.timer / 60)).padStart(2, '0');
  const s = String(state.timer % 60).padStart(2, '0');
  timerEl.textContent = `${m}:${s}`;
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ---- Toast ----
function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ---- Confetti ----
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiParticles = [];
let confettiAnimId = null;

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeConfetti);
resizeConfetti();

function launchConfetti() {
  confettiParticles = [];
  const colors = ['#E8A838', '#5CB85C', '#3ECFB2', '#E85454', '#F5F0E8', '#D4943A', '#7EC8E3'];
  for (let i = 0; i < 150; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    });
  }
  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
  animateConfetti();
}

function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  let alive = false;
  for (const p of confettiParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.rotation += p.rotSpeed;
    if (p.y > confettiCanvas.height + 20) {
      p.opacity -= 0.02;
    }
    if (p.opacity <= 0) continue;
    alive = true;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rotation * Math.PI) / 180);
    confettiCtx.globalAlpha = Math.max(0, p.opacity);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
  }
  if (alive) {
    confettiAnimId = requestAnimationFrame(animateConfetti);
  } else {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiAnimId = null;
  }
}

// ---- Modals ----
function openModal(el) {
  el.classList.add('open');
}
function closeModal(el) {
  el.classList.remove('open');
}

// ---- Game Init ----
function initGame(difficulty) {
  const { puzzle, solution } = generateBoard(difficulty);
  state.puzzle = puzzle.map((r) => [...r]);
  state.solution = solution;
  state.given = puzzle.map((r) => r.map((v) => v !== 0));
  state.notes = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set()),
  );
  state.selected = null;
  state.notesMode = false;
  state.mistakes = 0;
  state.hints = 3;
  state.difficulty = difficulty;
  state.history = [];
  state.gameOver = false;
  state.won = false;

  btnNotes.classList.remove('active');
  hintCountEl.textContent = '3';
  mistakesEl.textContent = '0/3';
  mistakesEl.classList.remove('error');

  diffBadge.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  diffBadge.className = 'difficulty-badge diff-' + difficulty;

  renderGrid();
  renderNumpad();
  startTimer();

  closeModal(modalWin);
  closeModal(modalGameover);
  closeModal(modalNewGame);
}

// ---- Rendering ----
function renderGrid() {
  gridEl.innerHTML = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('tabindex', '0');

      if (c === 2 || c === 5 || c === 8) cell.classList.add('box-right');
      if (r === 2 || r === 5 || r === 8) cell.classList.add('box-bottom');

      applyHighlighting(cell, r, c);

      const val = state.puzzle[r][c];
      if (val !== 0) {
        const span = document.createElement('span');
        span.className = 'cell-value';
        if (state.given[r][c]) {
          span.classList.add('given');
        } else if (val !== state.solution[r][c]) {
          span.classList.add('user-input', 'error');
        } else {
          span.classList.add('user-input');
        }
        span.textContent = val;
        cell.appendChild(span);
      } else if (state.notes[r][c].size > 0) {
        const notesDiv = document.createElement('div');
        notesDiv.className = 'notes-grid';
        for (let n = 1; n <= 9; n++) {
          const noteSpan = document.createElement('span');
          noteSpan.className = 'note-num';
          noteSpan.textContent = state.notes[r][c].has(n) ? n : '';
          notesDiv.appendChild(noteSpan);
        }
        cell.appendChild(notesDiv);
      }

      cell.addEventListener('click', () => selectCell(r, c));

      gridEl.appendChild(cell);
    }
  }
}

function applyHighlighting(cell, r, c) {
  const sel = state.selected;
  if (!sel) return;

  if (r === sel.row && c === sel.col) {
    cell.classList.add('selected');
    return;
  }

  const sameRow = r === sel.row;
  const sameCol = c === sel.col;
  const sameBox =
    Math.floor(r / 3) === Math.floor(sel.row / 3) && Math.floor(c / 3) === Math.floor(sel.col / 3);

  if (sameRow || sameCol || sameBox) {
    cell.classList.add('highlighted');
  }

  const selVal = state.puzzle[sel.row][sel.col];
  const cellVal = state.puzzle[r][c];
  if (selVal !== 0 && cellVal === selVal) {
    cell.classList.add('same-number');
  }
}

function renderNumpad() {
  numpadEl.innerHTML = '';
  for (let n = 1; n <= 9; n++) {
    const btn = document.createElement('button');
    btn.className = 'num-btn';
    btn.dataset.num = n;
    btn.setAttribute('aria-label', `Number ${n}`);

    let count = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (state.puzzle[r][c] === n && state.puzzle[r][c] === state.solution[r][c]) {
          count++;
        }
      }
    }
    const remaining = 9 - count;

    btn.innerHTML = `<span>${n}</span><span class="num-remaining">${remaining}</span>`;
    if (remaining <= 0) btn.classList.add('completed');

    btn.addEventListener('click', () => inputNumber(n));
    numpadEl.appendChild(btn);
  }
}

// ---- Selection ----
function selectCell(r, c) {
  if (state.gameOver || state.won) return;
  state.selected = { row: r, col: c };
  renderGrid();
}

// ---- Input ----
function inputNumber(num) {
  if (state.gameOver || state.won || !state.selected) return;
  const { row, col } = state.selected;
  if (state.given[row][col]) return;

  if (state.notesMode) {
    const prevNotes = new Set(state.notes[row][col]);
    if (state.notes[row][col].has(num)) {
      state.notes[row][col].delete(num);
    } else {
      state.notes[row][col].add(num);
    }
    if (state.puzzle[row][col] !== 0) {
      state.history.push({ row, col, prevValue: state.puzzle[row][col], prevNotes });
      state.puzzle[row][col] = 0;
    } else {
      state.history.push({ row, col, prevValue: 0, prevNotes });
    }
    renderGrid();
    return;
  }

  const prevValue = state.puzzle[row][col];
  const prevNotes = new Set(state.notes[row][col]);

  state.history.push({ row, col, prevValue, prevNotes });
  state.puzzle[row][col] = num;
  state.notes[row][col].clear();

  if (num !== state.solution[row][col]) {
    state.mistakes++;
    mistakesEl.textContent = `${state.mistakes}/${state.maxMistakes}`;
    if (state.mistakes >= 2) mistakesEl.classList.add('error');

    renderGrid();
    const cellEl = getCellElement(row, col);
    if (cellEl) cellEl.classList.add('shake');
    showToast('Wrong number', 'error');

    if (state.mistakes >= state.maxMistakes) {
      state.gameOver = true;
      stopTimer();
      setTimeout(() => openModal(modalGameover), 600);
    }
    return;
  }

  removeNoteFromPeers(row, col, num);

  renderGrid();
  renderNumpad();

  const cellEl = getCellElement(row, col);
  if (cellEl) {
    const valEl = cellEl.querySelector('.cell-value');
    if (valEl) valEl.classList.add('pop');
  }

  if (checkWin()) {
    state.won = true;
    stopTimer();
    setTimeout(() => {
      document.getElementById('win-time').textContent = formatTime(state.timer);
      document.getElementById('win-mistakes').textContent = state.mistakes;
      document.getElementById('win-diff').textContent =
        state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1);
      openModal(modalWin);
      launchConfetti();
    }, 400);
  }
}

function removeNoteFromPeers(row, col, num) {
  for (let c = 0; c < 9; c++) state.notes[row][c].delete(num);
  for (let r = 0; r < 9; r++) state.notes[r][col].delete(num);
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      state.notes[r][c].delete(num);
    }
  }
}

function getCellElement(row, col) {
  return gridEl.children[row * 9 + col] || null;
}

// ---- Undo ----
function undo() {
  if (state.gameOver || state.won || state.history.length === 0) return;
  const move = state.history.pop();
  state.puzzle[move.row][move.col] = move.prevValue;
  state.notes[move.row][move.col] = move.prevNotes;
  renderGrid();
  renderNumpad();
}

// ---- Erase ----
function erase() {
  if (state.gameOver || state.won || !state.selected) return;
  const { row, col } = state.selected;
  if (state.given[row][col]) return;
  if (state.puzzle[row][col] === 0 && state.notes[row][col].size === 0) return;

  state.history.push({
    row,
    col,
    prevValue: state.puzzle[row][col],
    prevNotes: new Set(state.notes[row][col]),
  });
  state.puzzle[row][col] = 0;
  state.notes[row][col].clear();
  renderGrid();
  renderNumpad();
}

// ---- Notes toggle ----
function toggleNotes() {
  state.notesMode = !state.notesMode;
  btnNotes.classList.toggle('active', state.notesMode);
}

// ---- Hint ----
function giveHint() {
  if (state.gameOver || state.won) return;
  if (state.hints <= 0) {
    showToast('No hints remaining', 'error');
    return;
  }

  let target = state.selected;
  if (
    !target ||
    state.given[target.row][target.col] ||
    state.puzzle[target.row][target.col] === state.solution[target.row][target.col]
  ) {
    const candidates = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!state.given[r][c] && state.puzzle[r][c] !== state.solution[r][c]) {
          candidates.push({ row: r, col: c });
        }
      }
    }
    if (candidates.length === 0) return;
    target = candidates[Math.floor(Math.random() * candidates.length)];
    state.selected = target;
  }

  state.hints--;
  hintCountEl.textContent = state.hints;

  state.history.push({
    row: target.row,
    col: target.col,
    prevValue: state.puzzle[target.row][target.col],
    prevNotes: new Set(state.notes[target.row][target.col]),
  });

  state.puzzle[target.row][target.col] = state.solution[target.row][target.col];
  state.notes[target.row][target.col].clear();
  removeNoteFromPeers(target.row, target.col, state.solution[target.row][target.col]);

  renderGrid();
  renderNumpad();

  const cellEl = getCellElement(target.row, target.col);
  if (cellEl) {
    const valEl = cellEl.querySelector('.cell-value');
    if (valEl) valEl.classList.add('pop');
  }

  showToast('Hint revealed', 'success');

  if (checkWin()) {
    state.won = true;
    stopTimer();
    setTimeout(() => {
      document.getElementById('win-time').textContent = formatTime(state.timer);
      document.getElementById('win-mistakes').textContent = state.mistakes;
      document.getElementById('win-diff').textContent =
        state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1);
      openModal(modalWin);
      launchConfetti();
    }, 400);
  }
}

// ---- Win check ----
function checkWin() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (state.puzzle[r][c] !== state.solution[r][c]) return false;
    }
  }
  return true;
}

// ---- Keyboard support ----
document.addEventListener('keydown', (e) => {
  if (state.gameOver || state.won) return;
  if (
    modalNewGame.classList.contains('open') ||
    modalWin.classList.contains('open') ||
    modalGameover.classList.contains('open')
  )
    return;

  const key = e.key;

  if (key >= '1' && key <= '9') {
    e.preventDefault();
    inputNumber(parseInt(key, 10));
    return;
  }

  if (key === 'Backspace' || key === 'Delete') {
    e.preventDefault();
    erase();
    return;
  }

  if (key === 'n' || key === 'N') {
    e.preventDefault();
    toggleNotes();
    return;
  }

  if (key === 'z' || key === 'Z') {
    e.preventDefault();
    undo();
    return;
  }

  if (key === 'h' || key === 'H') {
    e.preventDefault();
    giveHint();
    return;
  }

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
    e.preventDefault();
    if (!state.selected) {
      selectCell(0, 0);
      return;
    }
    let { row, col } = state.selected;
    if (key === 'ArrowUp') row = Math.max(0, row - 1);
    if (key === 'ArrowDown') row = Math.min(8, row + 1);
    if (key === 'ArrowLeft') col = Math.max(0, col - 1);
    if (key === 'ArrowRight') col = Math.min(8, col + 1);
    selectCell(row, col);
  }
});

// ---- Event listeners ----
btnUndo.addEventListener('click', undo);
btnErase.addEventListener('click', erase);
btnNotes.addEventListener('click', toggleNotes);
btnHint.addEventListener('click', giveHint);
btnNewGame.addEventListener('click', () => openModal(modalNewGame));
document.getElementById('btn-cancel-new').addEventListener('click', () => closeModal(modalNewGame));

document.querySelectorAll('.diff-card').forEach((card) => {
  card.addEventListener('click', () => {
    const diff = card.dataset.diff;
    initGame(diff);
  });
});

document.getElementById('btn-win-new').addEventListener('click', () => {
  closeModal(modalWin);
  openModal(modalNewGame);
});

document.getElementById('btn-gameover-retry').addEventListener('click', () => {
  closeModal(modalGameover);
  state.puzzle = state.given.map((row, r) => row.map((isGiven, c) => (isGiven ? state.solution[r][c] : 0)));
  state.notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
  state.selected = null;
  state.notesMode = false;
  state.mistakes = 0;
  state.hints = 3;
  state.history = [];
  state.gameOver = false;
  btnNotes.classList.remove('active');
  hintCountEl.textContent = '3';
  mistakesEl.textContent = '0/3';
  mistakesEl.classList.remove('error');
  renderGrid();
  renderNumpad();
  startTimer();
});

document.getElementById('btn-gameover-new').addEventListener('click', () => {
  closeModal(modalGameover);
  openModal(modalNewGame);
});

[modalNewGame, modalWin, modalGameover].forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      if (modal === modalNewGame) closeModal(modal);
    }
  });
});

// ---- Start ----
initGame('easy');
