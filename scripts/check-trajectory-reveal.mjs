import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';

// Executa o hook real com observadores e animações controlados, sem simular scroll nativo.
const code = ts.transpile(fs.readFileSync('app/use-trajectory-reveal.ts', 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
for (const mode of ['desktop', 'mobile', 'reduced', 'unsupported']) {
  const effects = [], observers = [], events = new Map();
  class Element {
    constructor(order, kind) { this.dataset = { revealOrder: String(order), reveal: kind }; this.classes = new Set(); this.classList = { add: name => this.classes.add(name), remove: name => this.classes.delete(name) }; this.animations = []; }
    animate(keyframes, options) {
      const animation = { keyframes, options, paused: false, pause() { this.paused = true; }, play() { this.paused = false; }, cancel() { this.cancelled = true; } };
      this.animations.push(animation); return animation;
    }
  }
  if (mode === 'unsupported') Element.prototype.animate = undefined;
  const elements = ['copy', 'rings', 'phrase', 'copy'].map((kind, order) => new Element(order, kind));
  const section = { querySelectorAll: () => elements };
  const media = query => ({ matches: query.includes('reduced') ? mode === 'reduced' : mode === 'mobile', addEventListener() {}, removeEventListener() {} });
  class Observer { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} disconnect() { this.disconnected = true; } }
  const document = { hidden: false, addEventListener: (name, callback) => events.set(name, callback), removeEventListener: name => events.delete(name) };
  const context = { exports: {}, require: () => ({ useRef: () => ({ current: section }), useEffect: effect => effects.push(effect) }), Element, IntersectionObserver: Observer, window: { IntersectionObserver: Observer }, document, matchMedia: media };
  vm.runInNewContext(code, context);
  context.exports.useTrajectoryReveal();
  const cleanup = effects[0]();
  if (mode === 'reduced' || mode === 'unsupported') {
    assert.ok(elements.every(element => !element.classes.size && !element.animations.length)); cleanup?.(); continue;
  }
  const observer = observers[0];
  const emit = entries => observer.callback(entries.map(([target, isIntersecting]) => ({ target, isIntersecting })));
  emit([[section, true]]);
  if (mode === 'desktop') {
    assert.deepEqual(elements.map(element => element.animations[0].options.delay), [0, 110, 220, 330]);
    assert.ok(elements.every(element => element.animations[0].paused));
    emit(elements.map(element => [element, true]));
  } else {
    assert.ok(elements.every(element => !element.animations.length));
    emit([[elements[0], true]]);
    assert.equal(elements[0].animations.length, 1); assert.equal(elements[1].animations.length, 0);
    emit(elements.slice(1).map(element => [element, true]));
    assert.ok(elements.every(element => element.animations[0].options.delay === 0));
  }
  assert.ok(elements.every(element => element.animations[0].options.duration === 560 && !element.animations[0].paused));
  document.hidden = true; events.get('visibilitychange')(); assert.ok(elements.every(element => element.animations[0].paused));
  document.hidden = false; events.get('visibilitychange')(); assert.ok(elements.every(element => !element.animations[0].paused));
  emit([[elements[3], false]]); assert.equal(elements[3].animations[0].paused, true);
  for (const element of elements) element.animations[0].onfinish();
  emit(elements.map(element => [element, true]));
  assert.ok(elements.every(element => element.animations.length === 1 && !element.classes.size), 'Revela apenas uma vez');
  cleanup(); assert.ok(observer.disconnected); assert.equal(events.size, 0);
}
console.log('PASSOU: sequência desktop, entrada individual mobile, pausa por visibilidade, revelação única, redução de movimento e alternativa sem APIs.');
