function startGame() {
    player = Math.random() < 0.5;

    refreshPlayer();

    document.getElementById("startButton").style.display = "none";
    document.getElementById("toogleMiniTicTacToe").style.display = "none";
    document.getElementById("playerinfo").style.display = "block";

    if (miniTicTacToe) {
        document.getElementById("big1").style.display = "none";
        document.getElementById("big2").style.display = "none";
        document.getElementById("big3").style.display = "none";
        document.getElementById("big4").style.display = "none";
        document.getElementById("big6").style.display = "none";
        document.getElementById("big7").style.display = "none";
        document.getElementById("big8").style.display = "none";
        document.getElementById("big9").style.display = "none";
        document.getElementById("mainGrid").style.gridTemplateColumns = "repeat(1, 1fr)"
    } else {

    }

    gameActive = true;

    // Jede Zeile des Arrays initialisieren
    for (let i = 0; i < 9; i++) {
        fields[i] = new Array(9);
    }

// Optionale Initialisierung der Array-Werte, z.B. mit Nullen
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            fields[i][j] = 0;
        }
    }

    for (let i = 0; i < 9; i++) {
        bigFields[i] = 0;
    }

    bigGridItem = 5;
    changeRedBorder();

    showHitbox("Das Spiel beginnt!");
}

function changeRedBorder() {
    document.querySelectorAll('.big-grid-item').forEach(bigItem => {
        bigItem.style.border = "1px solid black";
    })

    document.getElementById("big" + bigGridItem).style.border = "4px solid red";

    isNewBigFieldValid();
}

function isNewBigFieldValid() {
    let fieldsWithNull = 0;

    fields[bigGridItem - 1].forEach(field => {
        if (field == 0) {
            fieldsWithNull++;
        }
    })
    if (fieldsWithNull == 0) {
        if (bigGridItem != 9) {
            bigGridItem++;
        } else {
            bigGridItem = 1;
        }

        changeRedBorder();
    }
}

function refreshPlayer() {
    player = !player;
    if (player) {
        document.getElementById("player").innerText = "O";
    } else {
        document.getElementById("player").innerText = "X";
    }
}

function showHitbox(message, type = 'good', duration = 3000) {
    const hitbox = document.getElementById('hitbox');
    const hitboxMessage = document.getElementById('hitbox-message');
    const hitboxProgress = document.getElementById('hitbox-progress');

    hitboxMessage.textContent = message;
    hitbox.className = 'hitbox show'; // Reset classes
    hitbox.classList.add(type); // Add type class (good or bad)

    // Reset progress bar
    hitboxProgress.style.transition = 'none';
    hitboxProgress.style.width = '100%';

    // Trigger reflow to restart animation
    void hitboxProgress.offsetWidth;

    // Animate progress bar
    hitboxProgress.style.transition = `width ${duration}ms linear`;
    hitboxProgress.style.width = '0%';

    // Hide the hitbox after the specified duration
    setTimeout(() => {
        hitbox.classList.remove('show');
    }, duration);
}


function fieldClick(i, j) {
    clickedField = document.getElementById((i + 1) + "-" + (j + 1));
    if (gameActive == false) {
        showHitbox("Bitte beginne zuerst das Spiel.", "bad");
        return;
    }
    if (bigGridItem != i + 1) {
        showHitbox("Dieses Feld kann derzeit nicht genutzt werden.", "bad")
        return;
    }
    if (fields[i][j] != 0) {
        showHitbox("Dieses Feld ist bereits belegt.", "bad");
        return;
    }
    if (player) {
        clickedField.innerText = "O";
        fields[i][j] = 4;
    } else {
        clickedField.innerText = "X";
        fields[i][j] = 1;
    }

    clickedField.style.color = "black";

    refreshPlayer();
    validateField(fields[i], "small");
    checkEndOfGame();
    if (gameActive && !miniTicTacToe) {
        bigGridItem = j + 1;
        changeRedBorder();
    }
}

function validateField(field, typ) {
    let p1 = field[0] + field[1] + field[2];
    let p2 = field[3] + field[4] + field[5];
    let p3 = field[6] + field[7] + field[8];
    let p4 = field[0] + field[3] + field[6];
    let p5 = field[1] + field[4] + field[7];
    let p6 = field[2] + field[5] + field[8];
    let p7 = field[0] + field[4] + field[8];
    let p8 = field[2] + field[4] + field[6];

    if (p1 == 3 || p2 == 3 || p3 == 3 || p4 == 3 || p5 == 3 || p6 == 3 || p7 == 3 || p8 == 3) {
        if (typ == "small") {
            showHitbox("X hat ein Feld gewonnen.")
            bigFields[bigGridItem - 1] = 1;
            showWinField("x");
            lockNotUseableFields();
            validateField(bigFields, "big");
            if (miniTicTacToe) {
                showHitbox("X hat gewonnen. Glückwunsch!", "good", 10000)

                endGame();
            }
        } else {
            showHitbox("X hat gewonnen. Glückwunsch!", "good", 10000)
            endGame();
        }

    } else if (p1 == 12 || p2 == 12 || p3 == 12 || p4 == 12 || p5 == 12 || p6 == 12 || p7 == 12 || p8 == 12) {
        if (typ == "small") {
            showHitbox("O hat ein Feld gewonnen.")
            bigFields[bigGridItem - 1] = 4;
            showWinField("o");
            lockNotUseableFields();
            validateField(bigFields, "big");
            if (miniTicTacToe) {
                showHitbox("O hat gewonnen. Glückwunsch!", "good", 10000)

                endGame();
            }
        } else {
            showHitbox("O hat gewonnen. Glückwunsch!", "good", 10000)
            endGame();
        }
    }
}

function lockNotUseableFields() {
    for (let i = 0; i < 9; i++) {
        //Freie Felder im abgeschlossenen BigField sperren
        if (fields[bigGridItem - 1][i] == 0) {
            fields[bigGridItem - 1][i] = 13;
            document.getElementById((bigGridItem) + "-" + (i + 1)).innerText = "-";
            document.getElementById((bigGridItem) + "-" + (i + 1)).style.color = "black";
        }

        //Kleine Felder in allen großen Feldern sperren
        if (fields[i][bigGridItem - 1] == 0) {
            fields[i][bigGridItem - 1] = 13;
            document.getElementById((i + 1) + "-" + (bigGridItem)).innerText = "-";
            document.getElementById((i + 1) + "-" + (bigGridItem)).style.color = "black";
        }
    }
}

function checkEndOfGame() {
    let fieldsWithNull = 0;
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (fields[i][j] == 0) {
                fieldsWithNull++;
            }
        }
    }

    if (fieldsWithNull == 0) {
        stopGameWithoutClearWinner();
    }
    if (miniTicTacToe && gameActive) {
        fieldsWithNull = 0;
        for (let i = 0; i < 9; i++) {
            if (fields[4][i] == 0) {
                fieldsWithNull++;
            }
        }

        if (fieldsWithNull == 0) {
            gameActive = false;
            showHitbox("Spielende! Unentschieden!", "good", 10000);
            endGame();
        }
    }
}

function endGame() {
    gameActive = false;
    //Alle nicht belegten Felder Sperren
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (fields[i][j] == 0) {
                fields[i][j] = 13;
                let field = document.getElementById((i + 1) + "-" + (j + 1));
                field.innerText = "-";
                field.style.color = "black";
            }
        }
    }

    document.getElementById("playerinfo").style.display = "none";
    document.getElementById("resetButton").style.display = "block";
}

function stopGameWithoutClearWinner() {
    if (gameActive) {
        let xFields = 0;
        let oFields = 0;
        bigFields.forEach(field => {
            if (field == 1) {
                xFields++;
            } else if (field == 4) {
                oFields++;
            }
        })
        let winMessage = "Spielende! ";
        if (xFields == oFields) {
            winMessage += "Unentschieden."
        } else if (xFields > oFields) {
            winMessage += "X gewinnt!";
        } else {
            winMessage += "O gewinnt!";
        }
        showHitbox(winMessage, "good", 10000);

        endGame();
    }
}

function showWinField(winner) {
    let fieldsToFormat;
    let color;
    if (winner == "x") {
        color = "#6ebcc3";
        fieldsToFormat = new Array(
            document.getElementById(bigGridItem + "-1"),
            document.getElementById(bigGridItem + "-3"),
            document.getElementById(bigGridItem + "-5"),
            document.getElementById(bigGridItem + "-7"),
            document.getElementById(bigGridItem + "-9")
        )
    } else {
        color = "#cf9f62";
        fieldsToFormat = new Array(
            document.getElementById(bigGridItem + "-2"),
            document.getElementById(bigGridItem + "-4"),
            document.getElementById(bigGridItem + "-6"),
            document.getElementById(bigGridItem + "-8")
        )
    }


    fieldsToFormat.forEach(field => {
        field.style.backgroundColor = color;
    })
}

function toggleButton(element, identity) {
    element.classList.toggle("on");
    switch (identity) {
        case "miniTicTacToe":
            miniTicTacToe = !miniTicTacToe;
            break;
        case "singlePlayer":
            singlePlayer = !singlePlayer;
            break;
    }
}