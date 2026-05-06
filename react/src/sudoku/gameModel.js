import { generateBoard } from './engine';
import {
  cloneNotes,
  noteToggle,
  removeNoteFromPeers,
} from './notes';

export function createNewGame(difficulty) {
  const { puzzle, solution } = generateBoard(difficulty);
  return {
    puzzle: puzzle.map((r) => [...r]),
    solution,
    given: puzzle.map((r) => r.map((v) => v !== 0)),
    notes: Array.from({ length: 9 }, () => Array(9).fill(0)),
    selected: null,
    notesMode: false,
    mistakes: 0,
    maxMistakes: 3,
    hints: 3,
    difficulty,
    history: [],
    gameOver: false,
    won: false,
  };
}

export function checkWin(puzzle, solution) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

function clonePuzzle(puzzle) {
  return puzzle.map((r) => [...r]);
}

export function applyInputNumber(state, num) {
  if (state.gameOver || state.won || !state.selected) return { state: null };
  const { row, col } = state.selected;
  if (state.given[row][col]) return { state: null };

  if (state.notesMode) {
    const prevNotesMask = state.notes[row][col];
    const newNoteMask = noteToggle(prevNotesMask, num);
    const newNotes = cloneNotes(state.notes);
    newNotes[row][col] = newNoteMask;
    const prevVal = state.puzzle[row][col];
    const newPuzzle = clonePuzzle(state.puzzle);
    const history = [...state.history];
    if (prevVal !== 0) {
      history.push({ row, col, prevValue: prevVal, prevNotes: prevNotesMask });
      newPuzzle[row][col] = 0;
    } else {
      history.push({ row, col, prevValue: 0, prevNotes: prevNotesMask });
    }
    return {
      state: {
        ...state,
        puzzle: newPuzzle,
        notes: newNotes,
        history,
      },
    };
  }

  const prevValue = state.puzzle[row][col];
  const prevNotesMask = state.notes[row][col];
  const newPuzzle = clonePuzzle(state.puzzle);
  newPuzzle[row][col] = num;
  let newNotes = cloneNotes(state.notes);
  newNotes[row][col] = 0;

  const history = [
    ...state.history,
    { row, col, prevValue, prevNotes: prevNotesMask },
  ];

  if (num !== state.solution[row][col]) {
    const mistakes = state.mistakes + 1;
    return {
      state: {
        ...state,
        puzzle: newPuzzle,
        notes: newNotes,
        history,
        mistakes,
        gameOver: mistakes >= state.maxMistakes,
      },
      effect: 'wrong',
    };
  }

  newNotes = removeNoteFromPeers(newNotes, row, col, num);
  const next = {
    ...state,
    puzzle: newPuzzle,
    notes: newNotes,
    history,
  };
  if (checkWin(newPuzzle, state.solution)) {
    return { state: { ...next, won: true }, effect: 'win' };
  }
  return { state: next, effect: 'correct' };
}

export function applyUndo(state) {
  if (state.gameOver || state.won || state.history.length === 0) return null;
  const history = [...state.history];
  const move = history.pop();
  const newPuzzle = clonePuzzle(state.puzzle);
  newPuzzle[move.row][move.col] = move.prevValue;
  const newNotes = cloneNotes(state.notes);
  newNotes[move.row][move.col] = move.prevNotes;
  return {
    ...state,
    puzzle: newPuzzle,
    notes: newNotes,
    history,
  };
}

export function applyErase(state) {
  if (state.gameOver || state.won || !state.selected) return null;
  const { row, col } = state.selected;
  if (state.given[row][col]) return null;
  if (state.puzzle[row][col] === 0 && state.notes[row][col] === 0) return null;

  const history = [
    ...state.history,
    {
      row,
      col,
      prevValue: state.puzzle[row][col],
      prevNotes: state.notes[row][col],
    },
  ];
  const newPuzzle = clonePuzzle(state.puzzle);
  newPuzzle[row][col] = 0;
  const newNotes = cloneNotes(state.notes);
  newNotes[row][col] = 0;
  return {
    ...state,
    puzzle: newPuzzle,
    notes: newNotes,
    history,
  };
}

export function applyHint(state) {
  if (state.gameOver || state.won) return null;

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
    if (candidates.length === 0) return null;
    target = candidates[Math.floor(Math.random() * candidates.length)];
  }

  const hints = state.hints - 1;
  const tr = target.row;
  const tc = target.col;
  const solVal = state.solution[tr][tc];

  const history = [
    ...state.history,
    {
      row: tr,
      col: tc,
      prevValue: state.puzzle[tr][tc],
      prevNotes: state.notes[tr][tc],
    },
  ];
  const newPuzzle = clonePuzzle(state.puzzle);
  newPuzzle[tr][tc] = solVal;
  let newNotes = cloneNotes(state.notes);
  newNotes[tr][tc] = 0;
  newNotes = removeNoteFromPeers(newNotes, tr, tc, solVal);

  const next = {
    ...state,
    puzzle: newPuzzle,
    notes: newNotes,
    hints,
    selected: target,
    history,
  };
  if (checkWin(newPuzzle, state.solution)) {
    return { state: { ...next, won: true }, effect: 'win' };
  }
  return { state: next, effect: 'hint' };
}

export function applyGameOverRetry(state) {
  const newPuzzle = state.given.map((row, r) =>
    row.map((isGiven, c) => (isGiven ? state.solution[r][c] : 0)),
  );
  return {
    ...state,
    puzzle: newPuzzle,
    notes: Array.from({ length: 9 }, () => Array(9).fill(0)),
    selected: null,
    notesMode: false,
    mistakes: 0,
    hints: 3,
    history: [],
    gameOver: false,
    won: false,
  };
}
