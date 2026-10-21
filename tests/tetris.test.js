const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  BOARD_WIDTH, BOARD_HEIGHT, SHAPES, createTetris, movePiece, rotatePiece,
  tickTetris, softDrop, hardDrop, getGhostPiece, getDropInterval
} = require('../client/src/games/tetris.js');

const emptyBoard = () => Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
const verticalI = () => Array.from({ length: 4 }, () => [0, 0, 1, 0]);
const piece = (type, x, y, matrix = SHAPES[type]) => ({ type, x, y, matrix: matrix.map((row) => [...row]) });
const running = (overrides = {}) => ({ ...createTetris(() => 0), status: 'running', ...overrides });

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function cells(active) {
  return active.matrix.flatMap((row, y) => row.flatMap((cell, x) => cell ? [{ x: active.x + x, y: active.y + y }] : []));
}

test('a new game has an empty independent board and all seven square tetrominoes', () => {
  const game = createTetris(() => 0);
  assert.equal(BOARD_WIDTH, 10);
  assert.equal(BOARD_HEIGHT, 20);
  assert.equal(game.board.length, BOARD_HEIGHT);
  assert.ok(game.board.every((row) => row.length === BOARD_WIDTH && row.every((cell) => cell === null)));
  assert.notEqual(game.board[0], game.board[1]);
  assert.equal(game.status, 'ready');
  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.equal(game.level, 1);
  assert.equal(game.lastClear, 0);
  assert.equal(game.active.y, 0);
  assert.equal(game.active.x, Math.floor((BOARD_WIDTH - game.active.matrix.length) / 2));
  assert.notEqual(game.active.matrix, SHAPES[game.active.type]);
  assert.equal(game.bag.length, 5);
  assert.equal(new Set([game.active.type, game.next, ...game.bag]).size, 7);
  assert.deepEqual(Object.keys(SHAPES).sort(), ['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
  for (const matrix of Object.values(SHAPES)) {
    assert.ok(matrix.every((row) => row.length === matrix.length && row.every((cell) => cell === 0 || cell === 1)));
    assert.equal(matrix.flat().reduce((sum, cell) => sum + cell, 0), 4);
  }
});

test('the randomizer emits every tetromino once per bag and maintains the next-piece preview', () => {
  let seed = 12345;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
  let game = { ...createTetris(random), status: 'running' };
  const sequence = [];
  for (let index = 0; index < 28; index += 1) {
    sequence.push(game.active.type);
    const expectedNext = game.next;
    game = hardDrop({ ...game, board: emptyBoard() }, random);
    assert.equal(game.active.type, expectedNext);
    assert.equal(game.active.y, 0);
  }
  for (let index = 0; index < sequence.length; index += 7) {
    assert.deepEqual(sequence.slice(index, index + 7).sort(), Object.keys(SHAPES).sort());
  }
});

test('horizontal moves reject walls, occupied cells and paths through a stack', () => {
  const board = emptyBoard();
  board[6][3] = 'J';
  const game = freeze(running({ board, active: piece('O', 0, 5) }));
  assert.equal(movePiece(game, -1), game);
  assert.equal(movePiece(game, 4), game);
  const moved = movePiece(game, 1);
  assert.equal(moved.active.x, 1);
  assert.equal(moved.active.y, 5);
  assert.equal(moved.board, game.board);
  assert.equal(movePiece(moved, 1), moved);
  const atRight = running({ active: piece('O', 8, 5) });
  assert.equal(movePiece(atRight, 1), atRight);
  assert.equal(movePiece(game, 0), game);
  assert.equal(movePiece(game, 0.5), game);
  assert.equal(movePiece(game, 'left'), game);
  assert.equal(game.active.x, 0);
});

test('clockwise and counterclockwise rotations preserve the original game and the square stays stable', () => {
  const game = freeze(running({ active: piece('T', 3, 5) }));
  const rotated = rotatePiece(game);
  assert.deepEqual(rotated.active.matrix, [[0, 1, 0], [0, 1, 1], [0, 1, 0]]);
  assert.deepEqual(rotatePiece(rotated, -1).active.matrix, game.active.matrix);
  let fullTurn = game;
  for (let index = 0; index < 4; index += 1) fullTurn = rotatePiece(fullTurn);
  assert.deepEqual(fullTurn.active, game.active);
  assert.deepEqual(game.active.matrix, SHAPES.T);
  const square = freeze(running({ active: piece('O', 4, 5) }));
  assert.equal(rotatePiece(square), square);
  assert.equal(rotatePiece(game, 0), game);
});

test('wall kicks allow a vertical I to rotate next to either side of the board', () => {
  for (const x of [-2, 7]) {
    const game = freeze(running({ active: piece('I', x, 5, verticalI()) }));
    const rotated = rotatePiece(game);
    assert.notEqual(rotated, game);
    assert.ok(cells(rotated.active).every((cell) => cell.x >= 0 && cell.x < BOARD_WIDTH));
    assert.equal(new Set(cells(rotated.active).map((cell) => cell.y)).size, 1);
    assert.notEqual(rotated.active.x, x);
  }
});

test('floor kicks allow a horizontal I to rotate upward without extending below the board', () => {
  const game = freeze(running({ active: piece('I', 3, 18) }));
  const rotated = rotatePiece(game);
  assert.notEqual(rotated, game);
  assert.equal(rotated.active.y, 16);
  assert.ok(cells(rotated.active).every((cell) => cell.y >= 0 && cell.y < BOARD_HEIGHT));
  assert.equal(new Set(cells(rotated.active).map((cell) => cell.x)).size, 1);
});

test('a rotation is refused when every kick collides with the stack', () => {
  const active = piece('T', 3, 5);
  const board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill('J'));
  for (const { x, y } of cells(active)) board[y][x] = null;
  const game = freeze(running({ board, active }));
  assert.equal(rotatePiece(game), game);
  assert.equal(rotatePiece(game, -1), game);
});

test('gravity moves one row with no points and locks all cells when the piece reaches the floor', () => {
  const game = freeze(running({ active: piece('O', 4, 0) }));
  const moved = tickTetris(game);
  assert.equal(moved.active.y, 1);
  assert.equal(moved.score, 0);
  assert.equal(moved.board, game.board);
  assert.equal(game.active.y, 0);
  const bottom = freeze({ ...game, active: piece('O', 4, 18), lastClear: 2 });
  const locked = tickTetris(bottom);
  for (const y of [18, 19]) for (const x of [4, 5]) assert.equal(locked.board[y][x], 'O');
  assert.equal(locked.board.flat().filter(Boolean).length, 4);
  assert.equal(locked.active.type, game.next);
  assert.equal(locked.active.y, 0);
  assert.equal(locked.status, 'running');
  assert.equal(locked.lastClear, 0);
  assert.equal(bottom.board.flat().filter(Boolean).length, 0);
  assert.notEqual(locked.board, bottom.board);
});

test('the stack stops gravity and the ghost shows the same landing position without mutation', () => {
  const board = emptyBoard();
  board[19][4] = 'L';
  board[19][5] = 'L';
  const game = freeze(running({ board, active: piece('O', 4, 0) }));
  const ghost = getGhostPiece(game);
  assert.equal(ghost.y, 17);
  assert.equal(ghost.x, 4);
  assert.notEqual(ghost, game.active);
  assert.notEqual(ghost.matrix, game.active.matrix);
  const bottom = { ...game, active: ghost };
  const locked = tickTetris(bottom);
  assert.equal(locked.board[17][4], 'O');
  assert.equal(locked.board[18][5], 'O');
  assert.equal(locked.board[19][4], 'L');
  assert.equal(game.active.y, 0);
});

test('soft drop awards one point per descended row and no extra point when locking', () => {
  const game = freeze(running({ active: piece('O', 4, 0), score: 7 }));
  const dropped = softDrop(game);
  assert.equal(dropped.active.y, 1);
  assert.equal(dropped.score, 8);
  assert.equal(game.score, 7);
  const locked = softDrop(freeze({ ...game, active: piece('O', 4, 18) }));
  assert.equal(locked.score, 7);
  assert.equal(locked.board[19][4], 'O');
});

test('hard drop awards two points per descended row and locks immediately, including a zero-distance drop', () => {
  const game = freeze(running({ active: piece('O', 4, 0), score: 5 }));
  const dropped = hardDrop(game);
  assert.equal(dropped.score, 41);
  assert.equal(dropped.board[18][4], 'O');
  assert.equal(dropped.board[19][5], 'O');
  assert.equal(dropped.active.type, game.next);
  assert.equal(dropped.active.y, 0);
  const locked = hardDrop(freeze({ ...game, active: piece('O', 4, 18) }));
  assert.equal(locked.score, 5);
  assert.equal(locked.board[19][4], 'O');
});

test('one, two, three and four completed rows clear together and use the level before the clear', () => {
  const points = [0, 100, 300, 500, 800];
  for (const count of [1, 2, 3, 4]) {
    const board = emptyBoard();
    board[10][0] = 'L';
    for (let y = BOARD_HEIGHT - count; y < BOARD_HEIGHT; y += 1) {
      board[y] = Array.from({ length: BOARD_WIDTH }, (_, x) => x === 4 ? null : 'J');
    }
    const game = freeze(running({ board, active: piece('I', 2, 16, verticalI()), score: 25, lines: 29, level: 3 }));
    const cleared = tickTetris(game);
    assert.equal(cleared.lastClear, count);
    assert.equal(cleared.lines, 29 + count);
    assert.equal(cleared.level, 4);
    assert.equal(cleared.score, 25 + points[count] * 3);
    assert.equal(cleared.board[10 + count][0], 'L');
    assert.equal(cleared.board.length, BOARD_HEIGHT);
    assert.ok(cleared.board.slice(0, count).every((row) => row.every((cell) => cell === null)));
    assert.ok(cleared.board.every((row) => row.some((cell) => cell === null)));
    assert.equal(board[10][0], 'L');
    assert.equal(game.lines, 29);
  }
});

test('hard-drop points and line-clear points are both included', () => {
  const board = emptyBoard();
  board[18] = Array.from({ length: BOARD_WIDTH }, (_, x) => x === 4 || x === 5 ? null : 'J');
  board[19] = [...board[18]];
  const game = freeze(running({ board, active: piece('O', 4, 0), lines: 9, level: 1 }));
  const dropped = hardDrop(game);
  assert.equal(dropped.score, 36 + 300);
  assert.equal(dropped.lastClear, 2);
  assert.equal(dropped.lines, 11);
  assert.equal(dropped.level, 2);
  assert.ok(dropped.board.flat().every((cell) => cell === null));
});

test('a blocked next-piece spawn ends the game and removes the active piece', () => {
  const board = emptyBoard();
  board[0][4] = 'J';
  const game = freeze(running({ board, active: piece('O', 0, 18), next: 'O' }));
  const over = tickTetris(game);
  assert.equal(over.status, 'over');
  assert.equal(over.active, null);
  assert.equal(over.board[0][4], 'J');
  assert.equal(over.board[19][0], 'O');
  assert.equal(getGhostPiece(over), null);
  assert.equal(hardDrop(over), over);
});

test('line clearing happens before checking whether the next spawn is blocked', () => {
  const board = emptyBoard();
  board[0][4] = 'J';
  for (const y of [18, 19]) board[y] = Array.from({ length: BOARD_WIDTH }, (_, x) => x === 4 || x === 5 ? null : 'L');
  const game = freeze(running({ board, active: piece('O', 4, 18), next: 'O' }));
  const cleared = tickTetris(game);
  assert.equal(cleared.lastClear, 2);
  assert.equal(cleared.status, 'running');
  assert.equal(cleared.active.type, 'O');
  assert.equal(cleared.active.y, 0);
  assert.equal(cleared.board[2][4], 'J');
});

test('ready, paused and finished games ignore every gameplay input and do not consume randomness', () => {
  const random = () => assert.fail('An inactive game must not draw a new piece');
  for (const status of ['ready', 'paused', 'over']) {
    const game = freeze(running({ status }));
    assert.equal(movePiece(game, 1), game);
    assert.equal(rotatePiece(game), game);
    assert.equal(tickTetris(game, random), game);
    assert.equal(softDrop(game, random), game);
    assert.equal(hardDrop(game, random), game);
    assert.notEqual(getGhostPiece(game), game.active);
  }
});

test('bag replenishment preserves frozen states and accepts the random range boundaries', () => {
  const game = freeze(running({ active: piece('O', 4, 18), bag: [] }));
  const locked = tickTetris(game, () => 1);
  assert.equal(locked.bag.length, 6);
  assert.equal(new Set([locked.next, ...locked.bag]).size, 7);
  assert.deepEqual(game.bag, []);
  assert.equal(game.active.y, 18);
  assert.ok(Object.hasOwn(SHAPES, locked.next));
});

test('the gravity interval gets shorter with each level and remains bounded', () => {
  assert.equal(getDropInterval(1), 800);
  assert.equal(getDropInterval(2), 680);
  let previous = getDropInterval(1);
  for (let level = 2; level <= 100; level += 1) {
    const interval = getDropInterval(level);
    assert.ok(interval <= previous);
    assert.ok(interval >= 90);
    previous = interval;
  }
  assert.equal(getDropInterval(100), 90);
});
