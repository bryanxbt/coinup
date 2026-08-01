import fs from "fs";
import path from "path";
import { chapters, type BrandChapter } from "./toc";

const BOOK_DIR = path.join(process.cwd(), "docs/brand-book");

export function chapterFileName(chapter: BrandChapter): string {
  return `${chapter.number}-${chapter.slug === "the-world" ? "the-world" : chapter.slug === "lore" ? "lore" : chapter.slug}.md`;
}

/** Map slug → filename on disk */
const SLUG_TO_FILE: Record<string, string> = {
  cover: "00-cover.md",
  "brand-definition": "01-brand-definition.md",
  positioning: "02-positioning.md",
  "the-world": "03-the-world.md",
  "visual-identity": "04-visual-identity.md",
  "color-system": "05-color-system.md",
  typography: "06-typography.md",
  "pixel-system": "07-pixel-system.md",
  "chip-bible": "08-chip-bible.md",
  "world-building": "09-world-building.md",
  "cabinet-system": "10-cabinet-system.md",
  "ui-system": "11-ui-system.md",
  motion: "12-motion.md",
  "sound-identity": "13-sound-identity.md",
  merchandise: "14-merchandise.md",
  "social-media": "15-social-media.md",
  "marketing-templates": "16-marketing-templates.md",
  events: "17-events.md",
  achievements: "18-achievements.md",
  economy: "19-economy.md",
  "illustration-style": "20-illustration-style.md",
  photography: "21-photography.md",
  "environmental-graphics": "22-environmental-graphics.md",
  lore: "23-lore.md",
  copywriting: "24-copywriting.md",
  "brand-applications": "25-brand-applications.md",
};

export function loadChapterMarkdown(slug: string): string | null {
  const file = SLUG_TO_FILE[slug];
  if (!file) return null;
  const full = path.join(BOOK_DIR, file);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8");
}

export function listChapterMeta() {
  return chapters;
}
