"use client";

import { useEffect, useRef } from "react";

export function useTrajectoryReveal() {
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !window.IntersectionObserver || !Element.prototype.animate) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)"), mobile = matchMedia("(max-width: 900px)");
    const setup = () => {
      const elements = Array.from(section.querySelectorAll<HTMLElement>("[data-reveal]"));
      if (reduced.matches) return () => {};
      const animations = new Map<HTMLElement, Animation>(), visible = new Map<Element, boolean>();
      const pending = new Set(elements.filter(element => element.dataset.revealComplete !== "true"));
      const sync = () => animations.forEach((animation, element) => {
        if (document.hidden || !visible.get(element)) animation.pause(); else animation.play();
      });
      const start = (element: HTMLElement) => {
        if (!pending.delete(element)) return;
        // A transformação pertence ao invólucro, nunca ao canvas interativo.
        try {
          const ring = element.dataset.reveal === "rings";
          const animation = element.animate([
            { opacity: 0, transform: `translateY(24px)${ring ? " scale(.97)" : ""}` },
            { opacity: 1, transform: "translateY(0) scale(1)" },
          ], { duration: 560, delay: mobile.matches ? 0 : Number(element.dataset.revealOrder) * 110, easing: "cubic-bezier(.2,.65,.3,1)", fill: "both" });
          element.dataset.revealComplete = "true";
          animations.set(element, animation);
          animation.onfinish = () => { element.classList.remove("reveal-pending"); animations.delete(element); animation.cancel(); };
          sync();
        } catch { element.classList.remove("reveal-pending"); }
      };
      let groupStarted = false;
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) visible.set(entry.target, entry.isIntersecting);
        if (!mobile.matches && !groupStarted && visible.get(section)) {
          groupStarted = true; elements.forEach(start);
        }
        if (mobile.matches) for (const entry of entries) if (entry.isIntersecting && entry.target !== section) start(entry.target as HTMLElement);
        sync();
      }, { threshold: .08, rootMargin: "0px 0px -4% 0px" });
      // Sem JS, redução de movimento ou suporte às APIs, o conteúdo fica visível.
      pending.forEach(element => element.classList.add("reveal-pending"));
      observer.observe(section); elements.forEach(element => observer.observe(element));
      document.addEventListener("visibilitychange", sync);
      return () => {
        observer.disconnect(); document.removeEventListener("visibilitychange", sync);
        animations.forEach(animation => { animation.onfinish = null; animation.cancel(); });
        elements.forEach(element => element.classList.remove("reveal-pending"));
      };
    };
    let dispose = setup();
    const configure = () => { dispose(); dispose = setup(); };
    reduced.addEventListener("change", configure); mobile.addEventListener("change", configure);
    return () => { dispose(); reduced.removeEventListener("change", configure); mobile.removeEventListener("change", configure); };
  }, []);
  return sectionRef;
}
