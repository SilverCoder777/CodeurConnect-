export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const SHAPES = Object.freeze(Object.fromEntries(Object.entries({
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]]
}).map(([type, matrix]) => [type, Object.freeze(matrix.map((row) => Object.freeze(row)))])));

const LINE_POINTS = [0, 100, 300, 500, 800];
const emptyRow = () => Array(BOARD_WIDTH).fill(null);
const copyMatrix = (matrix) => matrix.map((row) => [...row]);

function takeType(bag, random) {
  let available = bag;
  if (available.length === 0) {
    available = Object.keys(SHAPES);
    for (let index = available.length - 1; index > 0; index -= 1) {
      const other = Math.min(index, Math.max(0, Math.floor(random() * (index + 1))));
      [available[index], available[other]] = [available[other], available[index]];
    }
  }
  return { type: available[0], bag: available.slice(1) };
}

function spawnPiece(type) {
  const matrix = copyMatrix(SHAPES[type]);
  return { type, matrix, x: Math.floor((BOARD_WIDTH - matrix.length) / 2), y: 0 };
}

function fits(board, piece) {
  return piece.matrix.every((row, rowIndex) => row.every((cell, columnIndex) => {
    if (!cell) return true;
    const x = piece.x + columnIndex;
    const y = piece.y + rowIndex;
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT && board[y][x] === null;
  }));
}

export function createTetris(random = Math.random) {
  const first = takeType([], random);
  const next = takeType(first.bag, random);
  return {
    board: Array.from({ length: BOARD_HEIGHT }, emptyRow),
    active: spawnPiece(first.type),
    next: next.type,
    bag: next.bag,
    score: 0,
    lines: 0,
    level: 1,
    status: 'ready',
    lastClear: 0
  };
}

export function movePiece(game, dx) {
  if (game.status !== 'running' || !game.active || !Number.isInteger(dx) || dx === 0) return game;
  const step = Math.sign(dx);
  // Check every intermediate position so a larger movement cannot cross a block.
  for (let distance = 1; distance <= Math.abs(dx); distance += 1) {
    if (!fits(game.board, { ...game.active, x: game.active.x + step * distance })) return game;
  }
  return { ...game, active: { ...game.active, x: game.active.x + dx } };
}

export function rotatePiece(game, direction = 1) {
  if (game.status !== 'running' || !game.active || game.active.type === 'O' || ![1, -1].includes(direction)) return game;
  const original = game.active.matrix;
  const size = original.length;
  const matrix = original.map((row, y) => row.map((cell, x) =>
    direction === 1 ? original[size - x - 1][y] : original[x][size - y - 1]));

  // Small wall and floor kicks make rotations forgiving without crossing the board.
  for (const dy of [0, -1, -2]) {
    for (const dx of [0, -1, 1, -2, 2]) {
      const active = { ...game.active, matrix, x: game.active.x + dx, y: game.active.y + dy };
      if (fits(game.board, active)) return { ...game, active };
    }
  }
  return game;
}

function lockPiece(game, random) {
  const board = game.board.map((row) => [...row]);
  const { active } = game;
  active.matrix.forEach((row, y) => row.forEach((cell, x) => {
    if (cell) board[active.y + y][active.x + x] = active.type;
  }));

  const remaining = board.filter((row) => row.some((cell) => cell === null));
  const lastClear = BOARD_HEIGHT - remaining.length;
  const clearedBoard = [...Array.from({ length: lastClear }, emptyRow), ...remaining];
  const lines = game.lines + lastClear;
  const nextActive = spawnPiece(game.next);
  const next = takeType(game.bag, random);
  const blocked = !fits(clearedBoard, nextActive);

  return {
    ...game,
    board: clearedBoard,
    active: blocked ? null : nextActive,
    next: next.type,
    bag: next.bag,
    score: game.score + LINE_POINTS[lastClear] * game.level,
    lines,
    level: 1 + Math.floor(lines / 10),
    status: blocked ? 'over' : 'running',
    lastClear
  };
}

function descend(game, points, random) {
  if (game.status !== 'running' || !game.active) return game;
  const active = { ...game.active, y: game.active.y + 1 };
  return fits(game.board, active)
    ? { ...game, active, score: game.score + points }
    : lockPiece(game, random);
}

export function tickTetris(game, random = Math.random) {
  return descend(game, 0, random);
}

export function softDrop(game, random = Math.random) {
  return descend(game, 1, random);
}

export function getGhostPiece(game) {
  if (!game.active) return null;
  const active = { ...game.active, matrix: copyMatrix(game.active.matrix) };
  while (fits(game.board, { ...active, y: active.y + 1 })) active.y += 1;
  return active;
}

export function hardDrop(game, random = Math.random) {
  if (game.status !== 'running' || !game.active) return game;
  const active = getGhostPiece(game);
  const score = game.score + (active.y - game.active.y) * 2;
  return lockPiece({ ...game, active, score }, random);
}

export function getDropInterval(level) {
  return Math.max(90, Math.round(800 * 0.85 ** Math.max(0, level - 1)));
}
