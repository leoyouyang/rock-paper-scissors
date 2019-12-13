let totalRounds = 5;
let firstRoundCountdown = 5;
let otherRoundCountdown = 3;
let countdown;
let answerDuration = 3;
let startButtonColor, homeButtonColor;
let ifCameraReady = false;
let state, ifModelReady, shouldGameStart, ifGetGesture, ifAddScore, ifShowingResult;
let startTime;
let round;
let result, userScore, compScore;
let userGestures = [];
let compGestures = [];
let countdownSound, cameraSound, winSound, loseSound, resultSoundIsPlayed;

// Classifier Variable
let classifier;
// Model URL
let imageModelURL = 'https://teachablemachine.withgoogle.com/models/OQ2spHBv/';

// Video
let video;
let flippedVideo;
// To store the classification
let label = "";

// Load the model first
function preload() {
  classifier = ml5.imageClassifier(imageModelURL + 'model.json');
  countdownSound = loadSound('assets/countdown2.mp3');
  cameraSound = loadSound('assets/camera.mp3');
  winSound = loadSound('assets/win.mp3');
  loseSound = loadSound('assets/lose.mp3');
}

function setup() {
  createCanvas(600, 450);
  noStroke();
  textAlign(CENTER, CENTER);
  generateCompGestures();
  startButtonColor = 255;
  homeButtonColor = 255;
  state = 0;
  round = 0;
  userScore = 0;
  compScore = 0;
  ifModelReady = false;
  ifGetGesture = false;
  ifAddScore = false;
  ifShowingResult = false;
  shouldGameStart = true;
  resultSoundIsPlayed = false;
  loseSound.setVolume(0.6);
  winSound.setVolume(0.5);
}

function draw() {
  //State: 0 - Start Page, 1 - Game Page, 2 - Score Page
  if (state == 0)
    startPage();

  if (state == 1) {
    //Only set the camera up for once
    if (ifCameraReady == false) {
      setupCamera();
      ifCameraReady = true;
    }
    gamePage();
  }

  if (state == 2)
    scorePage();
}

// Get a prediction for the current video frame
function classifyVideo() {
  flippedVideo = ml5.flipImage(video)
  classifier.classify(flippedVideo, gotResult);
}

// When we get a result
function gotResult(error, results) {
  // If there is an error
  if (error) {
    console.error(error);
    return;
  }
  // The results are in an array ordered by confidence.
  // console.log(results[0]);
  label = results[0].label;
  // Classifiy again!
  classifyVideo();
  ifModelReady = true;
}

function setupCamera() {
  // Create the video
  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide();

  flippedVideo = ml5.flipImage(video)
  // Start classifying
  classifyVideo();
}

function startPage() {
  //Display the game title
  background(237, 0, 128);
  fill(255, 217, 63);
  textFont('Arvo');
  textSize(72);
  text("ROCK", width / 2, height / 2 - 102);
  text("PAPER", width / 2, height / 2 - 31);
  text("SCISSORS!", width / 2, height / 2 + 40);

  //Create the start button
  if (mouseX > 225 && mouseX < 375 && mouseY > 320 && mouseY < 370) {
    startButtonColor = 200;
  }
  if (ifCameraReady)
    startButtonColor += 15;
  else
    startButtonColor += 5;
  fill(startButtonColor);
  rectMode(CENTER);
  rect(300, 345, 150, 50);
  fill(237, 0, 128);
  textSize(30);
  textFont('Nunito');
  text("Start", width/2-2, 348);
}

function gamePage() {
  //Start the timer
  if (ifModelReady == true && shouldGameStart == true) {
    startTime = millis();
    shouldGameStart = false;
  }

  //Set the countdown time
  if (round == 0)
    countdown = firstRoundCountdown;
  else
    countdown = otherRoundCountdown;

  //Display the game interface
  gameUI();

  if (millis() - startTime > countdown * 1000) {
    //Get the player's gesture
    if (ifGetGesture == false) {
      cameraSound.play();
      userGestures[round] = label;
      ifGetGesture = true;
    }

    if (millis() - startTime < (countdown * 1000) + (answerDuration * 1000)) {
      //Check who wins
      checkWhoWins();

      //Show the result of the round
      ifShowingResult = true;
      resultPage();
    } else {
      //Go to the next round
      round++;
      ifShowingResult = false;
      ifGetGesture = false;
      ifAddScore = false;
      startTime = millis();
    }

    if (round > totalRounds - 1)
      //Go to the Score Page
      state = 2;
  }
}

function touchStarted() {
  if (state == 0) {
    if (mouseX > 225 && mouseX < 375 && mouseY > 320 && mouseY < 370) {
      state = 1;
    }
  } else if (state == 2) {
      if (mouseX > 225 && mouseX < 375 && mouseY > 359.5 && mouseY < 404.5)
        setup();
  }
}

function generateCompGestures() {
  for (let i = 0; i < totalRounds; i++) {
    //0-Rock, 1-Paper, 2-Scissors
    let compGesturesIdx = int(random(0, 3));
    if (compGesturesIdx == 0)
      compGestures[i] = 'Rock';
    else if (compGesturesIdx == 1)
      compGestures[i] = 'Paper';
    else if (compGesturesIdx == 2)
      compGestures[i] = 'Scissors';
  }
}

function gameUI() {
  showUIFrame();
  fill(255);
  textFont('Arvo');
  textSize(24);
  text('Loading...', 161, 209);

  //Draw the video
  image(flippedVideo, 33, 113, 256, 192);

  //Show scores
  fill(0);
  textFont('Nunito');
  textSize(22);
  text('Score: ' + userScore, 161, 356);
  text('Score: ' + compScore, 440, 356);

  //Show the player's gesture
  fill(255);
  if (label == 'Idle') {
    textSize(20);
    text('Please throw a shape', 161.5, 283.5);
  }
  
  else {
    let gestureEmoji = convertToEmoji(label);
    textSize(36);
    text(gestureEmoji, 161, 280);
  }

  //Show rounds left
  fill(0);
  textFont('Arvo');
  textSize(46);
  text((totalRounds - round), 300, 365);
  textSize(18);
  text('ROUNDS LEFT', 262.5, 398, 80, 40);

  //Show countdown
  fill(255);
  textSize(112);
  let countdownDisplay = countdown - int((millis() - startTime) / 1000);
  if (countdownDisplay > 0 && countdownDisplay != firstRoundCountdown)
    text(countdownDisplay, 440, 218);
  else if (countdownDisplay == firstRoundCountdown) {
    textSize(24);
    text('Loading...', 440, 209);
  }
  
  //Play countdown sound
  if ((int(millis() - startTime) % 1000) < 90 && ifShowingResult == false && shouldGameStart == false && countdownSound.isPlaying() == false && countdownDisplay != firstRoundCountdown)
    countdownSound.play();
}

function checkWhoWins() {
  if (userGestures[round] == 'Rock') {
    if (compGestures[round] == 'Rock') {
      result = 'Tie!';
    } else if (compGestures[round] == 'Paper') {
      result = 'You Lose!';
      if (ifAddScore == false) {
        compScore++;
        ifAddScore = true;
      }
    } else if (compGestures[round] == 'Scissors') {
      result = 'You Win!';
      if (ifAddScore == false) {
        userScore++;
        ifAddScore = true;
      }
    }
  } else if (userGestures[round] == 'Paper') {
    if (compGestures[round] == 'Rock') {
      result = 'You Win!';
      if (ifAddScore == false) {
        userScore++;
        ifAddScore = true;
      }
    } else if (compGestures[round] == 'Paper') {
      result = 'Tie!';
    } else if (compGestures[round] == 'Scissors') {
      result = 'You Lose!';
      if (ifAddScore == false) {
        compScore++;
        ifAddScore = true;
      }
    }
  } else if (userGestures[round] == 'Scissors') {
    if (compGestures[round] == 'Rock') {
      result = 'You Lose!';
      if (ifAddScore == false) {
        compScore++;
        ifAddScore = true;
      }
    } else if (compGestures[round] == 'Paper') {
      result = 'You Win!';
      if (ifAddScore == false) {
        userScore++;
        ifAddScore = true;
      }
    } else if (compGestures[round] == 'Scissors') {
      result = 'Tie!';
    }
  } else if (userGestures[round] == 'Idle') {
    result = 'You Lose!';
    if (ifAddScore == false) {
      compScore++;
      ifAddScore = true;
    }
  }
}

function resultPage() {
  showUIFrame();
  
  //Show the player and the computer's gestures
  fill(255, 217, 63);
  textFont('Arvo');
  textSize(84);
  let userGestureEmoji = convertToEmoji(userGestures[round]);
  let compGestureEmoji = convertToEmoji(compGestures[round]);
  text(userGestureEmoji, 161, 218);
  text(compGestureEmoji, 440, 218);
  
  //Show the result
  fill(0);
  textSize(36);
  text(result, width/2, 386);
}

function showUIFrame() {
  background(255, 217, 63);
  
  //Show the game title
  fill(237, 0, 128);
  textFont('Arvo');
  textSize(36);
  text('ROCK PAPER SCISSORS!', width / 2, 60);
  
  //Create two frames
  fill(0, 155, 223);
  rectMode(CORNER);
  rect(33, 113, 256, 192);
  rect(312, 113, 256, 192);
  
  //Show labels
  fill(0);
  textFont('Nunito');
  textSize(22);
  text('YOU', 161.5, 330);
  text('COMPUTER', 440.5, 330);
}

function convertToEmoji(label) {
  if (label == 'Rock')
    return '✊';
  else if (label == 'Paper')
    return '🖐';
  else if (label == 'Scissors')
    return '✌️';
  else if (label == 'Idle')
    return '?';
  else
    return '';
}

function scorePage() {
  background(0, 155, 223);
  
  //Show the title
  fill(255, 217, 63);
  textFont('Arvo');
  textSize(36);
  text('FINAL SCORES', width / 2, 60);
  
  //Create two frames
  fill(255, 217, 63);
  rectMode(CORNER);
  rect(33, 113, 256, 131);
  rect(312, 113, 256, 131);
  
  //Show labels
  fill(255);
  textFont('Nunito');
  textSize(22);
  text('YOU', 161.5, 268);
  text('COMPUTER', 440.5, 268);
  
  //Show final scores
  fill(237, 0, 128);
  textFont('Arvo');
  textSize(96);
  text(userScore, 160.5, 188);
  text(compScore, 440, 188);
  
  //Show the result
  let resultText;
  if (userScore > compScore) {
    resultText = 'YOU WIN!';
    if (resultSoundIsPlayed == false) {
      winSound.play();
      resultSoundIsPlayed = true;
    }
  }
  else if (userScore < compScore) {
    resultText = 'YOU LOSE!';
    if (resultSoundIsPlayed == false) {
      loseSound.play();
      resultSoundIsPlayed = true;
    }
  }
  else
    resultText = 'TIE!';
  fill(255);
  textSize(40);
  text(resultText, width/2, 320);
  
  //Show the Home button
  if (mouseX > 225 && mouseX < 375 && mouseY > 359.5 && mouseY < 404.5) {
    homeButtonColor = 200;
  }
  if (ifCameraReady)
    homeButtonColor += 15;
  else
    homeButtonColor += 5;
  fill(homeButtonColor);
  rectMode(CENTER);
  rect(300, 382, 150, 45);
  fill(237, 0, 128);
  textSize(24);
  textFont('Nunito');
  text("Play Again", width/2, 384);
}