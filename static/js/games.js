// Games JavaScript - Written From Scratch
let currentGame = null;

// =============================================================================
// SNAKE GAME
// =============================================================================

function startSnakeGame() {
    currentGame = 'snake';
    document.getElementById('game-modal-title').textContent = 'Path Algorithm';
    document.getElementById('game-modal-body').innerHTML = `
        <div class="snake-header">
            <div class="snake-score">Score: <span id="snake-score">0</span></div>
            <div class="snake-controls">
                <button onclick="resetSnakeGame()" class="control-btn">🔄 Reset</button>
            </div>
        </div>
        <div class="snake-container">
            <canvas id="snake-canvas" width="480" height="480"></canvas>
            <div id="snake-status" class="snake-status">Press arrow keys to start</div>
        </div>
    `;
    document.getElementById('game-modal').style.display = 'flex';
    initSnakeGame();
}

function initSnakeGame() {
    const canvas = document.getElementById('snake-canvas');
    const ctx = canvas.getContext('2d');
    const gridSize = 24;
    const tileCount = 20;

    let snake = [{x: 10, y: 10}];
    let food = {x: 15, y: 15};
    let dx = 0, dy = 0;
    let score = 0;
    let gameRunning = false;
    let gameInterval;

    function drawGame() {
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw snake
        ctx.fillStyle = '#58a6ff';
        snake.forEach(segment => {
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
        });

        // Draw food
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
    }

    function moveSnake() {
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};

        // Check walls
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            gameOver();
            return;
        }

        // Check self collision
        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            gameOver();
            return;
        }

        snake.unshift(head);

        // Check food
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            document.getElementById('snake-score').textContent = score;
            generateFood();
        } else {
            snake.pop();
        }
    }

    function generateFood() {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        // Make sure food doesn't spawn on snake
        if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
            generateFood();
        }
    }

    function gameOver() {
        gameRunning = false;
        clearInterval(gameInterval);
        document.getElementById('snake-status').textContent = `Game Over! Score: ${score}`;
    }

    function handleKeyPress(e) {
        if (currentGame !== 'snake') return;

        if (!gameRunning && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            gameRunning = true;
            gameInterval = setInterval(() => {
                moveSnake();
                drawGame();
            }, 150);
            document.getElementById('snake-status').textContent = 'Playing...';
        }

        // Change direction
        if (e.code === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
        if (e.code === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
        if (e.code === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
        if (e.code === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }

        e.preventDefault();
    }

    document.addEventListener('keydown', handleKeyPress);

    window.resetSnakeGame = function() {
        clearInterval(gameInterval);
        snake = [{x: 10, y: 10}];
        dx = 0; dy = 0; score = 0;
        gameRunning = false;
        document.getElementById('snake-score').textContent = '0';
        document.getElementById('snake-status').textContent = 'Press arrow keys to start';
        generateFood();
        drawGame();
    };

    drawGame();
}

// =============================================================================
// MEMORY GAME
// =============================================================================

function startMemoryGame() {
    currentGame = 'memory';
    document.getElementById('game-modal-title').textContent = 'Memory Tester';
    document.getElementById('game-modal-body').innerHTML = `
        <div class="memory-header">
            <div class="memory-stats">
                <div>Moves: <span id="memory-moves">0</span></div>
                <div>Pairs: <span id="memory-pairs">0/8</span></div>
            </div>
            <button onclick="resetMemoryGame()" class="control-btn">🔄 Reset</button>
        </div>
        <div class="memory-board" id="memory-board"></div>
    `;
    document.getElementById('game-modal').style.display = 'flex';
    initMemoryGame();
}

function initMemoryGame() {
    const board = document.getElementById('memory-board');
    const emojis = ['🎮', '🚀', '⭐', '🔥', '💎', '🎯', '⚡', '🎪'];
    const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);

    let flippedCards = [];
    let moves = 0;
    let pairs = 0;

    board.innerHTML = '';
    cards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.emoji = emoji;
        card.addEventListener('click', flipCard);
        board.appendChild(card);
    });

    function flipCard() {
        if (flippedCards.length === 2 || this.classList.contains('flipped')) return;

        this.classList.add('flipped');
        this.textContent = this.dataset.emoji;
        flippedCards.push(this);

        if (flippedCards.length === 2) {
            moves++;
            document.getElementById('memory-moves').textContent = moves;

            if (flippedCards[0].dataset.emoji === flippedCards[1].dataset.emoji) {
                flippedCards.forEach(card => card.classList.add('matched'));
                pairs++;
                document.getElementById('memory-pairs').textContent = `${pairs}/8`;
                flippedCards = [];

                if (pairs === 8) {
                    setTimeout(() => alert('You Won!'), 300);
                }
            } else {
                setTimeout(() => {
                    flippedCards.forEach(card => {
                        card.classList.remove('flipped');
                        card.textContent = '';
                    });
                    flippedCards = [];
                }, 1000);
            }
        }
    }

    window.resetMemoryGame = function() {
        initMemoryGame();
    };
}

// =============================================================================
// CLICKER GAME
// =============================================================================

function startClickerGame() {
    currentGame = 'clicker';
    document.getElementById('game-modal-title').textContent = 'Click Benchmark';
    document.getElementById('game-modal-body').innerHTML = `
        <div class="clicker-header">
            <div class="clicker-stats">
                <div>Clicks: <span id="clicker-clicks">0</span></div>
                <div>CPS: <span id="clicker-cps">0.0</span></div>
                <div>Time: <span id="clicker-time">10</span>s</div>
            </div>
            <button onclick="resetClickerGame()" class="control-btn">🔄 Reset</button>
        </div>
        <div class="clicker-game">
            <div class="clicker-target" id="clicker-target">
                <div class="target-text">Click to Start!</div>
            </div>
        </div>
    `;
    document.getElementById('game-modal').style.display = 'flex';
    initClickerGame();
}

function initClickerGame() {
    const target = document.getElementById('clicker-target');
    let clicks = 0;
    let timeLeft = 10;
    let gameStarted = false;
    let startTime = null;
    let timer = null;

    target.addEventListener('click', function() {
        if (!gameStarted) {
            gameStarted = true;
            startTime = Date.now();
            this.querySelector('.target-text').textContent = 'Click!';

            timer = setInterval(() => {
                timeLeft--;
                document.getElementById('clicker-time').textContent = timeLeft;

                if (timeLeft <= 0) {
                    clearInterval(timer);
                    gameStarted = false;
                    this.querySelector('.target-text').textContent = `Final: ${clicks} clicks!`;
                    document.getElementById('clicker-time').textContent = '0';
                }
            }, 1000);
        }

        if (gameStarted && timeLeft > 0) {
            clicks++;
            document.getElementById('clicker-clicks').textContent = clicks;

            const elapsed = (Date.now() - startTime) / 1000;
            const cps = (clicks / elapsed).toFixed(1);
            document.getElementById('clicker-cps').textContent = cps;
        }
    });

    window.resetClickerGame = function() {
        if (timer) clearInterval(timer);
        initClickerGame();
    };
}

// =============================================================================
// 2048 GAME
// =============================================================================

function start2048Game() {
    currentGame = '2048';
    document.getElementById('game-modal-title').textContent = 'Matrix Solver';
    document.getElementById('game-modal-body').innerHTML = `
        <div class="puzzle-header">
            <div class="puzzle-stats">
                <div>Score: <span id="puzzle-score">0</span></div>
            </div>
            <button onclick="reset2048Game()" class="control-btn">🔄 Reset</button>
        </div>
        <div class="puzzle-container">
            <div class="puzzle-board-2048" id="puzzle-board"></div>
        </div>
        <div style="text-align: center; margin-top: 16px; color: #8b949e; font-size: 14px;">
            Use arrow keys to move tiles
        </div>
    `;
    document.getElementById('game-modal').style.display = 'flex';
    init2048Game();
}

function init2048Game() {
    const board = document.getElementById('puzzle-board');
    let grid = Array(4).fill().map(() => Array(4).fill(0));
    let score = 0;

    function addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (grid[i][j] === 0) emptyCells.push({x: i, y: j});
            }
        }

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            grid[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    function updateDisplay() {
        board.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const tile = document.createElement('div');
                tile.className = `puzzle-tile${grid[i][j] ? ' tile-' + grid[i][j] : ''}`;
                tile.textContent = grid[i][j] || '';
                board.appendChild(tile);
            }
        }
        document.getElementById('puzzle-score').textContent = score;
    }

    function move(direction) {
        let moved = false;
        const newGrid = grid.map(row => [...row]);

        if (direction === 'left' || direction === 'right') {
            for (let i = 0; i < 4; i++) {
                let row = newGrid[i].filter(val => val !== 0);
                if (direction === 'right') row.reverse();

                for (let j = 0; j < row.length - 1; j++) {
                    if (row[j] === row[j + 1]) {
                        row[j] *= 2;
                        score += row[j];
                        row[j + 1] = 0;
                    }
                }

                row = row.filter(val => val !== 0);
                while (row.length < 4) row.push(0);
                if (direction === 'right') row.reverse();

                for (let j = 0; j < 4; j++) {
                    if (newGrid[i][j] !== row[j]) moved = true;
                    newGrid[i][j] = row[j];
                }
            }
        } else {
            for (let j = 0; j < 4; j++) {
                let col = [];
                for (let i = 0; i < 4; i++) col.push(newGrid[i][j]);
                col = col.filter(val => val !== 0);
                if (direction === 'down') col.reverse();

                for (let i = 0; i < col.length - 1; i++) {
                    if (col[i] === col[i + 1]) {
                        col[i] *= 2;
                        score += col[i];
                        col[i + 1] = 0;
                    }
                }

                col = col.filter(val => val !== 0);
                while (col.length < 4) col.push(0);
                if (direction === 'down') col.reverse();

                for (let i = 0; i < 4; i++) {
                    if (newGrid[i][j] !== col[i]) moved = true;
                    newGrid[i][j] = col[i];
                }
            }
        }

        if (moved) {
            grid = newGrid;
            addRandomTile();
            updateDisplay();
        }
    }

    function handleKeyPress(e) {
        if (currentGame !== '2048') return;

        if (e.code === 'ArrowLeft') move('left');
        if (e.code === 'ArrowRight') move('right');
        if (e.code === 'ArrowUp') move('up');
        if (e.code === 'ArrowDown') move('down');

        e.preventDefault();
    }

    document.addEventListener('keydown', handleKeyPress);

    window.reset2048Game = function() {
        grid = Array(4).fill().map(() => Array(4).fill(0));
        score = 0;
        addRandomTile();
        addRandomTile();
        updateDisplay();
    };

    addRandomTile();
    addRandomTile();
    updateDisplay();
}

// =============================================================================
// TETRIS GAME
// =============================================================================

function startTetrisGame() {
    currentGame = 'tetris';
    document.getElementById('game-modal-title').textContent = 'Block Simulator';
    document.getElementById('game-modal-body').innerHTML = `
        <div class="tetris-header">
            <div class="tetris-stats">
                <div>Lines: <span id="tetris-lines">0</span></div>
                <div>Score: <span id="tetris-score">0</span></div>
            </div>
            <button onclick="resetTetrisGame()" class="control-btn">🔄 Reset</button>
        </div>
        <div class="tetris-container">
            <canvas id="tetris-canvas" width="300" height="600"></canvas>
            <div id="tetris-status" class="tetris-status">Press SPACE to start</div>
        </div>
    `;
    document.getElementById('game-modal').style.display = 'flex';
    initTetrisGame();
}

function initTetrisGame() {
    const canvas = document.getElementById('tetris-canvas');
    const ctx = canvas.getContext('2d');
    const CELL_SIZE = 30;
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;

    let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    let currentPiece = null;
    let gameRunning = false;
    let score = 0;
    let lines = 0;
    let gameInterval;

    const pieces = [
        [[1,1,1,1]], // I
        [[1,1],[1,1]], // O
        [[0,1,0],[1,1,1]], // T
        [[0,1,1],[1,1,0]], // S
        [[1,1,0],[0,1,1]], // Z
        [[1,0,0],[1,1,1]], // J
        [[0,0,1],[1,1,1]]  // L
    ];
    const colors = ['#00f5ff', '#ffff00', '#800080', '#00ff00', '#ff0000', '#0000ff', '#ff8000'];

    function createPiece() {
        const pieceIndex = Math.floor(Math.random() * pieces.length);
        return {
            shape: pieces[pieceIndex],
            color: colors[pieceIndex],
            x: Math.floor((BOARD_WIDTH - pieces[pieceIndex][0].length) / 2),
            y: 0
        };
    }

    function drawBoard() {
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw placed pieces
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (board[y][x]) {
                    ctx.fillStyle = '#666';
                    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
                }
            }
        }

        // Draw current piece
        if (currentPiece) {
            ctx.fillStyle = currentPiece.color;
            for (let y = 0; y < currentPiece.shape.length; y++) {
                for (let x = 0; x < currentPiece.shape[y].length; x++) {
                    if (currentPiece.shape[y][x]) {
                        ctx.fillRect(
                            (currentPiece.x + x) * CELL_SIZE,
                            (currentPiece.y + y) * CELL_SIZE,
                            CELL_SIZE - 1, CELL_SIZE - 1
                        );
                    }
                }
            }
        }
    }

    function canMove(piece, dx, dy) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = piece.x + x + dx;
                    const newY = piece.y + y + dy;

                    if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return false;
                    if (newY >= 0 && board[newY][newX]) return false;
                }
            }
        }
        return true;
    }

    function placePiece() {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    board[currentPiece.y + y][currentPiece.x + x] = 1;
                }
            }
        }

        // Clear lines
        let linesCleared = 0;
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (board[y].every(cell => cell)) {
                board.splice(y, 1);
                board.unshift(Array(BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }

        if (linesCleared > 0) {
            lines += linesCleared;
            score += linesCleared * 100;
            document.getElementById('tetris-lines').textContent = lines;
            document.getElementById('tetris-score').textContent = score;
        }

        currentPiece = createPiece();
        if (!canMove(currentPiece, 0, 0)) {
            gameRunning = false;
            clearInterval(gameInterval);
            document.getElementById('tetris-status').textContent = 'Game Over!';
        }
    }

    function gameLoop() {
        if (canMove(currentPiece, 0, 1)) {
            currentPiece.y++;
        } else {
            placePiece();
        }
        drawBoard();
    }

    function handleKeyPress(e) {
        if (currentGame !== 'tetris') return;

        if (e.code === 'Space' && !gameRunning) {
            gameRunning = true;
            currentPiece = createPiece();
            gameInterval = setInterval(gameLoop, 500);
            document.getElementById('tetris-status').textContent = 'Playing...';
        }

        if (!gameRunning) return;

        if (e.code === 'ArrowLeft' && canMove(currentPiece, -1, 0)) {
            currentPiece.x--;
            drawBoard();
        }
        if (e.code === 'ArrowRight' && canMove(currentPiece, 1, 0)) {
            currentPiece.x++;
            drawBoard();
        }
        if (e.code === 'ArrowDown' && canMove(currentPiece, 0, 1)) {
            currentPiece.y++;
            drawBoard();
        }

        e.preventDefault();
    }

    document.addEventListener('keydown', handleKeyPress);

    window.resetTetrisGame = function() {
        clearInterval(gameInterval);
        board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        currentPiece = null;
        gameRunning = false;
        score = 0;
        lines = 0;
        document.getElementById('tetris-lines').textContent = '0';
        document.getElementById('tetris-score').textContent = '0';
        document.getElementById('tetris-status').textContent = 'Press SPACE to start';
        drawBoard();
    };

    drawBoard();
}

// =============================================================================
// BREAKOUT GAME
// =============================================================================

function startWordSearchGame() {
    currentGame = 'breakout';
    document.getElementById('game-modal-title').textContent = 'Breakout';
    document.getElementById('game-modal-body').innerHTML = `
        <div class="wordsearch-header">
            <div class="wordsearch-stats">
                <div>Score: <span id="breakout-score">0</span></div>
                <div>Lives: <span id="breakout-lives">3</span></div>
                <div>Level: <span id="breakout-level">1</span></div>
            </div>
            <button onclick="resetBreakoutGame()" class="control-btn">🔄 Reset</button>
        </div>
        <div class="wordsearch-container">
            <canvas id="breakout-canvas" width="400" height="500"></canvas>
            <div id="breakout-status" class="tetris-status">Click canvas or press SPACE to launch ball</div>
        </div>
    `;
    document.getElementById('game-modal').style.display = 'flex';
    initBreakoutGame();
}

function initBreakoutGame() {
    const canvas = document.getElementById('breakout-canvas');
    const ctx = canvas.getContext('2d');

    let gameRunning = false;
    let score = 0;
    let lives = 3;
    let level = 1;
    let gameInterval;

    // Keyboard state for continuous movement
    const keys = { left: false, right: false };

    const paddle = {
        width: 80,
        height: 12,
        x: canvas.width / 2 - 40,
        y: canvas.height - 30,
        speed: 8
    };

    const ball = {
        x: canvas.width / 2,
        y: paddle.y - 20,
        radius: 8,
        dx: 0,
        dy: 0,
        speed: 6,
        launched: false
    };

    let bricks = [];
    const brickRows = 8;
    const brickCols = 8;
    const brickWidth = 46;
    const brickHeight = 20;
    const brickPadding = 2;
    const brickOffsetTop = 60;
    const brickOffsetLeft = 6;
    const brickColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];

    function initBricks() {
        bricks = [];
        for (let r = 0; r < brickRows; r++) {
            bricks[r] = [];
            for (let c = 0; c < brickCols; c++) {
                bricks[r][c] = {
                    x: c * (brickWidth + brickPadding) + brickOffsetLeft,
                    y: r * (brickHeight + brickPadding) + brickOffsetTop,
                    status: 1,
                    color: brickColors[r]
                };
            }
        }
    }

    function draw() {
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw bricks
        for (let r = 0; r < brickRows; r++) {
            for (let c = 0; c < brickCols; c++) {
                if (bricks[r][c].status === 1) {
                    const brick = bricks[r][c];
                    ctx.fillStyle = brick.color;
                    ctx.fillRect(brick.x, brick.y, brickWidth, brickHeight);
                }
            }
        }

        // Draw paddle
        ctx.fillStyle = '#58a6ff';
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

        // Draw ball
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    function updatePaddle() {
        if (keys.left && paddle.x > 0) {
            paddle.x -= paddle.speed;
        }
        if (keys.right && paddle.x < canvas.width - paddle.width) {
            paddle.x += paddle.speed;
        }
    }

    function resetBall() {
        ball.x = canvas.width / 2;
        ball.y = paddle.y - 20;
        ball.dx = 0;
        ball.dy = 0;
        ball.launched = false;
    }

    function launchBall() {
        if (!ball.launched) {
            gameRunning = true;
            ball.launched = true;
            const angle = (Math.random() - 0.5) * Math.PI / 6;
            ball.dx = Math.sin(angle) * ball.speed;
            ball.dy = -Math.cos(angle) * ball.speed;
            document.getElementById('breakout-status').textContent = 'Playing...';

            if (!gameInterval) {
                gameInterval = setInterval(update, 1000 / 60);
            }
        }
    }

    function collisionDetection() {
        for (let r = 0; r < brickRows; r++) {
            for (let c = 0; c < brickCols; c++) {
                const brick = bricks[r][c];
                if (brick.status === 1) {
                    if (ball.x > brick.x && ball.x < brick.x + brickWidth &&
                        ball.y > brick.y && ball.y < brick.y + brickHeight) {
                        ball.dy = -ball.dy;
                        brick.status = 0;
                        score += 10;
                        document.getElementById('breakout-score').textContent = score;

                        const allBroken = bricks.every(row => row.every(brick => brick.status === 0));
                        if (allBroken) {
                            level++;
                            document.getElementById('breakout-level').textContent = level;
                            ball.speed += 0.5;
                            initBricks();
                            resetBall();
                            document.getElementById('breakout-status').textContent = 'Level up! Click to continue';
                        }
                    }
                }
            }
        }
    }

    function update() {
        updatePaddle();

        if (ball.launched) {
            ball.x += ball.dx;
            ball.y += ball.dy;

            // Wall collisions
            if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
                ball.dx = -ball.dx;
            }
            if (ball.y - ball.radius < 0) {
                ball.dy = -ball.dy;
            }

            // Paddle collision
            if (ball.y + ball.radius > paddle.y &&
                ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
                ball.dy = -ball.dy;
                const hitPos = (ball.x - paddle.x) / paddle.width;
                ball.dx = (hitPos - 0.5) * ball.speed;
            }

            // Ball out of bounds
            if (ball.y + ball.radius > canvas.height) {
                lives--;
                document.getElementById('breakout-lives').textContent = lives;

                if (lives === 0) {
                    gameRunning = false;
                    clearInterval(gameInterval);
                    gameInterval = null;
                    document.getElementById('breakout-status').textContent = `Game Over! Final Score: ${score}`;
                } else {
                    resetBall();
                    document.getElementById('breakout-status').textContent = 'Click canvas or press SPACE to launch ball';
                }
            }

            collisionDetection();
        }

        draw();
    }

    // Event listeners
    canvas.addEventListener('mousemove', (e) => {
        if (currentGame !== 'breakout') return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        paddle.x = mouseX - paddle.width / 2;

        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x > canvas.width - paddle.width) paddle.x = canvas.width - paddle.width;
    });

    canvas.addEventListener('click', launchBall);

    function handleKeyDown(e) {
        if (currentGame !== 'breakout') return;

        if (e.code === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
        if (e.code === 'ArrowRight') { keys.right = true; e.preventDefault(); }
        if (e.code === 'Space') { launchBall(); e.preventDefault(); }
    }

    function handleKeyUp(e) {
        if (currentGame !== 'breakout') return;

        if (e.code === 'ArrowLeft') { keys.left = false; e.preventDefault(); }
        if (e.code === 'ArrowRight') { keys.right = false; e.preventDefault(); }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    window.resetBreakoutGame = function() {
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = null;
        gameRunning = false;
        score = 0;
        lives = 3;
        level = 1;
        ball.speed = 6;
        keys.left = false;
        keys.right = false;

        document.getElementById('breakout-score').textContent = '0';
        document.getElementById('breakout-lives').textContent = '3';
        document.getElementById('breakout-level').textContent = '1';

        paddle.x = canvas.width / 2 - paddle.width / 2;
        initBricks();
        resetBall();
        draw();
    };

    // Start continuous update loop
    gameInterval = setInterval(update, 1000 / 60);
    initBricks();
    draw();
}

// =============================================================================
// MODAL MANAGEMENT
// =============================================================================

function closeGameModal() {
    document.getElementById('game-modal').style.display = 'none';

    // Stop all intervals
    const intervals = [
        window.snakeInterval,
        window.tetrisInterval,
        window.breakoutInterval,
        window.clickerTimer,
        window.memoryTimer
    ];

    intervals.forEach(interval => {
        if (interval) clearInterval(interval);
    });

    currentGame = null;
}

// Global event listeners
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('game-modal');
        if (e.target === modal) {
            closeGameModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && currentGame) {
            closeGameModal();
        }
    });
});

// Make functions globally available
window.startSnakeGame = startSnakeGame;
window.startMemoryGame = startMemoryGame;
window.startClickerGame = startClickerGame;
window.start2048Game = start2048Game;
window.startTetrisGame = startTetrisGame;
window.startWordSearchGame = startWordSearchGame;
window.closeGameModal = closeGameModal;