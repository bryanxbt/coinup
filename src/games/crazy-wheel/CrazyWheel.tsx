"use client";

/**
 * Crazy Wheel — free-to-enter cabinet; each spin bets from wallet balance.
 * Stay at the machine and keep spinning without re-inserting at the door.
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

/** Quick-pick stake amounts (sats) */
const BET_PRESETS = [100, 500, 1_000, 2_500, 5_000, 10_000] as const;

type Phase = "lobby" | "countdown" | "spinning" | "result";

export function CrazyWheel({ session, onScore, onExit }: GamePlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>("lobby");
  const [selected, setSelected] = useState<string | null>(null);
  const [betSats, setBetSats] = useState(1_000);
  const [balance, setBalance] = useState(0);
  const [activeStake, setActiveStake] = useState(0); // stake locked for current spin
  const [countdown, setCountdown] = useState(3);
  const [rotation, setRotation] = useState(0);
  const [landed, setLanded] = useState<WheelSegment | null>(null);
  const [won, setWon] = useState(false);
  const [payout, setPayout] = useState(0);
  const [timerLeft, setTimerLeft] = useState(24);
  const [error, setError] = useState<string | null>(null);

  const angles = useMemo(() => segmentAngles(WHEEL_SEGMENTS.length), []);
  const guest = useMemo(() => getGuestName(), []);
  const selectedSeg = WHEEL_SEGMENTS.find((s) => s.id === selected) ?? null;
  const potPreview = selectedSeg ? betSats * selectedSeg.mult : betSats;

  const refreshBalance = useCallback(async () => {
    const bal = await mockPaymentClient.getBalance(getPlayerId());
    setBalance(bal.availableSats);
    return bal.availableSats;
  }, []);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

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

      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#1a1030");
      g.addColorStop(0.5, "#2a1848");
      g.addColorStop(1, "#12101c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

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

      ctx.fillStyle = "rgba(15, 23, 20, 0.92)";
      roundRect(ctx, CX - 70, CY - 70, 140, 44, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(74, 222, 128, 0.5)";
      ctx.lineWidth = 2;
      roundRect(ctx, CX - 70, CY - 70, 140, 44, 8);
      ctx.stroke();

      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 15px monospace";
      ctx.textAlign = "center";
      ctx.fillText(potText, CX, CY - 48);

      ctx.font = "36px serif";
      ctx.fillText("🧰", CX + 78, CY - 42);

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

  const placeBet = async () => {
    if (!selected || phase !== "lobby") return;
    setError(null);
    if (betSats < 100) {
      setError("MIN BET 100 SATS");
      return;
    }
    try {
      const result = await mockPaymentClient.insertCoin({
        gameId: session.gameId,
        costSats: betSats,
        playerId: getPlayerId(),
      });
      setBalance(result.remainingSats);
      setActiveStake(betSats);
      window.dispatchEvent(new Event("coinup:balance"));
      setPhase("countdown");
      setCountdown(3);
      let n = 3;
      const t = window.setInterval(() => {
        n -= 1;
        setCountdown(n);
        if (n <= 0) {
          window.clearInterval(t);
          runSpin(betSats);
        }
      }, 650);
    } catch (e) {
      setError(e instanceof Error ? e.message.toUpperCase() : "BET FAILED");
    }
  };

  const runSpin = (stake: number) => {
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
    const potText = formatSatsShort(
      stake * (WHEEL_SEGMENTS.find((s) => s.id === selected)?.mult ?? 1),
    );

    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / duration);
      const e = 1 - (1 - u) ** 3;
      const r = startRot + (targetRot - startRot) * e;
      setRotation(r);
      draw(r, selected, potText);
      if (u < 1) spinRef.current = requestAnimationFrame(tick);
      else void finish(winSeg, stake);
    };
    spinRef.current = requestAnimationFrame(tick);
  };

  const finish = async (winSeg: WheelSegment, stake: number) => {
    setLanded(winSeg);
    setPhase("result");
    const hit = winSeg.id === selected;
    setWon(hit);
    if (hit) {
      const pay = stake * winSeg.mult;
      setPayout(pay);
      try {
        const bal = await mockPaymentClient.claimReward({
          potId: `wheel_${session.sessionId}_${Date.now()}`,
          playerId: getPlayerId(),
          amountSats: pay,
        });
        setBalance(bal.availableSats);
        window.dispatchEvent(new Event("coinup:balance"));
      } catch {
        /* ignore */
      }
      onScore({
        gameId: session.gameId,
        sessionId: session.sessionId,
        score: pay,
        meta: { mult: winSeg.mult, segment: winSeg.id, won: true, stake },
      });
    } else {
      setPayout(0);
      await refreshBalance();
      onScore({
        gameId: session.gameId,
        sessionId: session.sessionId,
        score: 0,
        meta: { mult: winSeg.mult, segment: winSeg.id, won: false, stake },
      });
    }
  };

  /** Stay at the wheel — next spin from wallet, no exit */
  const playAgain = () => {
    setPhase("lobby");
    setLanded(null);
    setWon(false);
    setPayout(0);
    setActiveStake(0);
    setError(null);
    // keep color selection & bet amount
    void refreshBalance();
  };

  const adjustBet = (delta: number) => {
    setBetSats((n) => {
      const next = Math.max(100, Math.min(balance || n, n + delta));
      // snap to 100
      return Math.floor(next / 100) * 100 || 100;
    });
  };

  const mm = String(Math.floor(timerLeft / 60)).padStart(2, "0");
  const ss = String(timerLeft % 60).padStart(2, "0");

  return (
    <div className="cw-shell">
      <header className="cw-top">
        <h1 className="cw-title">
          CRAZY <span>WHEEL</span>
        </h1>
        <div className="cw-timer">
          <span className="cw-timer-val">
            {mm}:{ss}
          </span>
          <span className="cw-timer-sub">OPEN</span>
        </div>
        <div className="cw-players">
          <p className="cw-players-h">WALLET</p>
          <p className="cw-players-line cw-players-line--bal">
            {formatSats(balance).toUpperCase()}
          </p>
          {selectedSeg && (
            <p className="cw-players-line" style={{ color: selectedSeg.color }}>
              BET {selectedSeg.label.toUpperCase()}
            </p>
          )}
        </div>
      </header>

      <div className="cw-stage">
        <canvas ref={canvasRef} width={W} height={H} className="cw-canvas" />
        {phase === "countdown" && (
          <div className="cw-overlay">
            <span className="cw-count">{countdown > 0 ? countdown : "GO"}</span>
          </div>
        )}
      </div>

      {phase === "lobby" && (
        <>
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
          <div className="cw-presets">
            {BET_PRESETS.map((amt) => (
              <button
                key={amt}
                type="button"
                className={`cw-preset${betSats === amt ? " cw-preset--on" : ""}`}
                disabled={balance < amt}
                onClick={() => setBetSats(amt)}
              >
                {amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>
        </>
      )}

      {error && <p className="cw-error">{error}</p>}

      {phase === "result" && landed && (
        <div className={`cw-result${won ? " cw-result--win" : ""}`}>
          <p className="cw-result-title">{won ? "YOU WIN" : "NO HIT"}</p>
          <p style={{ color: landed.color }}>
            LANDED {landed.label.toUpperCase()}
            {activeStake
              ? ` · STAKE ${formatSats(activeStake).toUpperCase()}`
              : ""}
          </p>
          {won && (
            <p className="cw-result-pay">+{formatSats(payout).toUpperCase()}</p>
          )}
          <p className="cw-result-bal">
            BALANCE {formatSats(balance).toUpperCase()}
          </p>
        </div>
      )}

      <footer className="cw-bar">
        <div className="cw-user">
          <span className="cw-avatar">₿</span>
          <div>
            <p className="cw-user-name">{guest}</p>
            <p className="cw-user-bal">{formatSats(balance).toUpperCase()}</p>
          </div>
        </div>

        {phase === "lobby" && (
          <div className="cw-bet-ctrl">
            <button
              type="button"
              className="cw-step"
              disabled={betSats <= 100}
              onClick={() => adjustBet(-100)}
            >
              −
            </button>
            <span className="cw-bet-amt" title="Bet in sats">
              {formatBetLabel(betSats)}
            </span>
            <button
              type="button"
              className="cw-step"
              disabled={betSats + 100 > balance}
              onClick={() => adjustBet(100)}
            >
              +
            </button>
          </div>
        )}

        {phase === "lobby" ? (
          <button
            type="button"
            className="cw-place"
            disabled={!selected || betSats > balance || balance < 100}
            onClick={() => void placeBet()}
          >
            PLACE BET · {formatBetLabel(betSats)}
          </button>
        ) : phase === "result" ? (
          <button type="button" className="cw-place" onClick={playAgain}>
            SPIN AGAIN
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
        COINUP ARCADE · BET FROM WALLET · KEEP SPINNING · PLAY AT YOUR OWN RISK
      </p>
    </div>
  );
}

function formatBetLabel(sats: number): string {
  if (sats >= 1000) return `${(sats / 1000).toFixed(sats % 1000 === 0 ? 0 : 1)}k`;
  return String(sats);
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
