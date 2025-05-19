// Elements
const landingPage = document.getElementById("landing-page");
const modeSelection = document.getElementById("mode-selection");
const settingsScreen = document.getElementById("settings-screen");
const gameScreen = document.getElementById("game-screen");

const gameBoard = document.getElementById("game-board");
const cells = document.querySelectorAll(".cell");
const winningLineSVG = document.querySelector("#winning-line line");

const playBtn = document.getElementById("play-btn");
const settingsBtn = document.getElementById("settings-btn");
const pvpBtn = document.getElementById("pvp-btn");
const pvcBtn = document.getElementById("pvc-btn");
const modeBackBtn = document.getElementById("mode-back-btn");
const settingsCloseBtn = document.getElementById("settings-close-btn");
const gameBackBtn = document.getElementById("game-back-btn");

const soundX = document.getElementById("sound-x");
const soundO = document.getElementById("sound-o");
const soundWin = document.getElementById("sound-win");

const soundVolumeControl = document.getElementById("sound-volume");
const themeSelect = document.getElementById("theme-select");
const aiDifficultySelect = document.getElementById("ai-difficulty");

// Game variables
let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = false;
let vsAI = false;
let aiDifficulty = "medium";

const winningConditions = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // columns
  [0,4,8],[2,4,6]          // diagonals
];

// Show screen helper
function showScreen(screen) {
  [landingPage, modeSelection, settingsScreen, gameScreen].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

// Reset game
function resetGame() {
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  gameActive = true;
  clearBoardUI();
  clearWinningLine();
}

// Clear UI board cells
function clearBoardUI() {
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove("x", "o");
    cell.style.pointerEvents = "auto";
  });
}

// Draw winning line on SVG
function drawWinningLine(winningCombo) {
  // Positions for centers of cells in 300x300 grid
  const positions = [
    [50, 50], [150, 50], [250, 50],
    [50, 150], [150, 150], [250, 150],
    [50, 250], [150, 250], [250, 250],
  ];

  const [start, , end] = winningCombo;
  const [x1, y1] = positions[start];
  const [x2, y2] = positions[end];

  winningLineSVG.setAttribute("x1", x1);
  winningLineSVG.setAttribute("y1", y1);
  winningLineSVG.setAttribute("x2", x2);
  winningLineSVG.setAttribute("y2", y2);
  winningLineSVG.style.opacity = 1;
}

// Clear winning line
function clearWinningLine() {
  winningLineSVG.style.opacity = 0;
}

// Play sound helper
function playSound(sound) {
  sound.volume = soundVolumeControl.value;
  sound.currentTime = 0;
  sound.play();
}

// Check winner or draw
function checkResult() {
  for (const condition of winningConditions) {
    const [a, b, c] = condition;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      // We have a winner
      gameActive = false;
      drawWinningLine(condition);
      playSound(soundWin);
      setTimeout(() => {
        alert(`${board[a]} wins!`);
      }, 200);
      disableBoard();
      return;
    }
  }
  if (!board.includes("")) {
    // Draw
    gameActive = false;
    setTimeout(() => alert("It's a draw!"), 100);
    disableBoard();
  }
}

// Disable board clicks when game ends
function disableBoard() {
  cells.forEach(cell => {
    cell.style.pointerEvents = "none";
  });
}

// Handle player move
function playerMove(index) {
  if (!gameActive || board[index]) return;
  board[index] = currentPlayer;
  updateCellUI(index);
  playSound(currentPlayer === "X" ? soundX : soundO);
  checkResult();
  if (gameActive) {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    if (vsAI && currentPlayer === "O") {
      aiMove();
    }
  }
}

// Update UI cell
function updateCellUI(index) {
  const cell = cells[index];
  cell.textContent = board[index];
  cell.classList.add(board[index].toLowerCase());
  cell.style.pointerEvents = "none";
}

// AI move based on difficulty
function aiMove() {
  let move;
  if (aiDifficulty === "easy") {
    move = randomMove();
  } else if (aiDifficulty === "medium") {
    move = mediumMove();
  } else {
    move = hardMove();
  }
  if (move !== null) {
    setTimeout(() => {
      playerMove(move);
    }, 500);
  }
}

// Random move for easy AI
function randomMove() {
  const available = board.map((val, idx) => val === "" ? idx : null).filter(i => i !== null);
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

// Medium AI: tries to win or block
function mediumMove() {
  // Try to win
  for (const cond of winningConditions) {
    const res = findWinningMove(cond, "O");
    if (res !== null) return res;
  }
  // Try to block X
  for (const cond of winningConditions) {
    const res = findWinningMove(cond, "X");
    if (res !== null) return res;
  }
  // Else random
  return randomMove();
}

// Hard AI: Minimax algorithm
function hardMove() {
  let bestScore = -Infinity;
  let bestMove = null;
  for (let i = 0; i < 9; i++) {
    if (board[i] === "") {
      board[i] = "O";
      let score = minimax(board, 0, false);
      board[i] = "";
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

// Minimax implementation
function minimax(newBoard, depth, isMaximizing) {
  const scores = {O: 10, X: -10, tie: 0};
  let result = checkWinner(newBoard);
  if (result !== null) {
    return scores[result];
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i] === "") {
        newBoard[i] = "O";
        let score = minimax(newBoard, depth + 1, false);
        newBoard[i] = "";
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i] === "") {
        newBoard[i] = "X";
        let score = minimax(newBoard, depth + 1, true);
        newBoard[i] = "";
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

// Check winner for minimax board
function checkWinner(boardToCheck) {
  for (const condition of winningConditions) {
    const [a,b,c] = condition;
    if (boardToCheck[a] && boardToCheck[a] === boardToCheck[b] && boardToCheck[a] === boardToCheck[c]) {
      return boardToCheck[a];
    }
  }
  if (!boardToCheck.includes("")) return "tie";
  return null;
}

// Find winning/blocking move
function findWinningMove(condition, player) {
  const [a,b,c] = condition;
  const line = [board[a], board[b], board[c]];
  if (line.filter(x => x === player).length === 2 && line.includes("")) {
    return condition[line.indexOf("")];
  }
  return null;
}

// Event listeners for board cells
cells.forEach((cell, idx) => {
  cell.addEventListener("click", () => {
    if (gameActive && !vsAI) {
      playerMove(idx);
    } else if (gameActive && vsAI && currentPlayer === "X") {
      playerMove(idx);
    }
  });
});

// Landing page buttons
playBtn.addEventListener("click", () => {
  showScreen(modeSelection);
});

settingsBtn.addEventListener("click", () => {
  showScreen(settingsScreen);
});

modeBackBtn.addEventListener("click", () => {
  showScreen(landingPage);
});

settingsCloseBtn.addEventListener("click", () => {
  showScreen(landingPage);
});

gameBackBtn.addEventListener("click", () => {
  showScreen(landingPage);
  gameActive = false;
  clearWinningLine();
  disableBoard();
});

// Mode selection buttons
pvpBtn.addEventListener("click", () => {
  vsAI = false;
  resetGame();
  showScreen(gameScreen);
});

pvcBtn.addEventListener("click", () => {
  vsAI = true;
  resetGame();
  showScreen(gameScreen);
});

// Sound volume control
soundVolumeControl.addEventListener("input", () => {
  // Just updating volume for future sounds
});

// Theme select
themeSelect.addEventListener("change", (e) => {
  document.body.classList.remove("theme-neon", "theme-dark", "theme-blue", "theme-red");
  switch(e.target.value) {
    case "neon":
      // Default neon theme - no class needed, but add for clarity
      document.body.classList.add("theme-neon");
      break;
    case "dark":
      document.body.classList.add("theme-dark");
      break;
    case "blue":
      document.body.classList.add("theme-blue");
      break;
    case "red":
      document.body.classList.add("theme-red");
      break;
  }
});

// AI difficulty select
aiDifficultySelect.addEventListener("change", (e) => {
  aiDifficulty = e.target.value;
});

// Initialize with neon theme class
document.body.classList.add("theme-neon");



