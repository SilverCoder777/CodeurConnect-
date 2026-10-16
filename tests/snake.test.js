const { test } = require('node:test');
const assert = require('node:assert/strict');
const { BOARD_SIZE, createGame, changeDirection, advanceGame } = require('../client/src/games/snake.js');

function running(overrides = {}) {
  return { ...createGame(() => 0), status: 'running', ...overrides };
}

function freezeGame(game) {
  game.snake.forEach(Object.freeze);
  Object.freeze(game.snake);
  if (game.food) Object.freeze(game.food);
  return Object.freeze(game);
}

test('a new game has a centered snake and food on an empty cell', () => {
  const game = createGame(() => 0);
  assert.equal(BOARD_SIZE, 20);
  assert.equal(game.status, 'ready');
  assert.equal(game.score, 0);
  assert.equal(game.direction, 'right');
  assert.equal(game.nextDirection, 'right');
  assert.deepEqual(game.snake, [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }]);
  assert.deepEqual(game.food, { x: 0, y: 0 });
  assert.ok(!game.snake.some(({ x, y }) => x === game.food.x && y === game.food.y));
});

test('a move advances the head, releases the tail and leaves the previous state unchanged', () => {
  const game = freezeGame(running());
  const next = advanceGame(game);
  assert.deepEqual(next.snake, [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }]);
  assert.equal(next.score, 0);
  assert.equal(next.status, 'running');
  assert.equal(next.food, game.food);
  assert.deepEqual(game.snake[0], { x: 8, y: 10 });
});

test('turns apply on the next move and only then update the actual direction', () => {
  const game = freezeGame(running());
  const turned = changeDirection(game, 'up');
  assert.equal(turned.direction, 'right');
  assert.equal(turned.nextDirection, 'up');
  assert.equal(game.nextDirection, 'right');
  const moved = advanceGame(turned);
  assert.deepEqual(moved.snake[0], { x: 8, y: 9 });
  assert.equal(moved.direction, 'up');
  assert.equal(changeDirection(moved, 'down'), moved);
  assert.equal(changeDirection(moved, 'left').nextDirection, 'left');
});

test('rapid key presses cannot queue a reversal of the last actual move', () => {
  const game = running();
  const turned = changeDirection(game, 'up');
  assert.equal(changeDirection(turned, 'left'), turned);
  assert.equal(changeDirection(game, 'left'), game);
  assert.deepEqual(advanceGame(changeDirection(turned, 'left')).snake[0], { x: 8, y: 9 });
  for (const invalid of ['diagonal', '', 'toString', '__proto__', undefined]) {
    assert.equal(changeDirection(game, invalid), game);
  }
});

test('ready, paused and finished games do not advance or request random food', () => {
  for (const status of ['ready', 'paused', 'over', 'won']) {
    const game = freezeGame(running({ status }));
    assert.equal(advanceGame(game, () => assert.fail('An inactive game must not use randomness')), game);
  }
});

test('eating increases the length and score and spawns food outside the snake', () => {
  const game = freezeGame(running({ food: { x: 9, y: 10 }, score: 20 }));
  const next = advanceGame(game, () => 0.5);
  assert.deepEqual(next.snake, [{ x: 9, y: 10 }, ...game.snake]);
  assert.equal(next.score, 30);
  assert.equal(next.status, 'running');
  assert.ok(!next.snake.some(({ x, y }) => x === next.food.x && y === next.food.y));
  assert.equal(game.score, 20);
  assert.equal(game.snake.length, 3);
});

test('all four board boundaries end the game without adding an out-of-bounds cell', () => {
  const edges = [
    ['left', { x: 0, y: 10 }],
    ['right', { x: BOARD_SIZE - 1, y: 10 }],
    ['up', { x: 10, y: 0 }],
    ['down', { x: 10, y: BOARD_SIZE - 1 }]
  ];
  for (const [direction, head] of edges) {
    const game = running({ snake: [head], direction, nextDirection: direction });
    const next = advanceGame(game);
    assert.equal(next.status, 'over', direction);
    assert.equal(next.snake, game.snake);
    assert.equal(next.score, game.score);
  }
});

test('moving into the body ends the game', () => {
  const game = running({
    snake: [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 4, y: 2 }],
    direction: 'up', nextDirection: 'right'
  });
  const next = advanceGame(game);
  assert.equal(next.status, 'over');
  assert.equal(next.snake, game.snake);
});

test('moving into the tail cell is valid when that cell is released', () => {
  const game = running({
    snake: [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 2 }],
    direction: 'up', nextDirection: 'right'
  });
  const next = advanceGame(game);
  assert.equal(next.status, 'running');
  assert.deepEqual(next.snake, [{ x: 3, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }]);
});

test('food generation skips occupied cells even when randomness selects their position', () => {
  const target = 10 * BOARD_SIZE + 6;
  const game = createGame(() => target / (BOARD_SIZE * BOARD_SIZE - 3));
  assert.deepEqual(game.food, { x: 9, y: 10 });
  const last = createGame(() => 1);
  assert.deepEqual(last.food, { x: BOARD_SIZE - 1, y: BOARD_SIZE - 1 });
});

test('a nearly full board spawns the only available food without retries', () => {
  const food = { x: 1, y: 0 };
  const empty = { x: 2, y: 0 };
  const snake = [{ x: 0, y: 0 }];
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (y === 0 && x < 3) continue;
      snake.push({ x, y });
    }
  }
  let randomCalls = 0;
  const next = advanceGame(running({ snake, food }), () => { randomCalls += 1; return 0; });
  assert.deepEqual(next.food, empty);
  assert.equal(next.status, 'running');
  assert.equal(next.snake.length, BOARD_SIZE * BOARD_SIZE - 1);
  assert.equal(randomCalls, 1);
});

test('eating the last free cell wins without attempting to generate more food', () => {
  const food = { x: 1, y: 0 };
  const snake = [{ x: 0, y: 0 }];
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (y === 0 && x < 2) continue;
      snake.push({ x, y });
    }
  }
  const next = advanceGame(running({ snake, food, score: 100 }), () => assert.fail('A full board needs no random number'));
  assert.equal(next.status, 'won');
  assert.equal(next.food, null);
  assert.equal(next.snake.length, BOARD_SIZE * BOARD_SIZE);
  assert.equal(next.score, 110);
});
