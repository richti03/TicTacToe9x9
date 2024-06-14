function startGame() {
    console.log("Start Game");

    player = Math.random() < 0.5;

    refreshPlayer();

    document.getElementById("startButton").style.display = "none";
    document.getElementById("playerinfo").style.display = "block";

    gameActive = true;

    bigGridItem = 5;
    changeRedBorder();

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

    console.log(fields);
    console.log(bigFields);

    showHitbox("Das Spiel beginnt!");
}

function changeRedBorder() {
    document.querySelectorAll('.big-grid-item').forEach(bigItem => {
        bigItem.style.border = "1px solid black";
    })

    document.getElementById("big" + bigGridItem).style.border = "4px solid red";
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
    bigGridItem = j + 1;
    changeRedBorder();
}

function validateField(field, typ) {
    console.log(field);
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
            bigFields[bigGridItem - 1] = 3;
            //TODO irgendwie markieren
            lockNotUseableFields();
            validateField(bigFields, "big");
        } else {
            showHitbox("X hat gewonnen. Glückwunsch!", "good", 10000)
            //TODO alle Felder sperren
        }

    } else if (p1 == 12 || p2 == 12 || p3 == 12 || p4 == 12 || p5 == 12 || p6 == 12 || p7 == 12 || p8 == 12) {
        if (typ == "small") {
            showHitbox("O hat ein Feld gewonnen.")
            bigFields[bigGridItem - 1] = 4;
            //TODO irgendwie markieren
            lockNotUseableFields();
            validateField(bigFields, "big");
        } else {
            showHitbox("O hat gewonnen. Glückwunsch!", "good", 10000)
            //TODO alle Felder sperren
            
        }
    }
}

function lockNotUseableFields() {
    console.log("In lockNotUseableFields");
    for (let i = 0; i < 9; i++) {
        //Freie Felder im abgeschlossenen BigField sperren
        if (fields[bigGridItem-1][i] == 0) {
            fields[bigGridItem-1][i] = 13;
            console.log((bigGridItem) + "-" + (i + 1));
            document.getElementById((bigGridItem) + "-" + (i + 1)).innerText = "-";
            document.getElementById((bigGridItem) + "-" + (i + 1)).style.color = "black";
        }

        //Kleine Felder in allen großen Feldern sperren
        if (fields[i][bigGridItem-1] == 0) {
            fields[i][bigGridItem-1] = 13;
            document.getElementById((i + 1) + "-" + (bigGridItem)).innerText = "-";
            document.getElementById((i + 1) + "-" + (bigGridItem)).style.color = "black";
        }
    }
}