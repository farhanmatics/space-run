// script.js - Fullscreen game logic with home and game over screens
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Home screen ship animation canvas
const homeShipCanvas = document.getElementById('homeShipCanvas');
const homeShipCtx = homeShipCanvas.getContext('2d');

// Game over screen ship animation canvas
const gameOverShipCanvas = document.getElementById('gameOverShipCanvas');
const gameOverShipCtx = gameOverShipCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const finalScoreElement = document.getElementById('finalScore');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const homeScreen = document.getElementById('homeScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');

// Load sprite sheet for player ship
const spriteSheet = new Image();
spriteSheet.src = 'assets/BlueStarShip/Blue Star Ship Idle Sprite Sheet.png';

// Track if the sprite sheet has loaded
let spriteSheetLoaded = false;
spriteSheet.onload = function() {
    spriteSheetLoaded = true;
};

// Sprite sheet animation variables
const spriteFrameWidth = 64;  // Each frame is 64x64 pixels
const spriteFrameHeight = 64;
const spriteColumns = 4;      // 4 columns
const spriteRows = 2;         // 2 rows
const totalFrames = 8;        // 4 * 2 = 8 frames total
let currentFrame = 0;         // Current frame index (0-7)
let animationFrameCounter = 0;
const framesPerAnimationFrame = 8; // Change frame every 8 game frames (adjust for animation speed)

// Home screen ship animation variables
let homeShipCurrentFrame = 0;
let homeShipAnimationCounter = 0;
let homeShipAnimationId;

// Home screen star animation variables
let homeStarAnimationId;

// Game over screen ship animation variables
let gameOverShipCurrentFrame = 0;
let gameOverShipAnimationCounter = 0;
let gameOverShipAnimationId;

// Load asteroid PNG as an image
const asteroidImg = new Image();
asteroidImg.src = 'assets/meteorite.png';

// Track if the asteroid image has loaded
let asteroidLoaded = false;
asteroidImg.onload = function() {
    asteroidLoaded = true;
};

// Starfield background
const stars = [];
const numStars = 100;

// Home screen starfield background
const homeStarCanvas = document.getElementById('homeStarCanvas');
const homeStarCtx = homeStarCanvas.getContext('2d');
const homeStars = [];
const numHomeStars = 150;

function initStars() {
    stars.length = 0; // Clear existing stars
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.5 + 0.2, // Different speeds for parallax effect
            brightness: Math.random()
        });
    }
}

function drawStars() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    stars.forEach(star => {
        ctx.globalAlpha = star.brightness;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
}

function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

function initHomeStars() {
    homeStars.length = 0; // Clear existing stars
    for (let i = 0; i < numHomeStars; i++) {
        homeStars.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 3 + 0.5,
            speed: Math.random() * 1.5 + 0.5, // Slower than game stars for home screen
            brightness: Math.random() * 0.8 + 0.2
        });
    }
}

function drawHomeStars() {
    // Clear canvas
    homeStarCtx.clearRect(0, 0, homeStarCanvas.width, homeStarCanvas.height);

    // Draw stars
    homeStarCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    homeStars.forEach(star => {
        homeStarCtx.globalAlpha = star.brightness;
        homeStarCtx.beginPath();
        homeStarCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        homeStarCtx.fill();
    });
    homeStarCtx.globalAlpha = 1.0;
}

function updateHomeStars() {
    homeStars.forEach(star => {
        star.y += star.speed;
        if (star.y > homeStarCanvas.height) {
            star.y = -star.size;
            star.x = Math.random() * homeStarCanvas.width;
        }
    });
}

// Set canvas to full window size
function resizeCanvas() {
    // Use visual viewport if available (better for mobile), otherwise fallback to window
    const visualViewport = window.visualViewport;
    if (visualViewport) {
        canvas.width = visualViewport.width;
        canvas.height = visualViewport.height;
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    initStars(); // Reinitialize stars when canvas is resized
}

// Initialize player with responsive dimensions
let player = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    speed: 0,
    dx: 0
};

function initPlayer() {
    // Make the ship larger - use 18% of canvas width and maintain square aspect ratio
    player.width = Math.max(80, canvas.width * 0.18); // 18% of canvas width
    player.height = player.width; // Keep it square to match the 64x64 sprite
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 20;
    player.speed = canvas.width * 0.008; // Speed proportional to canvas size
}

// Game variables
let score = 0;
let lives = 3;
let gameRunning = false;
let lastTimestamp = 0;
let animationId;
let enemies = [];
let enemySpawnRate = 60;
let frameCount = 0;

// Music variables
let backgroundMusic = null;

// Draw player ship (using sprite sheet)
function drawPlayer() {
    if (spriteSheetLoaded) {
        // Calculate which frame to draw from the sprite sheet
        const column = currentFrame % spriteColumns;  // Column index (0-3)
        const row = Math.floor(currentFrame / spriteColumns);  // Row index (0-1)

        // Calculate source position in sprite sheet
        const sourceX = column * spriteFrameWidth;
        const sourceY = row * spriteFrameHeight;

        // Draw the current frame from the sprite sheet
        ctx.drawImage(
            spriteSheet,
            sourceX, sourceY, spriteFrameWidth, spriteFrameHeight,  // Source rectangle
            player.x, player.y, player.width, player.height  // Destination rectangle
        );
    } else {
        // Fallback to drawing a rectangle if the sprite sheet hasn't loaded yet
        ctx.fillStyle = '#3498db';
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // Draw cockpit
        ctx.fillStyle = '#aed6f1';
        ctx.fillRect(player.x + player.width * 0.3, player.y + player.height * 0.2, player.width * 0.4, player.height * 0.4);
    }
}

// Draw home screen ship animation
function drawHomeShip() {
    if (!spriteSheetLoaded) return;

    // Calculate which frame to draw from the sprite sheet
    const column = homeShipCurrentFrame % spriteColumns;
    const row = Math.floor(homeShipCurrentFrame / spriteColumns);

    // Calculate source position in sprite sheet
    const sourceX = column * spriteFrameWidth;
    const sourceY = row * spriteFrameHeight;

    // Clear canvas
    homeShipCtx.clearRect(0, 0, homeShipCanvas.width, homeShipCanvas.height);

    // Draw the current frame centered on canvas
    const destX = (homeShipCanvas.width - spriteFrameWidth) / 2;
    const destY = (homeShipCanvas.height - spriteFrameHeight) / 2;

    homeShipCtx.drawImage(
        spriteSheet,
        sourceX, sourceY, spriteFrameWidth, spriteFrameHeight,
        destX, destY, spriteFrameWidth, spriteFrameHeight
    );
}

// Draw game over screen ship animation
function drawGameOverShip() {
    if (!spriteSheetLoaded) return;

    // Calculate which frame to draw from the sprite sheet
    const column = gameOverShipCurrentFrame % spriteColumns;
    const row = Math.floor(gameOverShipCurrentFrame / spriteColumns);

    // Calculate source position in sprite sheet
    const sourceX = column * spriteFrameWidth;
    const sourceY = row * spriteFrameHeight;

    // Clear canvas
    gameOverShipCtx.clearRect(0, 0, gameOverShipCanvas.width, gameOverShipCanvas.height);

    // Draw the current frame centered on canvas
    const destX = (gameOverShipCanvas.width - spriteFrameWidth) / 2;
    const destY = (gameOverShipCanvas.height - spriteFrameHeight) / 2;

    gameOverShipCtx.drawImage(
        spriteSheet,
        sourceX, sourceY, spriteFrameWidth, spriteFrameHeight,
        destX, destY, spriteFrameWidth, spriteFrameHeight
    );
}

// Animate home screen ship
function animateHomeShip() {
    homeShipAnimationCounter++;
    if (homeShipAnimationCounter >= framesPerAnimationFrame) {
        homeShipAnimationCounter = 0;
        homeShipCurrentFrame = (homeShipCurrentFrame + 1) % totalFrames;
    }
    drawHomeShip();
    homeShipAnimationId = requestAnimationFrame(animateHomeShip);
}

// Animate game over screen ship
function animateGameOverShip() {
    gameOverShipAnimationCounter++;
    if (gameOverShipAnimationCounter >= framesPerAnimationFrame) {
        gameOverShipAnimationCounter = 0;
        gameOverShipCurrentFrame = (gameOverShipCurrentFrame + 1) % totalFrames;
    }
    drawGameOverShip();
    gameOverShipAnimationId = requestAnimationFrame(animateGameOverShip);
}

// Stop home screen ship animation
function stopHomeShipAnimation() {
    if (homeShipAnimationId) {
        cancelAnimationFrame(homeShipAnimationId);
        homeShipAnimationId = null;
    }
}

// Stop game over screen ship animation
function stopGameOverShipAnimation() {
    if (gameOverShipAnimationId) {
        cancelAnimationFrame(gameOverShipAnimationId);
        gameOverShipAnimationId = null;
    }
}

// Animate home screen stars
function animateHomeStars() {
    updateHomeStars();
    drawHomeStars();
    homeStarAnimationId = requestAnimationFrame(animateHomeStars);
}

// Stop home screen star animation
function stopHomeStarAnimation() {
    if (homeStarAnimationId) {
        cancelAnimationFrame(homeStarAnimationId);
        homeStarAnimationId = null;
    }
}

// Create new enemy (asteroid)
function createEnemy() {
    const width = Math.random() * (canvas.width * 0.1) + (canvas.width * 0.05); // 5-15% of canvas width
    const height = width; // Keep it square for now
    
    // Random rotation and spin speed
    const rotation = Math.random() * Math.PI * 2;
    const rotationSpeed = (Math.random() - 0.5) * 0.05;
    
    const enemy = {
        x: Math.random() * (canvas.width - width),
        y: -height,
        width: width,
        height: height,
        speed: (Math.random() * 1.5 + 0.8) * (canvas.width * 0.0006), // Slower speed relative to canvas size
        rotation: rotation,
        rotationSpeed: rotationSpeed
    };
    enemies.push(enemy);
}

// Draw enemies (using PNG meteorite image)
function drawEnemies() {
    enemies.forEach(enemy => {
        if (asteroidLoaded) {
            // Save the current context
            ctx.save();
            
            // Move to the center of the meteorite
            ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            
            // Rotate based on the enemy's rotation
            ctx.rotate(enemy.rotation);
            
            // Draw the meteorite image scaled to fit the enemy's dimensions
            ctx.drawImage(
                asteroidImg,
                -enemy.width/2, -enemy.height/2, enemy.width, enemy.height
            );
            
            // Restore the context to undo transformations
            ctx.restore();
        } else {
            // Fallback to drawing a rocky meteorite if the image hasn't loaded yet
            ctx.save();
            ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            
            // Draw rocky texture
            ctx.fillStyle = '#c0392b'; // Darker red/brown for rocky appearance
            ctx.beginPath();
            
            // Create an irregular polygon to resemble a meteorite
            const radius = Math.min(enemy.width, enemy.height) / 2;
            const points = 8; // Number of points in the meteorite
            
            for (let i = 0; i < points; i++) {
                const angle = (i * 2 * Math.PI / points);
                const distance = radius * (0.7 + Math.random() * 0.3); // Vary distance for irregularity
                
                if (i === 0) {
                    ctx.moveTo(Math.cos(angle) * distance, Math.sin(angle) * distance);
                } else {
                    ctx.lineTo(Math.cos(angle) * distance, Math.sin(angle) * distance);
                }
            }
            
            ctx.closePath();
            ctx.fill();
            
            // Add some surface details
            ctx.fillStyle = '#a02c2c'; // Slightly darker for details
            for (let i = 0; i < 3; i++) {
                const detailX = (Math.random() - 0.5) * radius;
                const detailY = (Math.random() - 0.5) * radius;
                const detailSize = radius * 0.1 * Math.random();
                
                ctx.beginPath();
                ctx.arc(detailX, detailY, detailSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    });
}

// Move enemies
function moveEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        // Update position
        enemies[i].y += enemies[i].speed;
        
        // Update rotation
        enemies[i].rotation += enemies[i].rotationSpeed;
        
        // Remove enemies that go off screen
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
            updateScore(10); // Add points for avoiding enemy
        }
    }
}

// Check collisions
function checkCollisions() {
    for (let i = 0; i < enemies.length; i++) {
        if (
            player.x < enemies[i].x + enemies[i].width &&
            player.x + player.width > enemies[i].x &&
            player.y < enemies[i].y + enemies[i].height &&
            player.y + player.height > enemies[i].y
        ) {
            // Collision detected
            enemies.splice(i, 1);
            lives--;
            livesElement.textContent = lives;
            
            if (lives <= 0) {
                endGame();
            }
        }
    }
}

// Update score
function updateScore(points) {
    score += points;
    scoreElement.textContent = score;
}

// Draw everything
function draw() {
    // Draw space background
    ctx.fillStyle = '#09092B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    drawStars();
    
    // Draw game objects
    drawPlayer();
    drawEnemies();
}

// Update game state
function update() {
    // Update stars for space effect
    updateStars();
    
    // Update sprite animation
    animationFrameCounter++;
    if (animationFrameCounter >= framesPerAnimationFrame) {
        animationFrameCounter = 0;
        currentFrame = (currentFrame + 1) % totalFrames; // Loop through frames 0-7
    }
    
    // Move player
    player.x += player.dx;
    
    // Keep player in bounds
    if (player.x < 0) {
        player.x = 0;
    } else if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
    
    // Spawn enemies
    frameCount++;
    if (frameCount % enemySpawnRate === 0) {
        createEnemy();
        // Increase difficulty over time
        if (enemySpawnRate > 20 && frameCount % 300 === 0) {
            enemySpawnRate--;
        }
    }
    
    // Move enemies and check collisions
    moveEnemies();
    checkCollisions();
}

// Game loop with fixed timestep
function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    // Calculate delta time for smooth animation
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    update();
    draw();
    
    animationId = requestAnimationFrame(gameLoop);
}

// Load and setup background music
function loadBackgroundMusic() {
    // Try to load MP3 first, fallback to OGG, then WAV
    const audio = new Audio();
    
    // Set audio properties
    audio.loop = true;
    audio.volume = 0.5; // 50% volume (adjust as needed)
    audio.preload = 'auto';
    
    // Try different audio formats
    const audioFormats = [
        'assets/leap.mp3',
        'assets/leap.ogg',
        'assets/leap.wav'
    ];
    
    // Set source and handle errors
    let formatIndex = 0;
    const tryNextFormat = () => {
        if (formatIndex < audioFormats.length) {
            audio.src = audioFormats[formatIndex];
            audio.load();
            formatIndex++;
        } else {
            console.warn('No supported audio format found. Please convert leap.mid to MP3, OGG, or WAV format.');
        }
    };
    
    audio.addEventListener('error', () => {
        console.log(`Failed to load ${audioFormats[formatIndex - 1]}, trying next format...`);
        tryNextFormat();
    });
    
    audio.addEventListener('canplaythrough', () => {
        console.log('Background music loaded successfully:', audio.src);
    });
    
    tryNextFormat();
    
    backgroundMusic = audio;
}

// Play background music
function playMusic() {
    if (!backgroundMusic) {
        console.warn('Background music not loaded');
        return;
    }
    
    try {
        // Reset to beginning and play
        backgroundMusic.currentTime = 0;
        const playPromise = backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Music started playing');
                })
                .catch(error => {
                    console.error('Error playing music:', error);
                    // Music might need user interaction first
                });
        }
    } catch (error) {
        console.error('Error playing music:', error);
    }
}

// Stop background music
function stopMusic() {
    if (backgroundMusic) {
        try {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        } catch (error) {
            console.error('Error stopping music:', error);
        }
    }
}

// Start game
function startGame() {
    if (gameRunning) return;

    // Stop home screen animations
    stopHomeShipAnimation();
    stopHomeStarAnimation();
    stopGameOverShipAnimation();

    // Switch to game screen
    homeScreen.classList.remove('active');
    gameScreen.classList.add('active');
    gameOverScreen.classList.remove('visible');

    gameRunning = true;
    initPlayer(); // Initialize player based on current canvas size
    initStars(); // Initialize stars

    // Reset game state
    score = 0;
    lives = 3;
    enemies = []; // Clear enemies array
    frameCount = 0;
    enemySpawnRate = 60;
    currentFrame = 0; // Reset animation to first frame
    animationFrameCounter = 0;

    scoreElement.textContent = score;
    livesElement.textContent = lives;

    // Start background music
    playMusic();

    lastTimestamp = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

// End game
function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);

    // Stop background music
    stopMusic();

    // Show game over screen with final score
    finalScoreElement.textContent = score;
    gameOverScreen.classList.add('visible');

    // Start game over ship animation
    animateGameOverShip();
}

// Handle window resize
function handleResize() {
    resizeCanvas();

    // Resize home star canvas
    homeStarCanvas.width = window.innerWidth;
    homeStarCanvas.height = window.innerHeight;
    initHomeStars(); // Reinitialize stars for new canvas size

    if (gameRunning) {
        initPlayer();
    }
}

// Keyboard controls (for desktop)
function keyDownHandler(e) {
    if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && player.x < canvas.width - player.width) {
        player.dx = player.speed;
    } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && player.x > 0) {
        player.dx = -player.speed;
    }
}

function keyUpHandler(e) {
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || 
        e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        player.dx = 0;
    }
}

// Touch/swipe controls for mobile
function setupTouchControls() {
    let touchStartX = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        if (!touchStartX) return;

        const touchCurrentX = e.touches[0].clientX;
        const diff = touchCurrentX - touchStartX;

        // Set movement direction based on swipe with reduced speed for mobile
        if (diff > 10) {
            player.dx = player.speed * 0.6; // Move right at 60% speed
        } else if (diff < -10) {
            player.dx = -player.speed * 0.6; // Move left at 60% speed
        } else {
            player.dx = 0; // Stop if minimal movement
        }

        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchend', () => {
        player.dx = 0;
        touchStartX = 0;
    });
    
    canvas.addEventListener('touchcancel', () => {
        player.dx = 0;
        touchStartX = 0;
    });
}

// Initialize game
window.addEventListener('load', () => {
    resizeCanvas();
    initPlayer();
    initStars();
    setupTouchControls();

    // Set canvas sizes for ship animations
    homeShipCanvas.width = 240;
    homeShipCanvas.height = 240;
    gameOverShipCanvas.width = 100;
    gameOverShipCanvas.height = 100;

    // Set up home star canvas
    homeStarCanvas.width = window.innerWidth;
    homeStarCanvas.height = window.innerHeight;
    initHomeStars();

    // Load background music
    loadBackgroundMusic();

    // Start home screen animations
    animateHomeShip();
    animateHomeStars();
});

// Event listeners
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
window.addEventListener('resize', handleResize);

// Listen for visual viewport changes (important for mobile browsers)
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', () => {
        // Prevent scrolling on mobile
        window.scrollTo(0, 0);
    });
}

// Prevent scrolling when touching the game area
document.body.addEventListener('touchmove', (e) => {
    if (gameRunning) {
        e.preventDefault();
    }
}, { passive: false });

// Initial draw
draw();