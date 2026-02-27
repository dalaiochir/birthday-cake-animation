"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function playChime() {
  // Copyright-free жижиг аялгуу (WebAudio)
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
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

    // pluck envelope
    g.gain.setValueAtTime(0.0001, now + n.t);
    g.gain.exponentialRampToValueAtTime(1.0, now + n.t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);

    o.connect(g);
    g.connect(master);

    o.start(now + n.t);
    o.stop(now + n.t + n.d + 0.02);
  });

  // auto close
  setTimeout(() => ctx.close?.(), 2200);
}

function tryPlayPublicMp3(audioRef) {
  // Сонголтоор: /public/music.mp3 тавьсан бол тоглуулна
  const a = audioRef.current;
  if (!a) return;
  a.currentTime = 0;
  a.volume = 0.65;
  a.play().catch(() => {
    // Autoplay policy-д хориглогдвол зүгээр.
  });
}

export default function Home() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const confettiRef = useRef([]);
  const sparkleRef = useRef([]);
  const audioRef = useRef(null);

  const [played, setPlayed] = useState(false);
  const [openGift, setOpenGift] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const text = useMemo(
    () => ({
      headline: "Хайрт минь, төрсөн өдрийн мэнд хүргэе! 💖",
      sub: "Чамтай өнгөрүүлэх мөч бүр миний хамгийн гоё бэлэг. Өнөөдөр бол чиний өдөр ✨",
      cta: "Та бэлэг авмаар байна уу 🎁",
      noteTitle: "Чамд зориулсан бэлэг ✨",
      noteBody:
        "Аз жаргал, инээд, эрүүл энх, хүсэл мөрөөдлийн чинь биелэл бүгдийг бэлэглэе. Би үргэлж чиний талд байна 💛"
    }),
    []
  );

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

        if (p.life <= 0 || p.y > H + 80) c.splice(i, 1);
      }

      // sparkles
      const s = sparkleRef.current;
      for (let i = s.length - 1; i >= 0; i--) {
        const sp = s[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.02;
        sp.life -= 0.02;

        ctx.save();
        ctx.globalAlpha = Math.max(0, sp.life);
        ctx.fillStyle = `rgba(255, 245, 200, ${Math.max(0, sp.life)})`;
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
    };
  }, []);

  const burst = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const cx = W / 2;
    const cy = Math.min(H * 0.30, 280);

    const count = 180;
    const parts = [];
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.65;
      const sp = 2.4 + Math.random() * 5.6;
      parts.push({
        x: cx + (Math.random() - 0.5) * 22,
        y: cy + (Math.random() - 0.5) * 18,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 2.8,
        r: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.25,
        life: 1,
        h: Math.floor(Math.random() * 360)
      });
    }
    confettiRef.current.push(...parts);

    // sparkle burst
    const spCount = 36;
    const sparks = [];
    for (let i = 0; i < spCount; i++) {
      const a = (Math.PI * 2 * i) / spCount + (Math.random() - 0.5) * 0.4;
      const sp = 0.8 + Math.random() * 2.0;
      sparks.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.8,
        r: 1.2 + Math.random() * 2.2,
        life: 1
      });
    }
    sparkleRef.current.push(...sparks);
  };

  const onClickGift = () => {
    // reset + replay css animations cleanly
    setPlayed(false);
    setOpenGift(false);
    setShowNote(false);

    requestAnimationFrame(() => {
      setPlayed(true);
      setOpenGift(true);
      setTimeout(() => setShowNote(true), 720);

      burst();
      setTimeout(burst, 220);
      setTimeout(burst, 460);

      // Sound: chime + optional music.mp3
      playChime();
      tryPlayPublicMp3(audioRef);
    });
  };

  return (
    <main className="wrap">
      <canvas ref={canvasRef} className="fx" aria-hidden />
      <audio ref={audioRef} src="/music.mp3" preload="auto" />

      <div className={`card ${played ? "played" : ""}`}>
        <div className="topGlow" aria-hidden />

        <div className="header">
          <div className="heart" aria-hidden>
            <span />
          </div>
          <div>
            <h1 className="title">{text.headline}</h1>
            <p className="sub">{text.sub}</p>
          </div>
        </div>

        {/* Cake stage */}
        <section className={`stage ${played ? "play" : ""}`} aria-label="birthday cake">
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
          </div>
        </section>

        {/* Gift section */}
        <section className="giftArea">
          <button className="cta" onClick={onClickGift}>
            <span className="ctaIcon" aria-hidden>🎁</span>
            <span>{text.cta}</span>
            <span className="ctaArrow" aria-hidden>➜</span>
          </button>

          <div className={`gift ${openGift ? "open" : ""}`} aria-label="gift box">
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
            <div className="sparkle" aria-hidden />
          </div>

          {showNote && (
            <div className="note" role="status">
              <div className="noteTitle">{text.noteTitle}</div>
              <div className="noteBody">{text.noteBody}</div>
            </div>
          )}

          <div className="tiny">
            * Хэрвээ чи өөрийн дуу оруулах бол <code>public/music.mp3</code> гэж нэмээрэй.
          </div>
        </section>

        <div className="footer">Made with ❤️ for someone special</div>
      </div>

      <style jsx>{`
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
          width:min(720px, 100%);
          position:relative;
          z-index:2;
          border-radius:26px;
          padding:22px 20px 18px;
          background: linear-gradient(180deg, var(--glass2), var(--glass));
          border:1px solid var(--stroke);
          box-shadow: 0 28px 110px rgba(0,0,0,0.55);
          backdrop-filter: blur(10px);
          overflow:hidden;
        }
        .topGlow{
          position:absolute;
          inset:-200px -140px auto -140px;
          height:260px;
          background: radial-gradient(circle at 40% 40%, rgba(255,77,141,0.35), transparent 55%),
                      radial-gradient(circle at 70% 20%, rgba(124,58,237,0.25), transparent 60%);
          filter: blur(10px);
          pointer-events:none;
        }

        .header{
          display:flex;
          gap:14px;
          align-items:flex-start;
        }
        .title{
          margin:0;
          font-size:28px;
          letter-spacing:-0.02em;
        }
        .sub{
          margin:8px 0 0;
          color:var(--muted);
          line-height:1.55;
        }

        .heart{
          width:44px;height:44px;
          border-radius:14px;
          border:1px solid rgba(255,255,255,0.20);
          background: rgba(255,255,255,0.10);
          display:grid;
          place-items:center;
          box-shadow: 0 14px 40px rgba(0,0,0,0.25);
        }
        .heart span{
          width:18px;height:18px;
          background: radial-gradient(circle at 30% 30%, #fff, var(--rose) 55%, var(--pink));
          transform: rotate(45deg);
          border-radius:6px;
          position:relative;
          display:block;
          filter: drop-shadow(0 12px 18px rgba(255,77,141,0.25));
          animation: pulse 1.8s ease-in-out infinite;
        }
        .heart span::before,
        .heart span::after{
          content:"";
          position:absolute;
          width:18px;height:18px;
          background: inherit;
          border-radius:50%;
          top:-9px; left:0;
        }
        .heart span::after{
          top:0; left:-9px;
        }
        @keyframes pulse{
          0%,100%{ transform: rotate(45deg) scale(1); }
          50%{ transform: rotate(45deg) scale(1.12); }
        }

        .stage{
          display:grid;
          place-items:center;
          padding:14px 0 2px;
        }

        /* Cake */
        .cake{
          width:280px;
          height:240px;
          position:relative;
          transform: translateY(14px) scale(0.96);
          opacity:0.75;
        }
        .played .cake{ opacity:1; }
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
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
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
          filter: drop-shadow(0 14px 18px rgba(255,183,3,0.35));
          opacity:0;
        }
        .shine{
          position:absolute;
          left:50%;
          bottom:90px;
          width:140px;height:140px;
          transform:translateX(-50%);
          background: radial-gradient(circle, rgba(255,255,255,0.50), transparent 60%);
          opacity:0;
          pointer-events:none;
        }

        /* Cake play animations */
        .play .cake{ animation: cakePop 800ms cubic-bezier(.2,.9,.2,1) both; }
        .play .flame{
          opacity:1;
          animation: flameIn 260ms ease-out 160ms both, flicker 1.1s ease-in-out 520ms infinite;
        }
        .play .candles .candle{ animation: wiggle 900ms ease-in-out 260ms both; }
        .play .shine{ animation: shine 950ms ease-out 220ms both; }

        @keyframes cakePop{
          0%{ transform: translateY(24px) scale(0.90); opacity:0.5; }
          60%{ transform: translateY(-10px) scale(1.04); opacity:1; }
          100%{ transform: translateY(14px) scale(0.98); opacity:1; }
        }
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
          40%{ opacity:0.65; }
          100%{ opacity:0; transform:translateX(-50%) scale(1.35); }
        }

        /* Gift */
        .giftArea{
          margin-top: 10px;
          display:grid;
          gap: 14px;
          place-items:center;
        }
        .cta{
          width:min(520px, 100%);
          border:0;
          cursor:pointer;
          padding: 13px 14px;
          border-radius: 16px;
          color:#fff;
          font-weight:800;
          font-size:15px;
          background: linear-gradient(135deg, rgba(255,77,141,0.95), rgba(124,58,237,0.95));
          box-shadow: 0 22px 70px rgba(124,58,237,0.28);
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          transition: transform 120ms ease, filter 120ms ease;
          border:1px solid rgba(255,255,255,0.18);
        }
        .cta:hover{ transform: translateY(-1px); filter:brightness(1.02); }
        .cta:active{ transform: translateY(0px) scale(0.99); }
        .ctaArrow{ opacity:0.9; }

        .gift{
          width: 140px;
          height: 140px;
          position:relative;
          display:grid;
          place-items:center;
          transform: translateY(2px);
        }
        .giftShadow{
          position:absolute;
          bottom: 6px;
          left:50%;
          width: 110px;
          height: 24px;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(0,0,0,0.42), transparent 70%);
          filter: blur(8px);
        }
        .box{
          width: 120px;
          height: 88px;
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(255,207,90,0.95), rgba(255,122,168,0.82));
          border:1px solid rgba(255,255,255,0.18);
          box-shadow: 0 18px 50px rgba(0,0,0,0.35);
          position:absolute;
          bottom: 16px;
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
          opacity:0.95;
        }
        .ribbonH{
          position:absolute;
          left:0;
          top: 38px;
          width: 100%;
          height: 16px;
          background: linear-gradient(90deg, rgba(255,77,141,0.95), rgba(124,58,237,0.85));
          opacity:0.95;
        }

        .lid{
          width: 128px;
          height: 42px;
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.10));
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 18px 45px rgba(0,0,0,0.28);
          position:absolute;
          bottom: 92px;
          transform-origin: 22px 40px;
          transform: rotate(0deg) translateY(0);
        }

        .bow{ position:absolute; left:50%; top:-10px; transform: translateX(-50%); width: 60px; height: 40px; }
        .loop{
          position:absolute;
          width: 30px; height: 22px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(255,77,141,0.95), rgba(124,58,237,0.90));
          box-shadow: 0 12px 24px rgba(0,0,0,0.22);
          border:1px solid rgba(255,255,255,0.14);
        }
        .l1{ left: 0; transform: rotate(-18deg); }
        .l2{ right: 0; transform: rotate(18deg); }
        .knot{
          position:absolute;
          left:50%; top: 12px;
          width: 14px; height: 14px;
          transform: translateX(-50%);
          border-radius: 6px;
          background: rgba(255,255,255,0.28);
          border: 1px solid rgba(255,255,255,0.16);
        }

        .sparkle{
          position:absolute;
          left:50%;
          bottom: 108px;
          width: 120px; height: 120px;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(255,255,255,0.45), transparent 60%);
          opacity:0;
          pointer-events:none;
        }

        /* Gift open animations */
        .gift.open .lid{
          animation: lidOpen 780ms cubic-bezier(.2,.9,.2,1) both;
        }
        .gift.open .sparkle{
          animation: sparkle 900ms ease-out 220ms both;
        }
        @keyframes lidOpen{
          0%{ transform: rotate(0deg) translateY(0); }
          60%{ transform: rotate(-26deg) translate(-10px, -10px); }
          100%{ transform: rotate(-42deg) translate(-18px, -18px); }
        }
        @keyframes sparkle{
          0%{ opacity:0; transform: translateX(-50%) scale(0.7); }
          40%{ opacity:0.7; }
          100%{ opacity:0; transform: translateX(-50%) scale(1.35); }
        }

        .note{
          width:min(520px, 100%);
          padding: 14px 14px;
          border-radius: 18px;
          background: rgba(255,255,255,0.10);
          border:1px solid rgba(255,255,255,0.20);
          box-shadow: 0 26px 80px rgba(0,0,0,0.35);
          backdrop-filter: blur(8px);
          animation: noteIn 520ms ease-out both;
        }
        @keyframes noteIn{
          from{ opacity:0; transform: translateY(10px); }
          to{ opacity:1; transform: translateY(0); }
        }
        .noteTitle{ font-weight:900; margin-bottom:6px; }
        .noteBody{ color: var(--muted); line-height:1.55; }

        .tiny{
          width:min(520px, 100%);
          font-size:12px;
          color: rgba(255,255,255,0.68);
          text-align:center;
        }
        code{
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
          background: rgba(255,255,255,0.10);
          padding: 2px 6px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.16);
        }
        .footer{
          margin-top: 10px;
          text-align:center;
          font-size:12px;
          color: rgba(255,255,255,0.60);
        }
      `}</style>
    </main>
  );
}