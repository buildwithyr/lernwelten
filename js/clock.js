/**
 * clock.js
 * Wiederverwendbare Analoguhr-Komponente ("Uhr lesen", Klasse 2).
 * Reines Markup (keine Interaktivität) — gibt einen HTML-String zurück,
 * der wie jeder andere Aufgaben-Baustein in questionHtml eingebettet wird.
 */

const Clock = (() => {
  // Erzeugt Ziffernblatt + Zeiger für eine feste Uhrzeit (hour: 1-12, minute: 0-59).
  function render(hour, minute, opts = {}) {
    const size = opts.size || 140;
    const showNumbers = opts.showNumbers !== false;
    const faceColor = opts.faceColor || '#fff';
    const borderColor = opts.borderColor || 'var(--g2-accent)';
    const borderWidth = opts.borderWidth || 5;
    const tickColor = opts.tickColor || 'var(--text-mid)';
    const numColor = opts.numColor || 'var(--text-dark)';
    const hourColor = opts.hourColor || 'var(--g2-accent-dark)';
    const minuteColor = opts.minuteColor || 'var(--g2-accent)';
    const centerColor = opts.centerColor || 'var(--g2-accent-dark)';

    const cx = size / 2,
      cy = size / 2;
    const hourAngle = (hour % 12) * 30 + minute * 0.5;
    const minuteAngle = minute * 6;

    let numbersHtml = '';
    if (showNumbers) {
      for (let n = 1; n <= 12; n++) {
        const rad = (n * 30 * Math.PI) / 180;
        const r = size * 0.36;
        const x = cx + r * Math.sin(rad);
        const y = cy - r * Math.cos(rad);
        numbersHtml += `<span style="position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);font-family:var(--font-heading);font-weight:800;font-size:${Math.round(size * 0.115)}px;color:${numColor};">${n}</span>`;
      }
    }

    let ticksHtml = '';
    for (let n = 0; n < 12; n++) {
      const rad = (n * 30 * Math.PI) / 180;
      const r = size * 0.445;
      const x = cx + r * Math.sin(rad);
      const y = cy - r * Math.cos(rad);
      const isMajor = n % 3 === 0;
      const w = isMajor ? 3 : 2;
      const h = isMajor ? size * 0.07 : size * 0.045;
      ticksHtml += `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${tickColor};border-radius:2px;transform:translate(-50%,-50%) rotate(${n * 30}deg);"></div>`;
    }

    const hl = size * 0.3,
      hw = Math.max(3, size * 0.045);
    const ml = size * 0.42,
      mw = Math.max(2.5, size * 0.032);
    const dotSize = Math.max(8, size * 0.07);

    return `
      <div class="clock-face-wrap" style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${faceColor};border:${borderWidth}px solid ${borderColor};box-shadow:0 4px 14px rgba(0,0,0,0.12);flex-shrink:0;margin:0 auto;">
        ${numbersHtml}
        ${ticksHtml}
        <div style="position:absolute;left:50%;top:50%;width:${hw}px;height:${hl}px;background:${hourColor};border-radius:${hw}px;transform-origin:50% 100%;transform:translate(-50%,-100%) rotate(${hourAngle}deg);"></div>
        <div style="position:absolute;left:50%;top:50%;width:${mw}px;height:${ml}px;background:${minuteColor};border-radius:${mw}px;transform-origin:50% 100%;transform:translate(-50%,-100%) rotate(${minuteAngle}deg);"></div>
        <div style="position:absolute;left:50%;top:50%;width:${dotSize}px;height:${dotSize}px;background:${centerColor};border-radius:50%;transform:translate(-50%,-50%);border:2px solid ${faceColor};"></div>
      </div>
    `;
  }

  return { render };
})();
