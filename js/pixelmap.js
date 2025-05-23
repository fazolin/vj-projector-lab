// =====================================================
//                 VARIÁVEIS GLOBAIS
// =====================================================

let screenCounter = 0;
let autoCalcTimeout;
let resizeTimeout;

// =====================================================
//                 MODELOS E DOT PITCH
// =====================================================

function populateModelSelect() {
  const select = document.getElementById("selectedModel");
  select.innerHTML = painelModelos
    .map(
      (p, idx) =>
        `<option value="${idx}">${p.nome} (${p.resolucaoX}x${p.resolucaoY})</option>`
    )
    .join("");
  select.selectedIndex = 0;
  mostrarDotPitch();
}

function mostrarDotPitch() {
  const select = document.getElementById("selectedModel");
  const modelo = painelModelos[parseInt(select.value)];
  const div = document.getElementById("dotPitchInfo");
  div.textContent = `Dot Pitch (mm): ${modelo.pitch.toFixed(2)}mm`;
  refreshScreenList();
}

function refreshScreenList() {
  const inputs = document.querySelectorAll("#dynamicInputs input");
  inputs.forEach((input) => {
    if (input.id.startsWith("width") || input.id.startsWith("height")) {
      const index = parseInt(input.id.match(/\d+/)[0]);
      const modelo =
        painelModelos[parseInt(document.getElementById("selectedModel").value)];
      input.step = input.id.includes("width")
        ? modelo.larguraModulo
        : modelo.alturaModulo;
    }
  });
  calculate();
}

// =====================================================
//                 ADICIONAR E REMOVER SCREEN
// =====================================================

function addScreen() {
  const container = document.getElementById("dynamicInputs");
  const modelo =
    painelModelos[parseInt(document.getElementById("selectedModel").value)];
  screenCounter++;
  const i = screenCounter;

  const wrapper = document.createElement("div");
  wrapper.classList.add("panel-input");
  wrapper.id = `screen-wrapper-${i}`;

  wrapper.innerHTML = `
    <div class="panel-header">
      <span class="drag-handle" title="Drag to reorder">☰</span>
      <span class="drag-note">Drag to reorder</span>
      <button class="remove-btn" onclick="removeScreen(${i})" title="Remove this screen">×</button>
    </div>
    <div class="row">
      <label>Screen Name:
        <input type="text" id="name${i}" value="Screen ${i}">
      </label>
    </div>
    <div class="row">
      <label>Width (m):
        <input type="number" id="width${i}" step="${modelo.larguraModulo}" value="4.0">
      </label>
      <label>Height (m):
        <input type="number" id="height${i}" step="${modelo.alturaModulo}" value="3.0">
      </label>
    </div>
    <div class="row">
      <label class="align-label">Alignment</label>
      <div class="align-group" id="alignGroup${i}">
        <button type="button" class="align-btn" data-value="top" onclick="setAlignment(${i}, 'top')">↑</button>
        <button type="button" class="align-btn active" data-value="middle" onclick="setAlignment(${i}, 'middle')">↕</button>
        <button type="button" class="align-btn" data-value="bottom" onclick="setAlignment(${i}, 'bottom')">↓</button>
      </div>
    </div>
  `;
  container.appendChild(wrapper);
  bindAutoUpdate();
  calculate();
}

function removeScreen(id) {
  const wrapper = document.getElementById(`screen-wrapper-${id}`);
  if (wrapper) wrapper.remove();
  calculate();
}

// =====================================================
//                  ALINHAMENTO E ATUALIZAÇÃO
// =====================================================

function setAlignment(index, value) {
  const group = document.getElementById(`alignGroup${index}`);
  group.querySelectorAll(".align-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === value);
  });
  autoCalculate();
}

function getAlignment(index) {
  const group = document.getElementById(`alignGroup${index}`);
  const active = group.querySelector(".align-btn.active");
  return active ? active.dataset.value : "middle";
}

function bindAutoUpdate() {
  const inputs = document.querySelectorAll("#dynamicInputs input");
  inputs.forEach((el) => {
    el.removeEventListener("input", autoCalculate);
    el.removeEventListener("change", autoCalculate);
    el.addEventListener("input", autoCalculate);
    el.addEventListener("change", autoCalculate);
  });
}

function autoCalculate() {
  clearTimeout(autoCalcTimeout);
  autoCalcTimeout = setTimeout(() => calculate(), 300);
}

// =====================================================
//                 CÁLCULO E DESENHO
// =====================================================

function calculate(customOrder = null) {
  const modelo =
    painelModelos[parseInt(document.getElementById("selectedModel").value)];
  const results = document.getElementById("results");
  results.innerHTML = "";

  const paineis = [];
  let totalLarguraPx = 0;
  let maxAlturaPx = 0;

  const wrappers = customOrder || [
    ...document.querySelectorAll(".panel-input"),
  ];

  wrappers.forEach((wrapper) => {
    const i = parseInt(wrapper.id.split("-")[2]);
    const larguraM = parseFloat(document.getElementById(`width${i}`).value);
    const alturaM = parseFloat(document.getElementById(`height${i}`).value);
    const alinhamento = getAlignment(i);
    const nomePainel =
      document.getElementById(`name${i}`).value || `Screen ${i}`;

    const modX = Math.floor(larguraM / modelo.larguraModulo);
    const modY = Math.floor(alturaM / modelo.alturaModulo);

    const totalX = modX * modelo.resolucaoX;
    const totalY = modY * modelo.resolucaoY;
    const totalPixels = totalX * totalY;

    totalLarguraPx += totalX;
    if (totalY > maxAlturaPx) maxAlturaPx = totalY;

    paineis.push({
      modelo,
      modX,
      modY,
      totalX,
      totalY,
      alinhamento,
      nome: nomePainel,
      id: i - 1,
    });

    results.innerHTML += `
      <div class="result-box">
        <strong>${nomePainel}</strong><br>
        Model: ${modelo.nome} (${modelo.resolucaoX}x${modelo.resolucaoY})<br>
        Dot Pitch: ${modelo.pitch.toFixed(2)}mm<br>
        Grid: ${modX} x ${modY} modules<br>
        Total resolution: ${totalX} x ${totalY} = ${totalPixels.toLocaleString()} pixels<br>
        Physical size: ${(modX * modelo.larguraModulo).toFixed(2)}m x ${(
      modY * modelo.alturaModulo
    ).toFixed(2)}m
      </div>`;
  });

  if (totalLarguraPx <= 0 || maxAlturaPx <= 0) {
    const canvas = document.getElementById("panelCanvasPreview");
    canvas.width = 300;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "16px sans-serif";
    ctx.fillText("Waiting for valid screens", 150, 75);
    return;
  }

  const canvasOrig = document.getElementById("panelCanvasOriginal");
  const canvasPrev = document.getElementById("panelCanvasPreview");
  drawPixelMap(paineis, canvasOrig, canvasPrev, totalLarguraPx, maxAlturaPx);
}

function reorderScreensFromDOM() {
  const wrappers = [...document.querySelectorAll(".panel-input")];
  calculate(wrappers);
}

// =====================================================
//                  EXPORTAR PNG
// =====================================================

function exportAsPng() {
  const canvas = document.getElementById("panelCanvasOriginal");

  if (canvas.width > 32000 || canvas.height > 32000) {
    alert(
      "Export failed: canvas too large for browser (limit is ~32,000px). Reduce screen count or width."
    );
    return;
  }

  const link = document.createElement("a");
  link.download = "pixel_map.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// =====================================================
//                EVENTO: REDIMENSIONAMENTO
// =====================================================

window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    calculate();
  }, 300);
});
