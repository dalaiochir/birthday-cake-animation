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

// 🔧 Polaroid зургууд: public/photos/ доторх filename-уудтайгаа тааруулж солиорой
const PHOTOS: { src: string; caption: string }[] = [
  { src: "/photos/1.png", caption: "2024.06 — Анхны уулзалт ✨" },
  { src: "/photos/2.png", caption: "2024.09 — Хамтдаа инээсэн өдөр 💖" },
  { src: "/photos/3.png", caption: "2025.01 — Хамгийн дулаахан мөч 🫶" }
];

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
    { f: 392.0, t: 0.00, d: 0.14 },
    { f: 392.0, t: 0.18, d: 0.14 },
    { f: 440.0, t: 0.36, d: 0.18 },
    { f: 392.0, t: 0.58, d: 0.18 },
    { f: 523.25, t: 0.80, d: 0.22 },
    { f: 493.88, t: 1.06, d: 0.30 }
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

  // Mic refs
  const micStreamRef = useRef<MediaStream | null>(null);
  const micRafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micEnabledRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("closed");
  const [candleLit, setCandleLit] = useState(true);
  const [letterReady, setLetterReady] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [micOn, setMicOn] = useState(false);

  const [photoIndex, setPhotoIndex] = useState(0);

  const text = useMemo(
    () => ({
      headline: "Хайрт минь, төрсөн өдрийн мэнд хүргэе! 💖",
      sub: "Чамдаа хамгийн сайхан бүхнийг хүсье. Өнөөдөр бол чиний өдөр ✨",
      openGift: "OPEN 🎁",
      wish: "Хүслээ шивнээд Лаагаа үлээгээрэй",
      hint: "Mic acaaх дээр дараад хүслээ шивнээд mic-рүүгээ үлээгээрэй😮‍💨",
      mic: "🎤 Mic асаах",
      micOff: "🎤 Mic унтраах",
      letterBtn: "💌 Захиа нээх",
      noteTitle: "Чамд зориулсан захиа 💖",
      letterBody:
        "Хайрт минь…\n\nЧи миний өдөр бүрийн хамгийн гоё шалтгаан.\nИнээмсэглэл чинь миний хамгийн дуртай гэрэл.\nӨнөөдөр, маргааш, үргэлж би чиний талд байна.\n\nТөрсөн өдрийн мэнд! ✨\n— Чиний хүн 💛"
    }),
    []
  );

  // Polaroid slideshow timer (only when cake stage)
  useEffect(() => {
    if (phase !== "cake") return;
    if (!PHOTOS.length) return;

    const t = setInterval(() => {
      setPhotoIndex((i) => (i + 1) % PHOTOS.length);
    }, 2600);

    return () => clearInterval(t);
  }, [phase]);

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

      // sparks
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

  const burstConfetti = (strength = 1) => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const cx = W / 2;
    const cy = Math.min(H * 0.33, 300);

    const count = Math.floor(170 * strength);
    const parts: Confetti[] = [];
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.65;
      const sp = (2.2 + Math.random() * 5.4) * (0.9 + strength * 0.35);
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

  // ✨ stream from gift mouth while opening
  const streamFromGift = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const mx = W / 2;
    const my = Math.min(H * 0.50, 520) - 120;

    const count = 80;
    const sparks: Spark[] = [];
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 1.25;
      const up = 2.6 + Math.random() * 3.1;
      sparks.push({
        x: mx + (Math.random() - 0.5) * 22,
        y: my + (Math.random() - 0.5) * 12,
        vx: spread * (0.9 + Math.random() * 1.2),
        vy: -up - Math.random() * 1.8,
        r: 1.2 + Math.random() * 2.6,
        life: 1
      });
    }
    sparkRef.current.push(...sparks);
  };

  const onOpenGift = () => {
    if (phase !== "closed") return;

    setPhase("opening");
    playChime();

    streamFromGift();
    setTimeout(streamFromGift, 120);
    setTimeout(streamFromGift, 240);
    setTimeout(streamFromGift, 360);

    burstConfetti(0.85);
    setTimeout(() => burstConfetti(0.75), 220);

    setTimeout(() => {
      setPhase("cake");
      setCandleLit(true);
      setLetterReady(false);
      setLetterOpen(false);
      setTyped("");
      burstConfetti(1.0);
      setTimeout(() => burstConfetti(0.9), 240);
    }, 980);
  };

  // Space to blow
  useEffect(() => {
    if (phase !== "cake") return;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        blowOut("space");
      }
    };

    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, candleLit]);

  const blowOut = (source: "click" | "space" | "mic") => {
    if (phase !== "cake") return;
    if (!candleLit) return;

    setCandleLit(false);
    setLetterReady(true);

    // small cinematic burst on blow
    burstConfetti(1.25);
    setTimeout(() => burstConfetti(0.9), 180);

    // extra spark burst near candle mouth
    streamFromGift();

    // optional: stop mic after success
    if (source === "mic") {
      stopMic();
    }
  };

  // Typewriter effect
  useEffect(() => {
    if (!letterOpen) return;

    const full = text.letterBody;
    setTyped("");

    let i = 0;
    const t = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) clearInterval(t);
    }, 18);

    return () => clearInterval(t);
  }, [letterOpen, text.letterBody]);

  // Mic (blow detect)
  const startMic = async () => {
    if (micEnabledRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      micStreamRef.current = stream;

      // create AudioContext for analyser
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;
      src.connect(analyser);
      analyserRef.current = analyser;

      micEnabledRef.current = true;
      setMicOn(true);

      const data = new Uint8Array(analyser.frequencyBinCount);

      let overCount = 0;
      const loop = () => {
        if (!analyserRef.current || phase !== "cake" || !candleLit) {
          micRafRef.current = requestAnimationFrame(loop);
          return;
        }

        analyserRef.current.getByteTimeDomainData(data);

        // rough loudness metric (RMS)
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);

        // threshold for "blow" (adjustable)
        if (rms > 0.18) overCount++;
        else overCount = Math.max(0, overCount - 1);

        // require sustained loudness briefly (avoid random click)
        if (overCount > 6) {
          overCount = 0;
          blowOut("mic");
        }

        micRafRef.current = requestAnimationFrame(loop);
      };

      micRafRef.current = requestAnimationFrame(loop);
    } catch {
      // user denied or no mic; we just keep click/space
      setMicOn(false);
      micEnabledRef.current = false;
    }
  };

  const stopMic = () => {
    if (micRafRef.current) cancelAnimationFrame(micRafRef.current);
    micRafRef.current = null;

    analyserRef.current = null;

    if (audioCtxRef.current) {
      audioCtxRef.current.close?.();
      audioCtxRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    micEnabledRef.current = false;
    setMicOn(false);
  };

  // Clean up mic on unmount
  useEffect(() => {
    return () => stopMic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="wrap">
      <canvas ref={canvasRef} className="fx" aria-hidden />

      <div className="card">
        {/* Text shows with cake */}
        <div className={`hero ${phase === "cake" ? "show" : ""}`}>
          <h1 className="title">{text.headline}</h1>
          <p className="sub">{text.sub}</p>
        </div>

        <section className="center">
          {/* Gift */}
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

          {/* Cake + cinematic glow */}
          <div className={`cakeWrap ${phase === "cake" ? "show" : ""}`}>
            <div className="cakeGlow" aria-hidden />
            <div
              className={`cake ${!candleLit ? "blown" : ""}`}
              aria-label="birthday cake"
              onClick={() => blowOut("click")}
              role="button"
              tabIndex={0}
            >
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
                  <div className="smoke" />
                </div>
                <div className="candle tall">
                  <div className="flame" />
                  <div className="smoke" />
                </div>
                <div className="candle">
                  <div className="flame" />
                  <div className="smoke" />
                </div>
              </div>

              <div className="shine" />
              <div className="shimmer" aria-hidden />
            </div>

            {/* Wish prompt */}
            <div className={`wish ${phase === "cake" ? "show" : ""}`}>
              <div className="wishTitle">{text.wish}</div>
              <div className="wishHint">{text.hint}</div>

              <div className="wishRow">
                {!micOn ? (
                  <button
                    className="micBtn"
                    onClick={() => {
                      // user gesture required for mic prompt
                      startMic();
                    }}
                  >
                    {text.mic}
                  </button>
                ) : (
                  <button className="micBtn" onClick={stopMic}>
                    {text.micOff}
                  </button>
                )}

                {!candleLit && (
                  <div className="status">
                    Лаа унтарлаа одоо захиагаа нээгээрэй🫣
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* OPEN GIFT button disappears once cake shows */}
          {phase !== "cake" && (
            <button className="openBtn" onClick={onOpenGift}>
              {text.openGift}
            </button>
          )}

          {/* After blow -> letter button */}
          {phase === "cake" && letterReady && !letterOpen && (
            <button className="letterBtn" onClick={() => setLetterOpen(true)}>
              {text.letterBtn}
            </button>
          )}

          {/* Envelope + typewriter */}
          {phase === "cake" && letterOpen && (
            <div className="letterArea">
              <div className="envelope open" aria-hidden>
                <div className="envBack" />
                <div className="envFlap" />
                <div className="envPaper">
                  <div className="paperTitle">{text.noteTitle}</div>
                  <pre className="paperBody">{typed}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Polaroid slideshow */}
          {phase === "cake" && PHOTOS.length > 0 && (
            <div className="polaroidWrap" aria-label="memories">
              <div className="polaroid">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PHOTOS[photoIndex].src}
                  alt="memory"
                  className="pImg"
                />
                <div className="pCap">{PHOTOS[photoIndex].caption}</div>
              </div>
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

        .wrap{ min-height:100vh; display:grid; place-items:center; padding:28px 16px; position:relative; }
        .fx{ position:fixed; inset:0; width:100%; height:100%; pointer-events:none; z-index:1; }
        .card{
          width:min(820px, 100%);
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

        .hero{
          opacity:0;
          transform: translateY(10px);
          transition: opacity 420ms ease, transform 420ms ease;
          height: 0;
          overflow:hidden;
          pointer-events:none;
          margin-bottom: 0;
        }
        .hero.show{
          opacity:1;
          transform: translateY(0);
          height:auto;
          overflow:visible;
          pointer-events:auto;
          margin-bottom: 10px;
        }
        .title{ margin:0; font-size:28px; letter-spacing:-0.02em; }
        .sub{ margin:8px 0 0; color: rgba(255,255,255,0.74); line-height:1.55; }

        .center{
          margin-top: 10px;
          display:grid;
          place-items:center;
          gap: 12px;
          padding-bottom: 6px;
        }

        /* Gift box */
        .gift{ width: 160px; height: 160px; position:relative; display:grid; place-items:center; transform: translateY(2px); }
        .giftShadow{ position:absolute; bottom: 8px; left:50%; width: 120px; height: 26px; transform: translateX(-50%); background: radial-gradient(circle, rgba(0,0,0,0.42), transparent 70%); filter: blur(8px); }
        .box{ width: 130px; height: 96px; border-radius: 18px; background: linear-gradient(180deg, rgba(255,207,90,0.95), rgba(255,122,168,0.82)); border:1px solid rgba(255,255,255,0.18); box-shadow: 0 18px 50px rgba(0,0,0,0.35); position:absolute; bottom: 18px; overflow:hidden; }
        .ribbonV{ position:absolute; left:50%; top:0; width: 16px; height: 100%; transform: translateX(-50%); background: linear-gradient(180deg, rgba(255,77,141,0.95), rgba(124,58,237,0.85)); }
        .ribbonH{ position:absolute; left:0; top: 42px; width: 100%; height: 16px; background: linear-gradient(90deg, rgba(255,77,141,0.95), rgba(124,58,237,0.85)); }

        .lid{
          width: 140px; height: 46px; border-radius: 18px;
          background: linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.10));
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 18px 45px rgba(0,0,0,0.28);
          position:absolute; bottom: 104px;
          transform-origin: 22px 44px;
          transform: rotate(0deg) translateY(0);
        }
        .bow{ position:absolute; left:50%; top:-10px; transform: translateX(-50%); width: 66px; height: 44px; }
        .loop{ position:absolute; width: 32px; height: 24px; border-radius: 16px; background: linear-gradient(135deg, rgba(255,77,141,0.95), rgba(124,58,237,0.90)); box-shadow: 0 12px 24px rgba(0,0,0,0.22); border:1px solid rgba(255,255,255,0.14); }
        .l1{ left: 0; transform: rotate(-18deg); }
        .l2{ right: 0; transform: rotate(18deg); }
        .knot{ position:absolute; left:50%; top: 14px; width: 14px; height: 14px; transform: translateX(-50%); border-radius: 6px; background: rgba(255,255,255,0.28); border: 1px solid rgba(255,255,255,0.16); }

        .sparkle{ position:absolute; left:50%; bottom: 118px; width: 130px; height: 130px; transform: translateX(-50%); background: radial-gradient(circle, rgba(255,255,255,0.45), transparent 60%); opacity:0; pointer-events:none; }
        .sparkle.spark{ animation: sparkle 900ms ease-out 160ms both; }
        @keyframes sparkle{ 0%{ opacity:0; transform: translateX(-50%) scale(0.7); } 40%{ opacity:0.7; } 100%{ opacity:0; transform: translateX(-50%) scale(1.35); } }

        .gift.opening .lid{ animation: lidOpen 780ms cubic-bezier(.2,.9,.2,1) both; }
        @keyframes lidOpen{ 0%{ transform: rotate(0deg) translateY(0); } 60%{ transform: rotate(-26deg) translate(-10px, -10px); } 100%{ transform: rotate(-42deg) translate(-18px, -18px); } }
        .gift.gone{ animation: vanish 380ms ease-out both; }
        @keyframes vanish{ from{ opacity:1; transform: translateY(2px) scale(1); } to{ opacity:0; transform: translateY(10px) scale(0.85); } }

        /* Cake cinematic reveal */
        .cakeWrap{
          width: 360px; max-width: 100%;
          display:grid; place-items:center;
          opacity:0;
          transform: translateY(30px) scale(0.92);
          pointer-events:none;
          position:relative;
          margin-top: -6px;
        }
        .cakeWrap.show{
          opacity:1; pointer-events:auto;
          animation: cinematicRise 1100ms cubic-bezier(.16,.98,.2,1) both;
        }
        @keyframes cinematicRise{
          0%{ opacity:0; transform: translateY(40px) scale(0.88); filter: blur(2px); }
          55%{ opacity:1; transform: translateY(-14px) scale(1.06); filter: blur(0px); }
          78%{ opacity:1; transform: translateY(6px) scale(0.99); }
          100%{ opacity:1; transform: translateY(0px) scale(1); }
        }
        .cakeGlow{
          position:absolute;
          inset: 12px 60px 40px 60px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255,207,90,0.25), rgba(255,77,141,0.18), transparent 65%);
          opacity:0;
          filter: blur(6px);
          pointer-events:none;
        }
        .cakeWrap.show .cakeGlow{ animation: glowPulse 1300ms ease-out 120ms both; }
        @keyframes glowPulse{ 0%{ opacity:0; transform: scale(0.85); } 45%{ opacity:1; transform: scale(1.05); } 100%{ opacity:0.75; transform: scale(1); } }

        .cake{ width:280px; height:240px; position:relative; cursor:pointer; }
        .plate{ position:absolute; left:50%; bottom:18px; width:280px; height:54px; transform:translateX(-50%); border-radius:999px; background: linear-gradient(#f6f7fb, #dde2f5); box-shadow: inset 0 -12px 18px rgba(0,0,0,0.08), 0 22px 40px rgba(0,0,0,0.35); }
        .shadow{ position:absolute; left:50%; bottom:40px; width:190px; height:24px; transform:translateX(-50%); background: radial-gradient(circle, rgba(0,0,0,0.35), transparent 70%); filter: blur(6px); }

        .tier{ position:absolute; left:50%; transform:translateX(-50%); border-radius:18px; overflow:hidden; box-shadow: 0 22px 70px rgba(0,0,0,0.30); background: linear-gradient(180deg, rgba(255,122,168,0.95), rgba(255,77,141,0.88)); border:1px solid rgba(255,255,255,0.16); }
        .t1{ bottom:56px; width:210px; height:112px; }
        .t2{ bottom:140px; width:150px; height:76px; background: linear-gradient(180deg, rgba(255,207,90,0.85), rgba(255,122,168,0.75)); }

        .icing{ position:absolute; left:0; top:0; width:100%; height:36px; background: linear-gradient(#fff, rgba(255,255,255,0.78)); border-radius:18px 18px 14px 14px; box-shadow: inset 0 -10px 14px rgba(0,0,0,0.06); }
        .drip{ position:absolute; top:24px; width:22px; background: linear-gradient(#fff, rgba(255,255,255,0.82)); border-radius:999px; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.12)); }
        .d1{ left:26px; height:34px; }
        .d2{ left:86px; height:48px; }
        .d3{ left:146px; height:38px; }
        .sprinkles{ position:absolute; inset:10px 12px auto 12px; height:60px; opacity:0.95; background:
          radial-gradient(circle at 12% 40%, #ff4d6d 3px, transparent 4px),
          radial-gradient(circle at 24% 68%, #7c3aed 3px, transparent 4px),
          radial-gradient(circle at 46% 44%, #22c55e 3px, transparent 4px),
          radial-gradient(circle at 64% 64%, #f59e0b 3px, transparent 4px),
          radial-gradient(circle at 84% 46%, #06b6d4 3px, transparent 4px),
          radial-gradient(circle at 36% 78%, #ffd166 3px, transparent 4px);
          pointer-events:none;
        }

        .candles{ position:absolute; left:50%; bottom:188px; transform:translateX(-50%); display:flex; gap:16px; align-items:flex-end; }
        .candle{ width:14px; height:44px; border-radius:8px; background: repeating-linear-gradient(90deg, #ffffff, #ffffff 4px, #ff4d6d 4px, #ff4d6d 8px); box-shadow: 0 12px 18px rgba(0,0,0,0.22); position:relative; }
        .candle.tall{ height:52px; }

        .flame{
          position:absolute; left:50%; top:-18px;
          width:16px; height:22px; transform:translateX(-50%);
          border-radius:999px;
          background: radial-gradient(circle at 35% 40%, #fff7b0, #ffb703 60%, #fb5607 100%);
          filter: drop-shadow(0 16px 22px rgba(255,183,3,0.40));
          opacity:1;
          animation: flicker 1.1s ease-in-out 0ms infinite;
        }

        .smoke{
          position:absolute; left:50%; top:-18px;
          width:18px; height:18px;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(255,255,255,0.55), transparent 65%);
          opacity:0;
          filter: blur(1px);
          pointer-events:none;
        }

        .cake.blown .flame{
          opacity:0;
          animation: none;
        }
        .cake.blown .smoke{
          animation: smoke 900ms ease-out 60ms both;
        }
        @keyframes smoke{
          0%{ opacity:0.0; transform: translateX(-50%) translateY(0) scale(0.8); }
          30%{ opacity:0.55; }
          100%{ opacity:0.0; transform: translateX(-50%) translateY(-22px) scale(1.4); }
        }

        .shine{ position:absolute; left:50%; bottom:90px; width:140px; height:140px; transform:translateX(-50%); background: radial-gradient(circle, rgba(255,255,255,0.55), transparent 60%); opacity:0; pointer-events:none; }
        .cakeWrap.show .shine{ animation: shine 950ms ease-out 300ms both; }

        .shimmer{
          position:absolute; left:-40%; top: 60px;
          width: 60%; height: 120px; transform: rotate(18deg);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          opacity:0; pointer-events:none;
        }
        .cakeWrap.show .shimmer{ animation: shimmer 900ms ease-out 260ms both; }
        @keyframes shimmer{ 0%{ opacity:0; transform: translateX(0) rotate(18deg); } 30%{ opacity:1; } 100%{ opacity:0; transform: translateX(220%) rotate(18deg); } }

        @keyframes flicker{
          0%{ transform:translateX(-50%) scale(1) rotate(-2deg); }
          50%{ transform:translateX(-50%) scale(0.92) rotate(2deg); }
          100%{ transform:translateX(-50%) scale(1) rotate(-2deg); }
        }
        @keyframes shine{
          0%{ opacity:0; transform:translateX(-50%) scale(0.7); }
          40%{ opacity:0.70; }
          100%{ opacity:0; transform:translateX(-50%) scale(1.35); }
        }

        /* Wish UI */
        .wish{
          margin-top: 10px;
          width:min(520px, 100%);
          text-align:center;
          opacity:0;
          transform: translateY(8px);
          transition: opacity 260ms ease, transform 260ms ease;
        }
        .wish.show{ opacity:1; transform: translateY(0); }
        .wishTitle{ font-weight:900; letter-spacing:-0.01em; }
        .wishHint{ margin-top:6px; color: rgba(255,255,255,0.72); font-size: 12px; }
        .wishRow{
          margin-top:10px;
          display:flex;
          gap:10px;
          justify-content:center;
          align-items:center;
          flex-wrap:wrap;
        }
        .micBtn{
          border:1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.92);
          padding: 9px 12px;
          border-radius: 14px;
          cursor:pointer;
          font-weight:800;
        }
        .status{
          font-size: 12px;
          color: rgba(255,255,255,0.82);
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.18);
          padding: 8px 10px;
          border-radius: 14px;
        }

        /* Buttons */
        .openBtn, .letterBtn{
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
        .openBtn:hover, .letterBtn:hover{ transform: translateY(-1px); filter: brightness(1.02); }
        .openBtn:active, .letterBtn:active{ transform: translateY(0px) scale(0.99); }

        /* Letter envelope */
.letterArea{
  width:min(660px, 100%);
  display:grid;
  place-items:center;
  margin-top: 8px;
}

.envelope{
  width:min(600px, 100%);
  height: 320px;
  position:relative;
  border-radius: 22px;
  overflow:hidden;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow: 0 34px 120px rgba(0,0,0,0.55);
  backdrop-filter: blur(10px);
}

/* dreamy background */
.envBack{
  position:absolute; inset:0;
  background:
    radial-gradient(circle at 25% 15%, rgba(255,77,141,0.22), transparent 55%),
    radial-gradient(circle at 70% 20%, rgba(124,58,237,0.20), transparent 60%),
    radial-gradient(circle at 50% 95%, rgba(255,207,90,0.14), transparent 65%);
}

/* subtle sparkle dust */
.envelope::before{
  content:"";
  position:absolute; inset:0;
  background:
    radial-gradient(circle at 12% 30%, rgba(255,255,255,0.16) 1px, transparent 2px),
    radial-gradient(circle at 36% 18%, rgba(255,255,255,0.12) 1px, transparent 2px),
    radial-gradient(circle at 74% 26%, rgba(255,255,255,0.14) 1px, transparent 2px),
    radial-gradient(circle at 82% 60%, rgba(255,255,255,0.10) 1px, transparent 2px),
    radial-gradient(circle at 18% 72%, rgba(255,255,255,0.12) 1px, transparent 2px);
  opacity: 0.65;
  pointer-events:none;
}

/* flap */
.envFlap{
  position:absolute;
  left:0; right:0; top:0;
  height: 54%;
  background: linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08));
  transform-origin: top center;
  transform: rotateX(0deg);
  border-bottom: 1px solid rgba(255,255,255,0.12);
}

/* wax seal */
.envelope::after{
  content:"";
  position:absolute;
  left: 50%;
  top: 46%;
  width: 46px;
  height: 46px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background:
    radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25), transparent 45%),
    linear-gradient(135deg, rgba(255,77,141,0.95), rgba(124,58,237,0.92));
  box-shadow:
    0 18px 40px rgba(0,0,0,0.35),
    inset 0 -10px 16px rgba(0,0,0,0.22);
  opacity: 0.92;
  filter: saturate(1.05);
  pointer-events:none;
}

/* paper */
.envPaper{
  position:absolute;
  left: 16px; right: 16px;
  bottom: 16px;
  height: 86%;
  background:
    radial-gradient(circle at 20% 30%, rgba(0,0,0,0.04), transparent 45%),
    radial-gradient(circle at 78% 65%, rgba(0,0,0,0.03), transparent 50%),
    linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.10));
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 18px;
  padding: 16px 16px;
  transform: translateY(52%);
  opacity: 0;
  overflow:hidden;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.14);
}

/* paper inner lines (like notebook) */
.envPaper::before{
  content:"";
  position:absolute;
  inset: 52px 16px 18px 16px;
  background:
    repeating-linear-gradient(
      to bottom,
      rgba(255,255,255,0.12),
      rgba(255,255,255,0.12) 1px,
      transparent 1px,
      transparent 22px
    );
  opacity: 0.70;
  pointer-events:none;
}

/* paper left margin */
.envPaper::after{
  content:"";
  position:absolute;
  top: 54px;
  bottom: 18px;
  left: 22px;
  width: 2px;
  background: linear-gradient(rgba(255,77,141,0.35), rgba(255,77,141,0.12));
  opacity: 0.9;
  pointer-events:none;
}

/* open animations */
.envelope.open .envFlap{
  animation: flapOpen 650ms cubic-bezier(.2,.9,.2,1) both;
}
.envelope.open .envPaper{
  animation: paperRise 980ms cubic-bezier(.16,.98,.2,1) 180ms both;
}

@keyframes flapOpen{
  0%{ transform: rotateX(0deg); }
  100%{ transform: rotateX(70deg); }
}
@keyframes paperRise{
  0%{ transform: translateY(52%); opacity:0; }
  55%{ transform: translateY(-8%); opacity:1; }
  100%{ transform: translateY(0%); opacity:1; }
}

.paperTitle{
  position: relative;
  font-weight: 1000;
  margin-bottom: 10px;
  letter-spacing: -0.01em;
}

/* subtle highlight under title */
.paperTitle::after{
  content:"";
  position:absolute;
  left: 0;
  right: 30%;
  bottom: -6px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255,207,90,0.22), rgba(255,77,141,0.10), transparent);
  opacity: 0.9;
}

/* typewriter area */
.paperBody{
  margin:0;
  white-space: pre-wrap;
  color: rgba(255,255,255,0.84);
  line-height: 1.6;
  font-size: 14px;

  /* “handwritten-like” without external fonts */
  font-style: italic;
  letter-spacing: 0.01em;
  word-spacing: 0.06em;

  text-shadow:
    0.6px 0.7px 0 rgba(0,0,0,0.12),
    -0.4px 0.2px 0 rgba(0,0,0,0.06);
}

/* blinking cursor feel at end while typing */
.paperBody::after{
  content:"";
  display:inline-block;
  width: 10px;
  height: 1.1em;
  margin-left: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.55);
  opacity: 0;
  transform: translateY(2px);
  animation: cursorBlink 1s step-end infinite;
}

/* Only show cursor when typing is not complete:
   (Simple trick: we always blink; looks fine even at end) */
@keyframes cursorBlink{
  0%, 60%{ opacity: 0; }
  61%, 100%{ opacity: 1; }
}

        /* Polaroid */
.polaroidWrap{
  width:min(520px, 100%);
  display:grid;
  place-items:center;
  margin-top: 8px;
}

.polaroid{
  width: min(340px, 100%);
  background: rgba(255,255,255,0.92);
  color:#111;
  border-radius: 18px;
  padding: 12px 12px 18px;
  box-shadow: 0 30px 90px rgba(0,0,0,0.45);
  transform: rotate(-1.5deg);
  animation: polaroidIn 520ms ease-out both;
  position: relative;
  overflow: hidden;
}

/* subtle paper grain */
.polaroid::before{
  content:"";
  position:absolute; inset:0;
  background:
    radial-gradient(circle at 20% 30%, rgba(0,0,0,0.045), transparent 30%),
    radial-gradient(circle at 70% 60%, rgba(0,0,0,0.035), transparent 34%),
    repeating-linear-gradient(0deg, rgba(0,0,0,0.015), rgba(0,0,0,0.015) 1px, transparent 1px, transparent 4px);
  mix-blend-mode: multiply;
  opacity: 0.45;
  pointer-events:none;
}

.pImg{
  width:100%;
  height: 220px;
  object-fit: cover;
  border-radius: 14px;
  display:block;
  position: relative;
  z-index: 1;
}

/* caption handwritten feel — CSS-only */
.pCap{
  margin-top: 12px;
  position: relative;
  z-index: 1;

  /* handwritten vibe without external fonts */
  font-size: 14px;
  font-weight: 700;
  font-style: italic;
  letter-spacing: 0.01em;
  word-spacing: 0.06em;
  line-height: 1.25;

  color: rgba(12, 12, 12, 0.72);

  /* ink look */
  text-shadow:
    0.5px 0.6px 0 rgba(0,0,0,0.08),
    -0.3px 0.2px 0 rgba(0,0,0,0.05);

  transform: rotate(-1deg);
}

/* underline like pen stroke */
.pCap::after{
  content:"";
  position:absolute;
  left: 0;
  right: 8%;
  bottom: -6px;
  height: 10px;
  background:
    radial-gradient(circle at 10% 60%, rgba(0,0,0,0.12), transparent 60%),
    linear-gradient(90deg, rgba(10,10,10,0.18), rgba(10,10,10,0.06), rgba(10,10,10,0.14));
  opacity: 0.25;
  filter: blur(0.2px);
  border-radius: 999px;
  transform: rotate(-1.2deg);
}

@keyframes polaroidIn{
  from{ opacity:0; transform: translateY(10px) rotate(-2deg) scale(0.98); }
  to{ opacity:1; transform: translateY(0) rotate(-1.5deg) scale(1); }
}

        .footer{ margin-top: 10px; text-align:center; font-size:12px; color: rgba(255,255,255,0.60); }
      `}</style>
    </main>
  );
}