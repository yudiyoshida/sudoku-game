import { ref, computed } from 'vue'
import { generateBoard } from '../sudoku/engine.js'
import { noteToggle, cloneNotes, removeNoteFromPeers } from '../sudoku/notes.js'

function checkWin(puzzle, solution) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle[r][c] !== solution[r][c]) return false
    }
  }
  return true
}

export function useSudokuGame({ timer, toast, onWin, onGameOver }) {
  const puzzle = ref([])
  const solution = ref([])
  const given = ref([])
  const notes = ref([])
  const selected = ref(null)
  const notesMode = ref(false)
  const mistakes = ref(0)
  const maxMistakes = 3
  const hints = ref(3)
  const difficulty = ref('easy')
  const history = ref([])
  const gameOver = ref(false)
  const won = ref(false)
  const shakeCell = ref(null)
  const popCell = ref(null)

  const difficultyLabel = computed(
    () => difficulty.value.charAt(0).toUpperCase() + difficulty.value.slice(1),
  )

  function numpadRemaining(n) {
    let count = 0
    const p = puzzle.value
    const sol = solution.value
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (p[r][c] === n && p[r][c] === sol[r][c]) count++
      }
    }
    return 9 - count
  }

  function initGame(diff) {
    const { puzzle: p, solution: sol } = generateBoard(diff)
    puzzle.value = p.map((r) => [...r])
    solution.value = sol
    given.value = p.map((r) => r.map((v) => v !== 0))
    notes.value = Array.from({ length: 9 }, () => Array(9).fill(0))
    selected.value = null
    notesMode.value = false
    mistakes.value = 0
    hints.value = 3
    difficulty.value = diff
    history.value = []
    gameOver.value = false
    won.value = false
    shakeCell.value = null
    popCell.value = null

    timer.start(() => !gameOver.value && !won.value)
  }

  function selectCell(r, c) {
    if (gameOver.value || won.value) return
    selected.value = { row: r, col: c }
  }

  function triggerShake(r, c) {
    shakeCell.value = { row: r, col: c }
    setTimeout(() => {
      shakeCell.value = null
    }, 400)
  }

  function triggerPop(r, c) {
    popCell.value = { row: r, col: c }
    setTimeout(() => {
      popCell.value = null
    }, 250)
  }

  function inputNumber(num) {
    if (gameOver.value || won.value || !selected.value) return
    const { row, col } = selected.value
    if (given.value[row][col]) return

    if (notesMode.value) {
      const prevNotes = notes.value[row][col]
      const rowNotes = [...notes.value[row]]
      rowNotes[col] = noteToggle(rowNotes[col], num)
      const newNotes = [...notes.value]
      newNotes[row] = rowNotes
      const prevVal = puzzle.value[row][col]
      const newPuzzle = puzzle.value.map((rr) => [...rr])
      const hist = [...history.value]
      if (prevVal !== 0) {
        hist.push({ row, col, prevValue: prevVal, prevNotes })
        newPuzzle[row][col] = 0
      } else {
        hist.push({ row, col, prevValue: 0, prevNotes })
      }
      puzzle.value = newPuzzle
      notes.value = newNotes
      history.value = hist
      return
    }

    const prevValue = puzzle.value[row][col]
    const prevNotes = notes.value[row][col]
    const newPuzzle = puzzle.value.map((rr) => [...rr])
    newPuzzle[row][col] = num
    let newNotes = cloneNotes(notes.value)
    newNotes[row][col] = 0
    history.value = [...history.value, { row, col, prevValue, prevNotes }]
    puzzle.value = newPuzzle
    notes.value = newNotes

    if (num !== solution.value[row][col]) {
      mistakes.value++
      triggerShake(row, col)
      toast.show('Wrong number', 'error')
      if (mistakes.value >= maxMistakes) {
        gameOver.value = true
        timer.stop()
        setTimeout(() => onGameOver(), 600)
      }
      return
    }

    notes.value = removeNoteFromPeers(notes.value, row, col, num)
    triggerPop(row, col)

    if (checkWin(puzzle.value, solution.value)) {
      won.value = true
      timer.stop()
      setTimeout(() => onWin(), 400)
    }
  }

  function undo() {
    if (gameOver.value || won.value || history.value.length === 0) return
    const hist = [...history.value]
    const move = hist.pop()
    const newPuzzle = puzzle.value.map((r) => [...r])
    newPuzzle[move.row][move.col] = move.prevValue
    const newNotes = cloneNotes(notes.value)
    newNotes[move.row][move.col] = move.prevNotes
    puzzle.value = newPuzzle
    notes.value = newNotes
    history.value = hist
  }

  function erase() {
    if (gameOver.value || won.value || !selected.value) return
    const { row, col } = selected.value
    if (given.value[row][col]) return
    if (puzzle.value[row][col] === 0 && notes.value[row][col] === 0) return
    history.value = [
      ...history.value,
      {
        row,
        col,
        prevValue: puzzle.value[row][col],
        prevNotes: notes.value[row][col],
      },
    ]
    const newPuzzle = puzzle.value.map((r) => [...r])
    newPuzzle[row][col] = 0
    const newNotes = cloneNotes(notes.value)
    newNotes[row][col] = 0
    puzzle.value = newPuzzle
    notes.value = newNotes
  }

  function toggleNotes() {
    notesMode.value = !notesMode.value
  }

  function giveHint() {
    if (gameOver.value || won.value) return
    if (hints.value <= 0) {
      toast.show('No hints remaining', 'error')
      return
    }

    let target = selected.value
    if (
      !target ||
      given.value[target.row][target.col] ||
      puzzle.value[target.row][target.col] === solution.value[target.row][target.col]
    ) {
      const candidates = []
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!given.value[r][c] && puzzle.value[r][c] !== solution.value[r][c]) {
            candidates.push({ row: r, col: c })
          }
        }
      }
      if (candidates.length === 0) return
      target = candidates[Math.floor(Math.random() * candidates.length)]
      selected.value = target
    }

    hints.value--
    const tr = target.row
    const tc = target.col
    const solVal = solution.value[tr][tc]

    history.value = [
      ...history.value,
      {
        row: tr,
        col: tc,
        prevValue: puzzle.value[tr][tc],
        prevNotes: notes.value[tr][tc],
      },
    ]

    const newPuzzle = puzzle.value.map((r) => [...r])
    newPuzzle[tr][tc] = solVal
    let newNotes = cloneNotes(notes.value)
    newNotes[tr][tc] = 0
    newNotes = removeNoteFromPeers(newNotes, tr, tc, solVal)
    puzzle.value = newPuzzle
    notes.value = newNotes

    triggerPop(tr, tc)
    toast.show('Hint revealed', 'success')

    if (checkWin(puzzle.value, solution.value)) {
      won.value = true
      timer.stop()
      setTimeout(() => onWin(), 400)
    }
  }

  function gameOverRetry() {
    const newPuzzle = given.value.map((row, r) =>
      row.map((isGiven, c) => (isGiven ? solution.value[r][c] : 0)),
    )
    puzzle.value = newPuzzle
    notes.value = Array.from({ length: 9 }, () => Array(9).fill(0))
    selected.value = null
    notesMode.value = false
    mistakes.value = 0
    hints.value = 3
    history.value = []
    gameOver.value = false
    won.value = false
    timer.start(() => !gameOver.value && !won.value)
  }

  return {
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
    gameOver,
    won,
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
  }
}
