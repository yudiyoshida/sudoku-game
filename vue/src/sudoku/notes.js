export function noteToggle(mask, n) {
  return mask ^ (1 << (n - 1))
}

export function noteHas(mask, n) {
  return (mask & (1 << (n - 1))) !== 0
}

export function cloneNotes(notes) {
  return notes.map((row) => [...row])
}

export function removeNoteFromPeers(notes, row, col, num) {
  const bitClear = ~(1 << (num - 1))
  const next = cloneNotes(notes)
  for (let c = 0; c < 9; c++) next[row][c] &= bitClear
  for (let r = 0; r < 9; r++) next[r][col] &= bitClear
  const br = Math.floor(row / 3) * 3
  const bc = Math.floor(col / 3) * 3
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      next[r][c] &= bitClear
    }
  }
  return next
}
