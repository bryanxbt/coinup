"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GamePlayProps } from "../types";
import {
  pickWeightedIndex,
  segmentAngles,
  WHEEL_SEGMENTS,
  type WheelSegment,
} from "./segments";
import { formatSats, mockPaymentClient } from "@/lib/payments";
import { getPlayerId } from "@/lib/player";

const W = 340;
const H = 280;
const CX = W / 2;
const CY = H - 36;
const R_OUTER = 150;
const R_INNER = 72;

type Phase = "pick" | "countdown" | "spinning" | "result";

export function CrazyWheel({ session, onScore, onExit }: GamePlayProps) {
  const stake = session.creditsSpent;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("pick");
  const [selected, setSelected] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [rotation, setRotation] = useState(0); // radians offset of wheel
  const [landed, setLanded] = useState<WheelSegment | null>(null);
  const [won, setWon] = useState(false);
  const [payout, setPayout] = useState(0);
  const [status, setStatus] = useState("PICK A COLOR · THEN SPIN");
  const spinRef = useRef<number | null>(null);

  const angles = segmentAngles(WHEEL_SEGMENTS.length);

  const draw = useCallback(
    (rot: number, highlightId: string | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#0a0612";
      ctx.fillRect(0, 0, W, H);

      // hex floor vibe
      ctx.strokeStyle = "rgba(139,92,246,0.15)";
      ctx.lineWidth = 1;
      for (let y = 0; y < H; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // wheel wedges (semicircle)
      WHEEL_SEGMENTS.forEach((seg, i) => {
        const a = angles[i];
        const start = a.start + rot;
        const end = a.end + rot;
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.arc(CX, CY, R_OUTER, -start, -end, true);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();

        // inner cut for ring look
        // labels along mid
        const mid = a.mid + rot;
        const lx = CX + Math.cos(-mid) * ((R_OUTER + R_INNER) / 2);
        const ly = CY + Math.sin(-mid) * ((R_OUTER + R_INNER) / 2);
        ctx.fillStyle = "#000";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(seg.label, lx, ly);

        if (highlightId === seg.id) {
          ctx.beginPath();
          ctx.moveTo(CX, CY);
          ctx.arc(CX, CY, R_OUTER + 4, -start, -end, true);
          ctx.closePath();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      });

      // center well
      ctx.beginPath();
      ctx.arc(CX, CY, R_INNER, Math.PI, 0, true);
      ctx.lineTo(CX + R_INNER, CY + 20);
      ctx.lineTo(CX - R_INNER, CY + 20);
      ctx.closePath();
      ctx.fillStyle = "#14141a";
      ctx.fill();
      ctx.strokeStyle = "#2a2a33";
      ctx.lineWidth = 3;
      ctx.stroke();

      // treasure / pot
      ctx.fillStyle = "#EAB308";
      ctx.font = "28px serif";
      ctx.textAlign = "center";
      ctx.fillText("🎁", CX, CY - 28);
      ctx.fillStyle = "#00de76";
      ctx.font = "10px monospace";
      const potLabel = selected
        ? formatSats(
            stake * (WHEEL_SEGMENTS.find((s) => s.id === selected)?.mult ?? 1),
          )
        : formatSats(stake);
      ctx.fillText(potLabel.toUpperCase(), CX, CY - 4);
      ctx.fillStyle = "#5c5c6b";
      ctx.font = "8px monospace";
      ctx.fillText("POT IF WIN", CX, CY + 12);

      // pointer at top center of arc
      ctx.beginPath();
      ctx.moveTo(CX, CY - R_OUTER - 8);
      ctx.lineTo(CX - 10, CY - R_OUTER + 10);
      ctx.lineTo(CX + 10, CY - R_OUTER + 10);
      ctx.closePath();
      ctx.fillStyle = "#22d3ee";
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [angles, selected, stake],
  );

  useEffect(() => {
    draw(rotation, selected);
  }, [draw, rotation, selected]);

  useEffect(() => {
    return () => {
      if (spinRef.current) cancelAnimationFrame(spinRef.current);
    };
  }, []);

  const startSpin = () => {
    if (!selected || phase !== "pick") return;
    setPhase("countdown");
    setStatus("LOCKING BET…");
    setCountdown(3);
    let n = 3;
    const t = window.setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        window.clearInterval(t);
        runSpin();
      }
    }, 700);
  };

  const runSpin = () => {
    setPhase("spinning");
    setStatus("WHEEL IS CRAZY…");
    const winIndex = pickWeightedIndex();
    const winSeg = WHEEL_SEGMENTS[winIndex];
    const a = angles[winIndex];
    // Pointer is at top = angle -π/2 in canvas... our arcs use cos(-mid).
    // Target: segment mid should sit under pointer (top of semicircle = -π/2 in standard,
    // which is mid angle of π/2 from left... Our mid for center segment ~ π/2.
    // Pointer is at top of arc: direction from center is angle -π/2 in standard math = up.
    // We use angle system where 0 is right, π is left, mid of semicircle top is π/2.
    // We need mid + rot ≡ π/2 (mod full circle for the wedge under pointer)
    // rot = π/2 - mid + 2π*k for some k
    const targetMid = a.mid;
    const pointerAngle = Math.PI / 2;
    let targetRot = pointerAngle - targetMid;
    // add multiple full turns for drama (spin in increasing rot)
    const turns = 4 + Math.random() * 2;
    const startRot = rotation;
    // normalize so we always spin "forward" a lot
    while (targetRot < startRot + turns * Math.PI) {
      targetRot += Math.PI * 2;
    }
    // only semicircle content but rotation still full 2π for animation feel
    const duration = 3200;
    const t0 = performance.now();

    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / duration);
      // ease-out cubic
      const e = 1 - (1 - u) ** 3;
      const r = startRot + (targetRot - startRot) * e;
      setRotation(r);
      draw(r, selected);
      if (u < 1) {
        spinRef.current = requestAnimationFrame(tick);
      } else {
        finishSpin(winSeg);
      }
    };
    spinRef.current = requestAnimationFrame(tick);
  };

  const finishSpin = async (winSeg: WheelSegment) => {
    setLanded(winSeg);
    setPhase("result");
    const hit = winSeg.id === selected;
    setWon(hit);
    if (hit) {
      const pay = stake * winSeg.mult;
      setPayout(pay);
      setStatus(`HIT ${winSeg.label} · YOU WIN`);
      try {
        await mockPaymentClient.claimReward({
          potId: `wheel_${session.sessionId}`,
          playerId: getPlayerId(),
          amountSats: pay,
        });
        window.dispatchEvent(new Event("coinup:balance"));
      } catch {
        setStatus("WIN RECORDED · CLAIM FAILED");
      }
      onScore({
        gameId: session.gameId,
        sessionId: session.sessionId,
        score: pay,
        meta: { mult: winSeg.mult, segment: winSeg.id, won: true },
      });
    } else {
      setPayout(0);
      setStatus(`LANDED ${winSeg.label} · NO PAY`);
      onScore({
        gameId: session.gameId,
        sessionId: session.sessionId,
        score: 0,
        meta: { mult: winSeg.mult, segment: winSeg.id, won: false },
      });
    }
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <div className="w-full text-center">
        <p className="font-pixel text-[10px] text-[var(--neon-amber)]">CRAZY WHEEL</p>
        <p className="mt-1 font-pixel text-[8px] text-[var(--crt-green)]">{status}</p>
        <p className="mt-1 font-pixel text-[8px] text-[#5c5c6b]">
          STAKE {formatSats(stake).toUpperCase()}
        </p>
      </div>

      <div className="relative border-4 border-[#2a2a33] bg-[#0a0612] shadow-[6px_6px_0_#000]">
        <canvas ref={canvasRef} width={W} height={H} className="pixelated block" />
        {phase === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="font-pixel text-4xl text-[var(--neon-magenta)]">
              {countdown > 0 ? countdown : "GO"}
            </span>
          </div>
        )}
      </div>

      {phase === "pick" && (
        <>
          <div className="grid w-full grid-cols-4 gap-2 sm:grid-cols-7">
            {WHEEL_SEGMENTS.map((seg) => (
              <button
                key={seg.id}
                type="button"
                onClick={() => {
                  setSelected(seg.id);
                  setStatus(`BET ON ${seg.label} · ${seg.mult}X`);
                }}
                className="pixel-btn !px-1 !py-2 flex flex-col gap-1"
                style={{
                  background: seg.color,
                  color: "#000",
                  outline:
                    selected === seg.id ? "3px solid #fff" : "3px solid #000",
                }}
              >
                <span className="text-[8px]">{seg.label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="pixel-btn pixel-btn--green w-full"
            disabled={!selected}
            onClick={startSpin}
          >
            PLACE BET · SPIN
          </button>
        </>
      )}

      {phase === "result" && landed && (
        <div className="pixel-panel w-full border-[var(--neon-amber)] p-4 text-center">
          <p className="font-pixel text-[10px] text-white">
            {won ? "YOU WIN" : "BUST"}
          </p>
          <p className="mt-2 font-pixel text-[9px]" style={{ color: landed.color }}>
            {landed.label} · {landed.mult}X
          </p>
          {won && (
            <p className="mt-2 font-pixel text-[9px] text-[var(--crt-green)]">
              +{formatSats(payout).toUpperCase()}
            </p>
          )}
          <button
            type="button"
            className="pixel-btn mt-4 w-full"
            onClick={() => {
              // another spin requires new insert coin from play client
              onExit();
            }}
          >
            BACK · INSERT AGAIN TO REPLAY
          </button>
        </div>
      )}

      {(phase === "pick" || phase === "countdown" || phase === "spinning") && (
        <button type="button" className="pixel-btn pixel-btn--ghost" onClick={onExit}>
          LEAVE CABINET
        </button>
      )}
    </div>
  );
}
