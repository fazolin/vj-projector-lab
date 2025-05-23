// =====================================================
//           DESENHA O LAYOUT COMPLETO DO PIXEL MAP
// =====================================================

function drawPixelMap(
  paineis,
  canvasOrig,
  canvasPrev,
  totalLarguraPx,
  maxAlturaPx
) {
  canvasOrig.width = totalLarguraPx;
  canvasOrig.height = maxAlturaPx;

  const ctxOrig = canvasOrig.getContext("2d");
  ctxOrig.clearRect(0, 0, canvasOrig.width, canvasOrig.height);

  let offsetX = 0;
  paineis.forEach((painel) => {
    drawSinglePanel(ctxOrig, offsetX, painel, 1, painel.id);
    offsetX += painel.totalX;
  });

  const wrapper = canvasPrev.parentElement;
  const wrapperWidth = wrapper.clientWidth;
  const wrapperHeight =
    window.innerHeight - wrapper.getBoundingClientRect().top - 120;

  const scale = Math.min(
    wrapperWidth / totalLarguraPx,
    wrapperHeight / maxAlturaPx,
    1
  );

  canvasPrev.width = totalLarguraPx * scale;
  canvasPrev.height = maxAlturaPx * scale;

  const ctxPrev = canvasPrev.getContext("2d");
  ctxPrev.clearRect(0, 0, canvasPrev.width, canvasPrev.height);

  offsetX = 0;
  paineis.forEach((painel) => {
    drawSinglePanel(ctxPrev, offsetX * scale, painel, scale, painel.id);
    offsetX += painel.totalX;
  });
}

// =====================================================
//               DESENHA UM PAINEL INDIVIDUAL
// =====================================================

function drawSinglePanel(ctx, xOffset, painel, scale = 1, id = 0) {
  const { totalX, totalY, alinhamento, modX, modY, modelo, nome } = painel;
  const resX = modelo.resolucaoX;
  const resY = modelo.resolucaoY;

  const width = totalX * scale;
  const height = totalY * scale;

  let yOffset = 0;
  const canvasHeight = ctx.canvas.height / scale;

  if (alinhamento === "top") yOffset = 0;
  else if (alinhamento === "middle")
    yOffset = ((canvasHeight - totalY) / 2) * scale;
  else if (alinhamento === "bottom") yOffset = (canvasHeight - totalY) * scale;

  // Cores dos módulos
  const palette = [
    "#1d9bf0",
    "#198754",
    "#e83e8c",
    "#ffc107",
    "#6610f2",
    "#20c997",
    "#fd7e14",
  ];
  const baseColor = palette[id % palette.length];

  function adjustColor(hex, amt) {
    let col = parseInt(hex.slice(1), 16);
    let r = Math.min(255, ((col >> 16) & 0xff) + amt);
    let g = Math.min(255, ((col >> 8) & 0xff) + amt);
    let b = Math.min(255, (col & 0xff) + amt);
    return `rgb(${r},${g},${b})`;
  }

  const color1 = baseColor;
  const color2 = adjustColor(baseColor, -30);

  for (let y = 0; y < modY; y++) {
    for (let x = 0; x < modX; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? color1 : color2;
      ctx.fillRect(
        xOffset + x * resX * scale,
        yOffset + y * resY * scale,
        resX * scale,
        resY * scale
      );
    }
  }

  // Círculo e diagonais
  const circleRadius = (Math.min(totalX, totalY) * scale) / 2;
  ctx.beginPath();
  ctx.arc(
    xOffset + width / 2,
    yOffset + height / 2,
    circleRadius,
    0,
    Math.PI * 2
  );
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xOffset, yOffset);
  ctx.lineTo(xOffset + width, yOffset + height);
  ctx.moveTo(xOffset + width, yOffset);
  ctx.lineTo(xOffset, yOffset + height);
  ctx.stroke();

  // Texto
  const fontBase = Math.min(width * 0.12, height * 0.16);
  const fontSmall = height * 0.048;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "#000";

  // Nome da tela
  ctx.font = `${fontBase}px 'Roboto Condensed', sans-serif`;
  ctx.shadowBlur = 3;
  const centerY = yOffset + height / 2;
  ctx.fillText(nome, xOffset + width / 2, centerY - fontBase * 0.6);

  // Infos
  ctx.font = `${fontSmall}px 'Roboto Condensed', sans-serif`;
  ctx.shadowBlur = 2;
  const infoY = centerY + fontSmall * 0.6;
  ctx.fillText(`${totalX}x${totalY}`, xOffset + width / 2, infoY);
  ctx.fillText(
    `(${Math.round((xOffset + width / 2) / scale)}, ${Math.round(
      (yOffset + height / 2) / scale
    )})`,
    xOffset + width / 2,
    infoY + fontSmall * 1.5
  );

  ctx.shadowBlur = 0;
}
