export function equalSpacingFillText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  printWidth: number
) {
  // calculate every character width, and spacing
  const widths = [];
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    const metrics = ctx.measureText(char);
    widths.push(metrics.width);
  }
  const totalWidth = widths.reduce((a, b) => a + b, 0);
  const spacing = (printWidth - totalWidth) / (text.length - 1);

  // print every character with calculated spacing
  let offset = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    ctx.fillText(char, x + offset, y);
    offset += widths[i] + spacing;
  }
}
