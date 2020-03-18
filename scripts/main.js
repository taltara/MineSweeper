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

var elTimer = document.querySelector('.zTimer');
var elTable = document.querySelector('.table');

renderBoard(getShulaBoard(gLevel));


// Disabling right-mouse context menu for wanted behaviour

window.addEventListener('contextmenu', function (event) {
    // console.log(event);

    event.preventDefault();

}, false);


//=====================//
//     FUNCTIONS		//
//=====================//

function getShulaBoard(level) {

    var boardSize = level.SIZE;

    var minesIdxs = setMines();

    for (var i = 0; i < boardSize; i++) {

        var shulaRow = []
        for (var j = 0; j < boardSize; j++) {

            var temp1DIdx = i * boardSize + j;

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


function renderBoard(numsBoard) {

    var strHtml = '', classAdd = '', glareStat = '', tiltStat = '30';

    if (gLevel.DIFF === 3) {

        // classAdd = 'data-tilt-reset';
        glareStat = '1';
        tiltStat = '35';

    } else if (gLevel.DIFF === 2) {

        glareStat = '0.8';

    } else {

        glareStat = '0.6';
    }


    for (var i = 0; i < shulaBoard.length; i++) {

        strHtml += '<div class="num-row">';

        for (var j = 0; j < shulaBoard[i].length; j++) {

            gCount += 1;


            if (shulaBoard[i][j] != MINE) {

                if (shulaBoard[i][j] > 0) {

                    classAdd = `num-type-${shulaBoard[i][j]}`;
                }
            }

            strHtml += `<span class="span${gCount} outter-span" data-tilt><div onmouseup="cellClicked(this, event)" class="num-cell cell${gCount} num-cell-${gLevel.DIFF} in${i}-${j}" data-tilt>
            <span class="inner-num covered ${classAdd}">${shulaBoard[i][j]}</span>
            </div></span>`;

        }

        strHtml += '</div>'
    }
    // console.log(`gCOUNT: ${gCount}`);

    gCount -= gLevel.MINES;
    elTable.innerHTML = strHtml;
    gGame.isOn = true;

    initTiltBoard();

}

function initTiltBoard() {

    var tiltSpans = document.querySelectorAll(".outter-span");
    var innerTiltSpans = document.querySelectorAll(".num-cell");

    VanillaTilt.init(tiltSpans, {

        max: (gLevel.DIFF === 3) ? 15 : 20,
        speed: 500,
        // glare: true,
        // "max-glare": 0.6,
        // reverse: true,

    });

    VanillaTilt.init(innerTiltSpans, {
        // reset: gLevel.DIFF > 2 ? false : true,
        // glare: true,
        // "max-glare": 0.1,
    });

}


function resetGame(elDiffButton) {

    newBestscore = 0;
    var difficulty = elDiffButton.classList[1];
    gLevel.DIFF = parseInt(difficulty[difficulty.length - 1]);

    if (gLevel.DIFF === 1) gLevel.SIZE = 4, gLevel.MINES = 2;
    else if (gLevel.DIFF === 2) gLevel.SIZE = 8, gLevel.MINES = 12;
    else if (gLevel.DIFF === 3) gLevel.SIZE = 12, gLevel.MINES = 20;
    // console.log(`gLEVEL: DIFF = ${gLevel.DIFF} | SIZE = ${gLevel.SIZE} | MINES: ${gLevel.MINES}`);

    elTable.className = 'table';
    resetTimer();

    elTimer.style.fontSize = "unset";
    if (elTimer.classList.contains('new-best-score-timer')) elTimer.classList.remove('new-best-score-timer');

    gCount = 0, shulaBoard = [];

    renderBoard(getShulaBoard(gLevel));
}


function setMines() {

    var minesIdxVault = [];
    var newIdx = Math.floor(Math.random() * Math.pow(gLevel.SIZE, 2));

    for (var i = 0; i < gLevel.MINES; i++) {

        while (minesIdxVault.includes(newIdx)) {
            // console.log('IDX:', newIdx);

            newIdx = Math.floor(Math.random() * Math.pow(gLevel.SIZE, 2));
        }
        minesIdxVault.push(newIdx);
        // console.log(minesIdxVault);
    }

    console.log(minesIdxVault);

    return minesIdxVault;
}


function cellClicked(elNum, eventButton) {

    var numId = elNum.classList[1];
    var expandingEmptySpots = [];
    var checkedEmptyIdxs = [];

    var elClickedNum = document.querySelector(`.${numId}`);
    var elClickedInnerNum = document.querySelector(`.${numId} span`);
    console.log(eventButton);

    if (!(elClickedInnerNum.classList.contains('covered')) || !gGame.isOn) return;

    // Flagging right-pressed spots
    if (elClickedNum.classList.contains('flagged')) {
        if (eventButton.which === 3) {

            elClickedNum.classList.remove('flagged');
        }
        return;

    } else {

        if (eventButton.which === 3) {

            elClickedNum.classList.add('flagged');
            return;
        }
    }


    if (!gGame.shownCount) {
        startTime();
        elTable.classList.add(`table-start-${gLevel.DIFF}`);
    }

    var pressedSpot = document.querySelector(`.${numId} span`).innerHTML;

    if (pressedSpot === SPACE) { // Pressed a space

        var emptyIdx = getIdxs(elClickedNum.classList[elClickedNum.classList.length - 1]);
        // Recursively look for adjacent spaces
        recOpenEmptySpots(emptyIdx, expandingEmptySpots, checkedEmptyIdxs);
        console.log(`EXPANDERS:`, expandingEmptySpots);
        console.log(`CHECKED:`, checkedEmptyIdxs);

        gGame.shownCount += expandingEmptySpots.length;

        uncoverAllAdjEmpty(expandingEmptySpots);


    } else if (pressedSpot != MINE) { // Pressed a num

        if(parseInt(elClickedInnerNum.innerHTML) > 0) {

            gGame.shownCount += 1;
            elClickedNum.style.background = 'lightgray';
            elClickedInnerNum.classList.remove('covered');
        }

    } else { // Pressed a mine

        console.log('BIP BOOP BOP - YOU ARE DEAD');
        
        elClickedInnerNum.classList.remove('covered');
        endGame(true);
    }

    if(gCount === gGame.shownCount) endGame();
    // console.log(`gCount:`,gCount, `gGame.shownCount:`, gGame.shownCount);
    
}

function endGame(mine = false) {

    gGame.isOn = false;
    stopTimer();
    elTable.className = 'table';

    if (!mine) {

        elTimer.style.fontSize = "50px";
        if (updateScore()) elTimer.classList.add('new-best-score-timer');
    }
}




