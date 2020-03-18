

  //================================//
 //    SCORE HANDELING FUNCTIONS   //
//================================//


function updateScore() {

    var bestScore = localStorage.getItem(`bestScore${gLevel.DIFF}`);

    bestScore = (bestScore === null) ? Infinity : parseFloat(bestScore);

    console.log(`BEST:`, bestScore, ` | CURRENT:`, gTime);

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
    // console.log(stoppedDuration);

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
}

function clockRunning() {
    var currentTime = new Date(),
        timeElapsed = new Date(currentTime - timeBegan - stoppedDuration);
        min = timeElapsed.getUTCMinutes();
        gTime = timeElapsed.getUTCSeconds();
        // ms = timeElapsed.getUTCMilliseconds();

    if(min > 0) gTime += 60 * min;
    elTimer.innerHTML = (gTime < 10) ? `00${gTime}` : (gTime < 100) ? `0${gTime}` : `${gTime}`;

    gGame.secsPassed = gTime;
};


  //================================//
 //    MISCELLANEOUS FUNCTIONS     //
//================================//

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

function checkBombsAround() {

    var bombCount = 0;

    for (var i = 0; i < gLevel.SIZE; i++) {

        for (var j = 0; j < gLevel.SIZE; j++) {

            if(shulaBoard[i][j] === MINE) continue;

            let indexLeft = i - 1, indexRight = j - 1;
            for (let k = 0; k < 8; k++) {

                if ((indexLeft >= 0 && indexLeft < gLevel.SIZE) && (indexRight >= 0 && indexRight < gLevel.SIZE)) {

                    if (shulaBoard[indexLeft][indexRight] === MINE) bombCount += 1;
                }

                if      (k === 0 || k === 1) indexRight += 1
                else if (k === 2 || k === 3) indexLeft += 1
                else if (k === 4 || k === 5) indexRight -= 1
                else if (k === 6) indexLeft -= 1;

            };

            shulaBoard[i][j] = (bombCount) ? bombCount : SPACE;

            console.log(`shulaBoard[${i}][${j}] has ${bombCount} bombs around him`);
            bombCount = 0;
        };
    };
}


function recOpenEmptySpots (spot, allEmptySpots, checkedSpotsIdx, lastSpot = false) {
    
    if(spot.i < 0 || spot.i >= gLevel.SIZE ||
        spot.j < 0 || spot.j >= gLevel.SIZE) return;

    if(isPresentIdx(spot, checkedSpotsIdx)) return; 

    checkedSpotsIdx.push(spot);

    console.log(`SPOT`, spot);
    console.log('ALL EMPTY:', allEmptySpots);
    console.log('ALL CHECKED:',allEmptySpots);
    

    if(shulaBoard[spot.i][spot.j] != SPACE){

        if(lastSpot) allEmptySpots.push(spot);
    
        return;
    } 

    allEmptySpots.push(spot);
    lastSpot = true;
   
    recOpenEmptySpots({i: spot.i - 1, j: spot.j}, allEmptySpots, checkedSpotsIdx, lastSpot);
    recOpenEmptySpots({i: spot.i, j: spot.j - 1}, allEmptySpots, checkedSpotsIdx, lastSpot);
    recOpenEmptySpots({i: spot.i, j: spot.j + 1}, allEmptySpots, checkedSpotsIdx, lastSpot);
    recOpenEmptySpots({i: spot.i + 1, j: spot.j}, allEmptySpots, checkedSpotsIdx, lastSpot);
}


function getIdxs (idx) {

    var seperatorIdx;

    for(var i = 0; i < idx.length; i++) {
        if(idx[i] === '-'){
            seperatorIdx = i;
            break;
        } 
    }

    var indexI = idx.slice(2,i);
    var indexJ = idx.slice(i + 1);

    return {i: parseInt(indexI), j: parseInt(indexJ)};
}

function isPresentIdx (spot, checkedIdxs) {
    console.log(spot);
    
    if(checkedIdxs.length != undefined) {

        for(var i = 0; i < checkedIdxs.length; i++) {
    
            var tempCheck = checkedIdxs[i];
            if(spot.i === tempCheck.i && spot.j === tempCheck.j) return true;
        }

    } 

    return false;
}

function uncoverAllAdjEmpty(uncoveredIdxs) {

    for(var i = 0; i < uncoveredIdxs.length; i++) {

        var elParentToUncover = document.querySelector(`.in${uncoveredIdxs[i].i}-${uncoveredIdxs[i].j}`);
        var elToUncover = document.querySelector(`.in${uncoveredIdxs[i].i}-${uncoveredIdxs[i].j} span`);

        elParentToUncover.style.background = 'white';
        elToUncover.classList.remove('covered');
    }
}