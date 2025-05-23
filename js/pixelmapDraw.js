function drawPixelMap(paineis, canvasOrig, canvasPrev, totalLarguraPx, maxAlturaPx) {
  canvasOrig.width = totalLarguraPx;
  canvasOrig.height = maxAlturaPx;

  const ctxOrig = canvasOrig.getContext('2d');
  ctxOrig.clearRect(0, 0, canvasOrig.width, canvasOrig.height);

  let offsetX = 0;
  paineis.forEach((painel) => {
    drawSinglePanel(ctxOrig, offsetX, painel, 1, painel.id);
    offsetX += painel.totalX;
  });

const wrapper = canvasPrev.parentElement;
const wrapperWidth = wrapper.clientWidth;
const wrapperHeight = window.innerHeight - wrapper.getBoundingClientRect().top - 120;

const scale = Math.min(wrapperWidth / totalLarguraPx, wrapperHeight / maxAlturaPx, 1);
canvasPrev.width = totalLarguraPx * scale;
canvasPrev.height = maxAlturaPx * scale;


  const ctxPrev = canvasPrev.getContext('2d');
  ctxPrev.clearRect(0, 0, canvasPrev.width, canvasPrev.height);

  offsetX = 0;
  paineis.forEach((painel) => {
    drawSinglePanel(ctxPrev, offsetX * scale, painel, scale, painel.id);
    offsetX += painel.totalX;
  });
}

function drawSinglePanel(ctx, xOffset, painel, scale = 1, id = 0) {
  const { totalX, totalY, alinhamento, modX, modY, modelo, nome } = painel;
  const resX = modelo.resolucaoX;
  const resY = modelo.resolucaoY;

  const width = totalX * scale;
  const height = totalY * scale;

  let yOffset = 0;
  const canvasHeight = ctx.canvas.height / scale;

  if (alinhamento === 'top') yOffset = 0;
  else if (alinhamento === 'middle') yOffset = (canvasHeight - totalY) / 2 * scale;
  else if (alinhamento === 'bottom') yOffset = (canvasHeight - totalY) * scale;

  // Paleta fixa
  const palette = ['#1d9bf0', '#198754', '#e83e8c', '#ffc107', '#6610f2', '#20c997', '#fd7e14'];
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

  // Círculo central
  const circleRadius = Math.min(totalX, totalY) * scale / 2;
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

  // Diagonais
  ctx.beginPath();
  ctx.moveTo(xOffset, yOffset);
  ctx.lineTo(xOffset + width, yOffset + height);
  ctx.moveTo(xOffset + width, yOffset);
  ctx.lineTo(xOffset, yOffset + height);
  ctx.stroke();

  // Título
  const fontBase = Math.min(width * 0.12, height * 0.16);
  ctx.font = `${fontBase}px 'Roboto Condensed', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 3;
  ctx.fillText(nome, xOffset + width / 2, yOffset + height / 2 - fontBase * 0.4);

  // Infos menores
  const fontSmall = height * 0.048;
  ctx.font = `${fontSmall}px 'Roboto Condensed', sans-serif`;
  ctx.shadowBlur = 2;
  const text1 = `${totalX}x${totalY}`;
  const text2 = `(${totalX}px x ${totalY}px)`;
  ctx.fillText(text1, xOffset + width / 2, yOffset + height / 2 + fontSmall * 0.3);
  ctx.fillText(text2, xOffset + width / 2, yOffset + height / 2 + fontSmall * 1.4);

  ctx.shadowBlur = 0;
}
