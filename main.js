function startGame () {
    console.log("Start Game");

    player = Math.random() < 0.5;
    console.log("Spieler: " + player);

    refreshPlayer();

    document.getElementById("startButton").style.display = "none";
    document.getElementById("playerinfo").style.display = "block";

    gameActive = true;

    changeRedBorder();

    // Jede Zeile des Arrays initialisieren
    for (let i = 0; i < 9; i++) {
        fields[i] = new Array(9);
    }

    for (let i = 0; i < 3; i++) {
        bigFields[i] = new Array(3);
    }

// Optionale Initialisierung der Array-Werte, z.B. mit Nullen
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            fields[i][j] = 0;
        }
    }

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            bigFields[i][j] = 0;
        }
    }

    console.log(fields);
    console.log(bigFields);
}

function changeRedBorder() {
    document.querySelectorAll('.big-grid-item').forEach(bigItem => {
        bigItem.style.border = "1px solid black";
    })

    document.getElementById("big" + bigGridItem).style.border = "4px solid red";
}

function refreshPlayer() {
    player = !player;
    if (player == true) {
        document.getElementById("player").innerText = "O";
    } else {
        document.getElementById("player").innerText = "X";
    }
}

function fieldClick(bigField, i, j) {

}