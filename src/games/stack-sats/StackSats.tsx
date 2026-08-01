"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GamePlayProps } from "../types";

const WIDTH = 280;
const BLOCK_H = 24;
const START_W = 140;
const SPEED0 = 2.4;

export function StackSats({ session, onScore, onExit }: GamePlayProps) {
  const [score, setScore] = useState(0);
  const [alive, setAlive] = useState(true);
  const [blocks, setBlocks] = useState<{ x: number; w: number }[]>([
    { x: (WIDTH - START_W) / 2, w: START_W },
  ]);
  const movingRef = useRef({ x: 0, w: START_W, dir: 1, speed: SPEED0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef(0);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const drop = useCallback(() => {
    if (!alive) return;
    const prev = blocksRef.current[blocksRef.current.length - 1];
    const m = movingRef.current;
    const left = Math.max(prev.x, m.x);
    const right = Math.min(prev.x + prev.w, m.x + m.w);
    const w = right - left;
    if (w <= 4) {
      setAlive(false);
      onScore({
        gameId: session.gameId,
        sessionId: session.sessionId,
        score: scoreRef.current,
      });
      return;
    }
    const next = [...blocksRef.current, { x: left, w }];
    setBlocks(next);
    scoreRef.current += 1;
    setScore(scoreRef.current);
    movingRef.current = {
      x: 0,
      w,
      dir: 1,
      speed: SPEED0 + scoreRef.current * 0.12,
    };
  }, [alive, onScore, session.gameId, session.sessionId]);

  useEffect(() => {
    if (!alive) return;
    let raf = 0;
    const tick = () => {
      const m = movingRef.current;
      m.x += m.dir * m.speed;
      if (m.x <= 0) {
        m.x = 0;
        m.dir = 1;
      } else if (m.x + m.w >= WIDTH) {
        m.x = WIDTH - m.w;
        m.dir = -1;
      }

      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        const h = Math.max(360, (blocksRef.current.length + 3) * BLOCK_H + 40);
        const canvas = canvasRef.current!;
        if (canvas.height !== h) canvas.height = h;
        ctx.fillStyle = "#0a0612";
        ctx.fillRect(0, 0, WIDTH, h);

        const baseY = h - 20;
        blocksRef.current.forEach((b, i) => {
          const y = baseY - (i + 1) * BLOCK_H;
          const hue = 45 + i * 8;
          ctx.fillStyle = `hsl(${hue} 90% 55%)`;
          ctx.shadowColor = `hsl(${hue} 90% 55%)`;
          ctx.shadowBlur = 8;
          ctx.fillRect(b.x, y, b.w, BLOCK_H - 3);
          ctx.shadowBlur = 0;
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.font = "12px monospace";
          ctx.fillText("₿", b.x + b.w / 2 - 4, y + 16);
        });

        const y = baseY - (blocksRef.current.length + 1) * BLOCK_H;
        ctx.fillStyle = "#e879f9";
        ctx.shadowColor = "#e879f9";
        ctx.shadowBlur = 14;
        ctx.fillRect(m.x, y, m.w, BLOCK_H - 3);
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [alive]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        drop();
      } else if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drop, onExit]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="font-mono text-sm text-fuchsia-300">STACK {score}</div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={360}
        className="rounded-lg border border-fuchsia-500/40 shadow-[0_0_40px_rgba(232,121,249,0.15)]"
        onClick={drop}
      />
      {!alive && (
        <div className="text-center">
          <p className="font-mono text-xl text-amber-300">TOPPLED — {score} HIGH</p>
          <button
            type="button"
            onClick={onExit}
            className="mt-3 rounded border border-cyan-400/50 px-4 py-2 font-mono text-sm text-cyan-200 hover:bg-cyan-500/20"
          >
            BACK TO LOBBY
          </button>
        </div>
      )}
      <p className="text-center text-xs text-zinc-500">Space / click to drop · Esc exit</p>
    </div>
  );
}
