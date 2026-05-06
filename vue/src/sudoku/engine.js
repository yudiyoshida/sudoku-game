export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function isValidPlacement(board, row, col, num) {
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false
  }
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false
  }
  const br = Math.floor(row / 3) * 3
  const bc = Math.floor(col / 3) * 3
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (board[r][c] === num) return false
    }
  }
  return true
}

export function solveSudoku(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
        for (const num of nums) {
          if (isValidPlacement(board, r, c, num)) {
            board[r][c] = num
            if (solveSudoku(board)) return true
            board[r][c] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

export function generateBoard(difficulty) {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0))
  for (let box = 0; box < 9; box += 3) {
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
    let idx = 0
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        board[box + r][box + c] = nums[idx++]
      }
    }
  }
  solveSudoku(board)

  const solution = board.map((r) => [...r])

  const removeCounts = { easy: 36, medium: 46, hard: 54 }
  const toRemove = removeCounts[difficulty] || 36
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9]),
  )
  for (let i = 0; i < toRemove; i++) {
    const [r, c] = positions[i]
    board[r][c] = 0
  }

  return { puzzle: board, solution }
}
