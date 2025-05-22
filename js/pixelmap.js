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
  document.getElementById("numPanels").value = 1;
  generatePanelInputs();
}

function mostrarDotPitch() {
  const select = document.getElementById("selectedModel");
  const modelo = painelModelos[parseInt(select.value)];
  const div = document.getElementById("dotPitchInfo");
  div.textContent = `Dot Pitch (mm): ${modelo.pitch.toFixed(2)}mm`;
  autoUpdateModel();
}

function autoUpdateModel() {
  const modelo =
    painelModelos[parseInt(document.getElementById("selectedModel").value)];
  const num = parseInt(document.getElementById("numPanels").value);
  const stepX = modelo.larguraModulo;
  const stepY = modelo.alturaModulo;

  for (let i = 1; i <= num; i++) {
    const widthInput = document.getElementById(`width${i}`);
    const heightInput = document.getElementById(`height${i}`);
    if (widthInput && heightInput) {
      widthInput.step = stepX;
      heightInput.step = stepY;
      if (!widthInput.value || widthInput.value === "1.0")
        widthInput.value = 8.0;
      if (!heightInput.value || heightInput.value === "1.0")
        heightInput.value = 4.0;
    }
  }

  calculate();
}

function generatePanelInputs() {
  const num = parseInt(document.getElementById("numPanels").value);
  const container = document.getElementById("dynamicInputs");
  const modelo =
    painelModelos[parseInt(document.getElementById("selectedModel").value)];

  const existing = container.children.length;
  const diff = num - existing;

  if (diff > 0) {
    for (let i = existing + 1; i <= num; i++) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("panel-input");
      wrapper.id = `screen-wrapper-${i}`;

      wrapper.innerHTML = `
          <div class="drag-handle">☰</div>
          <h3>Screen ${i}</h3>
          <small class="drag-note">☰ Drag to reorder</small>
          <div class="row">
            <label>
              Screen Name:
              <input type="text" id="name${i}" value="Screen ${i}">
            </label>
          </div>
          <div class="row">
            <label>
              Width (m):
              <input type="number" id="width${i}" step="${modelo.larguraModulo}" value="8.0">
            </label>
            <label>
              Height (m):
              <input type="number" id="height${i}" step="${modelo.alturaModulo}" value="4.0">
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
    }
  } else if (diff < 0) {
    for (let i = existing; i > num; i--) {
      const el = document.getElementById(`screen-wrapper-${i}`);
      if (el) el.remove();
    }
  }

  bindAutoUpdate();
  calculate();
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

let autoCalcTimeout;
function autoCalculate() {
  clearTimeout(autoCalcTimeout);
  autoCalcTimeout = setTimeout(() => calculate(), 300);
}

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

function calculate(customOrder = null) {
  const modelo =
    painelModelos[parseInt(document.getElementById("selectedModel").value)];
  const results = document.getElementById("results");
  results.innerHTML = "";

  const paineis = [];
  let maxAlturaPx = 0;
  let totalLarguraPx = 0;

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
    const larguraPx = modX * 50;
    const alturaPx = modY * 50;

    if (alturaPx > maxAlturaPx) maxAlturaPx = alturaPx;
    totalLarguraPx += larguraPx;

    const totalX = modX * modelo.resolucaoX;
    const totalY = modY * modelo.resolucaoY;
    const totalPixels = totalX * totalY;

    paineis.push({
      modelo,
      modX,
      modY,
      larguraPx,
      alturaPx,
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
        </div>
      `;
  });

  const canvasOrig = document.getElementById("panelCanvasOriginal");
  const canvasPrev = document.getElementById("panelCanvasPreview");
  drawPixelMap(paineis, canvasOrig, canvasPrev, totalLarguraPx, maxAlturaPx);
}

function reorderScreensFromDOM() {
  const wrappers = [...document.querySelectorAll(".panel-input")];
  calculate(wrappers);
}

function exportAsPng() {
  const canvas = document.getElementById("panelCanvasOriginal");
  const link = document.createElement("a");
  link.download = "pixel_map.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
