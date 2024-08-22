function computerMove () {
    var field = fields[bigGridItem - 1];

    var possibilities = new Array(8);
    possibilities[0] = field[0] + field[1] + field[2];
    possibilities[1] = field[3] + field[4] + field[5];
    possibilities[2] = field[6] + field[7] + field[8];
    possibilities[3] = field[0] + field[3] + field[6];
    possibilities[4] = field[1] + field[4] + field[7];
    possibilities[5] = field[2] + field[5] + field[8];
    possibilities[6] = field[0] + field[4] + field[8];
    possibilities[7] = field[2] + field[4] + field[6];

    let twoOinARow = new Array(0);
    let oneOinARow = new Array(0);
    let null0inARow = new Array(0);

    for (let i = 0; i < possibilities.length; i++) {
        if (possibilities[i] == 8) {
            findFreeFieldForTwoO(i);
        }
    }

    for (let i = 0; i < possibilities.length; i++) {
        if (possibilities[i] == 4) {
            findFreeFieldForOneO(i);
        }
    }

    console.log("TWO:" + twoOinARow);
    console.log("ONE:" + oneOinARow);
    console.log("NULL:" + null0inARow);


}

function findFreeFieldForTwoO (possibility) {
    //TODO mögliche Felder Raussuchen, wenn zwei O in der Reihe
    switch (possibility) {
        case 0: //0, 1, 2
            break;
        case 1: //3, 4, 5
            break;
        case 2: //6, 7, 8
            break;
        case 3: //0, 3, 6
            break;
        case 4: //1, 4, 7
            break;
        case 5: //2, 5, 8
            break;
        case 6: //0, 4, 8
            break;
        case 7: //2, 4, 6
            break;
    }
}

function findFreeFieldForOneO (possibility) {
    //TODO mögliche Felder Raussuchen, wenn nur ein O in der Reihe
    switch (possibility) {
        case 0: //0, 1, 2
            break;
        case 1: //3, 4, 5
            break;
        case 2: //6, 7, 8
            break;
        case 3: //0, 3, 6
            break;
        case 4: //1, 4, 7
            break;
        case 5: //2, 5, 8
            break;
        case 6: //0, 4, 8
            break;
        case 7: //2, 4, 6
            break;
    }
}