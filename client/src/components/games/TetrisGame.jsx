import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { BOARD_WIDTH, BOARD_HEIGHT, SHAPES, createTetris, movePiece, rotatePiece, tickTetris, softDrop, hardDrop, getGhostPiece, getDropInterval } from '../../games/tetris';
import Icon from '../layout/Icon';
import './TetrisGame.css';

const colors = { I: '#65d5df', O: '#f3d574', T: '#bda2ee', S: '#79d6ab', Z: '#ef9292', J: '#83aef0', L: '#efb077' };
const statusLabels = { ready: 'Prêt à jouer', running: 'En cours', paused: 'En pause', over: 'Partie terminée' };

function readRecord(key) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch { return 0; }
}

function PieceCells({ piece, ghost = false }) {
  if (!piece) return null;
  return piece.matrix.flatMap((row, y) => row.map((cell, x) => cell ?
    <rect key={`${x}-${y}`} x={piece.x + x + 0.06} y={piece.y + y + 0.06} width="0.88" height="0.88" rx="0.09" fill={ghost ? 'none' : colors[piece.type]} stroke={ghost ? colors[piece.type] : '#ffffff35'} strokeWidth={ghost ? '0.065' : '0.035'} opacity={ghost ? 0.4 : 1} /> : null));
}

export default function TetrisGame() {
  const userId = useSelector((state) => state.auth.user?._id);
  const recordKey = userId ? `devconnector:tetris:${userId}` : null;
  const [game, setGame] = useState(createTetris);
  const [record, setRecord] = useState(() => recordKey ? readRecord(recordKey) : 0);
  const board = useRef(null);
  const running = game.status === 'running';
  const ghost = getGhostPiece(game);
  const interval = getDropInterval(game.level);
  const activeCells = game.active ? game.active.matrix.flatMap((row, y) => row.flatMap((cell, x) => cell ? [{ x: game.active.x + x, y: game.active.y + y }] : [])) : [];
  const activeColumn = activeCells.length ? Math.min(...activeCells.map((cell) => cell.x)) + 1 : 0;
  const activeRow = activeCells.length ? Math.min(...activeCells.map((cell) => cell.y)) + 1 : 0;
  const columnHeights = Array.from({ length: BOARD_WIDTH }, (_, x) => {
    const top = game.board.findIndex((row) => row[x]);
    return top < 0 ? 0 : BOARD_HEIGHT - top;
  });

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setGame((current) => tickTetris(current)), interval);
    return () => window.clearInterval(timer);
  }, [running, interval]);

  useEffect(() => { setRecord(recordKey ? readRecord(recordKey) : 0); }, [recordKey]);
  useEffect(() => {
    if (!recordKey) return;
    const saved = readRecord(recordKey);
    setRecord((current) => Math.max(current, saved, game.score));
    if (game.score <= saved) return;
    try { localStorage.setItem(recordKey, String(game.score)); } catch { /* A local record is optional. */ }
  }, [game.score, recordKey]);

  useEffect(() => {
    const pause = () => setGame((current) => current.status === 'running' ? { ...current, status: 'paused' } : current);
    const onVisibilityChange = () => { if (document.hidden) pause(); };
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const focusBoard = () => board.current?.focus({ preventScroll: true });
  const start = () => {
    setGame((current) => current.status === 'paused' ? { ...current, status: 'running' } : { ...createTetris(), status: 'running' });
    focusBoard();
  };
  const pause = () => {
    setGame((current) => current.status === 'running' ? { ...current, status: 'paused' } : current);
    focusBoard();
  };
  const act = (operation) => { setGame(operation); focusBoard(); };
  const onKeyDown = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowdown', 'arrowup', ' ', 'z', 'x', 'p', 'escape', 'enter'].includes(key)) event.preventDefault();
    else return;
    if (key === 'enter' || key === 'p') {
      if (!event.repeat) running ? pause() : start();
    } else if (key === 'escape') pause();
    else if (key === 'arrowleft') act((current) => movePiece(current, -1));
    else if (key === 'arrowright') act((current) => movePiece(current, 1));
    else if (key === 'arrowdown') act((current) => softDrop(current));
    else if (!event.repeat && key === ' ') act((current) => hardDrop(current));
    else if (!event.repeat) act((current) => rotatePiece(current, key === 'z' ? -1 : 1));
  };

  return (
    <section className="container tetris-page">
      <div className="tetris-heading"><div><span className="eyebrow">UNE PIÈCE APRÈS L’AUTRE</span><h1 className="large">Tetris</h1><p className="lead">Faites de la place aux bonnes idées. Et aux prochaines pièces.</p></div><span className="tetris-game-icon"><Icon name="blocks" size={28} /></span></div>
      <div className="card tetris-card">
        <div className="tetris-scoreboard">
          <div><span>Score</span><strong aria-live="polite" aria-label={`Score : ${game.score}`}>{game.score}</strong></div>
          <div><span>Mon record</span><strong aria-label={`Mon record : ${record}`}>{record}</strong></div>
          <div><span>Lignes</span><strong aria-live="polite" aria-label={`Lignes : ${game.lines}`}>{game.lines}</strong></div>
          <div><span>Niveau</span><strong aria-label={`Niveau : ${game.level}`}>{game.level}</strong></div>
        </div>
        <div className="tetris-game-status" role="status">{statusLabels[game.status]}</div>
        <p id="tetris-board-description" className="tetris-sr-only">{game.active ? `Pièce ${game.active.type}, colonne ${activeColumn}, ligne ${activeRow}.` : 'Aucune pièce active.'} Hauteur des colonnes de gauche à droite : {columnHeights.join(', ')}. Prochaine pièce : {game.next}.</p>
        <div className="tetris-play-area">
          <div className="tetris-board" ref={board} tabIndex={0} role="application" aria-label="Plateau de Tetris" aria-describedby="tetris-instructions tetris-board-description" onKeyDown={onKeyDown}>
            <svg viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} aria-hidden="true">
              <defs><pattern id="tetris-grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M 1 0 L 0 0 0 1" fill="none" stroke="#294050" strokeWidth="0.035" /></pattern></defs>
              <rect width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="url(#tetris-grid)" />
              {game.board.flatMap((row, y) => row.map((type, x) => type ? <rect key={`${x}-${y}`} x={x + 0.06} y={y + 0.06} width="0.88" height="0.88" rx="0.09" fill={colors[type]} stroke="#ffffff35" strokeWidth="0.035" /> : null))}
              <PieceCells piece={ghost} ghost />
              <PieceCells piece={game.active} />
            </svg>
            {game.status !== 'running' && <div className="tetris-overlay"><strong>{game.status === 'ready' ? 'À vous de jouer' : game.status === 'paused' ? 'Petite pause' : 'Bien joué !'}</strong><p>{game.status === 'ready' ? 'Alignez les pièces. Complétez les lignes.' : game.status === 'paused' ? 'Reprenez quand vous voulez.' : `${game.score} points · ${game.lines} ligne${game.lines > 1 ? 's' : ''}`}</p><span>{game.status === 'paused' ? 'Continuer ou Entrée' : game.status === 'ready' ? 'Commencer ou Entrée' : 'Rejouer ou Entrée'}</span></div>}
          </div>
          <aside className="tetris-preview" aria-label="Informations de la partie">
            <h2>À suivre</h2>
            <svg viewBox="0 0 5 5" role="img" aria-label={`Prochaine pièce : ${game.next}`}><PieceCells piece={{ type: game.next, matrix: SHAPES[game.next], x: (5 - SHAPES[game.next][0].length) / 2, y: (5 - SHAPES[game.next].length) / 2 }} /></svg>
            <div className="tetris-scoring"><h3>Chaque ligne compte</h3><p><span>1 ligne</span><strong>100</strong></p><p><span>2 lignes</span><strong>300</strong></p><p><span>3 lignes</span><strong>500</strong></p><p><span>4 lignes</span><strong>800</strong></p><small>Points × niveau.<br />Un niveau toutes les 10 lignes.</small></div>
          </aside>
        </div>
        <div className="tetris-actions">{running ? <button className="btn btn-outline" onClick={pause}>Mettre en pause</button> : <button className="btn btn-primary" onClick={start}>{game.status === 'paused' ? 'Continuer' : game.status === 'over' ? 'Rejouer' : 'Commencer'}</button>}<small>Votre record reste sur cet appareil, pour votre compte.</small></div>
        <div className="tetris-controls" role="group" aria-label="Commandes tactiles de Tetris">
          <button aria-label="Déplacer à gauche" onClick={() => act((current) => movePiece(current, -1))} disabled={!running}><Icon name="arrow" className="tetris-left" /><span>Gauche</span></button>
          <button aria-label="Tourner la pièce" onClick={() => act((current) => rotatePiece(current))} disabled={!running}><Icon name="rotate" /><span>Tourner</span></button>
          <button aria-label="Déplacer à droite" onClick={() => act((current) => movePiece(current, 1))} disabled={!running}><Icon name="arrow" /><span>Droite</span></button>
          <button aria-label="Descendre la pièce" onClick={() => act((current) => softDrop(current))} disabled={!running}><Icon name="arrow" className="tetris-down" /><span>Descendre</span></button>
          <button className="tetris-drop" aria-label="Faire tomber la pièce" onClick={() => act((current) => hardDrop(current))} disabled={!running}><Icon name="drop" /><span>Chute rapide</span></button>
        </div>
        <div className="tetris-instructions" id="tetris-instructions"><h2>Comment jouer ?</h2><p><kbd>←</kbd> <kbd>→</kbd> pour déplacer, <kbd>↑</kbd> pour tourner, <kbd>↓</kbd> pour descendre. <kbd>Espace</kbd> fait tomber la pièce. <kbd>P</kbd> met en pause ou reprend la partie.</p><p>Complétez des lignes pour les effacer. Le contour indique où la pièce atterrira. La descente manuelle rapporte 1 point par case, la chute rapide 2 points. La partie s’arrête quand les pièces atteignent le haut du plateau.</p></div>
      </div>
    </section>
  );
}
