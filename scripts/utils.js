const DOOM_HAPPY = 'happy';
const DOOM_ANGRY = 'angry';

//================================//
//    SCORE HANDELING FUNCTIONS   //
//================================//

// Handles updating local storage scores
function updateScore() {

    var bestScore = localStorage.getItem(`bestScore${gLevel.DIFF}`);

    bestScore = (bestScore === null) ? Infinity : parseFloat(bestScore);

    if (gTime < bestScore) {

        newBestscore = 1;
        localStorage.setItem(`bestScore${gLevel.DIFF}`, gTime);
        elTimer.classList.add('new-best-score-timer');
        console.log(`NEW BEST SCORE: ${gTime}`);

        return true;
    }
    return false;
}


//================================//
//    TIME HANDELING FUNCTIONS    //
//================================//

function startTime() {
    if (timeBegan === null) {
        timeBegan = new Date();
    }

    if (timeStopped !== null) {
        stoppedDuration += (new Date() - timeStopped);
    }

    startedTimer = setInterval(clockRunning, 10);
}

function stopTimer() {
    timeStopped = new Date();
    clearInterval(startedTimer);
}

function resetTimer() {
    clearInterval(startedTimer);
    stoppedDuration = 0;
    timeBegan = null;
    timeStopped = null;
    elTimer.innerHTML = "000";
    elTimer.style.fontSize = "unset";
    if (elTimer.classList.contains('new-best-score-timer')) elTimer.classList.remove('new-best-score-timer');
}

function clockRunning() {
    var currentTime = new Date(),
        timeElapsed = new Date(currentTime - timeBegan - stoppedDuration);
    min = timeElapsed.getUTCMinutes();
    gTime = timeElapsed.getUTCSeconds();
    // ms = timeElapsed.getUTCMilliseconds();

    if (min > 0) gTime += 60 * min;
    elTimer.innerHTML = (gTime < 10) ? `00${gTime}` : (gTime < 100) ? `0${gTime}` : `${gTime}`;

    gGame.secsPassed = gTime;
};

//====================================//
//    ANIMATION HANDELING FUNCTIONS   //
//====================================//

// Initializes 'Vanillatilt' for cell animation
function initTiltBoard() {

    var tiltSpans = document.querySelectorAll(".outter-span");
    var innerTiltSpans = document.querySelectorAll(".num-cell");

    VanillaTilt.init(tiltSpans, {

        max: (gLevel.DIFF === 3) ? 15 : 20,
        speed: 500,
        glare: (gLevel.DIFF < 3) ? true : false,
        reverse: (gLevel.DIFF === 3) ? true : false,

    });

    VanillaTilt.init(innerTiltSpans, {
        // reset: gLevel.DIFF > 2 ? false : true,
        // glare: true,
        // "max-glare": 0.1,
    });

}

// Handler of all 'DoomGuy' animation
function animateDoomShula(animateTo, hult = false) {

    var elDoomShula = document.querySelector(".doom-shula");

    if (!(animateTo === 'random')) {

        elDoomShula.src = `assets/doomguy-${animateTo}.png`;
    }


    if (hult && !(animateTo === 'random')) {

        if (gCount === gGame.shownCount) {

            elDoomShula.style.filter = "invert(1)";
        } else {

            elDoomShula.style.filter = "grayscale(1)";
        }

    } else {

        var randomGuy = (Math.ceil(Math.random() * 2)) ? 'interested' : 'looking';

        if (animateTo === 'random') {

            doomShulaInterval = setInterval(function () {
                randomGuy = (Math.floor(Math.random() * 2)) ? 'interested' : 'looking';

                elDoomShula.src = `assets/doomguy-${randomGuy}.png`;
                elDoomShula.style.filter = 'unset';

            }, 2000);

            if (hult) {

                elDoomShula.style.filter = 'unset';
                elDoomShula.src = `assets/doomguy-${randomGuy}.png`;
            }

        } else {

            setTimeout(function () {

                elDoomShula.src = `assets/doomguy-${randomGuy}.png`;
                elDoomShula.style.filter = 'unset';
            }, 750);
        }
    }

}


//================================//
//    MISCELLANEOUS FUNCTIONS     //
//================================//

// shuffle function for randomizing arrays
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}


// Sets random mines for shula board
function setMines() {

    var minesIdxVault = [];
    var newIdx = Math.floor(Math.random() * Math.pow(gLevel.SIZE, 2));

    for (var i = 0; i < gLevel.MINES; i++) {

        while (minesIdxVault.includes(newIdx)) {
            newIdx = Math.floor(Math.random() * Math.pow(gLevel.SIZE, 2));
        }
        minesIdxVault.push(newIdx);
    }
    return minesIdxVault;
}

// Checks for surrounding bombs
function checkBombsAround() {

    var bombCount = 0;

    for (var i = 0; i < gLevel.SIZE; i++) {

        for (var j = 0; j < gLevel.SIZE; j++) {

            if (shulaBoard[i][j] === MINE) continue;

            let indexLeft = i - 1, indexRight = j - 1;
            for (let k = 0; k < 8; k++) {

                if ((indexLeft >= 0 && indexLeft < gLevel.SIZE) && (indexRight >= 0 && indexRight < gLevel.SIZE)) {

                    if (shulaBoard[indexLeft][indexRight] === MINE) bombCount += 1;
                }

                if (k === 0 || k === 1) indexRight += 1
                else if (k === 2 || k === 3) indexLeft += 1
                else if (k === 4 || k === 5) indexRight -= 1
                else if (k === 6) indexLeft -= 1;

            };

            shulaBoard[i][j] = (bombCount) ? bombCount : SPACE;
            bombCount = 0;
        };
    };
}

// Recursive function for finding all connected empty spots and border 
function recOpenEmptySpots(spot, allEmptySpots, checkedSpotsIdx, lastSpot = false) {

    // return rule if idxs aren't valid
    if (spot.i < 0 || spot.i >= gLevel.SIZE ||
        spot.j < 0 || spot.j >= gLevel.SIZE) return;

    // return rule for already checked spots
    if (isPresentIdx(spot, checkedSpotsIdx)) return;

    // return rule for alread fliped spots
    var elVisitedNum = document.querySelector(`.in${spot.i}-${spot.j} span`);
    if (!elVisitedNum.classList.contains('covered')) return;

    // adding the spot to all checked spots vault
    checkedSpotsIdx.push(spot);

    // adding border numbers to the empty vault with a check for past empty spot origin
    if (shulaBoard[spot.i][spot.j] != SPACE) {

        if (lastSpot) allEmptySpots.push(spot);

        return;
    }

    // pushing empty spots to vault
    allEmptySpots.push(spot);
    lastSpot = true;

    // recursively going to all sides (up -> left -> right -> back)
    recOpenEmptySpots({ i: spot.i - 1, j: spot.j }, allEmptySpots, checkedSpotsIdx, lastSpot);
    recOpenEmptySpots({ i: spot.i, j: spot.j - 1 }, allEmptySpots, checkedSpotsIdx, lastSpot);
    recOpenEmptySpots({ i: spot.i, j: spot.j + 1 }, allEmptySpots, checkedSpotsIdx, lastSpot);
    recOpenEmptySpots({ i: spot.i + 1, j: spot.j }, allEmptySpots, checkedSpotsIdx, lastSpot);
    // across
    recOpenEmptySpots({ i: spot.i - 1, j: spot.j - 1 }, allEmptySpots, checkedSpotsIdx, lastSpot);
    recOpenEmptySpots({ i: spot.i - 1, j: spot.j + 1 }, allEmptySpots, checkedSpotsIdx, lastSpot);
    recOpenEmptySpots({ i: spot.i + 1, j: spot.j + 1 }, allEmptySpots, checkedSpotsIdx, lastSpot);
    recOpenEmptySpots({ i: spot.i + 1, j: spot.j - 1 }, allEmptySpots, checkedSpotsIdx, lastSpot);

    
}

// Translation function for getting indexes from class
function getIdxs(idx) {

    var seperatorIdx;

    for (var i = 0; i < idx.length; i++) {
        if (idx[i] === '-') {
            seperatorIdx = i;
            break;
        }
    }
    var indexI = idx.slice(2, i);
    var indexJ = idx.slice(i + 1);

    return { i: parseInt(indexI), j: parseInt(indexJ) };
}

// finds specific idxs in arrays {i: , j: }
function isPresentIdx(spot, checkedIdxs) {

    if (checkedIdxs.length != undefined) {

        for (var i = 0; i < checkedIdxs.length; i++) {

            var tempCheck = checkedIdxs[i];
            if (spot.i === tempCheck.i && spot.j === tempCheck.j) return true;
        }
    }
    return false;
}

// Helper function to 'recOpenEmptySpots' to flips all found empty and bordering spots
function uncoverAllAdjEmpty(uncoveredIdxs) {

    for (var i = 0; i < uncoveredIdxs.length; i++) {

        var elParentToUncover = document.querySelector(`.in${uncoveredIdxs[i].i}-${uncoveredIdxs[i].j}`);
        var elToUncover = document.querySelector(`.in${uncoveredIdxs[i].i}-${uncoveredIdxs[i].j} span`);
        var valueUncovered = elToUncover.innerHTML;

        if (parseInt(valueUncovered) > 0) elParentToUncover.style.background = 'lightgrey';
        else elParentToUncover.style.background = 'white';
        elToUncover.classList.remove('covered');
    }
}


// Main handeler for the 'Hints' and 'Safe Clicks' mode
function handleHintsAndSafeClicks(type, spent = 0) {

    if (!gGame.isOn) return;

    var htmlString = '';

    if ((type === 'hints' || type === 'both') && !hintModeOn) {
        // console.log(hintModeOn);

        var elHintsBox = document.querySelector(".hints");

        for (var i = 0; i < gHints - spent; i++) {

            htmlString += `<img src="assets/hint-lightbulb.png" onClick="handleHintsAndSafeClicks('hints', 1)" class="hint-lightbulb">`;
        }
        elHintsBox.innerHTML = htmlString;

        if (spent) {

            gHints -= 1;
            hintModeOn = true;
        }
    }

    htmlString = '';

    if (type === 'safeClicks' || type === 'both') {

        var elSafeClicksBox = document.querySelector(".safe-clicks");

        for (var i = 0; i < gSafeClick - spent; i++) {

            htmlString += `<img src="assets/safe-click-shield.png" onClick="handleHintsAndSafeClicks('safeClicks', 1)" class="safe-clicks-shield">`;
        }
        elSafeClicksBox.innerHTML = htmlString;

        if (spent) {

            gSafeClick -= 1;
            showSafeClick();

        }
    }
}

// Hides back all hinted about spots
function hideAllHints() {
    setTimeout(function () {
        var currentSpot;
        for (var j = 0; j < hintVault.length; j++) {

            currentSpot = hintVault[j];
            currentSpot.classList.add('covered');
        }
    }, 1000);
}

// Finds a safe click for the user to click on for 'safe click' mode
function showSafeClick() {

    var allSafeSpots = [];
    for (var i = 0; i < gLevel.SIZE; i++) {

        for (var j = 0; j < gLevel.SIZE; j++) {

            var elTempSpot = document.querySelector(`.in${i}-${j} span`);
            if (elTempSpot.classList.contains(`covered`)) {

                if (shulaBoard[i][j] != MINE) allSafeSpots.push({ i: i, j: j });
            }
        }
    }

    if (allSafeSpots.length) {

        allSafeSpots = shuffle(allSafeSpots);

        var pickedSafeClick = allSafeSpots[0];
        var elSafeSpot = document.querySelector(`.in${pickedSafeClick.i}-${pickedSafeClick.j}`);

        elSafeSpot.style.filter = 'invert(1)';

        setTimeout(function () {
            elSafeSpot.style.filter = 'unset';
        }, 1000);
    }

}

