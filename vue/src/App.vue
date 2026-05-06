<script setup>
import { ref } from 'vue'
import { noteHas } from './sudoku/notes.js'
import { useTimer } from './composables/useTimer.js'
import { useToast } from './composables/useToast.js'
import { useConfetti } from './composables/useConfetti.js'
import { useSudokuGame } from './composables/useSudokuGame.js'
import { useGameKeyboard } from './composables/useGameKeyboard.js'

const ROWS = Array.from({ length: 9 }, (_, i) => i)

const timer = useTimer()
const { toasts, show } = useToast()
const { canvasRef, launch } = useConfetti()

const modalNewGame = ref(false)
const modalWin = ref(false)
const modalGameover = ref(false)

const game = useSudokuGame({
  timer,
  toast: { show },
  onWin: () => {
    modalWin.value = true
    launch()
  },
  onGameOver: () => {
    modalGameover.value = true
  },
})

const {
  puzzle,
  solution,
  given,
  notes,
  selected,
  notesMode,
  mistakes,
  maxMistakes,
  hints,
  difficulty,
  difficultyLabel,
  shakeCell,
  popCell,
  initGame,
  selectCell,
  inputNumber,
  undo,
  erase,
  toggleNotes,
  giveHint,
  gameOverRetry,
  numpadRemaining,
} = game

game.initGame('easy')

useGameKeyboard({
  game,
  anyModalOpen: () =>
    modalNewGame.value || modalWin.value || modalGameover.value,
})

function isSelected(r, c) {
  return selected.value?.row === r && selected.value?.col === c
}

function isHighlighted(r, c) {
  const sel = selected.value
  if (!sel) return false
  if (r === sel.row && c === sel.col) return false
  const sameRow = r === sel.row
  const sameCol = c === sel.col
  const sameBox =
    Math.floor(r / 3) === Math.floor(sel.row / 3) &&
    Math.floor(c / 3) === Math.floor(sel.col / 3)
  return sameRow || sameCol || sameBox
}

function isSameNumber(r, c) {
  const sel = selected.value
  if (!sel) return false
  const selVal = puzzle.value[sel.row]?.[sel.col]
  const cellVal = puzzle.value[r][c]
  return selVal !== 0 && cellVal === selVal
}

function openNewGameModal() {
  modalNewGame.value = true
}

function closeNewGameModal() {
  modalNewGame.value = false
}

function startDifficulty(diff) {
  initGame(diff)
  modalNewGame.value = false
}

function winPlayAgain() {
  modalWin.value = false
  modalNewGame.value = true
}

function gameOverRetryClick() {
  modalGameover.value = false
  gameOverRetry()
}

function gameOverNewClick() {
  modalGameover.value = false
  modalNewGame.value = true
}

function onNewGameBackdropClick() {
  modalNewGame.value = false
}
</script>

<template>
  <div class="bg-blob blob-1"></div>
  <div class="bg-blob blob-2"></div>
  <div class="bg-blob blob-3"></div>

  <canvas id="confetti-canvas" ref="canvasRef"></canvas>

  <div class="toast-container" id="toast-container">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="toast"
      :class="[t.type, { out: t.out }]"
    >
      {{ t.message }}
    </div>
  </div>

  <div class="game-column">
    <h1 class="game-title">Sudo<span>ku</span></h1>

    <div class="stats-bar">
      <div class="stat-item">
        <i class="fa-regular fa-clock"></i>
        <span class="stat-value">{{ timer.formatted }}</span>
      </div>
      <div class="stat-item">
        <i class="fa-regular fa-circle-xmark"></i>
        <span
          class="stat-value"
          :class="{ error: mistakes >= 2 }"
          >{{ mistakes }}/{{ maxMistakes }}</span
        >
      </div>
      <div class="stat-item">
        <span class="difficulty-badge" :class="'diff-' + difficulty">{{
          difficultyLabel
        }}</span>
      </div>
    </div>

    <div class="tools-bar">
      <button class="tool-btn" aria-label="Undo" @click="undo">
        <i class="fa-solid fa-rotate-left"></i>
        <span>Undo</span>
      </button>
      <button class="tool-btn" aria-label="Erase" @click="erase">
        <i class="fa-regular fa-rectangle-xmark"></i>
        <span>Erase</span>
      </button>
      <button
        class="tool-btn"
        :class="{ active: notesMode }"
        aria-label="Toggle notes mode"
        @click="toggleNotes"
      >
        <i class="fa-regular fa-pen-to-square"></i>
        <span>Notes</span>
      </button>
      <button class="tool-btn" aria-label="Get a hint" @click="giveHint">
        <i class="fa-regular fa-lightbulb"></i>
        <span>Hint</span>
        <span class="tool-count">{{ hints }}</span>
      </button>
    </div>

    <div class="grid-wrapper">
      <div class="sudoku-grid" role="grid" aria-label="Sudoku puzzle grid">
        <template v-for="r in ROWS" :key="'row-' + r">
          <div
            v-for="c in ROWS"
            :key="'cell-' + r + '-' + c"
            :class="[
              'cell',
              c === 2 || c === 5 || c === 8 ? 'box-right' : '',
              r === 2 || r === 5 || r === 8 ? 'box-bottom' : '',
              isSelected(r, c) ? 'selected' : '',
              !isSelected(r, c) && isHighlighted(r, c) ? 'highlighted' : '',
              isSameNumber(r, c) ? 'same-number' : '',
              shakeCell?.row === r && shakeCell?.col === c ? 'shake' : '',
            ]"
            role="gridcell"
            tabindex="0"
            @click="selectCell(r, c)"
          >
            <template v-if="puzzle[r]?.[c] !== 0">
              <span
                :class="[
                  'cell-value',
                  given[r][c] ? 'given' : 'user-input',
                  !given[r][c] && puzzle[r][c] !== solution[r][c]
                    ? 'error'
                    : '',
                  popCell?.row === r && popCell?.col === c ? 'pop' : '',
                ]"
                >{{ puzzle[r][c] }}</span
              >
            </template>
            <div v-else-if="notes[r]?.[c]" class="notes-grid">
              <span
                v-for="n in 9"
                :key="n"
                class="note-num"
                >{{ noteHas(notes[r][c], n) ? n : '' }}</span
              >
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="numpad">
      <button
        v-for="n in 9"
        :key="n"
        class="num-btn"
        :class="{ completed: numpadRemaining(n) <= 0 }"
        :aria-label="'Number ' + n"
        @click="inputNumber(n)"
      >
        <span>{{ n }}</span>
        <span class="num-remaining">{{ numpadRemaining(n) }}</span>
      </button>
    </div>

    <button class="new-game-btn" @click="openNewGameModal">New Game</button>
  </div>

  <div
    class="modal-overlay"
    id="modal-new-game"
    :class="{ open: modalNewGame }"
    @click.self="onNewGameBackdropClick"
  >
    <div class="modal-box">
      <div class="modal-title">New Game</div>
      <div class="modal-subtitle">Choose your difficulty level</div>
      <div class="diff-card" data-diff="easy" @click="startDifficulty('easy')">
        <div
          class="diff-icon"
          style="background: rgba(92, 184, 92, 0.15); color: #5cb85c"
        >
          <i class="fa-solid fa-seedling"></i>
        </div>
        <div class="diff-card-info">
          <h3>Easy</h3>
          <p>36 blanks — relaxed solving</p>
        </div>
      </div>
      <div
        class="diff-card"
        data-diff="medium"
        @click="startDifficulty('medium')"
      >
        <div
          class="diff-icon"
          style="background: rgba(232, 168, 56, 0.15); color: #e8a838"
        >
          <i class="fa-solid fa-fire"></i>
        </div>
        <div class="diff-card-info">
          <h3>Medium</h3>
          <p>46 blanks — some challenge</p>
        </div>
      </div>
      <div class="diff-card" data-diff="hard" @click="startDifficulty('hard')">
        <div
          class="diff-icon"
          style="background: rgba(232, 84, 84, 0.15); color: #e85454"
        >
          <i class="fa-solid fa-skull"></i>
        </div>
        <div class="diff-card-info">
          <h3>Hard</h3>
          <p>54 blanks — expert level</p>
        </div>
      </div>
      <button class="modal-btn modal-btn-ghost" @click="closeNewGameModal">
        Cancel
      </button>
    </div>
  </div>

  <div class="modal-overlay" id="modal-win" :class="{ open: modalWin }">
    <div class="modal-box" style="text-align: center">
      <div class="modal-title" style="color: var(--accent)">Puzzle Complete</div>
      <div class="modal-subtitle">You solved it — well done!</div>
      <div class="win-stats">
        <div class="win-stat">
          <div class="win-stat-value">{{ timer.formatTime(timer.seconds) }}</div>
          <div class="win-stat-label">Time</div>
        </div>
        <div class="win-stat">
          <div class="win-stat-value">{{ mistakes }}</div>
          <div class="win-stat-label">Mistakes</div>
        </div>
        <div class="win-stat">
          <div class="win-stat-value">{{ difficultyLabel }}</div>
          <div class="win-stat-label">Difficulty</div>
        </div>
      </div>
      <button class="modal-btn modal-btn-primary" @click="winPlayAgain">
        Play Again
      </button>
    </div>
  </div>

  <div class="modal-overlay" id="modal-gameover" :class="{ open: modalGameover }">
    <div class="modal-box" style="text-align: center">
      <div class="modal-title" style="color: var(--fg-error)">Game Over</div>
      <div class="modal-subtitle">
        You made 3 mistakes. Better luck next time!
      </div>
      <button
        class="modal-btn modal-btn-primary"
        style="margin-bottom: 8px"
        @click="gameOverRetryClick"
      >
        Try Again
      </button>
      <button class="modal-btn modal-btn-ghost" @click="gameOverNewClick">
        New Game
      </button>
    </div>
  </div>
</template>
