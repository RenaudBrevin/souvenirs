var game = null;
var currentWidth = 1280;
var currentHeight = 720;
var myGame;
var highestZ = 0;
var piecesDone = 0;
var pieces = [];
var originalImage = null;
var pieceCanvases = [];
var rows = 1;
var columns = 1;
var puzzleComplete = false;
var gameReady = false;
var currentImageIndex = 1;
var transitionTimer = null;
var currentAudio = null;

// Tableau des images à afficher dans l'ordre
const imagePaths = [
    { original: 'images/image1.webp', colorized: 'images/image1_colorized.webp', sound: 'sound/sound1.mp3' },
    { original: 'images/image2.webp', colorized: 'images/image2_colorized.webp', sound: 'sound/sound2.mp3' },
    { original: 'images/image3.webp', colorized: 'images/image3_colorized.webp', sound: 'sound/sound3.mp3' }
];

const imageDescriptions = [
    `Souvenir d'une réunion de famille de 1900, empreint du silence d’instants révolus que seul le papier a su retenir.`,
    `Souvenir d’un frère et d’une sœur jouant dans les champs, insouciants et libres, pendant que le monde des grands s’affaire au loin, à l’abri de leur bulle d’enfance.`,
    `Souvenirs d’un moment suspendu, où deux âmes complices se retrouvent autour d’un verre en terrasse, le cœur léger, comme si le temps n’avait jamais passé.`
];

const overlay = document.getElementById('intro-overlay');
const discoverBtn = document.getElementById('discover-btn');
const audio = document.getElementById('intro-voix');
audio.volume = 1;
discoverBtn.addEventListener('click', () => {
    console.log('Clic détecté, tentative de lecture audio...');
    audio.volume = 1;
  
    audio.play()
      .then(() => {
        console.log('Audio lancé avec succès');
      })
      .catch(err => {
        console.error('Erreur lors de la lecture audio :', err);
      });
  
    overlay.classList.add('hidden');
  });
  


function setupPiecesPositions() {
    pieces = [];
    var pieceWidth = Math.floor(currentWidth / columns);
    var pieceHeight = Math.floor(currentHeight / rows);

    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < columns; col++) {
            pieces.push({
                x: col * pieceWidth,
                y: row * pieceHeight,
                row: row,
                col: col
            });
        }
    }
}

// Gestionnaire pour le bouton "Démarrer"
document.getElementById('startButton').addEventListener('click', function (e) {
    console.log(e)
    startGame();
});

function startGame() {
    loadImage(imagePaths[0].original);
}

function loadImage(imageSrc) {
    originalImage = new Image();
    originalImage.crossOrigin = "Anonymous";

    originalImage.onload = function () {
        if (game) {
            game.destroy(true);
            gameReady = false;
        }

        setupGame();
    };

    originalImage.onerror = function () {
        console.error("Erreur de chargement de l'image:", imageSrc);
        alert("Impossible de charger l'image. Vérifiez que le fichier " + imageSrc + " existe.");
    };

    originalImage.src = imageSrc;
}

function setupGame() {
    var aspectRatio = originalImage.width / originalImage.height;
    var maxWidth = window.innerWidth * 0.8;
    var maxHeight = window.innerHeight * 0.6;

    if (aspectRatio > 1) {
        currentWidth = Math.min(maxWidth, originalImage.width);
        currentHeight = currentWidth / aspectRatio;
    } else {
        currentHeight = Math.min(maxHeight, originalImage.height);
        currentWidth = currentHeight * aspectRatio;
    }

    currentWidth = Math.floor(currentWidth / columns) * columns;
    currentHeight = Math.floor(currentHeight / rows) * rows;

    setupPiecesPositions();

    initGame();
}

function initGame() {
    var config = {
        type: Phaser.AUTO,
        backgroundColor: '#000',
        width: currentWidth,
        height: currentHeight,
        scale: {
            mode: Phaser.Scale.NONE,
            parent: 'game-container',
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: {
            create: createGame
        }
    };
    game = new Phaser.Game(config);
}

function createGame() {
    myGame = this;

    piecesDone = 0;
    puzzleComplete = false;
    pieceCanvases = [];

    var sourcePieceWidth = Math.floor(originalImage.width / columns);
    var sourcePieceHeight = Math.floor(originalImage.height / rows);

    var fullCanvas = document.createElement('canvas');
    fullCanvas.width = originalImage.width;
    fullCanvas.height = originalImage.height;
    var fullCtx = fullCanvas.getContext('2d');
    fullCtx.drawImage(originalImage, 0, 0);

    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < columns; col++) {
            var index = row * columns + col;

            var pieceCanvas = document.createElement('canvas');
            pieceCanvas.width = sourcePieceWidth;
            pieceCanvas.height = sourcePieceHeight;
            var pieceCtx = pieceCanvas.getContext('2d');

            pieceCtx.drawImage(
                fullCanvas,
                col * sourcePieceWidth, row * sourcePieceHeight,
                sourcePieceWidth, sourcePieceHeight,
                0, 0,
                sourcePieceWidth, sourcePieceHeight
            );

            pieceCanvases.push({
                canvas: pieceCanvas,
                index: index
            });
        }
    }

    for (var i = 0; i < pieceCanvases.length; i++) {
        var pieceInfo = pieceCanvases[i];
        var texture = myGame.textures.createCanvas('piece_' + pieceInfo.index, pieceInfo.canvas.width, pieceInfo.canvas.height);
        var context = texture.getContext();
        context.drawImage(pieceInfo.canvas, 0, 0);
        texture.refresh();
    }

    createPuzzlePieces();
}

function createPuzzlePieces() {
    var pieceWidth = Math.floor(currentWidth / columns);
    var pieceHeight = Math.floor(currentHeight / rows);

    for (let i = 0; i < pieceCanvases.length; i++) {
        let x = Phaser.Math.Between(50, currentWidth - pieceWidth - 50);
        let y = Phaser.Math.Between(50, currentHeight - pieceHeight - 50);

        let piece = myGame.add.image(x, y, 'piece_' + i)
            .setInteractive({ draggable: true })
            .setOrigin(0)
            .setDepth(1)
            .setAlpha(0);

        myGame.tweens.add({
            targets: piece,
            alpha: 1,
            duration: 3000,
            ease: 'Power2'
        });

        piece.pIndex = i;
        piece.displayWidth = pieceWidth;
        piece.displayHeight = pieceHeight;
        piece.isPlaced = false;

        // Ombre blanche douce (optionnel, selon le renderer)
        if (piece.context) {
            piece.context.shadowColor = 'rgba(255, 255, 255, 0.7)';
            piece.context.shadowBlur = 10;
        }

        // Stocker direction et amplitude pour redémarrage
        const floatDirection = Phaser.Math.Between(0, 1) === 0 ? 'x' : 'y';
        const floatAmount = Phaser.Math.Between(3, 8);
        const floatDelay = Phaser.Math.Between(0, 500);

        piece._floatProps = { dir: floatDirection, amt: floatAmount, delay: floatDelay };

        // Lancer le flottement
        piece._floatTween = myGame.tweens.add({
            targets: piece,
            [floatDirection]: piece[floatDirection] + floatAmount,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: floatDelay
        });
    }

    myGame.input.on('dragstart', function (pointer, gameObject) {
        highestZ++;
        gameObject.setDepth(highestZ);

        // Stopper l'animation si elle existe
        if (gameObject._floatTween) {
            gameObject._floatTween.stop();
            gameObject._floatTween = null;
        }
    });

    myGame.input.on('drag', function (pointer, gameObject, dragX, dragY) {
        gameObject.x = dragX;
        gameObject.y = dragY;
    });

    myGame.input.on('dragend', function (pointer, gameObject) {
        var targetPiece = pieces[gameObject.pIndex];

        if (Phaser.Math.Distance.Between(
            gameObject.x, gameObject.y,
            targetPiece.x, targetPiece.y
        ) < 50) {
            gameObject.x = targetPiece.x;
            gameObject.y = targetPiece.y;
            gameObject.disableInteractive();
            piecesDone++;

            gameObject.isPlaced = true;

            new Audio('sound/clips.mp3').play();

            // Réduire la profondeur pour qu'elle passe sous les autres pièces
            gameObject.setDepth(0); // profondeur minimale

            if (gameObject._floatTween) {
                gameObject._floatTween.stop();
            }

            if (gameObject.context) {
                gameObject.context.shadowColor = 'rgba(0,0,0,0)';
                gameObject.context.shadowBlur = 0;
            }

            if (piecesDone === pieces.length && !puzzleComplete) {
                puzzleComplete = true;
                showColorizedImage();
            }
        } else {
            if (!gameObject.isPlaced && gameObject._floatProps) {
                const { dir, amt, delay } = gameObject._floatProps;
                gameObject._floatTween = myGame.tweens.add({
                    targets: gameObject,
                    [dir]: gameObject[dir] + amt,
                    duration: 2500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                    delay: delay
                });
            }
        }
    });


    gameReady = true;
}

function showColorizedImage() {
    const colorizedImage = new Image();
    colorizedImage.crossOrigin = "Anonymous";

    colorizedImage.onload = function () {
        if (myGame.textures.exists('colorized_image')) {
            myGame.textures.remove('colorized_image');
        }
        myGame.textures.addImage('colorized_image', colorizedImage);

        const bgImage = myGame.add.image(0, 0, 'colorized_image')
            .setOrigin(0)
            .setDepth(0)
            .setAlpha(0)
            .setDisplaySize(currentWidth, currentHeight);

        myGame.tweens.add({
            targets: myGame.children.list.filter(obj => obj.type === 'Image' && obj !== bgImage),
            alpha: 0,
            duration: 4000,
            ease: 'Power2'
        });

        showDescriptionText(currentImageIndex - 1);
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }

        currentAudio = new Audio(imagePaths[currentImageIndex - 1].sound);
        currentAudio.volume = 1;
        currentAudio.play();
        myGame.tweens.add({
            targets: bgImage,
            alpha: 1,
            duration: 3000,
            ease: 'Power2',
            onComplete: () => {
                transitionTimer = setTimeout(fadeToNextImage, 6000);
            }
        });
    };

    colorizedImage.onerror = function () {
        console.error("Erreur de chargement de l'image colorisée:", imagePaths[currentImageIndex - 1].colorized);
        setTimeout(fadeToNextImage, 2000);
    };

    // 6. Enfin on lance le chargement
    colorizedImage.src = imagePaths[currentImageIndex - 1].colorized;
}


function fadeToNextImage() {
    if (transitionTimer) {
        clearTimeout(transitionTimer);
        transitionTimer = null;
    }

    // Cacher la description AVANT le chargement de la prochaine image
    hideDescriptionText();

    myGame.tweens.add({
        targets: myGame.children.list,
        alpha: 0,
        duration: 4000,
        ease: 'Power2',
        onComplete: function () {
            // Estomper le son
            if (currentAudio) {
                let fadeInterval = setInterval(() => {
                    if (currentAudio.volume > 0.05) {
                        currentAudio.volume -= 0.05;
                    } else {
                        currentAudio.volume = 0;
                        currentAudio.pause();
                        clearInterval(fadeInterval);
                    }
                }, 200);
            }

            currentImageIndex++;

            if (currentImageIndex > imagePaths.length) {
                outroduction();
                return;
            }

            if (game) {
                game.destroy(true);
                gameReady = false;
            }

            loadImage(imagePaths[currentImageIndex - 1].original);
        }
    });

}

// Fonction pour redémarrer le jeu ou passer manuellement à l'image suivante
function resetGame() {
    if (transitionTimer) {
        clearTimeout(transitionTimer);
        transitionTimer = null;
    }

    currentImageIndex = 1;

    if (game) {
        game.destroy(true);
        gameReady = false;
    }
}


const storyText =
    `
Chaque souvenir est comme une photo éclatée en mille fragments, parfois flous, parfois déformés par le temps. Comme les pièces d’un puzzle que l’on assemble patiemment, c’est en reconnectant chaque détail que se révèle la mémoire.
`;

// const storyText = 'texte ici';

const introTextEl = document.getElementById('intro-text');
const startBtn = document.getElementById('startButton');
const introContainer = document.getElementById('start-container');

let currentChar = 0;

function typeWriter() {
    if (currentChar < storyText.length) {
        introTextEl.textContent += storyText.charAt(currentChar);
        currentChar++;
        setTimeout(typeWriter, 65);
    } else {
        startBtn.style.display = 'visible';
        startBtn.classList.add('visible');
        startBtn.style.opacity = '1';
        startBtn.style.pointerEvents = 'auto';
    }
}

//lancer typewrite quand overlaybutton clicqué
const overlayButton = document.getElementById('discover-btn');
overlayButton.addEventListener('click', () => {
    typeWriter();
});

startBtn.addEventListener('click', () => {
    introContainer.classList.add('fade-out');

    introContainer.addEventListener('transitionend', () => {
        introContainer.style.opacity = '0';
        introContainer.style.pointerEvents = 'none';
        //transition opacity
        introContainer.style.transition = 'opacity 1s ease-in-out';
    }, { once: true });
});

function showDescriptionText(index) {
    const descriptionContainer = document.getElementById('description-container');
    const descriptionText = document.getElementById('description-text');
    const fullText = imageDescriptions[index];
    
    descriptionText.textContent = fullText;
    descriptionContainer.style.opacity = '1';

}

function hideDescriptionText() {
    const container = document.getElementById('description-container');
    const text = document.getElementById('description-text');

    setTimeout(() => {
        container.style.opacity = '0';
    }, 800);
}

const endText = 'Les images brisées ont retrouvé leur unité. Et si tes propres souvenirs, eux aussi, attendaient d’être rassemblés ? Laisse les fragments remonter doucement. Prends le temps de les accueillir. Et de te souvenir.';
const body = document.body;
const gameContainer = document.getElementById('game-container');

function outroduction() {
    const outroButton = document.getElementById('outro-button');
        gameContainer.classList.add('fade-out');
        outroButton.classList.add('visible');

        outroButton.addEventListener('click', () => {
            outroButton.classList.remove('visible');
            outroButton.classList.add('hide');
            const audio = document.getElementById('outro-voix');
            audio.volume = 1;
            setTimeout(() => {
                audio.play()
                    .then(() => {
                        console.log('Audio lancé avec succès');
                    })
                    .catch(err => {
                        console.error('Erreur lors de la lecture audio :', err);
                    });
            }, 1000);
            
            body.style.backgroundColor = '#000';
            gameContainer.classList.add('fade-out');
            gameContainer.style.display = 'none';
            const outroContainer = document.getElementById('outro-container');
            outroContainer.classList.remove('fade-out');
            outroContainer.style.display = 'flex';
            outroContainer.style.opacity = '1';

            //add write effect with #outro-text
            const outroText = document.getElementById('outro-text');
            const storyText = 'Les images brisées ont retrouvé leur unité. Et si tes propres souvenirs, eux aussi, attendaient d’être rassemblés ? Laisse les fragments remonter doucement. Prends le temps de les accueillir. Et de te souvenir.';
            outroText.textContent = '';
            let outroCharIndex = 0;
            function outroTypeNextChar() {
                if (outroCharIndex < endText.length) {
                    outroText.textContent += endText.charAt(outroCharIndex);
                    outroCharIndex++;
                    setTimeout(outroTypeNextChar, 75);
                }
            }
            
            // Lancement avec un délai de 1000 ms avant de commencer la frappe
            setTimeout(outroTypeNextChar, 1000);
            
    });
}