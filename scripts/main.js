const MINE = `<img class="mine" src="assets/bomb.png">`;
const SPACE = ' ';

var gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0 }

var shulaBoard = [];

var gCount = 0;
var gLevel = { DIFF: 1, SIZE: 4, MINES: 2 };
var gTime = 0;


var timeBegan = null,
    timeStopped = null,
    stoppedDuration = 0,
    startedTimer = null;

var min, newBestscore = 0;
var gStart = 0;

var gHints = 3, gSafeClick = 3;
var doomShulaInterval;

var elTimer = document.querySelector('.zTimer');
var elTable = document.querySelector('.table');

fakeStart();

// Disabling right-mouse context menu for wanted behaviour

window.addEventListener('contextmenu', function (event) {
    // console.log(event);

    event.preventDefault();

}, false);


//=====================//
//     FUNCTIONS		//
//=====================//


function getFakeBoard() {

    var fakeBoard = [];

    for (var i = 0; i < gLevel.SIZE; i++) {

        var fakeBoardRow = [];
        for (var j = 0; j < gLevel.SIZE; j++) {

            fakeBoardRow.push(SPACE);
        }
        fakeBoard.push(fakeBoardRow);
    }
    console.log(fakeBoard);
    return fakeBoard;
}



function fakeStart(eldiffButton = null) {

    if (eldiffButton) {
        gStart = 0;
        gGame.shownCount = 0;
        elTable.className = 'table';
        gGame.isOn = false;
        document.querySelector('.hints').innerHTML = '';
        document.querySelector('.safe-clicks').innerHTML = '';

        clearInterval(doomShulaInterval);
        doomShulaInterval = null;
        
        animateDoomShula('random');

        resetGLevel(eldiffButton);
    }
    resetTimer();
    renderBoard(getFakeBoard());
}

function ensureSafeSpot(minesIdxs, safeSpot) {

    for (var i = 0; i < minesIdxs.length; i++) {

        if ((safeSpot.i * gLevel.SIZE + safeSpot.j) === minesIdxs[i]) {

            while ((safeSpot.i * gLevel.SIZE + safeSpot.j) === minesIdxs[i]) {

                minesIdxs[i] = Math.floor(Math.random() * Math.pow(gLevel.SIZE, 2));
            }
        }
    }
}

function getShulaBoard(level, safeSpot = null) {

    var minesIdxs = setMines();

    if (safeSpot) {

        ensureSafeSpot(minesIdxs, safeSpot)
    }

    for (var i = 0; i < level.SIZE; i++) {

        var shulaRow = []
        for (var j = 0; j < level.SIZE; j++) {

            var temp1DIdx = i * level.SIZE + j;

            if (minesIdxs.includes(temp1DIdx)) {

                shulaRow.push(MINE);

            } else {
                shulaRow.push(SPACE);
            }
            // shulaRow.push(i + j + 1);

        }
        shulaBoard.push(shulaRow);
    }

    checkBombsAround();

    return shulaBoard;
}


function renderBoard(numsBoard, safeSpot = null, event = null) {

    var strHtml = '', classAdd = '', glareStat = '', tiltStat = '30';
    var functionMode = (gStart === 1) ? `onmouseup="cellClicked(this, event)"` : `onmouseup="resetGame(this, true, event)"`;

    // console.log(functionMode);
    if (gLevel.DIFF === 3) {

        // classAdd = 'data-tilt-reset';
        glareStat = '1';
        tiltStat = '35';

    } else if (gLevel.DIFF === 2) {

        glareStat = '0.8';

    } else {

        glareStat = '0.6';
    }

    for (var i = 0; i < numsBoard.length; i++) {

        strHtml += '<div class="num-row">';

        for (var j = 0; j < numsBoard[i].length; j++) {

            gCount += 1;


            if (numsBoard[i][j] != MINE) {

                if (numsBoard[i][j] > 0) {

                    classAdd = `num-type-${numsBoard[i][j]}`;
                }
            }

            strHtml += `<span class="span${gCount} outter-span" data-tilt><div ${functionMode} class="num-cell cell${gCount} num-cell-${gLevel.DIFF} in${i}-${j}" data-tilt>
            <span class="inner-num covered ${classAdd}">${numsBoard[i][j]}</span>
            </div></span>`;

        }

        strHtml += '</div>'
    }

    gCount -= gLevel.MINES;
    elTable.innerHTML = strHtml;
    gGame.isOn = true;

    initTiltBoard();
    // console.log('ARRIVED AGAIN');
    if (gStart === 1 && safeSpot != null) {

        var elSafeSpot = document.querySelector(`.in${safeSpot.i}-${safeSpot.j}`);


        cellClicked(elSafeSpot, event);

        // console.log(`SAFE`, elSafeSpot);
        gStart = 0;
    }

    if (!gStart) gStart = 1
    // console.log('GSTART:', gStart);

}


function resetGLevel(elButton) {

    var difficulty = elButton.classList[1];
    gLevel.DIFF = parseInt(difficulty[difficulty.length - 1]);

    if (gLevel.DIFF === 1) gLevel.SIZE = 4, gLevel.MINES = 2;
    else if (gLevel.DIFF === 2) gLevel.SIZE = 8, gLevel.MINES = 12;
    else if (gLevel.DIFF === 3) gLevel.SIZE = 12, gLevel.MINES = 20;
}

function resetGame(elStartButton, mode = false, event = null) {

    var safeSpot = null;

    if (mode) {

        var clickedSafePlace = elStartButton.classList[elStartButton.classList.length - 1];
        safeSpot = getIdxs(clickedSafePlace);
        console.log(safeSpot);
    } else {

        resetGLevel(elStartButton);
    }

    newBestscore = 0;
    gHints = gSafeClick = 3;
    var elHints = document.querySelector('.hints');
    var elSafeClicks = document.querySelector('.safe-clicks');

    elHints.innerHTML = '';
    elSafeClicks.innerHTML = '';

    // console.log(`gLEVEL: DIFF = ${gLevel.DIFF} | SIZE = ${gLevel.SIZE} | MINES: ${gLevel.MINES}`);

    elTable.className = 'table';
    resetTimer();

    elTimer.style.fontSize = "unset";
    if (elTimer.classList.contains('new-best-score-timer')) elTimer.classList.remove('new-best-score-timer');

    gCount = 0, shulaBoard = [];

    renderBoard(getShulaBoard(gLevel, safeSpot), safeSpot, event);
}



function cellClicked(elNum, eventButton) {

    var numId = elNum.classList[1];
    var expandingEmptySpots = [];
    var checkedEmptyIdxs = [];

    var elClickedNum = document.querySelector(`.${numId}`);
    var elClickedInnerNum = document.querySelector(`.${numId} span`);
    // console.log(eventButton);

    if (!(elClickedInnerNum.classList.contains('covered')) || !gGame.isOn) return;

    // Flagging right-pressed spots
    if (elClickedNum.classList.contains('flagged')) {
        if (eventButton.which === 3) {

            elClickedNum.classList.remove('flagged');
            gGame.markedCount -= 1;
        }
        return;

    } else {

        if (eventButton.which === 3) {

            elClickedNum.classList.add('flagged');
            gGame.markedCount += 1;
            return;
        }
    }


    if (!gGame.shownCount) {
        startTime();
        handleHintsAndSafeClicks('both');
        elTable.classList.add(`table-start-${gLevel.DIFF}`);
    }

    var pressedSpot = document.querySelector(`.${numId} span`).innerHTML;

    if (pressedSpot === SPACE) { // Pressed a space

        var emptyIdx = getIdxs(elClickedNum.classList[elClickedNum.classList.length - 1]);

        recOpenEmptySpots(emptyIdx, expandingEmptySpots, checkedEmptyIdxs);
        gGame.shownCount += expandingEmptySpots.length;
        uncoverAllAdjEmpty(expandingEmptySpots);

        if (!(gCount === gGame.shownCount)) animateDoomShula(DOOM_HAPPY);

    } else if (pressedSpot != MINE) { // Pressed a num

        if (parseInt(elClickedInnerNum.innerHTML) > 0) {

            gGame.shownCount += 1;
            elClickedNum.style.background = 'lightgray';
            elClickedInnerNum.classList.remove('covered');
        }

    } else { // Pressed a mine


        console.log('BIP BOOP BOP - YOU ARE DEAD');

        elClickedInnerNum.classList.remove('covered');
        endGame(true);
    }

    if (gCount === gGame.shownCount) endGame();
    // console.log(`gCount:`,gCount, `gGame.shownCount:`, gGame.shownCount);
    // console.log('SHOWCOUNT:', gGame.shownCount);

}

function endGame(mine = false) {

    gGame.isOn = false;
    stopTimer();
    elTable.className = 'table';

    clearInterval(doomShulaInterval);
    doomShulaInterval = null;

    if (!mine) {

        animateDoomShula(DOOM_HAPPY, true);
        // elTimer.style.fontSize = "50px";
        if (updateScore()) elTimer.classList.add('new-best-score-timer');

    } else {

        animateDoomShula(DOOM_ANGRY, true);
    }
}

function showHint() {


}

function showSafeClick() {


}


