export const BOARD_SIZE = 20;

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }
};

const sameCell = (first, second) =>
  first.x === second.x && first.y === second.y;

function createFood(snake, random) {
  const occupied = new Set(snake.map(({ x, y }) => `${x},${y}`));
  const available = [];

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (!occupied.has(`${x},${y}`)) available.push({ x, y });
    }
  }

  if (available.length === 0) return null;
  const index = Math.min(available.length - 1, Math.max(0, Math.floor(random() * available.length)));
  return available[index];
}

export function createGame(random = Math.random) {
  const snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];

  return {
    snake,
    direction: 'right',
    nextDirection: 'right',
    food: createFood(snake, random),
    score: 0,
    status: 'ready'
  };
}

export function changeDirection(game, direction) {
  if (!Object.hasOwn(DIRECTIONS, direction)) return game;

  const current = DIRECTIONS[game.direction];
  const requested = DIRECTIONS[direction];
  // Compare with the last move so rapid key presses cannot turn into the body.
  if (current.x + requested.x === 0 && current.y + requested.y === 0) return game;
  if (game.nextDirection === direction) return game;

  return { ...game, nextDirection: direction };
}

export function advanceGame(game, random = Math.random) {
  if (game.status !== 'running') return game;

  const direction = game.nextDirection;
  const movement = DIRECTIONS[direction];
  const head = {
    x: game.snake[0].x + movement.x,
    y: game.snake[0].y + movement.y
  };
  const eating = game.food !== null && sameCell(head, game.food);
  // The tail vacates its cell on this move unless food makes the snake grow.
  const body = eating ? game.snake : game.snake.slice(0, -1);
  const outside = head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE;

  if (outside || body.some((cell) => sameCell(head, cell))) {
    return { ...game, direction, status: 'over' };
  }

  const snake = [head, ...body];
  const food = eating ? createFood(snake, random) : game.food;

  return {
    ...game,
    snake,
    direction,
    food,
    score: game.score + (eating ? 10 : 0),
    status: food === null ? 'won' : 'running'
  };
}
