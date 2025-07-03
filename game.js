// game.js - Sopa de Letras

const themes = [
    { name: "Animales", words: ["GATO", "PERRO", "CABALLO", "LEON", "TIGRE", "OSO", "RATON", "MONO", "ZORRO", "LOBO"] },
    { name: "Colores", words: ["ROJO", "AZUL", "VERDE", "AMARILLO", "NEGRO", "BLANCO", "MORADO", "NARANJA", "GRIS", "ROSA"] },
    { name: "Frutas", words: ["MANZANA", "PERA", "PLATANO", "NARANJA", "KIWI", "UVA", "MELON", "SANDIA", "CEREZA", "LIMON"] },
    { name: "Países", words: ["MEXICO", "ARGENTINA", "BRASIL", "CHILE", "PERU", "COLOMBIA", "URUGUAY", "VENEZUELA", "ECUADOR", "BOLIVIA"] }
];

const gridSizes = {
    easy: 8,
    medium: 10,
    hard: 12
};

let currentTheme, currentWords, grid, gridSize, foundWords = [], selectedCells = [], isMouseDown = false;

// --- Cambios para fondo aleatorio y selección precisa ---
const backgroundImages = [
    'Marco1.jpg',
    'Marco2.jpg',
    'Marco3.jpg',
    'Marco4.jpg'
];

function setRandomBackground() {
    const img = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    const wordSearch = document.getElementById('word-search');
    wordSearch.style.backgroundImage = `url('${img}')`;
}

function isStraightLineSelection(cells) {
    if (cells.length < 2) return false;
    const dr = cells[1].row - cells[0].row;
    const dc = cells[1].col - cells[0].col;
    if (dr === 0 && dc === 0) return false;
    for (let i = 1; i < cells.length; i++) {
        if ((cells[i].row - cells[0].row) * dc !== (cells[i].col - cells[0].col) * dr) return false;
        if (dr !== 0 && (cells[i].row - cells[0].row) % dr !== 0) return false;
        if (dc !== 0 && (cells[i].col - cells[0].col) % dc !== 0) return false;
    }
    return true;
}

let totalScore = 0;
let currentLevel = 0;
const difficulties = ["easy", "medium", "hard"];

function showPopup(isLastLevel = false) {
    const popup = document.getElementById('popup-modal');
    const title = document.getElementById('popup-title');
    const message = document.getElementById('popup-message');
    const nextBtn = document.getElementById('next-level-btn');
    const okBtn = document.getElementById('ok-btn');

    popup.classList.remove('hidden');
    if (isLastLevel) {
        title.textContent = "¡Juego terminado!";
        message.textContent = `¡Felicidades! Has completado todos los niveles.\nPuntuación final: ${totalScore + foundWords.length * 10}`;
        nextBtn.classList.add('hidden');
        okBtn.classList.remove('hidden');
    } else {
        title.textContent = "¡Felicidades!";
        message.textContent = "Has completado el nivel. ¿Listo para el siguiente?";
        nextBtn.classList.remove('hidden');
        okBtn.classList.add('hidden');
    }
}

function hidePopup() {
    document.getElementById('popup-modal').classList.add('hidden');
}

document.getElementById('next-level-btn').onclick = function() {
    if (currentLevel < difficulties.length - 1) {
        totalScore += foundWords.length * 10;
        currentLevel++;
        document.getElementById('difficulty').value = difficulties[currentLevel];
        startGame();
        hidePopup();
    }
};

document.getElementById('ok-btn').onclick = function() {
    hidePopup();
    // Si quieres reiniciar el juego aquí, puedes hacerlo
};

function updateScorePanel() {
    const score = totalScore + foundWords.length * 10;
    document.getElementById('score').textContent = score;
    document.getElementById('progress').textContent = `${foundWords.length} / ${currentWords.length} palabras`;
}

// --- Modificaciones en funciones principales ---
function pickRandomTheme() {
    return themes[Math.floor(Math.random() * themes.length)];
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createGrid(size) {
    return Array.from({ length: size }, () => Array(size).fill(""));
}

function placeWords(grid, words) {
    const size = grid.length;
    // Direcciones: [dr, dc]
    const directions = [
        [0, 1],   // Horizontal derecha
        [0, -1],  // Horizontal izquierda
        [1, 0],   // Vertical abajo
        [-1, 0],  // Vertical arriba
        [1, 1],   // Diagonal ↘
        [-1, -1], // Diagonal ↖
        [1, -1],  // Diagonal ↙
        [-1, 1],  // Diagonal ↗
    ];
    for (const word of words) {
        let placed = false, attempts = 0;
        while (!placed && attempts < 200) {
            const [dr, dc] = directions[Math.floor(Math.random() * directions.length)];
            let row = Math.floor(Math.random() * size);
            let col = Math.floor(Math.random() * size);
            // Calcular límites
            let endRow = row + dr * (word.length - 1);
            let endCol = col + dc * (word.length - 1);
            if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) { attempts++; continue; }
            let canPlace = true;
            for (let k = 0; k < word.length; k++) {
                const cell = grid[row + dr * k][col + dc * k];
                if (cell && cell !== word[k]) { canPlace = false; break; }
            }
            if (canPlace) {
                for (let k = 0; k < word.length; k++) {
                    grid[row + dr * k][col + dc * k] = word[k];
                }
                placed = true;
            }
            attempts++;
        }
    }
    // Rellenar vacíos
    const letters = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (!grid[i][j]) grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
        }
    }
}

function renderGrid(grid) {
    const wordSearch = document.getElementById("word-search");
    wordSearch.innerHTML = "";
    wordSearch.style.gridTemplateColumns = `repeat(${grid.length}, 32px)`;
    setRandomBackground();
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid.length; j++) {
            const cell = document.createElement("div");
            cell.className = "letter-cell";
            cell.textContent = grid[i][j];
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener("mousedown", handleCellMouseDown);
            cell.addEventListener("mouseenter", handleCellMouseEnter);
            cell.addEventListener("mouseup", handleCellMouseUp);
            wordSearch.appendChild(cell);
        }
    }
}

// --- Palabras ocultas ---
let hiddenWords = [];

function pickHiddenWords(words, count = 3) {
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(count, words.length));
}

function renderWordList(words) {
    const wordList = document.getElementById("word-list");
    wordList.innerHTML = "";
    for (const word of words) {
        const item = document.createElement("span");
        let classes = "word-item";
        if (foundWords.includes(word)) classes += " found";
        else if (hiddenWords.includes(word)) classes += " hidden-word";
        item.className = classes;
        item.textContent = word;
        wordList.appendChild(item);
    }
}

// --- Timer global ---
let timerInterval;
const levelTimes = [360, 240, 120]; // easy, medium, hard (segundos)

function startTimer() {
    clearInterval(timerInterval);
    let timeLeft = levelTimes[currentLevel];
    updateTimerDisplay(timeLeft);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showTimeUpPopup();
        }
    }, 1000);
}

function updateTimerDisplay(time) {
    const min = Math.floor(time / 60);
    const sec = time % 60;
    const timerDiv = document.getElementById('timer');
    if (timerDiv) {
        // Formato tipo reloj analógico, números en bold
        timerDiv.innerHTML = `<span style="font-weight:bold;font-family:'Courier New',monospace;font-size:1.3em;letter-spacing:1px;">🕒 ${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}</span>`;
    }
}

function showTimeUpPopup() {
    const popup = document.getElementById('popup-modal');
    const title = document.getElementById('popup-title');
    const message = document.getElementById('popup-message');
    const nextBtn = document.getElementById('next-level-btn');
    const okBtn = document.getElementById('ok-btn');
    title.textContent = "¡Tiempo terminado!";
    message.textContent = "Se acabó el tiempo. Presiona 'Nuevo Juego' para volver a intentarlo.";
    nextBtn.classList.add('hidden');
    okBtn.classList.remove('hidden');
    popup.classList.remove('hidden');
}

function startGame() {
    foundWords = [];
    selectedCells = [];
    isMouseDown = false;
    const difficulty = difficulties[currentLevel];
    gridSize = gridSizes[difficulty];
    currentTheme = pickRandomTheme();
    // --- Nueva lógica: asegurar que siempre haya 6 palabras en el tablero ---
    let maxTries = 50;
    let tries = 0;
    let words, tempGrid;
    do {
        words = shuffle(currentTheme.words).slice(0, Math.min(6, gridSize - 2));
        tempGrid = createGrid(gridSize);
        placeWords(tempGrid, words);
        // Verificar que todas las palabras estén realmente en el tablero (todas las direcciones)
        let allPlaced = true;
        for (const word of words) {
            let found = false;
            // Buscar en todas las direcciones
            const directions = [
                [0, 1],   // Horizontal derecha
                [0, -1],  // Horizontal izquierda
                [1, 0],   // Vertical abajo
                [-1, 0],  // Vertical arriba
                [1, 1],   // Diagonal ↘
                [-1, -1], // Diagonal ↖
                [1, -1],  // Diagonal ↙
                [-1, 1],  // Diagonal ↗
            ];
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    for (const [dr, dc] of directions) {
                        let match = true;
                        for (let k = 0; k < word.length; k++) {
                            let ni = i + dr * k;
                            let nj = j + dc * k;
                            if (ni < 0 || ni >= gridSize || nj < 0 || nj >= gridSize || tempGrid[ni][nj] !== word[k]) {
                                match = false;
                                break;
                            }
                        }
                        if (match) { found = true; break; }
                    }
                    if (found) break;
                }
                if (found) break;
            }
            if (!found) { allPlaced = false; break; }
        }
        if (allPlaced) break;
        tries++;
    } while (tries < maxTries);
    currentWords = words;
    hiddenWords = pickHiddenWords(currentWords, 3);
    grid = tempGrid;
    document.getElementById("theme").textContent = `Tema: ${currentTheme.name}`;
    document.getElementById("difficulty").textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    renderGrid(grid);
    renderWordList(currentWords);
    document.getElementById("message").textContent = "";
    updateScorePanel();
    startTimer();
}

function getCellFromEvent(e) {
    return {
        row: parseInt(e.target.dataset.row),
        col: parseInt(e.target.dataset.col)
    };
}

function handleCellMouseDown(e) {
    isMouseDown = true;
    selectedCells = [getCellFromEvent(e)];
    updateSelection();
}

function handleCellMouseEnter(e) {
    if (!isMouseDown) return;
    const cell = getCellFromEvent(e);
    const last = selectedCells[selectedCells.length - 1];
    // Solo permitir selección en línea recta
    if (selectedCells.length === 1 || isStraightLineSelection([...selectedCells, cell])) {
        if (last && (cell.row !== last.row || cell.col !== last.col)) {
            selectedCells.push(cell);
            updateSelection();
        }
    }
}

function handleCellMouseUp(e) {
    isMouseDown = false;
    if (isStraightLineSelection(selectedCells)) {
        checkSelectedWord();
    }
    selectedCells = [];
    updateSelection();
}

function updateSelection() {
    document.querySelectorAll(".letter-cell").forEach(cell => cell.classList.remove("selected"));
    for (const cell of selectedCells) {
        const idx = cell.row * gridSize + cell.col;
        document.querySelectorAll(".letter-cell")[idx].classList.add("selected");
    }
}

function checkSelectedWord() {
    if (selectedCells.length < 2) return;
    let word = "";
    for (const cell of selectedCells) {
        word += grid[cell.row][cell.col];
    }
    if (currentWords.includes(word) && !foundWords.includes(word)) {
        foundWords.push(word);
        markFoundWord(selectedCells);
        // Quitar el color de oculto si era una palabra oculta
        if (hiddenWords && hiddenWords.includes(word)) {
            hiddenWords = hiddenWords.filter(w => w !== word);
        }
        renderWordList(currentWords);
        updateScorePanel();
        if (foundWords.length === currentWords.length) {
            if (currentLevel === difficulties.length - 1) {
                showPopup(true);
            } else {
                showPopup();
            }
        }
    }
}

function markFoundWord(cells) {
    for (const cell of cells) {
        const idx = cell.row * gridSize + cell.col;
        document.querySelectorAll(".letter-cell")[idx].classList.add("found");
    }
}

document.getElementById("new-game").addEventListener("click", startGame);
document.getElementById('next-level-manual').addEventListener('click', function() {
    if (currentLevel < difficulties.length - 1) {
        totalScore += foundWords.length * 10;
        currentLevel++;
        startGame();
    } else {
        showPopup(true);
    }
});
window.onload = startGame;
