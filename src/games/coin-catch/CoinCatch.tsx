"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GamePlayProps } from "../types";

const WIDTH = 320;
const HEIGHT = 400;
const PLAYER_W = 56;
const PLAYER_H = 14;
const COIN_R = 10;
const DURATION_MS = 30_000;

type Coin = { id: number; x: number; y: number; vy: number };

export function CoinCatch({ session, onScore, onExit }: GamePlayProps) {
  const [score, setScore] = useState(0);
  const [leftMs, setLeftMs] = useState(DURATION_MS);
  const [running, setRunning] = useState(true);
  const [playerX, setPlayerX] = useState(WIDTH / 2 - PLAYER_W / 2);
  const coinsRef = useRef<Coin[]>([]);
  const scoreRef = useRef(0);
  const idRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerXRef = useRef(playerX);
  playerXRef.current = playerX;

  const finish = useCallback(
    (finalScore: number) => {
      setRunning(false);
      onScore({
        gameId: session.gameId,
        sessionId: session.sessionId,
        score: finalScore,
      });
    },
    [onScore, session.gameId, session.sessionId],
  );

  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    let raf = 0;
    let lastSpawn = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const remaining = Math.max(0, DURATION_MS - elapsed);
      setLeftMs(remaining);

      if (remaining <= 0) {
        finish(scoreRef.current);
        return;
      }

      if (now - lastSpawn > 450) {
        lastSpawn = now;
        coinsRef.current.push({
          id: idRef.current++,
          x: COIN_R + Math.random() * (WIDTH - COIN_R * 2),
          y: -COIN_R,
          vy: 2.2 + Math.random() * 2.4,
        });
      }

      const px = playerXRef.current;
      const next: Coin[] = [];
      for (const c of coinsRef.current) {
        const y = c.y + c.vy;
        const caught =
          y + COIN_R >= HEIGHT - 28 &&
          y - COIN_R <= HEIGHT - 28 + PLAYER_H &&
          c.x >= px &&
          c.x <= px + PLAYER_W;
        if (caught) {
          scoreRef.current += 1;
          setScore(scoreRef.current);
        } else if (y < HEIGHT + COIN_R) {
          next.push({ ...c, y });
        }
      }
      coinsRef.current = next;

      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0a0612";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        // scanlines
        ctx.fillStyle = "rgba(255,255,255,0.03)";
        for (let y = 0; y < HEIGHT; y += 4) ctx.fillRect(0, y, WIDTH, 1);

        for (const c of coinsRef.current) {
          const g = ctx.createRadialGradient(c.x - 2, c.y - 2, 1, c.x, c.y, COIN_R);
          g.addColorStop(0, "#ffe566");
          g.addColorStop(1, "#f59e0b");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(c.x, c.y, COIN_R, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.fillStyle = "#22d3ee";
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 12;
        ctx.fillRect(px, HEIGHT - 28, PLAYER_W, PLAYER_H);
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        setPlayerX((x) => Math.max(0, x - 22));
      } else if (e.key === "ArrowRight" || e.key === "d") {
        setPlayerX((x) => Math.min(WIDTH - PLAYER_W, x + 22));
      } else if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  const onPointer = (clientX: number, rect: DOMRect) => {
    const x = ((clientX - rect.left) / rect.width) * WIDTH - PLAYER_W / 2;
    setPlayerX(Math.max(0, Math.min(WIDTH - PLAYER_W, x)));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-[320px] items-center justify-between font-mono text-sm text-cyan-300">
        <span>SCORE {score}</span>
        <span>{(leftMs / 1000).toFixed(1)}s</span>
      </div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="cursor-none rounded-lg border border-cyan-500/40 shadow-[0_0_40px_rgba(34,211,238,0.15)]"
        onPointerMove={(e) => onPointer(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerDown={(e) => onPointer(e.clientX, e.currentTarget.getBoundingClientRect())}
      />
      {!running && (
        <div className="text-center">
          <p className="font-mono text-xl text-amber-300">RUN OVER — {score} COINS</p>
          <button
            type="button"
            onClick={onExit}
            className="mt-3 rounded border border-fuchsia-400/50 px-4 py-2 font-mono text-sm text-fuchsia-200 hover:bg-fuchsia-500/20"
          >
            BACK TO LOBBY
          </button>
        </div>
      )}
      <p className="text-center text-xs text-zinc-500">← → or drag · Esc exit</p>
    </div>
  );
}
