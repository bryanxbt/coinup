"use client";

import { useEffect, useRef, useState } from "react";

type TypeTextProps = {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursor?: boolean;
  holdCursor?: boolean;
  onDone?: () => void;
  as?: "span" | "p" | "h1" | "h2" | "div";
};

export function TypeText({
  text,
  speed = 28,
  delay = 0,
  className = "",
  cursor = true,
  holdCursor = true,
  onDone,
  as: Tag = "span",
}: TypeTextProps) {
  const [shown, setShown] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    doneRef.current = false;
    setShown("");
    setDone(false);
    setStarted(false);
    const start = window.setTimeout(() => setStarted(true), delay);
    return () => window.clearTimeout(start);
  }, [text, delay]);

  useEffect(() => {
    if (!started || doneRef.current) return;

    if (shown.length >= text.length) {
      doneRef.current = true;
      setDone(true);
      onDoneRef.current?.();
      return;
    }

    const t = window.setTimeout(() => {
      setShown(text.slice(0, shown.length + 1));
    }, speed);
    return () => window.clearTimeout(t);
  }, [started, shown, text, speed]);

  const showCursor = cursor && (!done || holdCursor);

  return (
    <Tag className={className}>
      {shown}
      {showCursor && (
        <span
          className={`type-cursor${done ? " type-cursor--blink" : ""}`}
          aria-hidden
        >
          █
        </span>
      )}
    </Tag>
  );
}

function StaticLine({
  text,
  className,
  cursor,
}: {
  text: string;
  className?: string;
  cursor?: boolean;
}) {
  return (
    <p className={className}>
      {text}
      {cursor && (
        <span className="type-cursor type-cursor--blink" aria-hidden>
          █
        </span>
      )}
    </p>
  );
}

/** Types lines sequentially; final line keeps a blinking cursor. */
export function TypeLines({
  lines,
  speed = 22,
  lineGap = 200,
  className = "",
  lineClassName = "",
  onAllDone,
}: {
  lines: string[];
  speed?: number;
  lineGap?: number;
  className?: string;
  lineClassName?: string;
  onAllDone?: () => void;
}) {
  const [lineIndex, setLineIndex] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const firedRef = useRef(false);
  const onAllDoneRef = useRef(onAllDone);
  onAllDoneRef.current = onAllDone;

  useEffect(() => {
    setLineIndex(0);
    setAllDone(false);
    firedRef.current = false;
  }, [lines.join("\0")]);

  if (allDone) {
    return (
      <div className={className}>
        {lines.map((line, i) => (
          <StaticLine
            key={`done-${i}`}
            text={line}
            className={lineClassName}
            cursor={i === lines.length - 1}
          />
        ))}
      </div>
    );
  }

  const completed = lines.slice(0, lineIndex);
  const current = lines[lineIndex];

  return (
    <div className={className}>
      {completed.map((line, i) => (
        <StaticLine key={`c-${i}`} text={line} className={lineClassName} />
      ))}
      {current !== undefined && (
        <TypeText
          key={`t-${lineIndex}`}
          text={current}
          speed={speed}
          delay={lineIndex === 0 ? 80 : lineGap}
          className={lineClassName}
          as="p"
          holdCursor={lineIndex === lines.length - 1}
          onDone={() => {
            if (lineIndex >= lines.length - 1) {
              setAllDone(true);
              if (!firedRef.current) {
                firedRef.current = true;
                onAllDoneRef.current?.();
              }
            } else {
              setLineIndex((i) => i + 1);
            }
          }}
        />
      )}
    </div>
  );
}
