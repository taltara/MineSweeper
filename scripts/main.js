const MINE = `<img class="mine" src="assets/bomb.png">`;
const SPACE = ' ';


var shulaBoard = [];
var boardTimeMachine = [];

var gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0 }
var gCount = 0;
var gLevel = { DIFF: 1, SIZE: 4, MINES: 2 };
var gTime = 0;
var gHints = 3, hintVault = [], gSafeClick = 3, hintModeOn = false, gLives = 3;
var gStart = 0;
var gHult = false;
var gMinesIdx = [];
var gDidTimeMachine = false;
var gHintsAndSafeClicksStats = [];

var timeBegan = null,
    timeStopped = null,
    stoppedDuration = 0,
    startedTimer = null;

var min, newBestscore = 0;

var doomShulaInterval;

var manualMineVault = [], manualMinesModeOn = false;

var elTimer = document.querySelector('.zTimer');
var elTable = document.querySelector('.table');

// audio files
var clickAudio = new Audio('assets/click.mp3');
var flagAudio = new Audio('assets/flag.mp3');
var reFlagAudio = new Audio('assets/re-flag.mp3');
var reClickAudio = new Audio('assets/re-click.mp3');

clickAudio.volume = 0.1;
reClickAudio.volume = 0.1;
flagAudio.volume = 0.075;
reFlagAudio.volume = 0.075;

fakeStartHandler();

// Disabling right-mouse context menu for wanted behaviour

window.addEventListener('contextmenu', function (event) {
    // console.log(event);

    event.preventDefault();

}, false);


//=====================//
//     FUNCTIONS		//
//=====================//


// Creates new fake board
function getFakeBoard() {

    var newFakeBoard = [];

    for (var i = 0; i < gLevel.SIZE; i++) {

        var fakeBoardRow = [];
        for (var j = 0; j < gLevel.SIZE; j++) {

            fakeBoardRow.push(SPACE);
        }
        newFakeBoard.push(fakeBoardRow);
    }

    return newFakeBoard;
}


// Handles initial board creation for correct animation and assets
function fakeStartHandler(eldiffButton = null) {

    if (eldiffButton) {

        resetGLevel(eldiffButton);
    }

    gDidTimeMachine = false;
    gHintsAndSafeClicksStats = [];
    gLives = 3;
    gStart = 0;
    gGame.shownCount = 0;
    elTable.className = 'table';
    gGame.isOn = false;
    document.querySelector('.hints').innerHTML = '';
    document.querySelector('.safe-clicks').innerHTML = '';
    headerAnimationsHandler(false, true);

    if (doomShulaInterval) clearInterval(doomShulaInterval);
    doomShulaInterval = null;

    animateDoomShula('random', true);
    hintModeOn = manualMinesModeOn = false;
    updateLifeStats(0);
    resetTimer();
    renderBoard(getFakeBoard());
}

// Making sure safe spot doesn't have a mine in it
function ensureSafeSpot(minesIdxs, safeSpot) {

    for (var i = 0; i < minesIdxs.length; i++) {

        if ((safeSpot.i * gLevel.SIZE + safeSpot.j) === minesIdxs[i]) {

            while ((safeSpot.i * gLevel.SIZE + safeSpot.j) === minesIdxs[i]) {

                minesIdxs[i] = Math.floor(Math.random() * Math.pow(gLevel.SIZE, 2));
            }
        }
    }
}

// Creates new shula board
// supports 'edit minefield' and safe-click modes
function getShulaBoard(level, mineConfig = null) {

    var minesIdxs;

    if (mineConfig) {

        if (Array.isArray(mineConfig)) {

            minesIdxs = mineConfig;
        } else {
            minesIdxs = setMines();
            ensureSafeSpot(minesIdxs, mineConfig)
        }
    } else minesIdxs = setMines();

    for (var i = 0; i < level.SIZE; i++) {

        var shulaRow = []
        for (var j = 0; j < level.SIZE; j++) {

            var temp1DIdx = i * level.SIZE + j;

            if (minesIdxs.includes(temp1DIdx)) {

                shulaRow.push(MINE);

            } else {
                shulaRow.push(SPACE);
            }

        }
        shulaBoard.push(shulaRow);
    }

    checkBombsAround();

    return shulaBoard;
}

// Renders board/starter fake board for 'first click safe' feature 
function renderBoard(numsBoard, safeSpot = null, event = null) {

    var strHtml = '', classAdd = '', glareStat = '', tiltStat = '30';
    var functionMode = (gStart === 1) ? `onmouseup="cellClicked(this, event)"` : `onmouseup="resetGame(this, true, event)"`;

    for (var i = 0; i < numsBoard.length; i++) {

        strHtml += '<div class="num-row">';

        for (var j = 0; j < numsBoard[i].length; j++) {

            gCount += 1;


            if (numsBoard[i][j] != MINE) {

                if (numsBoard[i][j] > 0) {

                    classAdd = ` num-type-${numsBoard[i][j]} `;
                }
            } else if (numsBoard[i][j] === MINE) {

                if (gStart) classAdd += ' mine-back '
            } else {

                if (gStart) classAdd += ' empty-back '
            }

            strHtml += `<span class="span${gCount} outter-span" data-tilt><div ${functionMode} class="num-cell cell${gCount} num-cell-${gLevel.DIFF} in${i}-${j}">
            <span class="inner-num covered ${classAdd}">${numsBoard[i][j]}</span>
            </div></span>`;

            classAdd = '';
        }

        strHtml += '</div>'
    }

    gCount -= gLevel.MINES;
    elTable.innerHTML = strHtml;
    if (gStart) boardTimeMachine.unshift(strHtml);
    gGame.isOn = true;

    initTiltBoard();

    if (gStart === 1 && safeSpot != null) {

        if (!Array.isArray(safeSpot)) {

            var elSafeSpot = document.querySelector(`.in${safeSpot.i}-${safeSpot.j}`);

            cellClicked(elSafeSpot, event);

        }

        gStart = 0;
    }


    if (!gStart) gStart = 1

}

// resets global level stats
function resetGLevel(elButton) {

    var difficulty = elButton.classList[1];
    gLevel.DIFF = parseInt(difficulty[difficulty.length - 1]);

    if (gLevel.DIFF === 1) gLevel.SIZE = 4, gLevel.MINES = 2;
    else if (gLevel.DIFF === 2) gLevel.SIZE = 8, gLevel.MINES = 12;
    else if (gLevel.DIFF === 3) gLevel.SIZE = 12, gLevel.MINES = 20;
}

// Main reset function for handeling resetting the game
// supports 'edit minefield' and safe-click modes
function resetGame(elStartButton, mode = false, event = null) {

    if (manualMinesModeOn && manualMineVault.length != gLevel.MINES) {
        cellClicked(elStartButton, event);
    } else {

        var safeSpot = null;

        if (mode) {

            if (manualMinesModeOn) {

                manualMinesModeOn = false;
                safeSpot = manualMineVault;

            } else {

                var clickedSafePlace = elStartButton.classList[elStartButton.classList.length - 1];
                safeSpot = getIdxs(clickedSafePlace);
            }

        } else {

            resetGLevel(elStartButton);
        }

        newBestscore = 0;
        gHints = gSafeClick = gLives = 3;
        var elHints = document.querySelector('.hints');
        var elSafeClicks = document.querySelector('.safe-clicks');

        elHints.innerHTML = '';
        elSafeClicks.innerHTML = '';
        manualMineVault = [];
        elTable.className = 'table';
        resetTimer();
        boardTimeMachine = [];
        elTimer.style.fontSize = "unset";
        if (elTimer.classList.contains('new-best-score-timer')) elTimer.classList.remove('new-best-score-timer');

        gCount = 0, shulaBoard = [];

        renderBoard(getShulaBoard(gLevel, safeSpot), safeSpot, event);

    }
}

// Resets animation for selected mines
function resetManualMineMode() {

    for (var i = 0; i < manualMineVault.length; i++) {

        var tempIdxJ, tempIdxI;
        tempIdxI = parseInt(manualMineVault[i] / gLevel.SIZE);
        tempIdxJ = manualMineVault[i] % gLevel.SIZE;

        var tempSpot = document.querySelector(`.in${tempIdxI}-${tempIdxJ}`);
        console.log(tempSpot);

        tempSpot.style.filter = 'unset';
    }
}

// handles creation of new mine in 'edit minefield' mode
function setManualMines(newMineSpot) {

    var newMineIdx = newMineSpot.classList[newMineSpot.classList.length - 1];
    newMineIdx = getIdxs(newMineIdx);
    newMineIdx = newMineIdx.i * gLevel.SIZE + newMineIdx.j;

    if (manualMineVault.length < gLevel.MINES) {

        if (!(manualMineVault.includes(newMineIdx))) {

            manualMineVault.push(newMineIdx);
        }

        if (manualMineVault.length === gLevel.MINES) {
            setTimeout(function () {
                document.querySelector('.set-mines-button').style.background = 'rgb(152,251,152)';
                resetGame(null, true);
            }, 200);
        }

    }
}

// Handles 'edit minefield' mode
function editMinesHandeler(editMinesButton) {

    if (!gGame.shownCount && !gDidTimeMachine) {

        if (!manualMinesModeOn) {

            manualMinesModeOn = true;
            editMinesButton.style.background = 'rgb(127,255,0)';

        }
        else {

            manualMinesModeOn = false;

            editMinesButton.style.background = 'rgb(152,251,152)';
            if (manualMineVault.length) resetManualMineMode();

        }
    }
}


// Main handler of user clicks
function cellClicked(elNum, eventButton) {

    var numId = elNum.classList[1];

    var elClickedNum = document.querySelector(`.${numId}`);
    var elClickedInnerNum = document.querySelector(`.${numId} span`);

    if (hintModeOn || manualMinesModeOn) {

        if (manualMinesModeOn) {
            elClickedNum.style.filter = 'brightness(0.5)';

            setManualMines(elClickedNum);

        } else {

            if (elClickedInnerNum.classList.contains('covered')) {
                // console.log('GOTHERE');


                showHint(elClickedNum);
            } else {

                elClickedNum.style.filter = 'sepia(1)';

                setTimeout(function () {

                    elClickedNum.style.filter = 'unset';
                }, 300);
            }
        }

    } else {

        if (!(elClickedInnerNum.classList.contains('covered')) || !gGame.isOn || gHult) return;
        var expandingEmptySpots = [];
        var checkedEmptyIdxs = [];
        var touchedMine = false;


        // Flagging right-pressed spots
        if (elClickedNum.classList.contains('flagged')) {
            if (eventButton.which === 3) {

                flagAudio.play();
                elClickedNum.classList.remove('flagged');
                gGame.markedCount -= 1;
            }
            return;

        } else {

            if (eventButton.which === 3) {

                reFlagAudio.play();
                elClickedNum.classList.add('flagged');
                gGame.markedCount += 1;
                return;
            }
        }
        clickAudio.play();

        if (!gGame.shownCount) {
            startTime();
            handleHintsAndSafeClicks('both');

            elTable.classList.add(`table-start-${gLevel.DIFF}`);
        }

        var pressedSpot = document.querySelector(`.${numId} span`).innerHTML;

        if (pressedSpot === SPACE) { // Pressed a space

            var emptyIdx = getIdxs(elClickedNum.classList[elClickedNum.classList.length - 1]);

            // recursively finding all adjacent spaces and first line of numbers
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

            touchedMine = true;
            updateLifeStats(1);
            gHult = true;
            revealAllBombs(elClickedInnerNum);
            if (!gLives) {
                endGame(true);
            }
            else {

                animateDoomShula('angry');
            }
            var pressedMineIdx = getIdxs(elNum.classList[elNum.classList.length - 1]);
            gMinesIdx.push(pressedMineIdx.i * gLevel.SIZE + pressedMineIdx.j);
        }

        if (!touchedMine) {
            gHintsAndSafeClicksStats.unshift({hints: gHints, safeClicks: gSafeClick});
            boardTimeMachine.unshift(document.querySelector('.table').innerHTML);
        }

        // on win
        if (gCount === gGame.shownCount) {
            flagAllMinesOnWin();
            endGame();
        }

    }

}

// Enables re-rendering of past board configuration
function shulaTimeMachine(elRedoButton) {

    if(!gDidTimeMachine) gDidTimeMachine = true;

    if (gGame.shownCount || gMinesIdx.length && gGame.isOn && boardTimeMachine.length > 0) {

        reClickAudio.play();
        
        elRedoButton.style.filter = 'blur(1px)';
        elTable.style.filter = 'blur(2px)';
        gHult = true;
        
        setTimeout(function () {
            
            elRedoButton.style.filter = 'unset';
            elTable.style.filter = 'unset';
            gHult = false;
        }, 300);

        boardTimeMachine.shift();
        gHintsAndSafeClicksStats.shift();
        elTable.innerHTML = boardTimeMachine[0];

        timeMachineStatsRecover();
    }
}

// Recovers game stats to previous position
function timeMachineStatsRecover() {

    var minesCount = 0, shownCells = 0;

    for (var i = 0; i < gLevel.SIZE; i++) {

        for (var j = 0; j < gLevel.SIZE; j++) {

            var tempCell = document.querySelector(`.in${i}-${j}`);

            var tempCellInner = document.querySelector(`.in${i}-${j} span`);

            if (!(tempCellInner.classList.contains('covered'))) {

                shownCells += 1;

                if (tempCellInner.innerHTML === MINE) {

                    minesCount += 1;
                }
            }
        }
    }

    // if (!(minesCount === gLevel.MINES)) {

    gGame.shownCount = shownCells;
    gLives = 3 - minesCount;

    while (gMinesIdx.length > minesCount) {
        gMinesIdx.pop();
    }

    gHints = gHintsAndSafeClicksStats[0].hints;
    gSafeClick = gHintsAndSafeClicksStats[0].safeClicks;
    handleHintsAndSafeClicks('both');

    updateLifeStats(-1);
    // }
}

// Updates life-related stats
function updateLifeStats(diff = 0) {

    if (diff > 0) {

        if (diff) {

            gLives -= diff;
        } else if (diff === 0) {
            gLives = 3;
        }

    }

    // console.log(gLives);

    var htmlLives = '';
    for (var i = 0; i < gLives; i++) {

        htmlLives += `<img src="assets/heart.png" class="heart">`;
    }

    document.querySelector('.lives').innerHTML = htmlLives;

}

// Reveals all bombs on bombs press
function revealAllBombs(elPressedBomb) {

    for (var i = 0; i < gLevel.SIZE; i++) {

        for (var j = 0; j < gLevel.SIZE; j++) {

            if (shulaBoard[i][j] === MINE) {

                var elBomb = document.querySelector(`.in${i}-${j} span`);

                elBomb.classList.remove('covered');

            }
        }
    }
    setTimeout(function () {

        hideAllBombs(elPressedBomb);
        gHintsAndSafeClicksStats.unshift({hints: gHints, safeClicks: gSafeClick});
        boardTimeMachine.unshift(document.querySelector('.table').innerHTML);
        gHult = false;
    }, 1000);
}

// Hides all unclicked mines
function hideAllBombs(elPressedBomb) {

    for (var i = 0; i < gLevel.SIZE; i++) {

        for (var j = 0; j < gLevel.SIZE; j++) {

            if (shulaBoard[i][j] === MINE) {

                var elBomb = document.querySelector(`.in${i}-${j} span`);
                if (!gMinesIdx.includes(i * gLevel.SIZE + j)) {

                    elBomb.classList.add('covered');
                }

            }
        }
    }
}

// End game function at win/lose
function endGame(mine = false) {

    gGame.isOn = false;
    stopTimer();
    elTable.className = 'table';

    clearInterval(doomShulaInterval);
    doomShulaInterval = null;

    if (!mine) {

        headerAnimationsHandler(true);
        animateDoomShula(DOOM_HAPPY, true);
        // elTimer.style.fontSize = "50px";
        if (updateScore()) elTimer.classList.add('new-best-score-timer');

    } else {

        console.log('BIP BOOP BOP - YOU ARE DEAD');
        headerAnimationsHandler(false);
        animateDoomShula(DOOM_ANGRY, true);

    }
}

// Handles header animations
function headerAnimationsHandler(won = false, reset = false) {

    var elMinesHeader = document.querySelector('.mines-header');
    var elShulaHeader = document.querySelector('.shula-header');
    var elSmallerHeader = document.querySelector('.smaller-header');

    if (!reset) {

        if (won) {

            elShulaHeader.classList.add('win-header');

            elMinesHeader.textContent = '';
            elSmallerHeader.textContent = '';

        } else {

            elMinesHeader.classList.add('win-header');
            elShulaHeader.textContent = '';
            elSmallerHeader.textContent = '';
        }

    } else {

        elShulaHeader.className = 'shula-header ';
        elMinesHeader.className = 'mines-header ';
        elShulaHeader.textContent = 'Shula ';
        elSmallerHeader.textContent = '& ';
        elMinesHeader.textContent = 'the mines';
    }
}

function flagAllMinesOnWin() {

    for (var i = 0; i < gLevel.SIZE; i++) {

        for (var j = 0; j < gLevel.SIZE; j++) {

            if (shulaBoard[i][j] === MINE) {

                var mineCover = document.querySelector(`.in${i}-${j}`);
                var mineInnerCover = document.querySelector(`.in${i}-${j} span`);

                if ((mineInnerCover.classList.contains('covered'))) {

                    mineCover.classList.add('flagged');
                }

            }
        }
    }

}

// Handler of the 'show hint' mode
function showHint(elCenterHintSpot) {

    hintModeOn = false;
    var centerIdx = elCenterHintSpot.classList[elCenterHintSpot.classList.length - 1];
    centerIdx = getIdxs(centerIdx);

    var centerHintSpot = document.querySelector(`.in${centerIdx.i}-${centerIdx.j} span`);

    centerHintSpot.classList.remove('covered');
    setTimeout(function () {

        centerHintSpot.classList.add('covered');
    }, 1100);

    checkAroundHintSpot(centerIdx)
}

// Checks around the hinted about spot
function checkAroundHintSpot(centerHintIdx) {

    hintVault = [];

    let indexLeft = centerHintIdx.i - 1, indexRight = centerHintIdx.j - 1;
    for (let k = 0; k < 8; k++) {

        var currentSpot = document.querySelector(`.in${indexLeft}-${indexRight}`);
        var currentSpotInner = document.querySelector(`.in${indexLeft}-${indexRight} span`);
        if ((indexLeft >= 0 && indexLeft < gLevel.SIZE) && (indexRight >= 0 && indexRight < gLevel.SIZE)) {

            if (!(currentSpot.classList.contains('flagged')) && currentSpotInner.classList.contains('covered')) {

                hintVault.push(currentSpotInner);

            }
        }

        if (k === 0 || k === 1) indexRight += 1
        else if (k === 2 || k === 3) indexLeft += 1
        else if (k === 4 || k === 5) indexRight -= 1
        else if (k === 6) indexLeft -= 1;

    };

    var currentSpot;

    for (var i = 0; i < hintVault.length; i++) {

        currentSpot = hintVault[i];
        currentSpot.classList.remove('covered');
    }


    hideAllHints();
}



