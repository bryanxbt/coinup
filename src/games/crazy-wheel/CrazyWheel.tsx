"use client";

/**
 * Crazy Wheel — frontend cabinet shell branded for CoinUp.
 * Layout mirrors the live product (arc, pot, chest, bet bar);
 * spin/payout is a local mock until wired to real rails.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GamePlayProps } from "../types";
import {
  pickWeightedIndex,
  segmentAngles,
  WHEEL_SEGMENTS,
  type WheelSegment,
} from "./segments";
import { formatSats, mockPaymentClient } from "@/lib/payments";
import { getGuestName, getPlayerId } from "@/lib/player";

const W = 420;
const H = 300;
const CX = W / 2;
const CY = H - 28;
const R_OUT = 168;
const R_IN = 88;

type Phase = "lobby" | "countdown" | "spinning" | "result";

export function CrazyWheel({ session, onScore, onExit }: GamePlayProps) {
  const stake = session.creditsSpent;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>("lobby");
  const [selected, setSelected] = useState<string | null>(null);
  const [betUnits, setBetUnits] = useState(1); // × stake slices for UI (display only on top of paid stake)
  const [countdown, setCountdown] = useState(3);
  const [rotation, setRotation] = useState(0);
  const [landed, setLanded] = useState<WheelSegment | null>(null);
  const [won, setWon] = useState(false);
  const [payout, setPayout] = useState(0);
  const [timerLeft, setTimerLeft] = useState(24);

  const angles = useMemo(() => segmentAngles(WHEEL_SEGMENTS.length), []);
  const guest = useMemo(() => getGuestName(), []);
  const selectedSeg = WHEEL_SEGMENTS.find((s) => s.id === selected) ?? null;
  const potPreview = selectedSeg ? stake * selectedSeg.mult * betUnits : stake;

  // Attract timer (cosmetic, like production)
  useEffect(() => {
    if (phase !== "lobby") return;
    const t = window.setInterval(() => {
      setTimerLeft((n) => (n <= 0 ? 24 : n - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  const draw = useCallback(
    (rot: number, highlightId: string | null, potText: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // isometric-ish hex floor (brand void + purple tint)
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#1a1030");
      g.addColorStop(0.5, "#2a1848");
      g.addColorStop(1, "#12101c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // diamond grid
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1;
      const step = 22;
      for (let y = -H; y < H * 2; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y + W * 0.35);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y - W * 0.35);
        ctx.stroke();
      }

      // cyan arc rail under segments
      ctx.beginPath();
      ctx.arc(CX, CY, R_OUT + 10, Math.PI, 0, false);
      ctx.strokeStyle = "rgba(34, 211, 238, 0.55)";
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(CX, CY, R_OUT + 10, Math.PI, 0, false);
      ctx.strokeStyle = "rgba(34, 211, 238, 0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // segments as rounded “cards” on the arc
      WHEEL_SEGMENTS.forEach((seg, i) => {
        const a = angles[i];
        const start = a.start + rot;
        const end = a.end + rot;
        const mid = a.mid + rot;

        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.arc(CX, CY, R_OUT, -start, -end, true);
        ctx.arc(CX, CY, R_IN, -end, -start, false);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.45)";
        ctx.lineWidth = 2;
        ctx.stroke();

        if (highlightId === seg.id) {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // seat circle + mult label
        const sx = CX + Math.cos(-mid) * ((R_OUT + R_IN) / 2);
        const sy = CY + Math.sin(-mid) * ((R_OUT + R_IN) / 2);
        ctx.beginPath();
        ctx.arc(sx, sy, 16, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = "#111";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(seg.label, sx, sy);
      });

      // center pot card
      ctx.fillStyle = "rgba(15, 23, 20, 0.92)";
      roundRect(ctx, CX - 70, CY - 70, 140, 44, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(74, 222, 128, 0.5)";
      ctx.lineWidth = 2;
      roundRect(ctx, CX - 70, CY - 70, 140, 44, 8);
      ctx.stroke();

      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(potText, CX, CY - 48);

      // chest
      ctx.font = "36px serif";
      ctx.fillText("🧰", CX + 78, CY - 42);

      // green GO / spin well
      ctx.beginPath();
      ctx.arc(CX, CY + 8, 36, 0, Math.PI * 2);
      ctx.fillStyle = "#16a34a";
      ctx.fill();
      ctx.strokeStyle = "#052e16";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = "#bbf7d0";
      ctx.font = "bold 12px monospace";
      ctx.fillText(phase === "spinning" ? "…" : "GO", CX, CY + 12);

      // pointer
      ctx.beginPath();
      ctx.moveTo(CX, CY - R_OUT - 14);
      ctx.lineTo(CX - 12, CY - R_OUT + 6);
      ctx.lineTo(CX + 12, CY - R_OUT + 6);
      ctx.closePath();
      ctx.fillStyle = "#38bdf8";
      ctx.fill();
      ctx.strokeStyle = "#0c4a6e";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [angles, phase],
  );

  useEffect(() => {
    draw(rotation, selected, formatSatsShort(potPreview));
  }, [draw, rotation, selected, potPreview]);

  useEffect(() => {
    return () => {
      if (spinRef.current) cancelAnimationFrame(spinRef.current);
    };
  }, []);

  const placeBet = () => {
    if (!selected || phase !== "lobby") return;
    setPhase("countdown");
    setCountdown(3);
    let n = 3;
    const t = window.setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        window.clearInterval(t);
        runSpin();
      }
    }, 650);
  };

  const runSpin = () => {
    setPhase("spinning");
    const winIndex = pickWeightedIndex();
    const winSeg = WHEEL_SEGMENTS[winIndex];
    const targetMid = angles[winIndex].mid;
    const pointerAngle = Math.PI / 2;
    let targetRot = pointerAngle - targetMid;
    const startRot = rotation;
    while (targetRot < startRot + (4 + Math.random() * 2) * Math.PI) {
      targetRot += Math.PI * 2;
    }
    const duration = 3000;
    const t0 = performance.now();

    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / duration);
      const e = 1 - (1 - u) ** 3;
      const r = startRot + (targetRot - startRot) * e;
      setRotation(r);
      draw(r, selected, formatSatsShort(potPreview));
      if (u < 1) spinRef.current = requestAnimationFrame(tick);
      else void finish(winSeg);
    };
    spinRef.current = requestAnimationFrame(tick);
  };

  const finish = async (winSeg: WheelSegment) => {
    setLanded(winSeg);
    setPhase("result");
    const hit = winSeg.id === selected;
    setWon(hit);
    if (hit) {
      const pay = stake * winSeg.mult * betUnits;
      setPayout(pay);
      try {
        await mockPaymentClient.claimReward({
          potId: `wheel_${session.sessionId}`,
          playerId: getPlayerId(),
          amountSats: pay,
        });
        window.dispatchEvent(new Event("coinup:balance"));
      } catch {
        /* ignore mock failures */
      }
      onScore({
        gameId: session.gameId,
        sessionId: session.sessionId,
        score: pay,
        meta: { mult: winSeg.mult, segment: winSeg.id, won: true },
      });
    } else {
      setPayout(0);
      onScore({
        gameId: session.gameId,
        sessionId: session.sessionId,
        score: 0,
        meta: { mult: winSeg.mult, segment: winSeg.id, won: false },
      });
    }
  };

  const mm = String(Math.floor(timerLeft / 60)).padStart(2, "0");
  const ss = String(timerLeft % 60).padStart(2, "0");

  return (
    <div className="cw-shell">
      {/* Top bar */}
      <header className="cw-top">
        <h1 className="cw-title">
          CRAZY <span>WHEEL</span>
        </h1>
        <div className="cw-timer">
          <span className="cw-timer-val">
            {mm}:{ss}
          </span>
          <span className="cw-timer-sub">BET</span>
        </div>
        <div className="cw-players">
          <p className="cw-players-h">1 ACTIVE · YOU</p>
          <p className="cw-players-line">
            {guest} · {formatSats(stake).toUpperCase()}
          </p>
          {selectedSeg && (
            <p className="cw-players-line" style={{ color: selectedSeg.color }}>
              BET {selectedSeg.label.toUpperCase()}
            </p>
          )}
        </div>
      </header>

      {/* Stage */}
      <div className="cw-stage">
        <canvas ref={canvasRef} width={W} height={H} className="cw-canvas" />
        {phase === "countdown" && (
          <div className="cw-overlay">
            <span className="cw-count">{countdown > 0 ? countdown : "GO"}</span>
          </div>
        )}
      </div>

      {/* Segment pick chips (map to arc colors) */}
      {phase === "lobby" && (
        <div className="cw-chips">
          {WHEEL_SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              type="button"
              className={`cw-chip${selected === seg.id ? " cw-chip--on" : ""}`}
              style={{ background: seg.color }}
              onClick={() => setSelected(seg.id)}
            >
              {seg.label}
            </button>
          ))}
        </div>
      )}

      {phase === "result" && landed && (
        <div className={`cw-result${won ? " cw-result--win" : ""}`}>
          <p className="cw-result-title">{won ? "YOU WIN" : "NO HIT"}</p>
          <p style={{ color: landed.color }}>
            LANDED {landed.label.toUpperCase()}
          </p>
          {won && (
            <p className="cw-result-pay">+{formatSats(payout).toUpperCase()}</p>
          )}
        </div>
      )}

      {/* Bottom bet bar — product layout */}
      <footer className="cw-bar">
        <div className="cw-user">
          <span className="cw-avatar">₿</span>
          <div>
            <p className="cw-user-name">{guest}</p>
            <p className="cw-user-bal">{formatSats(stake).toUpperCase()} STAKE</p>
          </div>
        </div>

        <div className="cw-bet-ctrl">
          <button
            type="button"
            className="cw-step"
            disabled={phase !== "lobby" || betUnits <= 1}
            onClick={() => setBetUnits((n) => Math.max(1, n - 1))}
          >
            −
          </button>
          <span className="cw-bet-amt">{betUnits}</span>
          <button
            type="button"
            className="cw-step"
            disabled={phase !== "lobby" || betUnits >= 5}
            onClick={() => setBetUnits((n) => Math.min(5, n + 1))}
          >
            +
          </button>
        </div>

        {phase === "lobby" ? (
          <button
            type="button"
            className="cw-place"
            disabled={!selected}
            onClick={placeBet}
          >
            PLACE BET
          </button>
        ) : phase === "result" ? (
          <button type="button" className="cw-place" onClick={onExit}>
            AGAIN
          </button>
        ) : (
          <button type="button" className="cw-place cw-place--wait" disabled>
            {phase === "countdown" ? "LOCKING…" : "SPINNING…"}
          </button>
        )}

        <button type="button" className="cw-exit" onClick={onExit}>
          EXIT
        </button>
      </footer>

      <p className="cw-brand-foot">
        COINUP ARCADE · SATS ONLY · PLAY AT YOUR OWN RISK
      </p>
    </div>
  );
}

function formatSatsShort(sats: number): string {
  if (sats >= 100_000) return `${(sats / 100_000).toFixed(2)}k sats`;
  return `${sats.toLocaleString()} sats`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
