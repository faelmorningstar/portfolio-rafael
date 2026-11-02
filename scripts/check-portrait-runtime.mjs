import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Executa o efeito real para testar seu ciclo de interação. Não substitui QA visual.
const require = createRequire(import.meta.url);
const compile = path => ts.transpile(fs.readFileSync(path, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX });
const helpers = { exports: {} }; vm.runInNewContext(compile('lib/portfolio-motion.ts'), helpers);
for (const mode of ['interactive', 'reduced', 'touch']) {
  const effects = [], observers = [], images = [], canvases = [], frames = new Map();
  let frameId = 0, time = 0, refIndex = 0;
  class Target {
    constructor() { this.listeners = new Map(); this.attributes = new Map(); this.classes = new Set(); this.classList = { add: name => this.classes.add(name), remove: name => this.classes.delete(name) }; }
    addEventListener(name, listener) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(listener); }
    removeEventListener(name, listener) { this.listeners.get(name)?.delete(listener); }
    emit(name, event) { for (const listener of this.listeners.get(name) ?? []) listener(event); }
    setAttribute(name, value) { this.attributes.set(name, value); }
    removeAttribute(name) { this.attributes.delete(name); }
    getBoundingClientRect() { return { left: 0, top: 0, width: 500, height: 500 }; }
    get clientWidth() { return 500; }
  }
  class Canvas extends Target {
    constructor() {
      super(); canvases.push(this);
      this.context = {
        draws: [], holes: [], reads: 0,
        clearRect() { this.draws = []; this.holes = []; },
        drawImage(...args) { this.draws.push(args); },
        fillRect(...args) { this.holes.push(args); },
        getImageData(_x, _y, width, height) {
          this.reads++; const data = new Uint8ClampedArray(width * height * 4);
          for (let i = 0; i < data.length; i += 4) data.set([120, 125, 130, 255], i);
          return { data };
        },
        setTransform() {}, putImageData() {}, beginPath() {}, arc() {}, fill() {},
      };
    }
    getContext() { return this.context; }
  }
  class Observer { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} disconnect() { this.disconnected = true; } }
  class Image { constructor() { this.naturalWidth = 32; this.naturalHeight = 32; images.push(this); } }
  const stage = new Target(), foreground = new Canvas(), base = new Canvas(), rings = [new Target(), new Target(), new Target()];
  const refs = [stage, foreground, base, ...rings];
  const document = new Target(); document.hidden = false; document.createElement = () => new Canvas();
  const window = new Target();
  const react = { useRef: () => ({ current: refs[refIndex++] }), useEffect: effect => effects.push(effect), useSyncExternalStore: () => mode === 'reduced' };
  const context = {
    exports: {}, require: name => name === 'react' ? react : name.includes('portfolio-motion') ? helpers.exports : require(name),
    Image, document, window, IntersectionObserver: Observer, ResizeObserver: Observer, devicePixelRatio: 1,
    matchMedia: () => ({ matches: mode !== 'touch' }),
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; }, cancelAnimationFrame: id => frames.delete(id),
  };
  vm.runInNewContext(compile('app/portfolio-effects.tsx'), context);
  context.exports.HybridPortrait(); const cleanup = effects[0](); images[0].onload();
  const intersections = visible => { for (const observer of observers) if (observer !== observers[1]) observer.callback([{ isIntersecting: visible }]); };
  // O segundo observador é de redimensionamento; os demais controlam visibilidade.
  intersections(true);
  const drain = () => {
    let iterations = 0;
    while (frames.size && iterations++ < 1000) { const pending = [...frames.values()]; frames.clear(); time += 16.7; for (const callback of pending) callback(time); }
    assert.equal(frames.size, 0, 'O loop termina em repouso');
  };
  drain(); assert.ok(stage.classes.has('effect-ready')); assert.equal(foreground.context.draws.length, 0);
  const reads = () => canvases.reduce((sum, canvas) => sum + canvas.context.reads, 0);
  const preparedReads = reads();
  const move = x => stage.emit('pointermove', { pointerType: 'mouse', clientX: x, clientY: 250, timeStamp: time });
  move(390); drain();
  if (mode === 'interactive') {
    assert.ok(foreground.context.draws.length > 0); assert.ok(base.context.holes.length > 0, 'A base é ocultada sob os fragmentos');
    const displacement = () => Math.max(...foreground.context.draws.map(args => Math.hypot(args[5] - (80 + args[1] / args[0].width * 340), args[6] - (80 + args[2] / args[0].height * 340))));
    const dragon = displacement();
    stage.emit('pointerleave'); drain();
    assert.equal(foreground.context.draws.length, 0); assert.equal(base.context.holes.length, 0, 'Retorno recompõe a base integral');
    move(110); drain(); const human = displacement(); assert.ok(dragon > human * 3, 'Dispersão humana significativamente menor');
    move(390); intersections(false); assert.equal(frames.size, 0, 'Pausa fora da tela');
    intersections(true); drain();
    move(390); document.hidden = true; document.emit('visibilitychange'); assert.equal(frames.size, 0, 'Pausa com aba oculta');
    document.hidden = false; document.emit('visibilitychange'); drain();
    assert.equal(foreground.context.draws.length, 0);
  } else assert.equal(foreground.context.draws.length, 0, 'Composição estática com redução de movimento ou sem hover');
  assert.equal(reads(), preparedReads, 'Nenhuma leitura de pixels durante os quadros');
  cleanup(); assert.equal(frames.size, 0); assert.ok(!stage.classes.has('effect-ready'));
  assert.ok(observers.every(observer => observer.disconnected));
  assert.ok([...stage.listeners.values(), ...document.listeners.values(), ...window.listeners.values()].every(listeners => !listeners.size));
}
console.log('PASSOU: dispersão/retorno reais do efeito, base sem duplicação, força por lado, pausa, descarte, pixels só na preparação e alternativas estáticas.');
