"use client";

import { useState } from "react";

export default function Home() {
  const [play, setPlay] = useState(false);

  return (
    <main className="container">
      <h1>Төрсөн өдрийн мэнд хүргэе! 🎉</h1>
      <p>Чамдаа хамгийн сайхан бүхнийг хүсье ❤️</p>

      <div className={`cake ${play ? "play" : ""}`}>
        <div className="plate"></div>
        <div className="layer"></div>
        <div className="candle">
          <div className="flame"></div>
        </div>
      </div>

      <button onClick={() => setPlay(true)}>
        Та бэлэг авмаар байна уу 🎁
      </button>

      {play && <div className="message">Бэлэгээ авлаа! ✨</div>}

      <style jsx>{`
        .container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #ff9a9e, #fad0c4);
          text-align: center;
        }

        h1 {
          margin-bottom: 10px;
        }

        .cake {
          position: relative;
          margin: 20px 0;
          opacity: 0;
          transform: scale(0.5);
          transition: 0.5s;
        }

        .cake.play {
          opacity: 1;
          transform: scale(1);
        }

        .plate {
          width: 200px;
          height: 20px;
          background: #eee;
          border-radius: 50%;
          margin: auto;
        }

        .layer {
          width: 150px;
          height: 80px;
          background: pink;
          border-radius: 10px;
          margin: -10px auto 0;
        }

        .candle {
          width: 10px;
          height: 40px;
          background: white;
          margin: auto;
          position: relative;
          top: -120px;
        }

        .flame {
          width: 15px;
          height: 15px;
          background: orange;
          border-radius: 50%;
          position: absolute;
          top: -15px;
          left: -2.5px;
          opacity: 0;
        }

        .cake.play .flame {
          opacity: 1;
          animation: flicker 0.5s infinite alternate;
        }

        @keyframes flicker {
          from { transform: scale(1); }
          to { transform: scale(1.2); }
        }

        button {
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          background: purple;
          color: white;
          font-weight: bold;
          cursor: pointer;
        }

        .message {
          margin-top: 20px;
          font-size: 20px;
          font-weight: bold;
        }
      `}</style>
    </main>
  );
}