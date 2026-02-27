"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Phase = "closed" | "opening" | "cake";

type Confetti = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rot: number;
  vrot: number;
  life: number;
  h: number;
};

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
};

function playChime() {
  type WebkitWindow = Window &
    typeof globalThis & { webkitAudioContext?: typeof AudioContext };

  const AudioCtx =
    window.AudioContext || (window as WebkitWindow).webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const master = ctx.createGain();
  master.gain.value = 0.08;
  master.connect(ctx.destination);

  const now = ctx.currentTime;

  const notes = [
    { f: 392.0, t: 0.00, d: 0.14 }, // G4
    { f: 392.0, t: 0.18, d: 0.14 },
    { f: 440.0, t: 0.36, d: 0.18 }, // A4
    { f: 392.0, t: 0.58, d: 0.18 },
    { f: 523.25, t: 0.80, d: 0.22 }, // C5
    { f: 493.88, t: 1.06, d: 0.30 }  // B4
  ];

  notes.forEach((n) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = "sine";
    o.frequency.setValueAtTime(n.f, now + n.t);

    g.gain.setValueAtTime(0.0001, now + n.t);
    g.gain.exponentialRampToValueAtTime(1.0, now + n.t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);

    o.connect(g);
    g.connect(master);

    o.start(now + n.t);
    o.stop(now + n.t + n.d + 0.02);
  });

  setTimeout(() => ctx.close?.(), 2200);
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const confettiRef = useRef<Confetti[]>([]);
  const sparkRef = useRef<Spark[]>([]);

  const [phase, setPhase] = useState<Phase>("closed");

  const text = useMemo(
    () => ({
      headline: "Хайрт минь, төрсөн өдрийн мэнд хүргэе! 💖",
      sub: "Чамдаа хамгийн сайхан бүхнийг хүсье. Өнөөдөр бол чиний өдөр ✨",
      open: "OPEN 🎁",
      noteTitle: "Чамд зориулсан бэлэг ✨",
      noteBody:
        "Аз жаргал, инээд, эрүүл энх, хүсэл мөрөөдлийн чинь биелэл бүгдийг бэлэглэе 💛"
    }),
    []
  );

  // Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);

      // confetti
      const c = confettiRef.current;
      for (let i = c.length - 1; i >= 0; i--) {
        const p = c[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.09;
        p.rot += p.vrot;
        p.life -= 0.012;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = `hsl(${p.h}, 92%, 62%)`;
        ctx.fillRect(-p.r, -p.r * 0.6, p.r * 2.2, p.r * 1.2);
        ctx.restore();

        if (p.life <= 0 || p.y > H + 90) c.splice(i, 1);
      }

      // sparks (stream + glitter)
      const s = sparkRef.current;
      for (let i = s.length - 1; i >= 0; i--) {
        const sp = s[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.015;
        sp.life -= 0.024;

        ctx.save();
        ctx.globalAlpha = Math.max(0, sp.life);
        ctx.fillStyle = `rgba(255,245,210,${Math.max(0, sp.life)})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (sp.life <= 0) s.splice(i, 1);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  const burstConfetti = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const cx = W / 2;
    const cy = Math.min(H * 0.33, 300);

    const count = 170;
    const parts: Confetti[] = [];
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.65;
      const sp = 2.2 + Math.random() * 5.4;
      parts.push({
        x: cx + (Math.random() - 0.5) * 18,
        y: cy + (Math.random() - 0.5) * 18,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 2.6,
        r: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.25,
        life: 1,
        h: Math.floor(Math.random() * 360)
      });
    }
    confettiRef.current.push(...parts);
  };

  // ✨ Particles stream from gift mouth while opening
  const streamFromGift = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    // Gift is centered visually; mouth position approx:
    const mx = W / 2;
    const my = Math.min(H * 0.50, 520) - 120; // slightly above gift center

    const count = 70;
    const sparks: Spark[] = [];
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 1.2;
      const up = 2.4 + Math.random() * 2.8;
      sparks.push({
        x: mx + (Math.random() - 0.5) * 20,
        y: my + (Math.random() - 0.5) * 10,
        vx: spread * (0.9 + Math.random() * 1.2),
        vy: -up - Math.random() * 1.8,
        r: 1.2 + Math.random() * 2.4,
        life: 1
      });
    }
    sparkRef.current.push(...sparks);
  };

  const onOpen = () => {
    if (phase !== "closed") return;

    setPhase("opening");
    playChime();

    // opening: sparkle stream + a little confetti
    streamFromGift();
    setTimeout(streamFromGift, 120);
    setTimeout(streamFromGift, 240);
    setTimeout(streamFromGift, 360);

    burstConfetti();
    setTimeout(burstConfetti, 220);

    // after lid opens + box vanishes -> show cake
    setTimeout(() => {
      setPhase("cake");
      burstConfetti();
      setTimeout(burstConfetti, 240);
    }, 980);
  };

  return (
    <main className="wrap">
      <canvas ref={canvasRef} className="fx" aria-hidden />

      <div className="card">
        {/* Text appears WITH cake */}
        <div className={`hero ${phase === "cake" ? "show" : ""}`}>
          <h1 className="title">{text.headline}</h1>
          <p className="sub">{text.sub}</p>
        </div>

        <section className="center">
          <div
            className={`gift ${phase === "opening" ? "opening" : ""} ${
              phase === "cake" ? "gone" : ""
            }`}
            aria-label="gift box"
          >
            <div className="giftShadow" />
            <div className="lid">
              <div className="bow">
                <div className="loop l1" />
                <div className="loop l2" />
                <div className="knot" />
              </div>
            </div>
            <div className="box">
              <div className="ribbonV" />
              <div className="ribbonH" />
            </div>
            <div className={`sparkle ${phase !== "closed" ? "spark" : ""}`} aria-hidden />
          </div>

          {/* Cinematic cake rise + glow */}
          <div className={`cakeWrap ${phase === "cake" ? "show" : ""}`} aria-label="birthday cake">
            <div className="cakeGlow" aria-hidden />
            <div className="cake">
              <div className="plate" />
              <div className="shadow" />

              <div className="tier t1">
                <div className="icing" />
                <div className="drip d1" />
                <div className="drip d2" />
                <div className="drip d3" />
                <div className="sprinkles" />
              </div>

              <div className="tier t2">
                <div className="icing" />
                <div className="sprinkles" />
              </div>

              <div className="candles">
                <div className="candle">
                  <div className="flame" />
                </div>
                <div className="candle tall">
                  <div className="flame" />
                </div>
                <div className="candle">
                  <div className="flame" />
                </div>
              </div>

              <div className="shine" />
              <div className="shimmer" aria-hidden />
            </div>
          </div>

          {/* OPEN button disappears after cake shows */}
          {phase !== "cake" && (
            <button className="openBtn" onClick={onOpen}>
              {text.open}
            </button>
          )}

          {phase === "cake" && (
            <div className="note" role="status">
              <div className="noteTitle">{text.noteTitle}</div>
              <div className="noteBody">{text.noteBody}</div>
            </div>
          )}
        </section>

        <div className="footer">Made with ❤️</div>
      </div>

      <style jsx>{`
        :global(body){
          margin:0;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
          background:
            radial-gradient(1000px 600px at 20% 10%, rgba(255,77,141,0.26), transparent 55%),
            radial-gradient(900px 560px at 80% 25%, rgba(124,58,237,0.22), transparent 58%),
            radial-gradient(800px 560px at 50% 95%, rgba(255,207,90,0.18), transparent 60%),
            linear-gradient(180deg, #0b1020, #1a1030);
          color: rgba(255,255,255,0.92);
          overflow-x:hidden;
        }

        .wrap{
          min-height:100vh;
          display:grid;
          place-items:center;
          padding:28px 16px;
          position:relative;
        }
        .fx{
          position:fixed;
          inset:0;
          width:100%;
          height:100%;
          pointer-events:none;
          z-index:1;
        }
        .card{
          width:min(760px, 100%);
          z-index:2;
          position:relative;
          border-radius:26px;
          padding:22px 20px 18px;
          background: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.10));
          border:1px solid rgba(255,255,255,0.22);
          box-shadow: 0 28px 110px rgba(0,0,0,0.55);
          backdrop-filter: blur(10px);
          overflow:hidden;
        }

        /* Hero text appears with cake */
        .hero{
          text-align:left;
          opacity:0;
          transform: translateY(10px);
          transition: opacity 420ms ease, transform 420ms ease;
          margin-bottom: 6px;
          pointer-events:none;
          height: 0;
          overflow: hidden;
        }
        .hero.show{
          opacity:1;
          transform: translateY(0px);
          pointer-events:auto;
          height: auto;
          overflow: visible;
          margin-bottom: 10px;
        }
        .title{ margin:0; font-size:28px; letter-spacing:-0.02em; }
        .sub{ margin:8px 0 0; color: rgba(255,255,255,0.74); line-height:1.55; }

        .center{
          margin-top: 14px;
          display:grid;
          place-items:center;
          gap: 14px;
          padding-bottom: 6px;
        }

        /* Gift box */
        .gift{
          width: 160px;
          height: 160px;
          position:relative;
          display:grid;
          place-items:center;
          transform: translateY(2px);
        }
        .giftShadow{
          position:absolute;
          bottom: 8px;
          left:50%;
          width: 120px;
          height: 26px;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(0,0,0,0.42), transparent 70%);
          filter: blur(8px);
        }
        .box{
          width: 130px;
          height: 96px;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(255,207,90,0.95), rgba(255,122,168,0.82));
          border:1px solid rgba(255,255,255,0.18);
          box-shadow: 0 18px 50px rgba(0,0,0,0.35);
          position:absolute;
          bottom: 18px;
          overflow:hidden;
        }
        .ribbonV{
          position:absolute;
          left:50%;
          top:0;
          width: 16px;
          height: 100%;
          transform: translateX(-50%);
          background: linear-gradient(180deg, rgba(255,77,141,0.95), rgba(124,58,237,0.85));
        }
        .ribbonH{
          position:absolute;
          left:0;
          top: 42px;
          width: 100%;
          height: 16px;
          background: linear-gradient(90deg, rgba(255,77,141,0.95), rgba(124,58,237,0.85));
        }
        .lid{
          width: 140px;
          height: 46px;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.10));
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 18px 45px rgba(0,0,0,0.28);
          position:absolute;
          bottom: 104px;
          transform-origin: 22px 44px;
          transform: rotate(0deg) translateY(0);
        }

        .bow{ position:absolute; left:50%; top:-10px; transform: translateX(-50%); width: 66px; height: 44px; }
        .loop{
          position:absolute;
          width: 32px; height: 24px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(255,77,141,0.95), rgba(124,58,237,0.90));
          box-shadow: 0 12px 24px rgba(0,0,0,0.22);
          border:1px solid rgba(255,255,255,0.14);
        }
        .l1{ left: 0; transform: rotate(-18deg); }
        .l2{ right: 0; transform: rotate(18deg); }
        .knot{
          position:absolute;
          left:50%; top: 14px;
          width: 14px; height: 14px;
          transform: translateX(-50%);
          border-radius: 6px;
          background: rgba(255,255,255,0.28);
          border: 1px solid rgba(255,255,255,0.16);
        }

        .sparkle{
          position:absolute;
          left:50%;
          bottom: 118px;
          width: 130px; height: 130px;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(255,255,255,0.45), transparent 60%);
          opacity:0;
          pointer-events:none;
        }
        .sparkle.spark{ animation: sparkle 900ms ease-out 160ms both; }
        @keyframes sparkle{
          0%{ opacity:0; transform: translateX(-50%) scale(0.7); }
          40%{ opacity:0.7; }
          100%{ opacity:0; transform: translateX(-50%) scale(1.35); }
        }

        /* Open flow */
        .gift.opening .lid{ animation: lidOpen 780ms cubic-bezier(.2,.9,.2,1) both; }
        @keyframes lidOpen{
          0%{ transform: rotate(0deg) translateY(0); }
          60%{ transform: rotate(-26deg) translate(-10px, -10px); }
          100%{ transform: rotate(-42deg) translate(-18px, -18px); }
        }

        .gift.gone{ animation: vanish 380ms ease-out both; }
        @keyframes vanish{
          from{ opacity:1; transform: translateY(2px) scale(1); }
          to{ opacity:0; transform: translateY(10px) scale(0.85); }
        }

        /* Cinematic cake reveal */
        .cakeWrap{
          width: 320px;
          height: 270px;
          display:grid;
          place-items:center;
          opacity:0;
          transform: translateY(30px) scale(0.92);
          pointer-events:none;
          margin-top: -6px;
          position:relative;
        }
        .cakeWrap.show{
          opacity:1;
          pointer-events:auto;
          animation: cinematicRise 1100ms cubic-bezier(.16,.98,.2,1) both;
        }

        /* Bounce + overshoot + settle */
        @keyframes cinematicRise{
          0%{ opacity:0; transform: translateY(40px) scale(0.88); filter: blur(2px); }
          55%{ opacity:1; transform: translateY(-14px) scale(1.06); filter: blur(0px); }
          78%{ opacity:1; transform: translateY(6px) scale(0.99); }
          100%{ opacity:1; transform: translateY(0px) scale(1); }
        }

        .cakeGlow{
          position:absolute;
          inset: 10px 40px 30px 40px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255,207,90,0.25), rgba(255,77,141,0.18), transparent 65%);
          opacity:0;
          filter: blur(6px);
          pointer-events:none;
        }
        .cakeWrap.show .cakeGlow{
          animation: glowPulse 1300ms ease-out 120ms both;
        }
        @keyframes glowPulse{
          0%{ opacity:0; transform: scale(0.85); }
          45%{ opacity:1; transform: scale(1.05); }
          100%{ opacity:0.75; transform: scale(1); }
        }

        /* Cake visuals */
        .cake{
          width:280px;
          height:240px;
          position:relative;
        }
        .plate{
          position:absolute;
          left:50%;
          bottom:18px;
          width:280px;
          height:54px;
          transform:translateX(-50%);
          border-radius:999px;
          background: linear-gradient(#f6f7fb, #dde2f5);
          box-shadow: inset 0 -12px 18px rgba(0,0,0,0.08),
                      0 22px 40px rgba(0,0,0,0.35);
        }
        .shadow{
          position:absolute;
          left:50%;
          bottom:40px;
          width:190px;
          height:24px;
          transform:translateX(-50%);
          background: radial-gradient(circle, rgba(0,0,0,0.35), transparent 70%);
          filter: blur(6px);
        }
        .tier{
          position:absolute;
          left:50%;
          transform:translateX(-50%);
          border-radius:18px;
          overflow:hidden;
          box-shadow: 0 22px 70px rgba(0,0,0,0.30);
          background: linear-gradient(180deg, rgba(255,122,168,0.95), rgba(255,77,141,0.88));
          border:1px solid rgba(255,255,255,0.16);
        }
        .t1{ bottom:56px; width:210px; height:112px; }
        .t2{ bottom:140px; width:150px; height:76px; background: linear-gradient(180deg, rgba(255,207,90,0.85), rgba(255,122,168,0.75)); }

        .icing{
          position:absolute;
          left:0; top:0;
          width:100%;
          height:36px;
          background: linear-gradient(#fff, rgba(255,255,255,0.78));
          border-radius:18px 18px 14px 14px;
          box-shadow: inset 0 -10px 14px rgba(0,0,0,0.06);
        }
        .drip{
          position:absolute;
          top:24px;
          width:22px;
          background: linear-gradient(#fff, rgba(255,255,255,0.82));
          border-radius:999px;
          filter: drop-shadow(0 10px 10px rgba(0,0,0,0.12));
        }
        .d1{ left:26px; height:34px; }
        .d2{ left:86px; height:48px; }
        .d3{ left:146px; height:38px; }

        .sprinkles{
          position:absolute;
          inset:10px 12px auto 12px;
          height:60px;
          opacity:0.95;
          background:
            radial-gradient(circle at 12% 40%, #ff4d6d 3px, transparent 4px),
            radial-gradient(circle at 24% 68%, #7c3aed 3px, transparent 4px),
            radial-gradient(circle at 46% 44%, #22c55e 3px, transparent 4px),
            radial-gradient(circle at 64% 64%, #f59e0b 3px, transparent 4px),
            radial-gradient(circle at 84% 46%, #06b6d4 3px, transparent 4px),
            radial-gradient(circle at 36% 78%, #ffd166 3px, transparent 4px);
          pointer-events:none;
        }

        .candles{
          position:absolute;
          left:50%;
          bottom:188px;
          transform:translateX(-50%);
          display:flex;
          gap:16px;
          align-items:flex-end;
        }
        .candle{
          width:14px;height:44px;
          border-radius:8px;
          background: repeating-linear-gradient(90deg, #ffffff, #ffffff 4px, #ff4d6d 4px, #ff4d6d 8px);
          box-shadow: 0 12px 18px rgba(0,0,0,0.22);
          position:relative;
        }
        .candle.tall{ height:52px; }
        .flame{
          position:absolute;
          left:50%;
          top:-18px;
          width:16px;height:22px;
          transform:translateX(-50%);
          border-radius:999px;
          background: radial-gradient(circle at 35% 40%, #fff7b0, #ffb703 60%, #fb5607 100%);
          filter: drop-shadow(0 16px 22px rgba(255,183,3,0.40));
          opacity:0;
        }
        .shine{
          position:absolute;
          left:50%;
          bottom:90px;
          width:140px;height:140px;
          transform:translateX(-50%);
          background: radial-gradient(circle, rgba(255,255,255,0.55), transparent 60%);
          opacity:0;
          pointer-events:none;
        }

        /* shimmer sweep across cake */
        .shimmer{
          position:absolute;
          left:-40%;
          top: 60px;
          width: 60%;
          height: 120px;
          transform: rotate(18deg);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          opacity:0;
          pointer-events:none;
        }
        .cakeWrap.show .shimmer{
          animation: shimmer 900ms ease-out 260ms both;
        }
        @keyframes shimmer{
          0%{ opacity:0; transform: translateX(0) rotate(18deg); }
          30%{ opacity:1; }
          100%{ opacity:0; transform: translateX(220%) rotate(18deg); }
        }

        /* When cake shows, light flames & shine */
        .cakeWrap.show .flame{
          opacity:1;
          animation: flameIn 260ms ease-out 260ms both, flicker 1.1s ease-in-out 620ms infinite;
        }
        .cakeWrap.show .candles .candle{ animation: wiggle 900ms ease-in-out 300ms both; }
        .cakeWrap.show .shine{ animation: shine 950ms ease-out 300ms both; }

        @keyframes flameIn{
          from{ transform:translateX(-50%) scale(0.6); opacity:0; }
          to{ transform:translateX(-50%) scale(1); opacity:1; }
        }
        @keyframes flicker{
          0%{ transform:translateX(-50%) scale(1) rotate(-2deg); }
          50%{ transform:translateX(-50%) scale(0.92) rotate(2deg); }
          100%{ transform:translateX(-50%) scale(1) rotate(-2deg); }
        }
        @keyframes wiggle{
          0%{ transform: rotate(0); }
          35%{ transform: rotate(-2deg); }
          65%{ transform: rotate(2deg); }
          100%{ transform: rotate(0); }
        }
        @keyframes shine{
          0%{ opacity:0; transform:translateX(-50%) scale(0.7); }
          40%{ opacity:0.70; }
          100%{ opacity:0; transform:translateX(-50%) scale(1.35); }
        }

        .openBtn{
          width:min(360px, 100%);
          border:0;
          cursor:pointer;
          padding: 12px 14px;
          border-radius: 16px;
          color:#fff;
          font-weight:900;
          font-size:15px;
          background: linear-gradient(135deg, rgba(255,77,141,0.95), rgba(124,58,237,0.95));
          box-shadow: 0 22px 70px rgba(124,58,237,0.28);
          border:1px solid rgba(255,255,255,0.18);
          transition: transform 120ms ease, filter 120ms ease;
        }
        .openBtn:hover{ transform: translateY(-1px); filter: brightness(1.02); }
        .openBtn:active{ transform: translateY(0px) scale(0.99); }

        .note{
          width:min(520px, 100%);
          padding: 14px 14px;
          border-radius: 18px;
          background: rgba(255,255,255,0.10);
          border:1px solid rgba(255,255,255,0.20);
          box-shadow: 0 26px 80px rgba(0,0,0,0.35);
          backdrop-filter: blur(8px);
          animation: noteIn 520ms ease-out both;
          text-align:left;
        }
        @keyframes noteIn{
          from{ opacity:0; transform: translateY(10px); }
          to{ opacity:1; transform: translateY(0); }
        }
        .noteTitle{ font-weight:900; margin-bottom:6px; }
        .noteBody{ color: rgba(255,255,255,0.74); line-height:1.55; }

        .footer{
          margin-top: 12px;
          text-align:center;
          font-size:12px;
          color: rgba(255,255,255,0.60);
        }
      `}</style>
    </main>
  );
}