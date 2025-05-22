function getContrastingColor(hex, strength = 0.4) {
  const r = 255 - parseInt(hex.substr(1, 2), 16);
  const g = 255 - parseInt(hex.substr(3, 2), 16);
  const b = 255 - parseInt(hex.substr(5, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${strength})`;
}

function drawPixelMap(
  paineis,
  canvasOrig,
  canvasPrev,
  totalLarguraPx,
  maxAlturaPx
) {
  canvasOrig.width = totalLarguraPx + 20;
  canvasOrig.height = maxAlturaPx + 40;

  canvasPrev.width = totalLarguraPx + 20;
  canvasPrev.height = maxAlturaPx + 40;

  const ctxOrig = canvasOrig.getContext("2d");
  const ctxPrev = canvasPrev.getContext("2d");

  ctxOrig.clearRect(0, 0, canvasOrig.width, canvasOrig.height);
  ctxPrev.clearRect(0, 0, canvasPrev.width, canvasPrev.height);

  const cores = [
    "#FF6B6B",
    "#FFD93D",
    "#6BCB77",
    "#4D96FF",
    "#FF9F1C",
    "#845EC2",
    "#F9C74F",
    "#00C9A7",
  ];
  let xOffset = 0;

  for (let i = 0; i < paineis.length; i++) {
    const p = paineis[i];
    const screenColor = cores[p.id % cores.length];

    let yOffset = 0;
    if (p.alinhamento === "top") yOffset = 0;
    if (p.alinhamento === "middle") yOffset = (maxAlturaPx - p.alturaPx) / 2;
    if (p.alinhamento === "bottom") yOffset = maxAlturaPx - p.alturaPx;

    [ctxOrig, ctxPrev].forEach((ctx) => {
      const altColor = getContrastingColor(screenColor, 0.4);

      const tileW = 50;
      const tileH = 50;

      for (let ty = 0; ty < p.modY; ty++) {
        for (let tx = 0; tx < p.modX; tx++) {
          const tone = (tx + ty) % 2 === 0 ? screenColor : altColor;
          ctx.fillStyle = tone;
          ctx.fillRect(
            xOffset + tx * tileW,
            yOffset + ty * tileH,
            tileW,
            tileH
          );
        }
      }

      const centerX = xOffset + p.larguraPx / 2;
      const centerY = yOffset + p.alturaPx / 2;
      const radius = Math.min(p.larguraPx, p.alturaPx) / 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xOffset, yOffset);
      ctx.lineTo(xOffset + p.larguraPx, yOffset + p.alturaPx);
      ctx.moveTo(xOffset + p.larguraPx, yOffset);
      ctx.lineTo(xOffset, yOffset + p.alturaPx);
      ctx.stroke();

      // Font sizes
      const nameFontSize = Math.min(p.larguraPx * 0.25, 38);
      const infoFontSize = Math.min(p.larguraPx * 0.15, 22);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Name (larger font)
      ctx.font = `600 ${nameFontSize}px 'IBM Plex Mono', monospace`;
      ctx.shadowColor = "black";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(p.nome, centerX, centerY - nameFontSize);

      // Info (smaller font)
      ctx.font = `400 ${infoFontSize}px 'IBM Plex Mono', monospace`;
      ctx.fillText(
        `Resolution: ${p.modX * p.modelo.resolucaoX}x${
          p.modY * p.modelo.resolucaoY
        }`,
        centerX,
        centerY
      );
      ctx.fillText(
        `Position: x: ${xOffset}, y: ${Math.round(yOffset)}`,
        centerX,
        centerY + infoFontSize + 4
      );

      // Reset shadow
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    });

    xOffset += p.larguraPx;
  }
}
