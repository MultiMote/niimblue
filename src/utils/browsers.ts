/** Check if browser makes some modifications to canvas when reading */
export const detectAntiFingerprinting = () => {
  const size = 32;
  const color = [0, 127, 255, 255];

  const canvas = document.createElement("canvas");
  canvas.height = size;
  canvas.width = size;

  const ctx = canvas.getContext("2d");

  if (ctx === null) return false;

  ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  for (let i = 0; i < data.length; i += 1) {
    if (data[i] !== color[i % 4]) {
      canvas.remove();
      return true;
    }
  }

  canvas.remove();
  return false;
};
