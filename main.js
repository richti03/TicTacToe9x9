const X = 1;
const O = 4;
const CLOSED = 13;
const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function startGame() {
    fields = Array.from({length: 9}, () => Array(9).fill(0));
    bigFields = Array(9).fill(0);
    gameActive = true;
    isAiThinking = false;
    player = Math.random() < 0.5;
    bigGridItem = 5;

    document.getElementById("startButton").style.display = "none";
    document.getElementById("toogleMiniTicTacToe").style.display = "none";
    document.getElementById("toogleSinglePlayer").style.display = "none";
    document.getElementById("playerinfo").style.display = "block";
    document.getElementById("stopButton").style.display = "block";

    if (miniTicTacToe) {
        document.querySelectorAll(".big-grid-item").forEach((item, index) => {
            item.style.display = index === 4 ? "grid" : "none";
        });
        document.getElementById("mainGrid").style.gridTemplateColumns = "1fr";
    }

    refreshPlayerInfo();
    changeRedBorder();
    showHitbox(singlePlayer ? "Das Spiel beginnt! Du spielst X." : "Das Spiel beginnt!");
    scheduleComputerMove();
}

function getPlayableBoards(stateFields = fields, stateBigFields = bigFields, forcedBoard = bigGridItem - 1) {
    if (miniTicTacToe) return stateBigFields[4] === 0 ? [4] : [];
    for (let offset = 0; offset < 9; offset++) {
        const boardIndex = (forcedBoard + offset) % 9;
        if (stateBigFields[boardIndex] === 0 && stateFields[boardIndex].includes(0)) return [boardIndex];
    }
    return [];
}

function changeRedBorder() {
    const playable = getPlayableBoards();
    document.querySelectorAll(".big-grid-item").forEach((item, index) => {
        item.classList.toggle("playable-board", gameActive && playable.includes(index));
    });
}

function refreshPlayerInfo() {
    const label = document.getElementById("player");
    if (singlePlayer && player) {
        label.innerText = "O (Computer denkt …)";
    } else {
        label.innerText = player ? "O" : "X";
    }
}

function showHitbox(message, type = "good", duration = 3000) {
    const hitbox = document.getElementById("hitbox");
    const progress = document.getElementById("hitbox-progress");
    document.getElementById("hitbox-message").textContent = message;
    hitbox.className = `hitbox show ${type}`;
    progress.style.transition = "none";
    progress.style.width = "100%";
    void progress.offsetWidth;
    progress.style.transition = `width ${duration}ms linear`;
    progress.style.width = "0%";
    setTimeout(() => hitbox.classList.remove("show"), duration);
}

function fieldClick(boardIndex, cellIndex) {
    if (onlineMode) return playRemoteMove(boardIndex, cellIndex);
    if (!gameActive) return showHitbox("Bitte beginne zuerst das Spiel.", "bad");
    if (singlePlayer && (player || isAiThinking)) {
        return showHitbox("Bitte warte auf den Zug des Computers.", "bad");
    }
    playMove(boardIndex, cellIndex);
}

function playMove(boardIndex, cellIndex, computerMove = false) {
    if (!gameActive || fields[boardIndex][cellIndex] !== 0) {
        if (!computerMove) showHitbox("Dieses Feld ist bereits belegt.", "bad");
        return false;
    }
    if (!getPlayableBoards().includes(boardIndex)) {
        if (!computerMove) showHitbox("Dieses Feld kann derzeit nicht genutzt werden.", "bad");
        return false;
    }

    const mark = player ? O : X;
    fields[boardIndex][cellIndex] = mark;
    const element = document.getElementById(`${boardIndex + 1}-${cellIndex + 1}`);
    element.innerText = mark === O ? "O" : "X";
    element.style.color = "black";

    finishSmallBoard(boardIndex, mark);
    if (finishGameIfNecessary()) return true;

    bigGridItem = cellIndex + 1;
    player = !player;
    isAiThinking = false;
    refreshPlayerInfo();
    changeRedBorder();
    scheduleComputerMove();
    return true;
}

function lineWinner(board) {
    for (const line of WIN_LINES) {
        if (board[line[0]] === X && board[line[1]] === X && board[line[2]] === X) return X;
        if (board[line[0]] === O && board[line[1]] === O && board[line[2]] === O) return O;
    }
    return 0;
}

function finishSmallBoard(boardIndex, mark) {
    if (lineWinner(fields[boardIndex]) === mark) {
        bigFields[boardIndex] = mark;
        closeBoard(boardIndex);
        showWinField(boardIndex, mark);
        showHitbox(`${mark === X ? "X" : "O"} hat ein Feld gewonnen.`);
    } else if (!fields[boardIndex].includes(0)) {
        bigFields[boardIndex] = CLOSED;
        closeBoard(boardIndex);
    }
}

function closeBoard(initialBoardIndex) {
    const boardsToClose = [initialBoardIndex];
    const closedBoards = new Set();

    while (boardsToClose.length) {
        const boardIndex = boardsToClose.shift();
        if (closedBoards.has(boardIndex)) continue;
        closedBoards.add(boardIndex);
        if (bigFields[boardIndex] === 0) bigFields[boardIndex] = CLOSED;

        fields[boardIndex].forEach((value, cellIndex) => {
            if (value === 0) markCellClosed(boardIndex, cellIndex);
        });
        if (miniTicTacToe) continue;

        fields.forEach((board, otherBoardIndex) => {
            if (bigFields[otherBoardIndex] !== 0 || board[boardIndex] !== 0) return;
            markCellClosed(otherBoardIndex, boardIndex);
            if (!board.includes(0)) {
                bigFields[otherBoardIndex] = CLOSED;
                boardsToClose.push(otherBoardIndex);
            }
        });
    }
}

function markCellClosed(boardIndex, cellIndex) {
    fields[boardIndex][cellIndex] = CLOSED;
    const element = document.getElementById(`${boardIndex + 1}-${cellIndex + 1}`);
    element.innerText = "–";
    element.style.color = "black";
}

function finishGameIfNecessary() {
    const winner = miniTicTacToe ? lineWinner(fields[4]) : lineWinner(bigFields);
    if (winner) {
        const text = singlePlayer
            ? (winner === X ? "Du hast gewonnen. Stark gespielt!" : "Der Computer gewinnt. Versuch es noch einmal!")
            : `${winner === X ? "X" : "O"} hat gewonnen. Glückwunsch!`;
        showHitbox(text, "good", 10000);
        endGame();
        return true;
    }
    if (getPlayableBoards(fields, bigFields, bigGridItem - 1).length === 0) {
        const xBoards = bigFields.filter(value => value === X).length;
        const oBoards = bigFields.filter(value => value === O).length;
        let result = "Unentschieden.";
        if (!miniTicTacToe && xBoards !== oBoards) result = `${xBoards > oBoards ? "X" : "O"} gewinnt nach Feldern!`;
        showHitbox(`Spielende! ${result}`, "good", 10000);
        endGame();
        return true;
    }
    return false;
}

function endGame() {
    gameActive = false;
    isAiThinking = false;
    changeRedBorder();
    document.getElementById("playerinfo").style.display = "none";
    document.getElementById("stopButton").style.display = "none";
    document.getElementById("resetButton").style.display = "block";
}

function showWinField(boardIndex, winner) {
    const color = winner === X ? "#6ebcc3" : "#cf9f62";
    const symbolCells = winner === X ? [0, 2, 4, 6, 8] : [1, 3, 5, 7];

    symbolCells.forEach(cellIndex => {
        const element = document.getElementById(`${boardIndex + 1}-${cellIndex + 1}`);
        element.style.backgroundColor = color;
    });
}

function scheduleComputerMove() {
    if (!singlePlayer || !gameActive || !player || isAiThinking) return;
    isAiThinking = true;
    refreshPlayerInfo();
    setTimeout(() => {
        if (!gameActive || !player) return;
        const move = chooseComputerMove();
        if (move) playMove(move.board, move.cell, true);
    }, 450);
}

function getLegalMoves(stateFields, stateBigFields, forcedBoard) {
    const moves = [];
    for (const board of getPlayableBoards(stateFields, stateBigFields, forcedBoard)) {
        stateFields[board].forEach((value, cell) => {
            if (value === 0) moves.push({board, cell});
        });
    }
    return moves;
}

function simulateMove(state, move, mark) {
    const next = {
        fields: state.fields.map(board => board.slice()),
        bigFields: state.bigFields.slice(),
        forcedBoard: move.cell
    };
    next.fields[move.board][move.cell] = mark;
    if (lineWinner(next.fields[move.board]) === mark) {
        next.bigFields[move.board] = mark;
        closeSimulatedBoard(next, move.board);
    } else if (!next.fields[move.board].includes(0)) {
        next.bigFields[move.board] = CLOSED;
        closeSimulatedBoard(next, move.board);
    }
    return next;
}

function closeSimulatedBoard(state, initialBoardIndex) {
    const boardsToClose = [initialBoardIndex];
    const closedBoards = new Set();
    while (boardsToClose.length) {
        const boardIndex = boardsToClose.shift();
        if (closedBoards.has(boardIndex)) continue;
        closedBoards.add(boardIndex);
        if (state.bigFields[boardIndex] === 0) state.bigFields[boardIndex] = CLOSED;
        state.fields[boardIndex] = state.fields[boardIndex].map(value => value === 0 ? CLOSED : value);
        if (miniTicTacToe) continue;
        state.fields.forEach((board, otherBoardIndex) => {
            if (state.bigFields[otherBoardIndex] !== 0 || board[boardIndex] !== 0) return;
            board[boardIndex] = CLOSED;
            if (!board.includes(0)) {
                state.bigFields[otherBoardIndex] = CLOSED;
                boardsToClose.push(otherBoardIndex);
            }
        });
    }
}

function evaluateLine(board, line) {
    const values = line.map(index => board[index]);
    if (values.includes(CLOSED) || (values.includes(X) && values.includes(O))) return 0;
    const oCount = values.filter(value => value === O).length;
    const xCount = values.filter(value => value === X).length;
    return oCount ? [0, 3, 22, 500][oCount] : -[0, 3, 24, 500][xCount];
}

function evaluateState(state) {
    if (miniTicTacToe) {
        if (state.bigFields[4] === O) return 100000;
        if (state.bigFields[4] === X) return -100000;
    }
    const globalWinner = lineWinner(state.bigFields);
    if (globalWinner === O) return 100000;
    if (globalWinner === X) return -100000;
    let score = 0;
    for (const line of WIN_LINES) score += evaluateLine(state.bigFields, line) * 20;
    state.bigFields.forEach((value, index) => {
        if (value === O) score += 400;
        else if (value === X) score -= 400;
        else if (value === 0) for (const line of WIN_LINES) score += evaluateLine(state.fields[index], line);
    });
    return score;
}

function minimax(state, mark, depth, alpha, beta) {
    const score = evaluateState(state);
    if (Math.abs(score) >= 100000 || depth === 0) return score;
    const moves = getLegalMoves(state.fields, state.bigFields, state.forcedBoard);
    if (!moves.length) return score;

    if (mark === O) {
        let best = -Infinity;
        for (const move of moves) {
            best = Math.max(best, minimax(simulateMove(state, move, O), X, depth - 1, alpha, beta));
            alpha = Math.max(alpha, best);
            if (beta <= alpha) break;
        }
        return best;
    }
    let best = Infinity;
    for (const move of moves) {
        best = Math.min(best, minimax(simulateMove(state, move, X), O, depth - 1, alpha, beta));
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
    }
    return best;
}

function chooseComputerMove() {
    const state = {fields, bigFields, forcedBoard: bigGridItem - 1};
    const moves = getLegalMoves(fields, bigFields, bigGridItem - 1);
    const isOpeningMove = fields.every(board => board.every(value => value === 0));
    if (isOpeningMove) {
        const variedOpenings = moves.filter(move => [0, 2, 4, 6, 8].includes(move.cell));
        return variedOpenings[Math.floor(Math.random() * variedOpenings.length)];
    }
    const winningMoves = moves.filter(move => {
        const board = fields[move.board].slice();
        board[move.cell] = O;
        return lineWinner(board) === O;
    });
    if (winningMoves.length) {
        return winningMoves.sort((a, b) => evaluateState(simulateMove(state, b, O)) - evaluateState(simulateMove(state, a, O)))[0];
    }
    const blockingMoves = moves.filter(move => {
        const board = fields[move.board].slice();
        board[move.cell] = X;
        return lineWinner(board) === X;
    });
    if (blockingMoves.length) return blockingMoves[0];

    let bestScore = -Infinity;
    let bestMoves = [];
    const remaining = moves.length;
    const depth = miniTicTacToe ? Math.min(9, fields[4].filter(value => value === 0).length) : (remaining > 20 ? 2 : 3);

    for (const move of moves) {
        const next = simulateMove(state, move, O);
        let score = minimax(next, X, depth - 1, -Infinity, Infinity);
        score += [3, 2, 3, 2, 5, 2, 3, 2, 3][move.cell];
        if (score > bestScore) {
            bestScore = score;
            bestMoves = [move];
        } else if (score === bestScore) {
            bestMoves.push(move);
        }
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function toggleButton(element, identity) {
    element.classList.toggle("on");
    element.setAttribute("aria-pressed", element.classList.contains("on"));
    if (identity === "miniTicTacToe") miniTicTacToe = !miniTicTacToe;
    if (identity === "singlePlayer") singlePlayer = !singlePlayer;
}
