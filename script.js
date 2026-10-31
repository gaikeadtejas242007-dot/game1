
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const carStyles = {
    classic: {
        body: "#f44336",
        accent: "#b71c1c",
        cabin: "#1d4f91",
        wheel: "#111",
        rim: "#d9d9d9",
        light: "#ffd54f"
    },
    sport: {
        body: "#00b7ff",
        accent: "#0066ff",
        cabin: "#0c2a63",
        wheel: "#1b1b1b",
        rim: "#e8f7ff",
        light: "#ffe082"
    },
    jeep: {
        body: "#4caf50",
        accent: "#2e7d32",
        cabin: "#1b4630",
        wheel: "#1d1d1d",
        rim: "#dce8d9",
        light: "#ffeb3b"
    },
    racer: {
        body: "#ff9f1c",
        accent: "#ff6a00",
        cabin: "#7a1e00",
        wheel: "#1a1a1a",
        rim: "#f5f5f5",
        light: "#fff59d"
    },
    bus: {
        body: "#30a6ff",
        accent: "#0d5da8",
        cabin: "#dfefff",
        wheel: "#111",
        rim: "#f5f5f5",
        light: "#ffe082"
    }
};

let selectedCar = "classic";

let car = {
    x: 150,
    y: 250,
    velocity: 0,
    verticalVelocity: 0,
    angle: 0,
    rotation: 0,
    wheelRotation: 0
};

let camera = 0;
let distance = 0;
let coins = 0;
let energy = 100;
let gameOver = false;
let gas = false;
let brake = false;
let boost = false;
let lastCoin = -1;
let energyBottles = [];
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioContext = new AudioCtx();
    }
    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function playTone(frequency, duration, type = "sine", volume = 0.08) {
    if (!audioContext) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    osc.stop(audioContext.currentTime + duration);
}

function playCoinSound() {
    initAudio();
    if (!audioContext) return;
    playTone(880, 0.08, "triangle", 0.06);
    setTimeout(() => playTone(1170, 0.08, "triangle", 0.05), 50);
}

function playEnergySound() {
    initAudio();
    if (!audioContext) return;
    playTone(420, 0.12, "sine", 0.08);
    setTimeout(() => playTone(620, 0.12, "sine", 0.07), 80);
    setTimeout(() => playTone(840, 0.16, "triangle", 0.06), 160);
}

function ground(x) {
    return 340 +
        Math.sin(x * 0.006) * 55 +
        Math.sin(x * 0.014) * 20;
}

function createEnergyBottles() {
    energyBottles = [];
    for (let i = 1; i <= 12; i++) {
        energyBottles.push({
            x: i * 440 + 180,
            collected: false
        });
    }
}

function reset() {
    car = {
        x: 150,
        y: ground(150) - 25,
        velocity: 0,
        verticalVelocity: 0,
        angle: 0,
        rotation: 0,
        wheelRotation: 0
    };

    camera = 0;
    distance = 0;
    coins = 0;
    energy = 100;
    gameOver = false;
    lastCoin = -1;
    createEnergyBottles();
}

function drawGround() {
    ctx.beginPath();
    ctx.moveTo(0, 450);

    for (let x = 0; x <= 900; x += 5) {
        let worldX = x + camera;
        ctx.lineTo(x, ground(worldX));
    }

    ctx.lineTo(900, 450);
    ctx.closePath();

    ctx.fillStyle = "#388e3c";
    ctx.fill();

    ctx.strokeStyle = "#654321";
    ctx.lineWidth = 5;
    ctx.stroke();
}

function drawClouds() {
    for (let i = 0; i < 7; i++) {
        const baseX = (i * 180 - (camera * 0.25)) % 1100;
        const x = baseX < 0 ? baseX + 1100 : baseX;
        const y = 55 + (i % 4) * 30;
        const scale = 0.8 + (i % 3) * 0.25;

        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.beginPath();
        ctx.arc(x, y, 22 * scale, 0, Math.PI * 2);
        ctx.arc(x + 30 * scale, y - 8, 26 * scale, 0, Math.PI * 2);
        ctx.arc(x + 58 * scale, y, 22 * scale, 0, Math.PI * 2);
        ctx.arc(x + 24 * scale, y + 10, 26 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawTrees() {
    for (let i = 0; i < 30; i++) {
        const worldX = i * 170 + camera * 0.7;
        const side = i % 2 === 0 ? 1 : -1;
        const x = (worldX - camera) + side * 110;
        const y = ground(worldX + side * 80) - 10;

        if (x < -80 || x > 980) continue;

        const trunkHeight = 26 + (i % 4) * 8;
        const trunkWidth = 12;
        const crownRadius = 20 + (i % 3) * 5;

        ctx.fillStyle = "#7a4d2d";
        ctx.fillRect(x - trunkWidth / 2, y - trunkHeight, trunkWidth, trunkHeight);

        ctx.beginPath();
        ctx.arc(x, y - trunkHeight - crownRadius + 5, crownRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#2e8b57";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x - 18, y - trunkHeight - crownRadius + 8, crownRadius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = "#3ca76c";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + 16, y - trunkHeight - crownRadius + 10, crownRadius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = "#33af5f";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + 4, y - trunkHeight - crownRadius - 8, crownRadius * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = "#5ecf82";
        ctx.fill();
    }
}

function getSelectedCarStyle() {
    return carStyles[selectedCar] || carStyles.classic;
}

function drawBoostTrail() {
    if (!boost || energy <= 0) return;

    for (let i = 0; i < 10; i++) {
        const offset = 28 + i * 10;
        const size = 8 + i * 2;

        ctx.beginPath();
        ctx.fillStyle = `rgba(96, 181, 255, ${0.25 + i * 0.05})`;
        ctx.ellipse(-offset, 8 + i * 1.5, size, size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawCar() {
    let x = car.x - camera;
    let y = car.y;
    const style = getSelectedCarStyle();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(car.angle);

    drawBoostTrail();

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 17, 55, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyGradient = ctx.createLinearGradient(-45, -25, 42, 20);
    bodyGradient.addColorStop(0, style.body);
    bodyGradient.addColorStop(0.35, style.accent);
    bodyGradient.addColorStop(1, style.body);

    ctx.fillStyle = bodyGradient;

    if (selectedCar === "jeep") {
        ctx.beginPath();
        ctx.moveTo(-42, 0);
        ctx.lineTo(26, 0);
        ctx.lineTo(42, -8);
        ctx.lineTo(38, -22);
        ctx.lineTo(-26, -22);
        ctx.lineTo(-40, -10);
        ctx.closePath();
        ctx.fill();
    } else if (selectedCar === "bus") {
        ctx.beginPath();
        ctx.moveTo(-58, 0);
        ctx.lineTo(54, 0);
        ctx.lineTo(62, -18);
        ctx.lineTo(52, -26);
        ctx.lineTo(-48, -26);
        ctx.lineTo(-58, -18);
        ctx.closePath();
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.moveTo(-42, 0);
        ctx.lineTo(30, 0);
        ctx.lineTo(38, -12);
        ctx.lineTo(20, -22);
        ctx.lineTo(-14, -22);
        ctx.lineTo(-35, -12);
        ctx.closePath();
        ctx.fill();
    }

    ctx.fillStyle = style.cabin;
    if (selectedCar === "bus") {
        ctx.fillRect(-40, -24, 64, 20);
        ctx.fillRect(-10, -38, 26, 16);
        ctx.fillRect(-44, -12, 12, 12);
        ctx.fillRect(50, -12, 10, 12);
        ctx.fillStyle = "#dfefff";
        ctx.fillRect(-36, -22, 12, 12);
        ctx.fillRect(-18, -22, 12, 12);
        ctx.fillRect(0, -22, 12, 12);
        ctx.fillRect(18, -22, 12, 12);
    } else {
        ctx.beginPath();
        ctx.moveTo(-8, -22);
        ctx.lineTo(16, -22);
        ctx.lineTo(10, -38);
        ctx.lineTo(-2, -38);
        ctx.closePath();
        ctx.fill();

        if (selectedCar === "sport") {
            ctx.fillStyle = "#dfefff";
            ctx.fillRect(-4, -36, 12, 13);
            ctx.fillRect(12, -36, 12, 13);
        } else {
            ctx.fillStyle = "#dfefff";
            ctx.fillRect(-4, -36, 10, 12);
            ctx.fillRect(12, -36, 10, 12);
        }
    }

    const wheelPositions = selectedCar === "bus" ? [-34, -8, 22, 46] : [-24, 18];

    for (let wx of wheelPositions) {
        ctx.save();
        ctx.translate(wx, 6);
        ctx.rotate(car.wheelRotation);

        ctx.fillStyle = "#0f1115";
        ctx.beginPath();
        ctx.ellipse(0, 0, 13, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#2b2b2b";
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = style.rim;
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos((i / 6) * Math.PI * 2) * 8, Math.sin((i / 6) * Math.PI * 2) * 8);
            ctx.stroke();
        }

        ctx.fillStyle = style.rim;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    ctx.fillStyle = style.light;
    ctx.fillRect(selectedCar === "bus" ? 52 : 32, -8, 8, 6);

    if (selectedCar === "racer") {
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillRect(-34, -8, 8, 6);
        ctx.fillRect(-36, -2, 10, 4);
    }

    ctx.restore();
}

function drawCoins() {
    for (let i = 1; i < 100; i++) {
        let worldX = i * 250;
        let x = worldX - camera;

        if (x > -20 && x < 920) {
            let y = ground(worldX) - 65;

            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fillStyle = "gold";
            ctx.fill();
            ctx.strokeStyle = "#b8860b";
            ctx.stroke();
        }
    }
}

function drawEnergyBottles() {
    energyBottles.forEach((bottle) => {
        if (bottle.collected) return;

        const x = bottle.x - camera;
        if (x < -30 || x > 930) return;

        const y = ground(bottle.x) - 30;

        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "#39d353";
        ctx.fillRect(-8, -18, 16, 30);
        ctx.fillStyle = "#d9ffe8";
        ctx.fillRect(-5, -10, 10, 12);
        ctx.fillStyle = "#39d353";
        ctx.fillRect(-2, -22, 4, 6);
        ctx.fillRect(-8, -15, 16, 3);
        ctx.restore();
    });
}

function update() {
    if (gameOver) return;

    if (boost && energy > 0) {
        car.velocity += 0.48;
        energy = Math.max(0, energy - 1.4);
    } else if (gas && energy > 0) {
        car.velocity += 0.16;
        energy = Math.max(0, energy - 0.5);
    } else {
        energy = Math.min(100, energy + 0.12);
    }

    if (energy <= 0) boost = false;

    if (brake) car.velocity -= 0.18;

    car.velocity *= 0.99;
    car.velocity = Math.max(-3, Math.min(car.velocity, boost ? 13 : 7));
    car.wheelRotation += car.velocity * 0.18;

    car.x += car.velocity;

    let targetY = ground(car.x) - 25;

    if (car.y < targetY) {
        car.verticalVelocity += 0.35;
        car.y += car.verticalVelocity;
    } else {
        car.y = targetY;
        car.verticalVelocity = 0;
    }

    let slope = (ground(car.x + 5) - ground(car.x - 5)) / 10;
    car.angle = Math.atan(slope);

    camera = Math.max(0, car.x - 180);

    distance = Math.max(0, Math.floor(car.x / 10));

    let coinIndex = Math.round(car.x / 250);
    if (coinIndex > lastCoin && coinIndex > 0 &&
        Math.abs(car.x - coinIndex * 250) < 12) {
        coins++;
        lastCoin = coinIndex;
        playCoinSound();
    }

    energyBottles.forEach((bottle) => {
        if (!bottle.collected && Math.abs(car.x - bottle.x) < 24 && Math.abs(car.y - (ground(bottle.x) - 30)) < 28) {
            bottle.collected = true;
            energy = Math.min(100, energy + 30);
            playEnergySound();
        }
    });

    if (car.y > 430) gameOver = true;

    document.getElementById("distance").textContent = distance;
    document.getElementById("coins").textContent = coins;
    document.getElementById("energy").textContent = Math.max(0, Math.round(energy));
}

function draw() {
    ctx.clearRect(0, 0, 900, 450);

    // Sun
    ctx.beginPath();
    ctx.arc(790, 70, 35, 0, Math.PI * 2);
    ctx.fillStyle = "yellow";
    ctx.fill();

    drawClouds();
    drawTrees();
    drawCoins();
    drawEnergyBottles();
    drawGround();
    drawCar();

    if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, 900, 450);

        ctx.fillStyle = "white";
        ctx.font = "bold 45px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER!", 450, 210);
        ctx.font = "22px Arial";
        ctx.fillText("Click Restart to play again", 450, 255);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

const carButtons = document.querySelectorAll(".car-option");
carButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectedCar = button.dataset.car;
        carButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    });
});

// Keyboard controls
document.addEventListener("keydown", e => {
    initAudio();
    if (e.key === "ArrowRight") gas = true;
    if (e.key === "ArrowLeft") brake = true;
    if (e.key === "Shift" || e.key === " ") boost = true;
});

document.addEventListener("keyup", e => {
    if (e.key === "ArrowRight") gas = false;
    if (e.key === "ArrowLeft") brake = false;
    if (e.key === "Shift" || e.key === " ") boost = false;
});

// Button controls
const gasButton = document.getElementById("gas");
const brakeButton = document.getElementById("brake");
const boostButton = document.getElementById("boost");

function hold(button, start, stop) {
    button.addEventListener("pointerdown", e => {
        e.preventDefault();
        initAudio();
        start();
    });
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointerleave", stop);
    button.addEventListener("pointercancel", stop);
}

hold(gasButton, () => gas = true, () => gas = false);
hold(brakeButton, () => brake = true, () => brake = false);
hold(boostButton, () => boost = true, () => boost = false);

document.getElementById("restart").onclick = reset;

reset();
loop();
