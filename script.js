// ---------------------------
// TETRIS CONSTANTS
// ---------------------------
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const ROWS = 20;
const COLS = 10;
const BLOCK = canvas.width / COLS;

let board = [];
let bag = [];
let score = 0;
let level = 1;
let lines = 0;
let holdPiece = null;
let canHold = true;

document.getElementById("score").textContent = score;
document.getElementById("level").textContent = level;
document.getElementById("lines").textContent = lines;

// Tetrimino shapes
const SHAPES = {
    I: [[1,1,1,1]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1]],
    S: [[0,1,1],[1,1,0]],
    Z: [[1,1,0],[0,1,1]],
    J: [[1,0,0],[1,1,1]],
    L: [[0,0,1],[1,1,1]],
};

const COLORS = {
    I: "#60a5fa",
    O: "#facc15",
    T: "#a855f7",
    S: "#22c55e",
    Z: "#ef4444",
    J: "#3b82f6",
    L: "#f97316",
};

let current;

// ---------------------------
// INITIAL BOARD SETUP
// ---------------------------
function resetBoard() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}
resetBoard();

// ---------------------------
// 7-BAG PIECE GENERATOR
// ---------------------------
function refillBag() {
    bag = ["I","O","T","S","Z","J","L"];
    bag.sort(() => Math.random() - 0.5);
}

function nextPiece() {
    if (bag.length === 0) refillBag();
    const shape = bag.pop();
    return new Piece(shape);
}

// ---------------------------
// PIECE CLASS
// ---------------------------
class Piece {
    constructor(type) {
        this.type = type;
        this.shape = SHAPES[type].map(r => [...r]);
        this.color = COLORS[type];
        this.x = 3;
        this.y = 0;
    }
}

// ---------------------------
// DRAWING
// ---------------------------
function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
    ctx.strokeStyle = "#0f172a";
    ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++){
        for (let x = 0; x < COLS; x++){
            if (board[y][x]) drawBlock(x, y, board[y][x]);
        }
    }
}

function drawPiece(p) {
    p.shape.forEach((row, r) => {
        row.forEach((val, c) => {
            if (val) drawBlock(p.x + c, p.y + r, p.color);
        });
    });
}

// ---------------------------
// COLLISION CHECK
// ---------------------------
function collision(p) {
    for (let r = 0; r < p.shape.length; r++){
        for (let c = 0; c < p.shape[r].length; c++){
            if (!p.shape[r][c]) continue;
            let nx = p.x + c;
            let ny = p.y + r;

            if (ny >= ROWS || nx < 0 || nx >= COLS) return true;
            if (board[ny] && board[ny][nx]) return true;
        }
    }
    return false;
}

// ---------------------------
// MERGE PIECE INTO BOARD
// ---------------------------
function freeze(p) {
    p.shape.forEach((row, r) => {
        row.forEach((val, c) => {
            if (val) board[p.y + r][p.x + c] = p.color;
        });
    });

    clearLines();
    canHold = true;
    current = nextPiece();
}

// ---------------------------
// LINE CLEAR
// ---------------------------
function clearLines() {
    let cleared = 0;

    board = board.filter(row => {
        if (row.every(v => v)) {
            cleared++;
            return false;
        }
        return true;
    });

    while (board.length < ROWS) board.unshift(Array(COLS).fill(0));

    if (cleared > 0) {
        score += cleared * 100;
        lines += cleared;
        level = 1 + Math.floor(lines / 10);

        document.getElementById("score").textContent = score;
        document.getElementById("level").textContent = level;
        document.getElementById("lines").textContent = lines;
    }
}

// ---------------------------
// MOVEMENT
// ---------------------------
function move(dx, dy) {
    current.x += dx;
    current.y += dy;
    if (collision(current)) {
        current.x -= dx;
        current.y -= dy;
        return false;
    }
    return true;
}

function hardDrop() {
    while (move(0, 1));
    freeze(current);
}

function rotate() {
    const prev = current.shape.map(r => [...r]);
    current.shape = current.shape[0].map((_, i) =>
        current.shape.map(r => r[i]).reverse()
    );
    if (collision(current)) current.shape = prev;
}

function hold() {
    if (!canHold) return;
    const old = current;
    if (!holdPiece) {
        holdPiece = old.type;
        current = nextPiece();
    } else {
        [holdPiece, current] = [old.type, new Piece(holdPiece)];
    }
    canHold = false;
    document.getElementById("hold-piece").textContent = holdPiece;
}

// ---------------------------
// GAME LOOP
// ---------------------------
let dropTimer = 0;
let speed = 1000;

function update(time = 0) {
    requestAnimationFrame(update);

    speed = 1000 - (level - 1) * 80;
    if (speed < 120) speed = 120;

    if (time - dropTimer > speed) {
        if (!move(0, 1)) freeze(current);
        dropTimer = time;
    }

    drawBoard();
    drawPiece(current);
}

current = nextPiece();
update();

// ---------------------------
// DESKTOP CONTROLS
// ---------------------------
document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") move(-1, 0);
    if (e.key === "ArrowRight") move(1, 0);
    if (e.key === "ArrowDown") move(0, 1);
    if (e.key === "ArrowUp") rotate();
    if (e.key === " ") hardDrop();
    if (e.key === "Shift") hold();
});

// ---------------------------
// MOBILE CONTROLS
// ---------------------------
document.getElementById("btn-left").onclick = () => move(-1, 0);
document.getElementById("btn-right").onclick = () => move(1, 0);
document.getElementById("btn-down").onclick = () => move(0, 1);
document.getElementById("btn-rotate").onclick = () => rotate();
document.getElementById("btn-hard").onclick = () => hardDrop();
document.getElementById("btn-hold").onclick = () => hold();