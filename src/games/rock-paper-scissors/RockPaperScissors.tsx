"use client";

import { useEffect, useRef, useState } from "react";
import type { GamePlayProps } from "../types";
import { CHOICES, type RpsChoice } from "./logic";
import { joinRpsLive, type RpsNetHandle, type RpsNetView } from "./rpsNet";
import { formatSats, mockPaymentClient } from "@/lib/payments";
import { getGuestName, getPlayerId } from "@/lib/player";

const ENTRY = 1000;

export function RockPaperScissors({ session, onScore, onExit }: GamePlayProps) {
  const [view, setView] = useState<RpsNetView>({
    status: "connecting",
    message: "BOOTING…",
    match: null,
    queueSize: 0,
  });
  const [rewardMsg, setRewardMsg] = useState<string | null>(null);
  const handleRef = useRef<RpsNetHandle | null>(null);

  useEffect(() => {
    let dead = false;
    const playerId = getPlayerId();
    const name = getGuestName();

    void (async () => {
      const handle = await joinRpsLive({
        playerId,
        name,
        sessionId: session.sessionId,
        entrySats: session.creditsSpent || ENTRY,
        practice: false,
        callbacks: {
          onView: (v) => {
            if (!dead) setView(v);
          },
          onWin: async (potSats, match) => {
            try {
              await mockPaymentClient.claimReward({
                potId: match.id,
                playerId,
                amountSats: potSats,
              });
              window.dispatchEvent(new Event("coinup:balance"));
              if (!dead) {
                setRewardMsg(`+${formatSats(potSats).toUpperCase()} TO YOUR CREDITS`);
              }
              onScore({
                gameId: session.gameId,
                sessionId: session.sessionId,
                score: match.p1.id === playerId ? match.p1Wins : match.p2Wins,
                meta: {
                  potSats,
                  winner: true,
                  multiplayer: true,
                },
              });
            } catch {
              if (!dead) setRewardMsg("REWARD CLAIM FAILED");
            }
          },
        },
      });
      if (dead) {
        handle.destroy();
        return;
      }
      handleRef.current = handle;
    })();

    return () => {
      dead = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [session, onScore]);

  const match = view.match;
  const me = getPlayerId();
  const myPick =
    match && match.p1.id === me
      ? match.picks.p1
      : match && match.p2.id === me
        ? match.picks.p2
        : null;
  const oppName =
    match && match.p1.id === me
      ? match.p2.name
      : match
        ? match.p1.name
        : "???";
  const myWins =
    match && match.p1.id === me ? match.p1Wins : match ? match.p2Wins : 0;
  const oppWins =
    match && match.p1.id === me ? match.p2Wins : match ? match.p1Wins : 0;

  const canPick =
    match?.phase === "waiting_picks" &&
    !myPick &&
    view.status !== "finished";

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 px-2 py-2">
      <div className="w-full text-center">
        <p className="font-pixel text-[8px] text-[#5c5c6b]">LIVE DUEL · BEST OF 3</p>
        <p className="mt-2 font-pixel text-[10px] text-[var(--neon-amber)]">
          {view.message}
        </p>
        {match && (
          <p className="mt-2 font-pixel text-[8px] text-[var(--crt-green)]">
            POT {formatSats(match.potSats).toUpperCase()}
          </p>
        )}
      </div>

      {(view.status === "queued" || view.status === "connecting") && !match && (
        <div className="pixel-panel w-full border-[var(--crt-green)] p-5 text-center">
          <p className="font-pixel text-[9px] leading-relaxed text-[var(--crt-green)]">
            {view.message}
          </p>
          <p className="mt-3 font-pixel text-[8px] text-[#5c5c6b]">
            LIVE DUEL ROOM · BOTH MUST PAY ENTRY
          </p>
          <p className="mt-4 font-pixel text-[7px] leading-relaxed text-[#3a3a44]">
            NORMAL WINDOW + INCOGNITO. INSERT COIN ON BOTH. WHEN LINKED YOU
            SHOULD SEE ROCK / PAPER / SCISSORS BUTTONS.
          </p>
          <button
            type="button"
            className="pixel-btn pixel-btn--ghost mt-5"
            onClick={() => {
              handleRef.current?.destroy();
              void (async () => {
                const handle = await joinRpsLive({
                  playerId: getPlayerId(),
                  name: getGuestName(),
                  sessionId: session.sessionId,
                  entrySats: session.creditsSpent || ENTRY,
                  practice: true,
                  callbacks: {
                    onView: setView,
                    onWin: async (potSats, m) => {
                      await mockPaymentClient.claimReward({
                        potId: m.id,
                        playerId: getPlayerId(),
                        amountSats: potSats,
                      });
                      window.dispatchEvent(new Event("coinup:balance"));
                      setRewardMsg(
                        `PRACTICE +${formatSats(potSats).toUpperCase()}`,
                      );
                    },
                  },
                });
                handleRef.current = handle;
              })();
            }}
          >
            PRACTICE VS CHIP-CPU
          </button>
        </div>
      )}

      {match && (view.status === "matched" || view.status === "practice" || view.status === "finished") && (
        <>
          <div className="flex w-full items-center justify-between gap-2 font-pixel text-[8px]">
            <div className="text-[var(--crt-green)]">
              YOU
              <br />
              <span className="text-lg text-white">{myWins}</span>
            </div>
            <div className="text-center text-[#5c5c6b]">
              R{match.round}
              <br />
              <span className="text-[var(--neon-magenta)]">VS</span>
            </div>
            <div className="text-right text-[var(--neon-cyan)]">
              {oppName}
              <br />
              <span className="text-lg text-white">{oppWins}</span>
            </div>
          </div>

          {match.phase === "reveal" && match.lastRound && (
            <div className="pixel-panel w-full border-[var(--neon-magenta)] p-4 text-center">
              <p className="font-pixel text-[8px] text-[#5c5c6b]">REVEAL</p>
              <p className="mt-2 font-pixel text-[11px] text-white">
                {glyph(match.lastRound.p1)} VS {glyph(match.lastRound.p2)}
              </p>
              <p className="mt-2 font-pixel text-[9px] text-[var(--neon-amber)]">
                {match.lastRound.result === 0
                  ? "DRAW"
                  : match.lastRound.result === 1
                    ? `${match.p1.name} WINS ROUND`
                    : `${match.p2.name} WINS ROUND`}
              </p>
            </div>
          )}

          {match.phase === "waiting_picks" && (
            <div className="grid w-full grid-cols-3 gap-2">
              {CHOICES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={!canPick}
                  onClick={() => handleRef.current?.setPick(c.id)}
                  className={`pixel-btn flex flex-col gap-2 !px-2 !py-4 ${
                    myPick === c.id ? "pixel-btn--green" : ""
                  } ${!canPick ? "opacity-40" : ""}`}
                >
                  <span className="text-2xl">{c.glyph}</span>
                  <span className="text-[7px]">{c.label}</span>
                </button>
              ))}
            </div>
          )}

          {myPick && match.phase === "waiting_picks" && (
            <p className="font-pixel text-[8px] text-[var(--crt-green)]">
              LOCKED · WAITING ON OPPONENT…
            </p>
          )}

          {view.status === "finished" && (
            <div className="pixel-panel w-full border-[var(--neon-amber)] p-4 text-center">
              <p className="font-pixel text-[10px] text-[var(--neon-amber)]">
                {match.winnerId === me ? "VICTORY" : "DEFEAT"}
              </p>
              {rewardMsg && (
                <p className="mt-2 font-pixel text-[8px] text-[var(--crt-green)]">
                  {rewardMsg}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {view.status === "error" && (
        <p className="font-pixel text-[8px] text-[var(--orange)]">{view.message}</p>
      )}

      <button type="button" className="pixel-btn pixel-btn--ghost mt-2" onClick={onExit}>
        LEAVE CABINET
      </button>
    </div>
  );
}

function glyph(c: RpsChoice): string {
  return CHOICES.find((x) => x.id === c)?.glyph ?? c;
}
