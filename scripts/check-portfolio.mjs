import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// Exercita o agendador real sem navegador, com visibilidade e quadros controlados.
const source = fs.readFileSync('app/portfolio-effects.tsx', 'utf8');
const start = source.indexOf('function animationDriver(');
const end = source.indexOf('// Símbolos', start);
assert.ok(start >= 0 && end > start);
const compiled = ts.transpile(source.slice(start, end), { target: ts.ScriptTarget.ES2022 });
let now = 0, next = 0, observer, disconnected = false;
const frames = new Map(), events = new Map(), attributes = new Map();
const doc = { hidden: false, addEventListener: (name, cb) => events.set(name, cb), removeEventListener: name => events.delete(name) };
const element = { setAttribute: (name, value) => attributes.set(name, value), removeAttribute: name => attributes.delete(name) };
const context = vm.createContext({ document: doc, requestAnimationFrame: cb => { frames.set(++next, cb); return next; }, cancelAnimationFrame: id => frames.delete(id), IntersectionObserver: class { constructor(cb) { observer = cb; } observe() {} disconnect() { disconnected = true; } } });
vm.runInContext(compiled + '\nglobalThis.makeDriver = animationDriver;', context);
let calls = 0, keepRunning = true;
const driver = context.makeDriver(element, (_time, delta) => { calls++; assert.ok(delta <= 40); return keepRunning; });
function advance() { const pending = [...frames.values()]; frames.clear(); now += 1000; for (const cb of pending) cb(now); }
driver.wake(); assert.equal(frames.size, 0, 'Não agenda antes de entrar na tela');
observer([{ isIntersecting: true }]); advance(); assert.equal(calls, 1); assert.equal(frames.size, 1);
observer([{ isIntersecting: false }]); assert.equal(frames.size, 0); advance(); assert.equal(calls, 1);
observer([{ isIntersecting: true }]); advance(); assert.equal(calls, 2);
doc.hidden = true; events.get('visibilitychange')(); assert.equal(frames.size, 0); driver.wake(); assert.equal(frames.size, 0);
doc.hidden = false; events.get('visibilitychange')(); keepRunning = false; advance(); assert.equal(calls, 3); assert.equal(frames.size, 0, 'Encerra em repouso');
driver.wake(); advance(); assert.equal(calls, 4, 'Retoma por interação');
driver.dispose(); driver.wake(); assert.equal(frames.size, 0); assert.equal(events.size, 0); assert.ok(disconnected);

// Exercita a mesma física usada na hero e no contato, sem giro autônomo.
const motionCode = ts.transpile(fs.readFileSync('lib/portfolio-motion.ts', 'utf8'), { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS });
const motionContext = { exports: {} };
vm.runInNewContext(motionCode, motionContext);
const { createAngularMotion, clearEdgeBackground } = motionContext.exports;
assert.equal(createAngularMotion().step(16.7).moving, false);
for (const direction of [-1, 1]) {
 const motion = createAngularMotion();
 const previous = direction * (Math.PI - .01), next = -direction * (Math.PI - .01);
 motion.move(Math.cos(previous), Math.sin(previous), 10);
 motion.step(16.7);
 motion.move(Math.cos(next), Math.sin(next), 26.7);
 const state = motion.step(16.7);
 assert.equal(Math.sign(state.symbols), direction);
 assert.ok(Math.abs(state.symbols) < 2, 'Sem salto ao atravessar a emenda angular');
 assert.ok(Math.abs(state.outer) < Math.abs(state.symbols));
 assert.ok(Math.abs(state.inner) < Math.abs(state.outer));
 motion.leave();
 let stopped;
 for (let i = 0; i < 500; i++) stopped = motion.step(16.7);
 assert.equal(stopped.moving, false); assert.equal(stopped.light, 0);
 assert.equal(motion.step(16.7).symbols, stopped.symbols, 'Para completamente após a inércia');
}
// O fundo conectado à borda some; preto interno e tons dos caracteres continuam intactos.
const raw = new Uint8ClampedArray(5 * 5 * 4);
for (let i = 0; i < 25; i++) raw[i * 4 + 3] = 255;
for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) if (x !== 2 || y !== 2) raw.set([120, 125, 130, 255], (y * 5 + x) * 4);
const clean = clearEdgeBackground(raw, 5, 5);
assert.equal(clean[3], 0); assert.equal(raw[3], 255, 'Não altera o buffer original');
assert.equal(clean[(2 * 5 + 2) * 4 + 3], 255, 'Preserva o preto isolado dentro do desenho');
for (let i = 0; i < raw.length; i++) if (i % 4 !== 3) assert.equal(clean[i], raw[i], 'Preserva todos os canais RGB');
// Baselines dos assets aprovados; o teste também funciona sem a pasta local de referências.
for (const [asset, expectedHash] of [
 ['public/dragon-approved.png', '73e5563fdc910ec196b82e726f9514367b4d0d7909254f1b0683c494093b66c4'],
 ['public/hybrid-portrait-approved.png', '93a51fcb19ec256d780d4dd5ac4f37046746a82091e467df51e2e4aefe5d5232'],
]) {
 const hash = path => createHash('sha256').update(fs.readFileSync(path)).digest('hex');
 assert.equal(hash(asset), expectedHash, asset);
}
console.log('PASSOU: pausa/retomada, descarte, inércia sem giro automático, continuidade angular, velocidades distintas, término do reflexo, preservação de tons e integridade dos assets.');
