
function initPlayer() {
    // Increase the player size by 20% for both width and height
    player.width = Math.max(48, canvas.width * 0.12); // Increased from 0.1 to 0.12 (20% larger)
    player.height = Math.max(36, canvas.height * 0.06); // Increased from 0.05 to 0.06 (20% larger)
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 20;
    player.speed = canvas.width * 0.008; // Speed proportional to canvas size
}


function drawPlayer() {
    if (rocketLoaded) {
        // Draw the rocket image with adjusted dimensions
        ctx.drawImage(
            rocketImg,
            player.x, player.y, player.width, player.height
        );
    } else {
        // Fallback to drawing a rectangle if the image hasn't loaded yet
        ctx.fillStyle = '#3498db';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // Draw cockpit
        ctx.fillStyle = '#aed6f1';
        ctx.fillRect(player.x + player.width * 0.3, player.y + player.height * 0.2, player.width * 0.4, player.height * 0.4);
    }
}