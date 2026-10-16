import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { BOARD_SIZE, createGame, changeDirection, advanceGame } from '../../games/snake';
import Icon from '../layout/Icon';
import './SnakeGame.css';

const directions = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left', z: 'up', d: 'right', s: 'down', q: 'left', w: 'up', a: 'left' };
const statusLabels = { ready: 'Prêt à jouer', running: 'En cours', paused: 'En pause', over: 'Partie terminée', won: 'Bravo, grille remplie !' };
const angles = { right: 0, down: 90, left: 180, up: 270 };
const directionLabels = { right: 'droite', down: 'bas', left: 'gauche', up: 'haut' };

function readRecord(key) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

export default function SnakeGame() {
  const userId = useSelector((state) => state.auth.user?._id);
  const recordKey = userId ? `devconnector:snake:${userId}` : null;
  const [game, setGame] = useState(createGame);
  const [speed, setSpeed] = useState(160);
  const [record, setRecord] = useState(() => recordKey ? readRecord(recordKey) : 0);
  const board = useRef(null);
  const running = game.status === 'running';

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setGame((current) => advanceGame(current)), speed);
    return () => window.clearInterval(timer);
  }, [running, speed]);

  useEffect(() => {
    if (!recordKey) return;
    setRecord(readRecord(recordKey));
  }, [recordKey]);

  useEffect(() => {
    if (!recordKey) return;
    const saved = readRecord(recordKey);
    setRecord((current) => Math.max(current, saved, game.score));
    if (game.score <= saved) return;
    try { localStorage.setItem(recordKey, String(game.score)); } catch { /* The game also works without browser storage. */ }
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
    setGame((current) => current.status === 'paused' ? { ...current, status: 'running' } : { ...createGame(), status: 'running' });
    focusBoard();
  };
  const pause = () => {
    setGame((current) => ({ ...current, status: current.status === 'running' ? 'paused' : current.status }));
    focusBoard();
  };
  const turn = (direction) => {
    setGame((current) => changeDirection(current, direction));
    focusBoard();
  };
  const onKeyDown = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = directions[event.key] || directions[event.key.toLowerCase()];
    if (direction) {
      event.preventDefault();
      turn(direction);
    } else if (event.key === ' ' || event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault();
      if (event.repeat) return;
      if (running) pause();
      else if (event.key !== 'Escape') start();
    }
  };

  return (
    <section className="container snake-page">
      <div className="snake-heading">
        <div><span className="eyebrow">UNE PETITE PAUSE ENTRE DEUX IDÉES</span><h1 className="large">Le jeu du serpent</h1><p className="lead">Un classique, juste pour le plaisir. Jusqu’où irez-vous ?</p></div>
        <span className="snake-game-icon"><Icon name="game" size={28} /></span>
      </div>
      <div className="card snake-card">
        <div className="snake-scoreboard">
          <div><span>Score</span><strong aria-live="polite" aria-label={`Score : ${game.score}`}>{game.score}</strong></div>
          <div><span>Mon record</span><strong aria-label={`Mon record : ${record}`}>{record}</strong></div>
          <span className={`snake-status snake-status-${game.status}`} role="status">{statusLabels[game.status]}</span>
        </div>
        <p id="snake-board-description" className="snake-board-description">Tête : colonne {game.snake[0].x + 1}, ligne {game.snake[0].y + 1}. Direction : {directionLabels[game.direction]}. {game.food ? `Fruit : colonne ${game.food.x + 1}, ligne ${game.food.y + 1}.` : 'Tous les fruits ont été mangés.'}</p>
        <div className="snake-board" ref={board} tabIndex={0} role="application" aria-label="Plateau du jeu du serpent" aria-describedby="snake-instructions snake-board-description" onKeyDown={onKeyDown}>
          <svg viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`} aria-hidden="true">
            <defs><pattern id="snake-grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M 1 0 L 0 0 0 1" fill="none" stroke="#294050" strokeWidth="0.035" /></pattern></defs>
            <rect width={BOARD_SIZE} height={BOARD_SIZE} fill="url(#snake-grid)" />
            {game.food && <g className="snake-food"><circle cx={game.food.x + 0.5} cy={game.food.y + 0.5} r="0.3" fill="#ffa65a" /><path d={`M${game.food.x + 0.5} ${game.food.y + 0.23}q0.05 -0.22 0.22 -0.18`} fill="none" stroke="#8de0a8" strokeWidth="0.09" /></g>}
            {game.snake.map((cell, index) => <rect key={`${cell.x}-${cell.y}`} x={cell.x + 0.06} y={cell.y + 0.06} width="0.88" height="0.88" rx="0.2" fill={index === 0 ? '#b0f1cc' : '#5dcc99'} />)}
            <g transform={`translate(${game.snake[0].x + 0.5} ${game.snake[0].y + 0.5}) rotate(${angles[game.direction]})`} fill="#123a2c"><circle cx="0.18" cy="-0.2" r="0.07" /><circle cx="0.18" cy="0.2" r="0.07" /></g>
          </svg>
          {game.status !== 'running' && <div className="snake-overlay">
            <strong>{game.status === 'ready' ? 'À vous de jouer' : game.status === 'paused' ? 'On reprend ?' : game.status === 'won' ? 'Une partie parfaite !' : 'Bien joué !'}</strong>
            <p>{game.status === 'ready' ? 'Attrapez les fruits. Évitez les murs et votre queue.' : game.status === 'paused' ? 'Votre serpent vous attend.' : `Vous avez marqué ${game.score} point${game.score > 1 ? 's' : ''}.`}</p>
            <span>{game.status === 'paused' ? 'Continuer ou Entrée pour reprendre' : game.status === 'ready' ? 'Commencer ou Entrée pour jouer' : 'Rejouer ou Entrée pour recommencer'}</span>
          </div>}
        </div>
        <div className="snake-actions">
          {running ? <button className="btn btn-outline" onClick={pause}>Mettre en pause</button> : <button className="btn btn-primary" onClick={start}>{game.status === 'paused' ? 'Continuer' : ['over', 'won'].includes(game.status) ? 'Rejouer' : 'Commencer'}</button>}
          <label className="snake-speed">Vitesse<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} disabled={running}><option value={240}>Tranquille</option><option value={160}>Classique</option><option value={100}>Rapide</option></select></label>
        </div>
        <div className="snake-help">
          <div id="snake-instructions"><h2>Comment jouer ?</h2><p>Dirigez le serpent avec les flèches du clavier, ZQSD ou les boutons ci-contre. Chaque fruit rapporte 10 points.</p><p><kbd>Espace</kbd> pour mettre en pause ou reprendre. Cliquez sur le plateau pour activer les commandes au clavier.</p><small>Votre record est conservé sur cet appareil pour votre compte.</small></div>
          <div className="snake-pad" role="group" aria-label="Commandes tactiles">
            <button className="snake-up" aria-label="Aller vers le haut" onClick={() => turn('up')}><Icon name="arrow" /></button>
            <button className="snake-left" aria-label="Aller vers la gauche" onClick={() => turn('left')}><Icon name="arrow" /></button>
            <button className="snake-down" aria-label="Aller vers le bas" onClick={() => turn('down')}><Icon name="arrow" /></button>
            <button className="snake-right" aria-label="Aller vers la droite" onClick={() => turn('right')}><Icon name="arrow" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
