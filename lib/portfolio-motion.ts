// Diferença angular contínua, inclusive ao atravessar -π/+π.
export function angleDelta(next: number, previous: number) {
  return Math.atan2(Math.sin(next - previous), Math.cos(next - previous));
}

export function createAngularMotion(inertia = .94) {
  let previous: number | null = null, lastTime = 0, velocity = 0, rotation = 0;
  let reflectedAngle = 0, targetAngle = 0, light = 0, inside = false;
  return {
    move(x: number, y: number, time: number) {
      if (Math.hypot(x, y) < .12) { previous = null; return; }
      const next = Math.atan2(y, x);
      if (previous !== null) {
        const difference = angleDelta(next, previous);
        const interval = Math.max(8, Math.min(80, time - lastTime));
        velocity = Math.max(-3, Math.min(3, velocity * .4 + difference * 180 / Math.PI * 16.7 / interval * .3));
      }
      targetAngle = reflectedAngle + angleDelta(next, reflectedAngle * Math.PI / 180) * 180 / Math.PI;
      previous = next; lastTime = time; inside = true;
    },
    leave() { inside = false; previous = null; },
    step(delta: number) {
      const frames = delta / 16.7, ease = 1 - Math.pow(.8, frames);
      velocity *= Math.pow(inertia, frames);
      if (Math.abs(velocity) < .001) velocity = 0;
      rotation += velocity * frames;
      reflectedAngle += (targetAngle - reflectedAngle) * ease;
      const targetLight = inside ? .85 : 0;
      light += (targetLight - light) * ease;
      if (Math.abs(light - targetLight) < .001) light = targetLight;
      if (Math.abs(targetAngle - reflectedAngle) < .01) reflectedAngle = targetAngle;
      return {
        outer: rotation * .82, inner: rotation * .64, symbols: rotation,
        reflection: reflectedAngle, light,
        moving: velocity !== 0 || reflectedAngle !== targetAngle || light !== targetLight,
      };
    },
  };
}

// Somente o preto quase puro conectado às bordas vira transparência.
// RGB e áreas escuras isoladas são preservados; não há limiar global no retrato.
export function clearEdgeBackground(input: Uint8ClampedArray, width: number, height: number) {
  const data = new Uint8ClampedArray(input), seen = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0, tail = 0;
  const visit = (pixel: number) => {
    if (seen[pixel]) return;
    seen[pixel] = 1;
    const i = pixel * 4, max = Math.max(data[i], data[i + 1], data[i + 2]);
    if (data[i + 3] && (max > 3 || max - Math.min(data[i], data[i + 1], data[i + 2]) > 2)) return;
    queue[tail++] = pixel;
  };
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  while (head < tail) {
    const pixel = queue[head++], x = pixel % width, y = Math.floor(pixel / width);
    data[pixel * 4 + 3] = 0;
    if (x) visit(pixel - 1); if (x < width - 1) visit(pixel + 1);
    if (y) visit(pixel - width); if (y < height - 1) visit(pixel + width);
  }
  return data;
}
