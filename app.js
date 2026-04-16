const matrixCanvas = document.getElementById("matrix");
const matrixCtx = matrixCanvas.getContext("2d");

const introStage = document.getElementById("introStage");
const analysisStage = document.getElementById("analysisStage");
const resultStage = document.getElementById("resultStage");

const startBtn = document.getElementById("startBtn");
const skipBtn = document.getElementById("skipBtn");
const restartBtn = document.getElementById("restartBtn");

const systemStatus = document.getElementById("systemStatus");
const progressBar = document.getElementById("progressBar");
const progressLabel = document.getElementById("progressLabel");
const logBox = document.getElementById("logBox");
const swagValue = document.getElementById("swagValue");
const humanValue = document.getElementById("humanValue");
const swagistanValue = document.getElementById("swagistanValue");
const probabilityText = document.getElementById("probabilityText");

const phases = [
  document.getElementById("phase0"),
  document.getElementById("phase1"),
  document.getElementById("phase2"),
  document.getElementById("phase3")
];

const steps = [
  { t: "Establishing contact with embedded marker...", p: 4, phase: 0, swag: "03.1", human: "96%", swagistan: "No signal" },
  { t: "Scanning whole swag...", p: 9, phase: 0, swag: "08.6", human: "92%", swagistan: "Unknown" },
  { t: "Reading thread behavior under symbolic pressure...", p: 14, phase: 0, swag: "14.4", human: "88%", swagistan: "Unknown" },
  { t: "Detecting silhouette confidence anomalies...", p: 20, phase: 0, swag: "21.8", human: "82%", swagistan: "Unknown" },
  { t: "Define swagability...", p: 27, phase: 1, swag: "31.5", human: "76%", swagistan: "Possible" },
  { t: "Extracting excess intention from garment posture...", p: 35, phase: 1, swag: "43.2", human: "67%", swagistan: "Possible" },
  { t: "Comparing garment affect against acceptable human thresholds...", p: 43, phase: 1, swag: "55.9", human: "58%", swagistan: "Likely" },
  { t: "Measuring certified badness coefficient...", p: 51, phase: 1, swag: "63.7", human: "47%", swagistan: "Likely" },
  { t: "Reconstructing synthetic confidence residue...", p: 60, phase: 2, swag: "72.4", human: "36%", swagistan: "Very likely" },
  { t: "Made in swagistan? running territorial speculation...", p: 69, phase: 2, swag: "81.3", human: "25%", swagistan: "Very likely" },
  { t: "Projecting moral implications of excessive drip...", p: 78, phase: 2, swag: "88.2", human: "14%", swagistan: "Confirmed" },
  { t: "Stabilizing final shame vector...", p: 87, phase: 3, swag: "94.7", human: "06%", swagistan: "Confirmed" },
  { t: "Preparing ceremonial sentence...", p: 95, phase: 3, swag: "98.8", human: "02%", swagistan: "Confirmed" },
  { t: "Verdict sealed. symbolic innocence unavailable.", p: 100, phase: 3, swag: "99.9", human: "00%", swagistan: "Confirmed" }
];

let running = false;
let stepIndex = 0;
let columns = [];
const fontSize = 16;
const chars = "01アイウエオカキクケコサシスセソABCDEFGHIJKLMNOPQRSTUVWXYZ$#*+<>/{}[]";

function setStage(stage) {
  [introStage, analysisStage, resultStage].forEach(s => s.classList.remove("show"));
  stage.classList.add("show");
}

function setPhase(index) {
  phases.forEach((phase, i) => {
    phase.classList.toggle("active", i === index);
  });
}

function setProgress(value) {
  progressBar.style.width = value + "%";
  progressLabel.textContent = value + "%";
}

function addLog(text, status = "OK") {
  const line = document.createElement("div");
  line.className = "log-line";
  line.innerHTML = `<span>&gt; ${text}</span><span class="log-status">${status}</span>`;
  logBox.appendChild(line);
  logBox.scrollTop = logBox.scrollHeight;
}

function resetUI() {
  running = false;
  stepIndex = 0;
  setStage(introStage);
  setPhase(0);
  setProgress(0);
  systemStatus.textContent = "Dormant";
  logBox.innerHTML = "";
  swagValue.textContent = "00.0";
  humanValue.textContent = "100%";
  swagistanValue.textContent = "Pending";
  probabilityText.textContent = "99.8%";
  restartBtn.classList.add("hidden");
}

function finishAnalysis() {
  systemStatus.textContent = "Sentence Ready";
  setStage(resultStage);
  restartBtn.classList.remove("hidden");
  running = false;
}

function runStep() {
  if (stepIndex >= steps.length) {
    setTimeout(finishAnalysis, 900);
    return;
  }

  const step = steps[stepIndex];
  setPhase(step.phase);
  setProgress(step.p);
  swagValue.textContent = step.swag;
  humanValue.textContent = step.human;
  swagistanValue.textContent = step.swagistan;

  let status = "OK";
  if (step.p >= 60 && step.p < 95) status = "WARN";
  if (step.p >= 95) status = "LOCKED";

  addLog(step.t, status);

  stepIndex += 1;
  setTimeout(runStep, 950);
}

function startAnalysis(skip = false) {
  if (running) return;
  running = true;

  logBox.innerHTML = "";
  setProgress(0);
  setPhase(0);
  setStage(analysisStage);

  if (skip) {
    systemStatus.textContent = "Immediate Verdict";
    addLog("Bypassing interpretive dignity checks...", "OK");
    addLog("Suppressing uncertainty...", "WARN");
    addLog("Final sentence assembled without consent...", "LOCKED");
    swagValue.textContent = "99.9";
    humanValue.textContent = "00%";
    swagistanValue.textContent = "Confirmed";
    setProgress(100);
    setPhase(3);
    setTimeout(finishAnalysis, 800);
    return;
  }

  systemStatus.textContent = "Reading";
  stepIndex = 0;
  setTimeout(runStep, 700);
}

startBtn.addEventListener("click", () => startAnalysis(false));
skipBtn.addEventListener("click", () => startAnalysis(true));
restartBtn.addEventListener("click", resetUI);

function resizeCanvas() {
  matrixCanvas.width = window.innerWidth * devicePixelRatio;
  matrixCanvas.height = window.innerHeight * devicePixelRatio;
  matrixCanvas.style.width = window.innerWidth + "px";
  matrixCanvas.style.height = window.innerHeight + "px";
  matrixCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  setupMatrix();
}

function setupMatrix() {
  const count = Math.floor(window.innerWidth / fontSize);
  columns = Array.from({ length: count }, () => Math.random() * window.innerHeight / fontSize);
}

function drawMatrix() {
  matrixCtx.fillStyle = "rgba(2, 1, 3, 0.1)";
  matrixCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  matrixCtx.font = fontSize + "px monospace";
  matrixCtx.fillStyle = "rgba(197, 134, 255, 0.78)";

  columns.forEach((y, i) => {
    const text = chars[Math.floor(Math.random() * chars.length)];
    const x = i * fontSize;
    matrixCtx.fillText(text, x, y * fontSize);

    if (y * fontSize > window.innerHeight && Math.random() > 0.985) {
      columns[i] = 0;
    } else {
      columns[i] = y + 0.92;
    }
  });

  requestAnimationFrame(drawMatrix);
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
drawMatrix();
resetUI();
