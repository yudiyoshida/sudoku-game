import { onMounted, onUnmounted } from 'vue'

export function useGameKeyboard({ game, anyModalOpen }) {
  function onKeydown(e) {
    if (game.gameOver.value || game.won.value) return
    if (anyModalOpen()) return

    const key = e.key
    if (key >= '1' && key <= '9') {
      e.preventDefault()
      game.inputNumber(parseInt(key, 10))
      return
    }
    if (key === 'Backspace' || key === 'Delete') {
      e.preventDefault()
      game.erase()
      return
    }
    if (key === 'n' || key === 'N') {
      e.preventDefault()
      game.toggleNotes()
      return
    }
    if (key === 'z' || key === 'Z') {
      e.preventDefault()
      game.undo()
      return
    }
    if (key === 'h' || key === 'H') {
      e.preventDefault()
      game.giveHint()
      return
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      e.preventDefault()
      if (!game.selected.value) {
        game.selectCell(0, 0)
        return
      }
      let { row, col } = game.selected.value
      if (key === 'ArrowUp') row = Math.max(0, row - 1)
      if (key === 'ArrowDown') row = Math.min(8, row + 1)
      if (key === 'ArrowLeft') col = Math.max(0, col - 1)
      if (key === 'ArrowRight') col = Math.min(8, col + 1)
      game.selectCell(row, col)
    }
  }

  onMounted(() => document.addEventListener('keydown', onKeydown))
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
}
