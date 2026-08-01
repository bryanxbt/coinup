/** Minimal markdown → React for brand book chapters (no extra deps). */
import type { JSX, ReactNode } from "react";

function inlineFormat(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // split by `code`, **bold**, *italic*, [links](url)
  const re =
    /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em] text-amber-200"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      parts.push(
        <em key={key++} className="italic text-zinc-300">
          {token.slice(1, -1)}
        </em>,
      );
    } else if (token.startsWith("[")) {
      const lm = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (lm) {
        parts.push(
          <a
            key={key++}
            href={lm[2]}
            className="text-cyan-400 underline-offset-2 hover:underline"
          >
            {lm[1]}
          </a>,
        );
      }
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // fenced code
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3);
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        body.push(lines[i]);
        i++;
      }
      i++; // close fence
      blocks.push(
        <pre
          key={key++}
          className="my-4 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-xs text-zinc-300"
        >
          <code data-lang={lang}>{body.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // table
    if (line.includes("|") && lines[i + 1]?.match(/^\|?[\s:-]+\|/)) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        const cells = lines[i]
          .split("|")
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1 || arr[0] !== "");
        // simpler split
        const raw = lines[i].trim().replace(/^\|/, "").replace(/\|$/, "");
        const parts = raw.split("|").map((c) => c.trim());
        if (!parts.every((p) => /^[-:]+$/.test(p))) {
          rows.push(parts);
        }
        i++;
      }
      if (rows.length) {
        const [head, ...body] = rows;
        blocks.push(
          <div key={key++} className="my-4 overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/15">
                  {head.map((c, ci) => (
                    <th
                      key={ci}
                      className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-pink-400"
                    >
                      {inlineFormat(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className="border-b border-white/5">
                    {row.map((c, ci) => (
                      <td key={ci} className="px-3 py-2 text-zinc-300">
                        {inlineFormat(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
      }
      continue;
    }

    // headings
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      const cls =
        level === 1
          ? "mt-2 mb-4 font-mono text-3xl font-bold tracking-tight text-white"
          : level === 2
            ? "mt-10 mb-3 font-mono text-xl font-bold text-white"
            : level === 3
              ? "mt-8 mb-2 font-mono text-lg font-semibold text-zinc-100"
              : "mt-6 mb-2 font-mono text-sm font-semibold uppercase tracking-wider text-pink-400";
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      blocks.push(
        <Tag key={key++} className={cls}>
          {inlineFormat(text)}
        </Tag>,
      );
      i++;
      continue;
    }

    // blockquote
    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-4 border-l-4 border-amber-400/80 bg-amber-400/5 py-3 pl-4 font-mono text-sm leading-relaxed text-amber-100"
        >
          {quote.map((q, qi) => (
            <p key={qi} className="mb-1 last:mb-0">
              {inlineFormat(q)}
            </p>
          ))}
        </blockquote>,
      );
      continue;
    }

    // list
    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      const ordered = /^\d+\./.test(line);
      while (
        i < lines.length &&
        (/^[-*]\s+/.test(lines[i]) || /^\d+\.\s+/.test(lines[i]))
      ) {
        items.push(lines[i].replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""));
        i++;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag
          key={key++}
          className={`my-3 space-y-1.5 pl-5 text-sm text-zinc-300 ${ordered ? "list-decimal" : "list-disc"}`}
        >
          {items.map((item, ii) => (
            <li key={ii}>{inlineFormat(item)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    // hr
    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={key++} className="my-8 border-white/10" />);
      i++;
      continue;
    }

    // paragraph (merge consecutive)
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith(">") &&
      !lines[i].startsWith("```") &&
      !lines[i].includes("|") &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim())
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="my-3 text-[15px] leading-relaxed text-zinc-400">
        {inlineFormat(para.join(" "))}
      </p>,
    );
  }

  return <div className="brand-md max-w-3xl">{blocks}</div>;
}
