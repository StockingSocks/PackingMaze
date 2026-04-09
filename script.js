const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreText = document.getElementById('score');
const livesText = document.getElementById('lives');
const statusText = document.getElementById('status');

const tileSize = 24;
const mapRows = 21;
const mapCols = 21;

const rawMap = [
  '111111111111111111111',
  '1o.......111........1',
  '1.111.111.111.111.11',
  '1.1......111......1.1',
  '1.1.111.11111.111.111',
  '1....1.........1....1',
  '11111.111111111.11111',
  '1.....1.1.....1.1.....1'.slice(0, 21),
  '11111.111.1.111.11111',
  '1o....1...1.1...1...o1',
  '11111.111.1.111.11111',
  '1......1.....1......1',
  '1.111.111111111.111.11',
  '1.1.......1.......1.1',
  '1.1.111.11111.111.111',
  '1....1.........1....1',
  '11111.111111111.11111',
  '1.....1.1.....1.1.....1'.slice(0, 21),
  '1.111.111.1.111.111.1',
  '1o....1...1.1...1...o1',
  '111111111111111111111'
];

const grid = rawMap.map(line => line.split('').map(char => {
  if (char === '1') return 1;
  if (char === '.') return 2;
  if (char === 'o') return 3;
  return 0;
}));

const player = {
  x: 10,
  y: 11,
  dir: { dx: -1, dy: 0 },
  nextDir: null,
  speed: 5,
  radius: tileSize * 0.38,
};

const ghosts = [
  { x: 9, y: 8, dir: { dx: 1, dy: 0 }, color: '#ff6b6b', frightened: false, eaten: false },
  { x: 11, y: 8, dir: { dx: -1, dy: 0 }, color: '#6bf0ff', frightened: false, eaten: false },
];

let score = 0;
let lives = 3;
let pelletsRemaining = grid.flat().filter(tile => tile === 2 || tile === 3).length;
let lastTime = 0;
let frightenedTimer = 0;
let gameOver = false;
let gameWon = false;

const directions = {
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#030714';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < mapRows; row += 1) {
    for (let col = 0; col < mapCols; col += 1) {
      const tile = grid[row][col];
      const x = col * tileSize;
      const y = row * tileSize;

      if (tile === 1) {
        ctx.fillStyle = '#1f5faf';
        ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
        ctx.strokeStyle = '#58a0ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      }

      if (tile === 2) {
        ctx.fillStyle = '#f6f1a5';
        ctx.beginPath();
        ctx.arc(x + tileSize / 2, y + tileSize / 2, tileSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }

      if (tile === 3) {
        ctx.fillStyle = '#f6f1a5';
        ctx.beginPath();
        ctx.arc(x + tileSize / 2, y + tileSize / 2, tileSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawPacman();
  ghosts.forEach(drawGhost);
}

function drawPacman() {
  const centerX = player.x * tileSize + tileSize / 2;
  const centerY = player.y * tileSize + tileSize / 2;
  const angle = Math.atan2(player.dir.dy, player.dir.dx);
  const eyeOffset = player.radius * 0.6;

  ctx.fillStyle = '#ffe95e';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, player.radius, angle + 0.25 * Math.PI, angle - 0.25 * Math.PI, false);
  ctx.lineTo(centerX, centerY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#15181d';
  const eyeX = centerX + Math.cos(angle) * eyeOffset - Math.sin(angle) * 4;
  const eyeY = centerY + Math.sin(angle) * eyeOffset + Math.cos(angle) * 4;
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGhost(ghost) {
  const centerX = ghost.x * tileSize + tileSize / 2;
  const centerY = ghost.y * tileSize + tileSize / 2;
  const bodyHeight = tileSize * 0.75;

  ctx.fillStyle = ghost.frightened ? '#5ac8ff' : ghost.color;
  ctx.beginPath();
  ctx.arc(centerX, centerY - 4, tileSize * 0.32, Math.PI, 0, false);
  ctx.lineTo(centerX + tileSize * 0.32, centerY + bodyHeight / 2);
  ctx.quadraticCurveTo(centerX + tileSize * 0.18, centerY + bodyHeight * 0.7, centerX + tileSize * 0.08, centerY + bodyHeight / 2);
  ctx.quadraticCurveTo(centerX, centerY + bodyHeight * 0.72, centerX - tileSize * 0.08, centerY + bodyHeight / 2);
  ctx.quadraticCurveTo(centerX - tileSize * 0.18, centerY + bodyHeight * 0.72, centerX - tileSize * 0.32, centerY + bodyHeight / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(centerX - 6, centerY - 4, 5, 0, Math.PI * 2);
  ctx.arc(centerX + 6, centerY - 4, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#15181d';
  ctx.beginPath();
  ctx.arc(centerX - 6, centerY - 4, 2, 0, Math.PI * 2);
  ctx.arc(centerX + 6, centerY - 4, 2, 0, Math.PI * 2);
  ctx.fill();
}

function update(delta) {
  if (gameOver || gameWon) return;

  if (frightenedTimer > 0) {
    frightenedTimer -= delta;
    if (frightenedTimer <= 0) {
      ghosts.forEach(ghost => {
        ghost.frightened = false;
      });
    }
  }

  movePlayer(delta);
  ghosts.forEach(ghost => moveGhost(ghost, delta));
  checkGhostCollision();
  updateHud();
}

function movePlayer(delta) {
  const speed = player.speed * delta * 0.001;
  const centerX = roundIfClose(player.x);
  const centerY = roundIfClose(player.y);
  const atCenter = Math.abs(player.x - centerX) < 0.02 && Math.abs(player.y - centerY) < 0.02;

  if (atCenter) {
    player.x = centerX;
    player.y = centerY;
    const nextDir = player.nextDir || player.dir;
    if (canMove(centerX, centerY, nextDir)) {
      player.dir = nextDir;
    } else if (!canMove(centerX, centerY, player.dir)) {
      player.dir = { dx: 0, dy: 0 };
    }

    if (grid[centerY][centerX] === 2 || grid[centerY][centerX] === 3) {
      if (grid[centerY][centerX] === 2) score += 10;
      if (grid[centerY][centerX] === 3) {
        score += 50;
        frightenedTimer = 5000;
        ghosts.forEach(ghost => {
          if (!ghost.eaten) ghost.frightened = true;
        });
      }
      grid[centerY][centerX] = 0;
      pelletsRemaining -= 1;
      if (pelletsRemaining === 0) {
        gameWon = true;
        statusText.textContent = 'You win! Press R to restart.';
      }
    }
  }

  player.x += player.dir.dx * speed;
  player.y += player.dir.dy * speed;
}

function roundIfClose(value) {
  return Math.abs(value - Math.round(value)) < 0.02 ? Math.round(value) : value;
}

function canMove(col, row, direction) {
  if (!direction || (direction.dx === 0 && direction.dy === 0)) return false;
  const targetCol = col + direction.dx;
  const targetRow = row + direction.dy;
  if (targetCol < 0 || targetRow < 0 || targetCol >= mapCols || targetRow >= mapRows) return false;
  return grid[targetRow][targetCol] !== 1;
}

function moveGhost(ghost, delta) {
  if (ghost.eaten) {
    ghost.x = 10;
    ghost.y = 8;
    ghost.eaten = false;
    ghost.frightened = false;
    ghost.dir = { dx: 0, dy: 0 };
    return;
  }

  const speed = (ghost.frightened ? 3.5 : 4) * delta * 0.001;
  const centerX = roundIfClose(ghost.x);
  const centerY = roundIfClose(ghost.y);
  const atCenter = Math.abs(ghost.x - centerX) < 0.02 && Math.abs(ghost.y - centerY) < 0.02;

  if (atCenter) {
    ghost.x = centerX;
    ghost.y = centerY;
    const choices = availableDirections(centerX, centerY, ghost.dir);
    if (choices.length > 0) {
      if (ghost.frightened) {
        ghost.dir = choices[Math.floor(Math.random() * choices.length)];
      } else {
        ghost.dir = chooseBestDirection(centerX, centerY, player, choices);
      }
    }
  }

  ghost.x += ghost.dir.dx * speed;
  ghost.y += ghost.dir.dy * speed;
}

function availableDirections(col, row, prevDir) {
  return Object.values(directions).filter(dir => {
    const opposite = dir.dx === -prevDir.dx && dir.dy === -prevDir.dy;
    return !opposite && canMove(col, row, dir);
  });
}

function chooseBestDirection(col, row, target, choices) {
  let best = choices[0];
  let bestDistance = Infinity;
  choices.forEach(dir => {
    const nextX = col + dir.dx;
    const nextY = row + dir.dy;
    const distance = Math.hypot(nextX - target.x, nextY - target.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = dir;
    }
  });
  return best;
}

function checkGhostCollision() {
  ghosts.forEach(ghost => {
    const dist = Math.hypot(ghost.x - player.x, ghost.y - player.y);
    if (dist < 0.6) {
      if (ghost.frightened) {
        score += 200;
        ghost.eaten = true;
        ghost.frightened = false;
      } else {
        loseLife();
      }
    }
  });
}

function loseLife() {
  lives -= 1;
  updateHud();
  if (lives <= 0) {
    gameOver = true;
    statusText.textContent = 'Game over! Press R to restart.';
    return;
  }
  player.x = 10;
  player.y = 11;
  player.dir = { dx: -1, dy: 0 };
  player.nextDir = null;
  ghosts.forEach(ghost => {
    ghost.x = ghost.color === '#ff6b6b' ? 9 : 11;
    ghost.y = 8;
    ghost.dir = { dx: ghost.color === '#ff6b6b' ? 1 : -1, dy: 0 };
    ghost.frightened = false;
    ghost.eaten = false;
  });
}

function updateHud() {
  scoreText.textContent = String(score).padStart(4, '0');
  livesText.textContent = String(lives);
}

function gameLoop(time) {
  const delta = time - lastTime;
  lastTime = time;
  update(delta);
  draw();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  window.location.reload();
}

window.addEventListener('keydown', event => {
  if (event.key === 'r' || event.key === 'R') {
    resetGame();
    return;
  }

  if (directions[event.key]) {
    player.nextDir = directions[event.key];
    statusText.textContent = 'Eat the pellets and watch the ghosts!';
    event.preventDefault();
  }
});

canvas.width = mapCols * tileSize;
canvas.height = mapRows * tileSize;
updateHud();
requestAnimationFrame(time => {
  lastTime = time;
  requestAnimationFrame(gameLoop);
});
