import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfettiCanvas } from './components/ConfettiCanvas';
import {
  applyErase,
  applyGameOverRetry,
  applyHint,
  applyInputNumber,
  applyUndo,
  createNewGame,
} from './sudoku/gameModel';
import { noteHas } from './sudoku/notes';

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function applyHighlightClass(sel, r, c, puzzle) {
  if (!sel) return {};
  const classes = {};
  if (r === sel.row && c === sel.col) {
    classes.selected = true;
    return classes;
  }
  const sameRow = r === sel.row;
  const sameCol = c === sel.col;
  const sameBox =
    Math.floor(r / 3) === Math.floor(sel.row / 3) &&
    Math.floor(c / 3) === Math.floor(sel.col / 3);
  if (sameRow || sameCol || sameBox) classes.highlighted = true;
  const selVal = puzzle[sel.row][sel.col];
  const cellVal = puzzle[r][c];
  if (selVal !== 0 && cellVal === selVal) classes.sameNumber = true;
  return classes;
}

export default function App() {
  const [game, setGame] = useState(() => createNewGame('easy'));
  const [timer, setTimer] = useState(0);
  const [modalOpen, setModalOpen] = useState(null);
  const [confettiTick, setConfettiTick] = useState(0);
  const [shakeCell, setShakeCell] = useState(null);
  const [popCell, setPopCell] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastSeq = useRef(0);

  const gameRef = useRef(game);
  gameRef.current = game;

  const addToast = useCallback((message, type = '') => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t, { id, message, type, out: false }]);
    setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x)));
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 300);
    }, 2000);
  }, []);

  const timerActive = !game.gameOver && !game.won;

  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive]);

  const initGame = useCallback((difficulty) => {
    setGame(createNewGame(difficulty));
    setTimer(0);
    setModalOpen(null);
  }, []);

  const selectCell = useCallback((r, c) => {
    setGame((g) => {
      if (g.gameOver || g.won) return g;
      return { ...g, selected: { row: r, col: c } };
    });
  }, []);

  const inputNumber = useCallback(
    (num) => {
      const sel = gameRef.current.selected;
      const res = applyInputNumber(gameRef.current, num);
      if (!res?.state) return;
      setGame(res.state);
      if (res.effect === 'wrong') {
        if (sel) {
          setShakeCell(sel);
          setTimeout(() => setShakeCell(null), 400);
        }
        addToast('Wrong number', 'error');
        if (res.state.gameOver) {
          setTimeout(() => setModalOpen('gameover'), 600);
        }
      } else if (res.effect === 'correct') {
        if (sel) {
          setPopCell(sel);
          setTimeout(() => setPopCell(null), 250);
        }
      } else if (res.effect === 'win') {
        if (sel) {
          setPopCell(sel);
          setTimeout(() => setPopCell(null), 250);
        }
        setTimeout(() => {
          setModalOpen('win');
          setConfettiTick((k) => k + 1);
        }, 400);
      }
    },
    [addToast],
  );

  const undo = useCallback(() => {
    setGame((g) => {
      const next = applyUndo(g);
      return next ?? g;
    });
  }, []);

  const erase = useCallback(() => {
    setGame((g) => {
      const next = applyErase(g);
      return next ?? g;
    });
  }, []);

  const toggleNotes = useCallback(() => {
    setGame((g) => ({ ...g, notesMode: !g.notesMode }));
  }, []);

  const giveHint = useCallback(() => {
    const g = gameRef.current;
    if (g.gameOver || g.won) return;
    if (g.hints <= 0) {
      addToast('No hints remaining', 'error');
      return;
    }
    const res = applyHint(g);
    if (!res) return;
    setGame(res.state);
    if (res.state.selected) {
      setPopCell(res.state.selected);
      setTimeout(() => setPopCell(null), 250);
    }
    addToast('Hint revealed', 'success');
    if (res.effect === 'win') {
      setTimeout(() => {
        setModalOpen('win');
        setConfettiTick((k) => k + 1);
      }, 400);
    }
  }, [addToast]);

  const onGameOverRetry = useCallback(() => {
    setModalOpen(null);
    setGame((g) => applyGameOverRetry(g));
    setTimer(0);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const g = gameRef.current;
      if (g.gameOver || g.won) return;
      if (modalOpen) return;

      const key = e.key;

      if (key >= '1' && key <= '9') {
        e.preventDefault();
        inputNumber(parseInt(key, 10));
        return;
      }

      if (key === 'Backspace' || key === 'Delete') {
        e.preventDefault();
        setGame((cur) => {
          const next = applyErase(cur);
          return next ?? cur;
        });
        return;
      }

      if (key === 'n' || key === 'N') {
        e.preventDefault();
        setGame((cur) => ({ ...cur, notesMode: !cur.notesMode }));
        return;
      }

      if (key === 'z' || key === 'Z') {
        e.preventDefault();
        setGame((cur) => {
          const next = applyUndo(cur);
          return next ?? cur;
        });
        return;
      }

      if (key === 'h' || key === 'H') {
        e.preventDefault();
        const cur = gameRef.current;
        if (cur.hints <= 0) {
          addToast('No hints remaining', 'error');
          return;
        }
        const res = applyHint(cur);
        if (!res) return;
        setGame(res.state);
        if (res.state.selected) {
          setPopCell(res.state.selected);
          setTimeout(() => setPopCell(null), 250);
        }
        addToast('Hint revealed', 'success');
        if (res.effect === 'win') {
          setTimeout(() => {
            setModalOpen('win');
            setConfettiTick((k) => k + 1);
          }, 400);
        }
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
        if (!g.selected) {
          selectCell(0, 0);
          return;
        }
        let { row, col } = g.selected;
        if (key === 'ArrowUp') row = Math.max(0, row - 1);
        if (key === 'ArrowDown') row = Math.min(8, row + 1);
        if (key === 'ArrowLeft') col = Math.max(0, col - 1);
        if (key === 'ArrowRight') col = Math.min(8, col + 1);
        selectCell(row, col);
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen, inputNumber, selectCell, addToast]);

  const numpadRemaining = (n) => {
    let count = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (
          game.puzzle[r][c] === n &&
          game.puzzle[r][c] === game.solution[r][c]
        ) {
          count++;
        }
      }
    }
    return 9 - count;
  };

  const diffLabel =
    game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1);

  return (
    <>
      <div className="bg-blob blob-1" aria-hidden="true" />
      <div className="bg-blob blob-2" aria-hidden="true" />
      <div className="bg-blob blob-3" aria-hidden="true" />

      <ConfettiCanvas launchId={confettiTick} />

      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type}${t.out ? ' out' : ''}`}
          >
            {t.message}
          </div>
        ))}
      </div>

      <div id="app">
        <h1 className="game-title">
          Sudo<span>ku</span>
        </h1>

        <div className="stats-bar">
          <div className="stat-item">
            <i className="fa-regular fa-clock" aria-hidden="true" />
            <span className="stat-value">{formatTime(timer)}</span>
          </div>
          <div className="stat-item">
            <i className="fa-regular fa-circle-xmark" aria-hidden="true" />
            <span
              className={`stat-value${game.mistakes >= 2 ? ' error' : ''}`}
            >
              {game.mistakes}/{game.maxMistakes}
            </span>
          </div>
          <div className="stat-item">
            <span className={`difficulty-badge diff-${game.difficulty}`}>
              {diffLabel}
            </span>
          </div>
        </div>

        <div className="tools-bar">
          <button
            type="button"
            className="tool-btn"
            aria-label="Undo"
            onClick={undo}
          >
            <i className="fa-solid fa-rotate-left" aria-hidden="true" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            className="tool-btn"
            aria-label="Erase"
            onClick={erase}
          >
            <i className="fa-regular fa-rectangle-xmark" aria-hidden="true" />
            <span>Erase</span>
          </button>
          <button
            type="button"
            className={`tool-btn${game.notesMode ? ' active' : ''}`}
            aria-label="Toggle notes mode"
            onClick={toggleNotes}
          >
            <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
            <span>Notes</span>
          </button>
          <button
            type="button"
            className="tool-btn"
            aria-label="Get a hint"
            onClick={giveHint}
          >
            <i className="fa-regular fa-lightbulb" aria-hidden="true" />
            <span>Hint</span>
            <span className="tool-count">{game.hints}</span>
          </button>
        </div>

        <div className="grid-wrapper">
          <div
            className="sudoku-grid"
            role="grid"
            aria-label="Sudoku puzzle grid"
          >
            {Array.from({ length: 81 }, (_, i) => {
              const r = Math.floor(i / 9);
              const c = i % 9;
              const hi = applyHighlightClass(
                game.selected,
                r,
                c,
                game.puzzle,
              );
              const val = game.puzzle[r][c];
              const notesMask = game.notes[r][c];
              const boxRight = c === 2 || c === 5 || c === 8;
              const boxBottom = r === 2 || r === 5 || r === 8;
              const shaking = shakeCell?.row === r && shakeCell?.col === c;
              const popping = popCell?.row === r && popCell?.col === c;

              return (
                <div
                  key={`${r}-${c}`}
                  role="presentation"
                  className={[
                    'cell',
                    boxRight && 'box-right',
                    boxBottom && 'box-bottom',
                    hi.selected && 'selected',
                    hi.highlighted && 'highlighted',
                    hi.sameNumber && 'same-number',
                    shaking && 'shake',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  tabIndex={0}
                  data-row={r}
                  data-col={c}
                  onClick={() => selectCell(r, c)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectCell(r, c);
                    }
                  }}
                >
                  {val !== 0 ? (
                    <span
                      className={[
                        'cell-value',
                        game.given[r][c] && 'given',
                        !game.given[r][c] &&
                          val !== game.solution[r][c] &&
                          'user-input error',
                        !game.given[r][c] &&
                          val === game.solution[r][c] &&
                          'user-input',
                        popping && 'pop',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {val}
                    </span>
                  ) : notesMask !== 0 ? (
                    <div className="notes-grid">
                      {Array.from({ length: 9 }, (_, j) => {
                        const n = j + 1;
                        return (
                          <span key={n} className="note-num">
                            {noteHas(notesMask, n) ? n : ''}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="numpad">
          {Array.from({ length: 9 }, (_, i) => {
            const n = i + 1;
            const remaining = numpadRemaining(n);
            return (
              <button
                key={n}
                type="button"
                className={`num-btn${remaining <= 0 ? ' completed' : ''}`}
                data-num={n}
                aria-label={`Number ${n}`}
                onClick={() => inputNumber(n)}
              >
                <span>{n}</span>
                <span className="num-remaining">{remaining}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="new-game-btn"
          onClick={() => setModalOpen('new')}
        >
          New Game
        </button>
      </div>

      <div
        className={`modal-overlay${modalOpen === 'new' ? ' open' : ''}`}
        id="modal-new-game"
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalOpen(null);
        }}
      >
        <div className="modal-box">
          <div className="modal-title">New Game</div>
          <div className="modal-subtitle">Choose your difficulty level</div>
          <button
            type="button"
            className="diff-card"
            data-diff="easy"
            onClick={() => initGame('easy')}
          >
            <div
              className="diff-icon"
              style={{
                background: 'rgba(92,184,92,0.15)',
                color: '#5CB85C',
              }}
            >
              <i className="fa-solid fa-seedling" aria-hidden="true" />
            </div>
            <div className="diff-card-info">
              <h3>Easy</h3>
              <p>36 blanks — relaxed solving</p>
            </div>
          </button>
          <button
            type="button"
            className="diff-card"
            data-diff="medium"
            onClick={() => initGame('medium')}
          >
            <div
              className="diff-icon"
              style={{
                background: 'rgba(232,168,56,0.15)',
                color: '#E8A838',
              }}
            >
              <i className="fa-solid fa-fire" aria-hidden="true" />
            </div>
            <div className="diff-card-info">
              <h3>Medium</h3>
              <p>46 blanks — some challenge</p>
            </div>
          </button>
          <button
            type="button"
            className="diff-card"
            data-diff="hard"
            onClick={() => initGame('hard')}
          >
            <div
              className="diff-icon"
              style={{
                background: 'rgba(232,84,84,0.15)',
                color: '#E85454',
              }}
            >
              <i className="fa-solid fa-skull" aria-hidden="true" />
            </div>
            <div className="diff-card-info">
              <h3>Hard</h3>
              <p>54 blanks — expert level</p>
            </div>
          </button>
          <button
            type="button"
            className="modal-btn modal-btn-ghost"
            id="btn-cancel-new"
            onClick={() => setModalOpen(null)}
          >
            Cancel
          </button>
        </div>
      </div>

      <div
        className={`modal-overlay${modalOpen === 'win' ? ' open' : ''}`}
        id="modal-win"
      >
        <div className="modal-box" style={{ textAlign: 'center' }}>
          <div className="modal-title" style={{ color: 'var(--accent)' }}>
            Puzzle Complete
          </div>
          <div className="modal-subtitle">You solved it — well done!</div>
          <div className="win-stats">
            <div className="win-stat">
              <div className="win-stat-value">{formatTime(timer)}</div>
              <div className="win-stat-label">Time</div>
            </div>
            <div className="win-stat">
              <div className="win-stat-value">{game.mistakes}</div>
              <div className="win-stat-label">Mistakes</div>
            </div>
            <div className="win-stat">
              <div className="win-stat-value">{diffLabel}</div>
              <div className="win-stat-label">Difficulty</div>
            </div>
          </div>
          <button
            type="button"
            className="modal-btn modal-btn-primary"
            id="btn-win-new"
            onClick={() => setModalOpen('new')}
          >
            Play Again
          </button>
        </div>
      </div>

      <div
        className={`modal-overlay${modalOpen === 'gameover' ? ' open' : ''}`}
        id="modal-gameover"
      >
        <div className="modal-box" style={{ textAlign: 'center' }}>
          <div className="modal-title" style={{ color: 'var(--fg-error)' }}>
            Game Over
          </div>
          <div className="modal-subtitle">
            You made 3 mistakes. Better luck next time!
          </div>
          <button
            type="button"
            className="modal-btn modal-btn-primary"
            id="btn-gameover-retry"
            style={{ marginBottom: 8 }}
            onClick={onGameOverRetry}
          >
            Try Again
          </button>
          <button
            type="button"
            className="modal-btn modal-btn-ghost"
            id="btn-gameover-new"
            onClick={() => setModalOpen('new')}
          >
            New Game
          </button>
        </div>
      </div>
    </>
  );
}
