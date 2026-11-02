"use client";

/* As imagens são preservadas; os efeitos movimentam recortes, nunca refazem o rosto. */
/* eslint-disable @next/next/no-img-element -- Imagens locais e canvases compartilham os mesmos arquivos originais. */
import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { clearEdgeBackground, createAngularMotion } from "../lib/portfolio-motion";

export const EFFECT_SETTINGS = {
  // Imagem aprovada preservada; null desativa a entrada e exibe a foto diretamente.
  dragonSrc: "/dragon-approved.png" as string | null,
  introDuration: 3400,
  humanDispersion: 9,
  dragonDispersion: 56,
  interactionRadius: 0.22,
  ringInertia: 0.94,
};

function subscribeMotion(callback: () => void) {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function useReducedMotion() {
  return useSyncExternalStore(subscribeMotion, () => matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
}

// Um único agendador pausa fora da tela/aba e só reinicia quando há trabalho.
function animationDriver(element: Element, render: (time: number, delta: number) => boolean) {
  let frame = 0, visible = false, previous = 0, disposed = false;
  const tick = (time: number) => {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    const delta = previous ? Math.min(time - previous, 40) : 16.7;
    previous = time;
    if (render(time, delta)) wake();
  };
  const wake = () => {
    if (!disposed && visible && !document.hidden && !frame) {
      element.setAttribute("data-animation-paused", "false");
      frame = requestAnimationFrame(tick);
    }
  };
  const pause = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; element.setAttribute("data-animation-paused", "true"); };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake(); else pause();
  });
  observer.observe(element);
  const visibility = () => { if (document.hidden) pause(); else wake(); };
  document.addEventListener("visibilitychange", visibility);
  return { wake, dispose() { disposed = true; pause(); element.removeAttribute("data-animation-paused"); observer.disconnect(); document.removeEventListener("visibilitychange", visibility); } };
}

// Símbolos desenhados em SVG: não dependem de glifos especiais da Alchemion.
const SYMBOLS = ["Ar", "Fogo", "Terra", "Água", "Enxofre", "Mercúrio", "Sal", "Ouro", "Prata"];
function Symbol({ index }: { index: number }) {
  if (index < 4) return <><path d={index === 0 || index === 1 ? "M0 -8 L8 7 H-8 Z" : "M0 8 L8 -7 H-8 Z"} />{(index === 0 || index === 2) && <path d="M-7 0 H7" />}</>;
  if (index === 4) return <><path d="M0 -9 L7 2 H-7 Z M0 2 V11 M-5 7 H5" /></>;
  if (index === 5) return <><circle cy="-1" r="5" /><path d="M-5 -10 Q0 -3 5 -10 M0 4 V12 M-4 9 H4" /></>;
  if (index === 6) return <><circle r="8" /><path d="M-8 0 H8" /></>;
  if (index === 7) return <><circle r="8" /><circle r="1.5" fill="currentColor" /></>;
  return <path d="M4 -8 A9 9 0 1 0 4 8 A9 9 0 0 1 4 -8 Z" />;
}
type RingRefs = {
  groupRef?: RefObject<SVGGElement | null>;
  outerRef?: RefObject<SVGGElement | null>;
  innerRef?: RefObject<SVGGElement | null>;
  reflectionRef?: RefObject<SVGGElement | null>;
};
export function AlchemyRings({ groupRef, outerRef, innerRef, reflectionRef }: RingRefs) {
  return <svg className="alchemy-rings" viewBox="0 0 500 500" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth=".8">
    <g ref={outerRef}><circle cx="250" cy="250" r="243" opacity=".3" /><circle cx="250" cy="250" r="232" opacity=".8" />
      {Array.from({ length: 60 }, (_, i) => {
        const angle = i / 60 * Math.PI * 2;
        return <path key={i} opacity={i % 5 ? ".25" : ".7"} d={`M${250 + Math.cos(angle) * 236} ${250 + Math.sin(angle) * 236} L${250 + Math.cos(angle) * (i % 5 ? 239 : 243)} ${250 + Math.sin(angle) * (i % 5 ? 239 : 243)}`} />;
      })}
    </g>
    <g ref={innerRef}><circle cx="250" cy="250" r="202" opacity=".4" /><circle cx="250" cy="250" r="202" strokeDasharray="13 410 7 839" opacity=".6" /></g>
    <g ref={groupRef}>{SYMBOLS.map((name, index) => {
      const angle = index / SYMBOLS.length * Math.PI * 2 - Math.PI / 2;
      return <g key={name} transform={`translate(${250 + Math.cos(angle) * 217} ${250 + Math.sin(angle) * 217})`} strokeWidth="1.1"><title>{name}</title><Symbol index={index} /></g>;
    })}</g>
    {reflectionRef && <g ref={reflectionRef} opacity="0" stroke="#fff" strokeLinecap="round"><path d="M478.48 209.71 A232 232 0 0 1 478.48 290.29" strokeWidth="1.8" /><path d="M488.53 207.94 A242.2 242.2 0 0 1 488.53 292.06" strokeWidth=".6" opacity=".5" /></g>}
  </svg>;
}

export function HeroRings({ stageRef, enabled }: { stageRef: RefObject<HTMLDivElement | null>; enabled: boolean }) {
  const groupRef = useRef<SVGGElement>(null), outerRef = useRef<SVGGElement>(null), innerRef = useRef<SVGGElement>(null), reflectionRef = useRef<SVGGElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const stage = stageRef.current, symbols = groupRef.current, outer = outerRef.current, inner = innerRef.current, reflection = reflectionRef.current;
    if (!stage || !enabled || reduced || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const motion = createAngularMotion(EFFECT_SETTINGS.ringInertia);
    const driver = animationDriver(stage, (_, delta) => {
      const state = motion.step(delta);
      symbols?.setAttribute("transform", `rotate(${state.symbols} 250 250)`);
      outer?.setAttribute("transform", `rotate(${state.outer} 250 250)`);
      inner?.setAttribute("transform", `rotate(${state.inner} 250 250)`);
      reflection?.setAttribute("transform", `rotate(${state.reflection} 250 250)`);
      reflection?.setAttribute("opacity", String(state.light));
      return state.moving;
    });
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = stage.getBoundingClientRect();
      motion.move((event.clientX - rect.left - rect.width / 2) / rect.width, (event.clientY - rect.top - rect.height / 2) / rect.height, event.timeStamp);
      driver.wake();
    };
    const leave = () => { motion.leave(); driver.wake(); };
    const visibility = () => { if (document.hidden) leave(); };
    const offscreen = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) leave(); }); offscreen.observe(stage);
    stage.addEventListener("pointermove", move, { passive: true }); stage.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave); document.addEventListener("visibilitychange", visibility);
    return () => {
      driver.dispose(); offscreen.disconnect(); stage.removeEventListener("pointermove", move); stage.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave); document.removeEventListener("visibilitychange", visibility);
      for (const node of [symbols, outer, inner, reflection]) node?.removeAttribute("transform");
      reflection?.setAttribute("opacity", "0");
    };
  }, [enabled, reduced, stageRef]);
  return <AlchemyRings groupRef={groupRef} outerRef={outerRef} innerRef={innerRef} reflectionRef={reflectionRef} />;
}

export function AnimatedEyeCursor() {
  const cursor = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const node = cursor.current;
    if (!node || !matchMedia("(pointer: fine)").matches) return;
    let ready = false, failed = false, selected = false, elapsed = 0;
    const images = Array.from({ length: 3 }, (_, i) => { const image = new Image(); image.src = `/cursors/eye-${i}.png`; return image; });
    Promise.all(images.map(image => image.decode())).then(() => { if (!failed) ready = true; }).catch(() => { failed = true; });
    const hide = () => { selected = false; node.classList.remove("is-visible"); document.body.classList.remove("eye-ready"); };
    const driver = animationDriver(document.documentElement, (_, delta) => {
      if (!selected || !ready) return false;
      elapsed += delta;
      const img = node.firstElementChild as HTMLImageElement;
      img.src = images[reduced ? 0 : Math.floor(elapsed / 130) % 3].src;
      return !reduced;
    });
    const move = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      selected = ready && event.pointerType === "mouse" && !!target?.closest("p,h1,h2,h3") && !target?.closest("a,button");
      node.style.transform = `translate3d(${event.clientX + 7}px,${event.clientY + 7}px,0)`;
      node.classList.toggle("is-visible", selected);
      document.body.classList.toggle("eye-ready", selected);
      if (selected) driver.wake();
    };
    const visibility = () => { if (document.hidden) hide(); };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", hide);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", hide);
    return () => { failed = true; hide(); driver.dispose(); window.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", hide); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("blur", hide); };
  }, [reduced]);
  return <div className="eye-cursor" ref={cursor} aria-hidden="true"><img src="/cursors/eye-0.png" alt="" /></div>;
}

export function CodeRain({ active }: { active: boolean }) {
  // A camada pertence à hero; o círculo recorta somente o canvas da transformação.
  return <div className={`code-rain ${active ? "is-active" : ""}`} aria-hidden="true">{Array.from({ length: 26 }, (_, i) =>
    <span key={i} style={{ left: `${(i * 37) % 101}%`, animationDelay: `${-((i * .19) % 1.8)}s`, animationDuration: `${1.25 + ((i * 13) % 9) / 10}s` }}>{Array.from({ length: 10 }, (_, j) => (i + j * 3) % 4 ? "0" : "1").join("\n")}</span>
  )}</div>;
}

export function IntroPortrait({ onPlayingChange, onFinishedChange }: { onPlayingChange: (playing: boolean) => void; onFinishedChange: (finished: boolean) => void }) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [skipped, setSkipped] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d");
    const source = EFFECT_SETTINGS.dragonSrc;
    // Sem o asset aprovado, a foto final fica disponível; nenhum dragão substituto é criado.
    // Aguarda a preferência real na hidratação; não habilita os anéis antes da entrada.
    if (reduced !== matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!canvas || !ctx || !source || reduced || skipped) { onPlayingChange(false); onFinishedChange(true); return; }
    onFinishedChange(false);
    let disposed = false, elapsed = 0;
    const dragon = new Image(), photo = new Image();
    let driver: ReturnType<typeof animationDriver> | undefined;
    dragon.src = source; photo.src = "/rafael.png";
    Promise.all([dragon.decode(), photo.decode()]).then(() => {
      if (disposed) return;
      const mobile = matchMedia("(max-width: 650px)").matches;
      const size = mobile ? 600 : 900;
      canvas.width = size; canvas.height = size;
      const base = document.createElement("canvas"); base.width = size; base.height = size;
      const baseCtx = base.getContext("2d"); if (!baseCtx) { onFinishedChange(true); return; }
      // Margem permite mostrar asas, chifres e cauda por inteiro dentro do círculo.
      const scale = Math.min(size / dragon.width, size / dragon.height) * .9;
      baseCtx.drawImage(dragon, (size - dragon.width * scale) / 2, (size - dragon.height * scale) / 2, dragon.width * scale, dragon.height * scale);
      // Os pixels são lidos somente na preparação da sequência.
      const data = baseCtx.getImageData(0, 0, size, size).data;
      const particles: { x: number; y: number; seed: number }[] = [];
      const photoBase = document.createElement("canvas"); photoBase.width = size; photoBase.height = size;
      const photoCtx = photoBase.getContext("2d"); if (!photoCtx) { onFinishedChange(true); return; }
      photoCtx.drawImage(photo, 0, 0, size, size);
      const photoPixels = photoCtx.getImageData(0, 0, size, size).data;
      const destinations: { x: number; y: number }[] = [];
      const step = mobile ? 14 : 12;
      for (let y = 0; y < size; y += step) for (let x = 0; x < size; x += step) {
        const i = (y * size + x) * 4;
        if (data[i + 3] > 30 && data[i] + data[i + 1] + data[i + 2] > 150) particles.push({ x, y, seed: ((x * 13 + y * 7) % 101) / 101 });
        if (photoPixels[i] + photoPixels[i + 1] + photoPixels[i + 2] > 180) destinations.push({ x, y });
      }
      ctx.drawImage(base, 0, 0);
      setPlaying(true);
      onPlayingChange(true);
      driver = animationDriver(canvas, (_, delta) => {
        elapsed += delta;
        const progress = elapsed / EFFECT_SETTINGS.introDuration;
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = "#07080a"; ctx.fillRect(0, 0, size, size);
        const dissolve = Math.max(0, Math.min(1, (progress - .2) / .34));
        // Máscara em faixas pequenas: o desenho se desfaz por regiões, sem crossfade integral.
        if (progress < .2) ctx.drawImage(base, 0, 0);
        else if (dissolve < 1) for (let y = 0; y < size; y += 10) for (let x = 0; x < size; x += 10) {
          const threshold = ((x * 17 + y * 11) % 103) / 103;
          if (threshold >= dissolve) ctx.drawImage(base, x, y, 10, 10, x, y, 10, 10);
        }
        const formation = Math.max(0, Math.min(1, (progress - .6) / .4));
        if (formation > 0) {
          ctx.save(); ctx.beginPath();
          for (let y = 0; y < size; y += 10) for (let x = 0; x < size; x += 10) if (((x * 17 + y * 11) % 103) / 103 < formation) ctx.rect(x, y, 10, 10);
          ctx.clip(); ctx.drawImage(photo, 0, 0, photo.width, photo.height, 0, 0, size, size); ctx.restore();
        }
        if (progress > .2 && progress < 1) {
          ctx.font = "11px ui-monospace,monospace"; ctx.fillStyle = "#e5e8ee";
          for (let index = 0; index < particles.length; index++) {
            const p = particles[index];
            if (p.seed > dissolve || p.seed < formation) continue;
            const flight = Math.sin(Math.min(1, (progress - .2) / .8) * Math.PI);
            const destination = destinations[(index * 37) % destinations.length] ?? p;
            const gather = Math.max(0, Math.min(1, (progress - .46) / .36));
            const drift = flight * (1 - gather);
            const x = p.x * (1 - gather) + destination.x * gather + Math.sin(p.seed * 60) * 90 * drift;
            const y = p.y * (1 - gather) + destination.y * gather + Math.cos(p.seed * 39) * 150 * drift;
            ctx.fillText(p.seed > .5 ? "0" : "1", x, y);
          }
        }
        if (progress >= 1) { setPlaying(false); onPlayingChange(false); onFinishedChange(true); return false; }
        return true;
      });
    }).catch(() => { if (!disposed) { setPlaying(false); onPlayingChange(false); onFinishedChange(true); } });
    return () => { disposed = true; driver?.dispose(); onPlayingChange(false); onFinishedChange(false); };
  }, [reduced, skipped, onPlayingChange, onFinishedChange]);
  return <><div className="identity-circle">
    <img className="portrait" src="/rafael.png" alt="Retrato de Rafael Amaral Silva" width="460" height="460" fetchPriority="high" />
    <canvas className="intro-canvas" ref={canvasRef} hidden={!playing || reduced || skipped} aria-hidden="true" />
  </div>{playing && !reduced && !skipped && <button className="skip-intro" onClick={() => { setSkipped(true); setPlaying(false); onPlayingChange(false); onFinishedChange(true); document.querySelector<HTMLAnchorElement>(".hero-actions a")?.focus({ preventScroll: true }); }}>Pular animação</button>}</>;
}

export function MagicRings() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d"); if (!canvas || !ctx) return;
    let width = 0, height = 0, clock = 0, interaction = 0;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, inside: false };
    const driver = animationDriver(canvas, (_, delta) => {
      clock += reduced ? 0 : delta;
      interaction += ((pointer.inside ? 1 : 0) - interaction) * .07;
      pointer.x += (pointer.targetX - pointer.x) * .07; pointer.y += (pointer.targetY - pointer.y) * .07;
      ctx.clearRect(0, 0, width, height);
      for (let ring = 0; ring < 7; ring++) {
        const radius = Math.min(width, height) * (.18 + ring * .047);
        ctx.beginPath();
        for (let i = 0; i <= 180; i++) {
          const angle = i / 180 * Math.PI * 2;
          const proximity = interaction * Math.max(0, 1 - Math.hypot(Math.cos(angle) * radius - pointer.x, Math.sin(angle) * radius - pointer.y) / (width * .42));
          const wave = reduced ? 0 : Math.sin(angle * 4 + clock * .0011 + ring) * (1.5 + proximity * 12);
          const x = width / 2 + Math.cos(angle) * (radius + wave), y = height / 2 + Math.sin(angle) * (radius + wave);
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.strokeStyle = ring % 2 ? "rgba(211,220,232,.35)" : "rgba(250,252,255,.8)";
        ctx.lineWidth = ring % 3 === 0 ? 1.1 : .65; ctx.stroke();
        for (let star = 0; star < 3; star++) {
          const angle = ring * 1.83 + star * 2.1 + clock * .00006 * (ring % 2 ? 1 : -1);
          const wave = reduced ? 0 : Math.sin(angle * 4 + clock * .0011 + ring) * 1.5;
          ctx.beginPath(); ctx.arc(width / 2 + Math.cos(angle) * (radius + wave), height / 2 + Math.sin(angle) * (radius + wave), star ? .8 : 1.4, 0, Math.PI * 2); ctx.fillStyle = "#f5f8ff"; ctx.fill();
        }
      }
      return !reduced && (pointer.inside || interaction > .001 || Math.hypot(pointer.targetX - pointer.x, pointer.targetY - pointer.y) > .15);
    });
    const resize = new ResizeObserver(() => {
      width = canvas.clientWidth; height = canvas.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, width < 400 ? 1.5 : 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); driver.wake();
    }); resize.observe(canvas);
    const move = (event: PointerEvent) => {
      if (reduced || event.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect(); pointer.targetX = event.clientX - rect.left - width / 2; pointer.targetY = event.clientY - rect.top - height / 2; pointer.inside = true; driver.wake();
    };
    const leave = () => { pointer.inside = false; pointer.targetX = 0; pointer.targetY = 0; driver.wake(); };
    canvas.addEventListener("pointermove", move, { passive: true }); canvas.addEventListener("pointerleave", leave);
    return () => { driver.dispose(); resize.disconnect(); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerleave", leave); };
  }, [reduced]);
  return <canvas className="magic-rings" ref={canvasRef} aria-hidden="true" />;
}

type Fragment = { sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; homeX: number; homeY: number; width: number; height: number; light: number };
export function HybridPortrait() {
  const stageRef = useRef<HTMLDivElement>(null), canvasRef = useRef<HTMLCanvasElement>(null), baseRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<SVGGElement>(null), outerRef = useRef<SVGGElement>(null), innerRef = useRef<SVGGElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const stage = stageRef.current, canvas = canvasRef.current, baseCanvas = baseRef.current;
    const ctx = canvas?.getContext("2d"), baseCtx = baseCanvas?.getContext("2d");
    const symbols = ringRef.current, outer = outerRef.current, inner = innerRef.current;
    if (!stage || !canvas || !ctx || !baseCanvas || !baseCtx) return;
    const interactive = !reduced && matchMedia("(hover: hover) and (pointer: fine)").matches;
    let disposed = false, loaded = false, size = 0, tiles: Fragment[] = [];
    const pointer = { x: -9999, y: -9999, inside: false };
    const image = new Image(), source = document.createElement("canvas");
    const motion = createAngularMotion(EFFECT_SETTINGS.ringInertia);
    const driver = animationDriver(stage, (_, delta) => {
      if (!loaded || !size) return false;
      const factor = 1 - Math.pow(.8, delta / 16.7);
      let moving = false;
      ctx.clearRect(0, 0, size, size);
      baseCtx.clearRect(0, 0, size * .76, size * .76);
      // Margem de 4% dentro da máscara preserva chifres e rosto sem esticar a imagem.
      baseCtx.drawImage(source, size * .04, size * .04, size * .68, size * .68);
      for (const tile of tiles) {
        const dx = tile.homeX + tile.width / 2 - pointer.x, dy = tile.homeY + tile.height / 2 - pointer.y;
        const distance = Math.hypot(dx, dy), radius = size * EFFECT_SETTINGS.interactionRadius;
        const proximity = pointer.inside ? Math.max(0, 1 - distance / radius) : 0;
        const strength = (tile.sx < source.width / 2 ? EFFECT_SETTINGS.humanDispersion : EFFECT_SETTINGS.dragonDispersion) * size / 500;
        const force = proximity * proximity * strength * Math.min(1, tile.light * 6);
        const targetX = dx / Math.max(distance, 1) * force, targetY = dy / Math.max(distance, 1) * force;
        const unsettled = Math.abs(targetX - tile.dx) + Math.abs(targetY - tile.dy) > .025;
        tile.dx = unsettled ? tile.dx + (targetX - tile.dx) * factor : targetX;
        tile.dy = unsettled ? tile.dy + (targetY - tile.dy) * factor : targetY;
        if (unsettled) moving = true;
        if (Math.abs(tile.dx) + Math.abs(tile.dy) < .05 && !proximity) { tile.dx = 0; tile.dy = 0; }
      }
      // A base perde a mesma contribuição que aparece no fragmento: não fica intacta por baixo.
      baseCtx.globalCompositeOperation = "destination-out";
      for (const tile of tiles) if (tile.dx || tile.dy) {
        const opacity = Math.min(1, Math.hypot(tile.dx, tile.dy) / .8);
        baseCtx.fillStyle = `rgba(0,0,0,${opacity})`;
        baseCtx.fillRect(tile.homeX - size * .12, tile.homeY - size * .12, tile.width, tile.height);
      }
      baseCtx.globalCompositeOperation = "source-over";
      // Esta camada está fora da máscara e recebe apenas os recortes deslocados.
      for (const tile of tiles) if (tile.dx || tile.dy) {
        ctx.globalAlpha = Math.min(1, Math.hypot(tile.dx, tile.dy) / .8);
        ctx.drawImage(source, tile.sx, tile.sy, tile.sw, tile.sh, tile.homeX + tile.dx, tile.homeY + tile.dy, tile.width, tile.height);
      }
      ctx.globalAlpha = 1;
      const angular = motion.step(delta);
      symbols?.setAttribute("transform", `rotate(${angular.symbols} 250 250)`);
      outer?.setAttribute("transform", `rotate(${angular.outer} 250 250)`);
      inner?.setAttribute("transform", `rotate(${angular.inner} 250 250)`);
      stage.classList.add("effect-ready");
      return moving || angular.moving;
    });
    const prepare = () => {
      if (!loaded || disposed) return;
      size = stage.clientWidth;
      const dpr = Math.min(devicePixelRatio || 1, size < 400 ? 1.5 : 2);
      canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      baseCanvas.width = Math.round(size * .76 * dpr); baseCanvas.height = Math.round(size * .76 * dpr); baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const columns = size < 400 ? 30 : 48;
      const sample = document.createElement("canvas"); sample.width = columns; sample.height = columns;
      const sampleCtx = sample.getContext("2d", { willReadFrequently: true }); if (!sampleCtx) return;
      sampleCtx.drawImage(source, 0, 0, columns, columns);
      const pixels = sampleCtx.getImageData(0, 0, columns, columns).data;
      tiles = [];
      for (let y = 0; y < columns; y++) for (let x = 0; x < columns; x++) {
        const i = (y * columns + x) * 4, width = size * .68 / columns;
        tiles.push({ sx: x * source.width / columns, sy: y * source.height / columns, sw: source.width / columns, sh: source.height / columns, homeX: size * .16 + x * width, homeY: size * .16 + y * width, width, height: width, dx: 0, dy: 0, light: (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 765 * pixels[i + 3] / 255 });
      }
      driver.wake();
    };
    image.onload = () => {
      if (disposed) return;
      try {
        // Preparação única em resolução nativa; os pixels não são lidos durante a dispersão.
        source.width = source.height = Math.max(image.naturalWidth, image.naturalHeight);
        const sourceCtx = source.getContext("2d", { willReadFrequently: true }); if (!sourceCtx) return;
        sourceCtx.drawImage(image, (source.width - image.naturalWidth) / 2, (source.height - image.naturalHeight) / 2);
        const original = sourceCtx.getImageData(0, 0, source.width, source.height);
        original.data.set(clearEdgeBackground(original.data, source.width, source.height));
        sourceCtx.putImageData(original, 0, 0);
        // Os fragmentos nascem somente da área que aparece no recorte original.
        sourceCtx.globalCompositeOperation = "destination-in";
        sourceCtx.beginPath(); sourceCtx.arc(source.width / 2, source.height / 2, source.width * .38 / .68, 0, Math.PI * 2); sourceCtx.fill();
        sourceCtx.globalCompositeOperation = "source-over";
        loaded = true; prepare();
      } catch { stage.classList.remove("effect-ready"); }
    };
    image.onerror = () => { stage.classList.remove("effect-ready"); };
    image.src = "/hybrid-portrait-approved.png";
    const resize = new ResizeObserver(prepare); resize.observe(stage);
    const move = (event: PointerEvent) => {
      if (!interactive || event.pointerType !== "mouse" || !loaded) return;
      const rect = stage.getBoundingClientRect(); pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; pointer.inside = true;
      motion.move((pointer.x - size / 2) / size, (pointer.y - size / 2) / size, event.timeStamp);
      driver.wake();
    };
    const leave = () => { pointer.inside = false; motion.leave(); driver.wake(); };
    const visibility = () => { if (document.hidden) leave(); };
    const offscreen = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) leave(); }); offscreen.observe(stage);
    stage.addEventListener("pointermove", move, { passive: true }); stage.addEventListener("pointerleave", leave); window.addEventListener("blur", leave); document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true; driver.dispose(); resize.disconnect(); offscreen.disconnect(); stage.classList.remove("effect-ready");
      stage.removeEventListener("pointermove", move); stage.removeEventListener("pointerleave", leave); window.removeEventListener("blur", leave); document.removeEventListener("visibilitychange", visibility);
      image.onload = null; image.onerror = null;
      for (const ring of [symbols, outer, inner]) ring?.removeAttribute("transform");
    };
  }, [reduced]);
  return <div className="hybrid-stage" ref={stageRef}>
    <AlchemyRings groupRef={ringRef} outerRef={outerRef} innerRef={innerRef} />
    <div className="hybrid-base-mask">
      <img className="hybrid-base" src="/hybrid-portrait-approved.png" width="1280" height="1280" alt="Retrato em código prateado: metade Rafael e metade dragão" loading="lazy" />
      <canvas ref={baseRef} className="hybrid-base-canvas" aria-hidden="true" />
    </div>
    <canvas ref={canvasRef} className="hybrid-canvas" aria-hidden="true" />
  </div>;
}
