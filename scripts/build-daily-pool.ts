/**
 * build-daily-pool.ts
 * -------------------------------------------------------------------------
 * Fetches a curated set of famous, beloved public-domain books from Project
 * Gutenberg (via the Gutendex API) and extracts several clean ~60–110 word
 * passages from each. Results are merged into `public/passages/pool.json`,
 * de-duplicated by passage id.
 *
 * Design notes:
 *   - The point of the daily page is recognition — "oh, I love that book". So
 *     the list below is deliberately crowd-pleasing (openings people can quote),
 *     not a random public-domain grab-bag.
 *   - Several passages per book (unique ids) means the pool GROWS, rather than
 *     one-per-book that a re-run just overwrites.
 *   - This runs unattended in CI, so it never trusts a hand-typed Gutenberg id:
 *     Gutendex's own `languages` (and a loose title check) must agree before a
 *     book is used, or it is skipped. A wrong id can therefore never mislabel a
 *     passage or slip a foreign-language book into the wrong list.
 *
 * Run with:  npx tsx scripts/build-daily-pool.ts
 * Requires:  Node 18+ (built-in fetch), tsx. No other packages.
 * -------------------------------------------------------------------------
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

interface BookMeta {
  id: string; // slug base for passage ids, e.g. "austen-pride-and-prejudice"
  title: string;
  author: string;
  language: "en" | "fr" | "es" | "de";
  year: number;
  gutenbergId: number;
}

// ---------------------------------------------------------------------------
// Curated, beloved, verifiably public-domain books. Gutenberg ids are checked
// against Gutendex at runtime (language + title), so a stale id fails safe.
// ---------------------------------------------------------------------------
const CURATED_BOOKS: BookMeta[] = [
  // — English —
  { id: "austen-pride-and-prejudice", title: "Pride and Prejudice", author: "Jane Austen", language: "en", year: 1813, gutenbergId: 1342 },
  { id: "austen-emma", title: "Emma", author: "Jane Austen", language: "en", year: 1815, gutenbergId: 158 },
  { id: "dickens-tale-of-two-cities", title: "A Tale of Two Cities", author: "Charles Dickens", language: "en", year: 1859, gutenbergId: 98 },
  { id: "dickens-great-expectations", title: "Great Expectations", author: "Charles Dickens", language: "en", year: 1861, gutenbergId: 1400 },
  { id: "dickens-christmas-carol", title: "A Christmas Carol", author: "Charles Dickens", language: "en", year: 1843, gutenbergId: 46 },
  { id: "melville-moby-dick", title: "Moby-Dick", author: "Herman Melville", language: "en", year: 1851, gutenbergId: 2701 },
  { id: "shelley-frankenstein", title: "Frankenstein", author: "Mary Shelley", language: "en", year: 1818, gutenbergId: 84 },
  { id: "carroll-alice-in-wonderland", title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", language: "en", year: 1865, gutenbergId: 11 },
  { id: "doyle-sherlock-holmes", title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", language: "en", year: 1892, gutenbergId: 1661 },
  { id: "stoker-dracula", title: "Dracula", author: "Bram Stoker", language: "en", year: 1897, gutenbergId: 345 },
  { id: "bronte-jane-eyre", title: "Jane Eyre", author: "Charlotte Brontë", language: "en", year: 1847, gutenbergId: 1260 },
  { id: "bronte-wuthering-heights", title: "Wuthering Heights", author: "Emily Brontë", language: "en", year: 1847, gutenbergId: 768 },
  { id: "wilde-dorian-gray", title: "The Picture of Dorian Gray", author: "Oscar Wilde", language: "en", year: 1890, gutenbergId: 174 },
  { id: "twain-huckleberry-finn", title: "Adventures of Huckleberry Finn", author: "Mark Twain", language: "en", year: 1884, gutenbergId: 76 },
  { id: "twain-tom-sawyer", title: "The Adventures of Tom Sawyer", author: "Mark Twain", language: "en", year: 1876, gutenbergId: 74 },
  { id: "london-call-of-the-wild", title: "The Call of the Wild", author: "Jack London", language: "en", year: 1903, gutenbergId: 215 },
  { id: "wells-war-of-the-worlds", title: "The War of the Worlds", author: "H. G. Wells", language: "en", year: 1898, gutenbergId: 36 },
  { id: "wells-time-machine", title: "The Time Machine", author: "H. G. Wells", language: "en", year: 1895, gutenbergId: 35 },
  { id: "stevenson-treasure-island", title: "Treasure Island", author: "Robert Louis Stevenson", language: "en", year: 1883, gutenbergId: 120 },
  { id: "barrie-peter-pan", title: "Peter Pan", author: "J. M. Barrie", language: "en", year: 1911, gutenbergId: 16 },
  { id: "baum-wizard-of-oz", title: "The Wonderful Wizard of Oz", author: "L. Frank Baum", language: "en", year: 1900, gutenbergId: 55 },
  { id: "montgomery-anne-of-green-gables", title: "Anne of Green Gables", author: "L. M. Montgomery", language: "en", year: 1908, gutenbergId: 45 },
  { id: "fitzgerald-great-gatsby", title: "The Great Gatsby", author: "F. Scott Fitzgerald", language: "en", year: 1925, gutenbergId: 64317 },
  { id: "homer-odyssey", title: "The Odyssey", author: "Homer", language: "en", year: -700, gutenbergId: 1727 },

  // — Français —
  { id: "hugo-les-miserables", title: "Les Misérables", author: "Victor Hugo", language: "fr", year: 1862, gutenbergId: 17489 },
  { id: "flaubert-madame-bovary", title: "Madame Bovary", author: "Gustave Flaubert", language: "fr", year: 1857, gutenbergId: 14155 },
  { id: "voltaire-candide", title: "Candide", author: "Voltaire", language: "fr", year: 1759, gutenbergId: 4650 },
  { id: "dumas-trois-mousquetaires", title: "Les Trois Mousquetaires", author: "Alexandre Dumas", language: "fr", year: 1844, gutenbergId: 13951 },
  { id: "leroux-fantome-opera", title: "Le Fantôme de l'Opéra", author: "Gaston Leroux", language: "fr", year: 1910, gutenbergId: 62215 },
  { id: "verne-tour-du-monde", title: "Le Tour du monde en quatre-vingts jours", author: "Jules Verne", language: "fr", year: 1873, gutenbergId: 800 },

  // — Español —
  { id: "cervantes-don-quijote", title: "Don Quijote", author: "Miguel de Cervantes", language: "es", year: 1605, gutenbergId: 2000 },
  { id: "clarin-la-regenta", title: "La Regenta", author: "Leopoldo Alas «Clarín»", language: "es", year: 1884, gutenbergId: 17073 },

  // — Deutsch —
  { id: "kafka-die-verwandlung", title: "Die Verwandlung", author: "Franz Kafka", language: "de", year: 1915, gutenbergId: 22367 },
  { id: "goethe-werther", title: "Die Leiden des jungen Werthers", author: "Johann Wolfgang von Goethe", language: "de", year: 1774, gutenbergId: 2407 },
  { id: "goethe-faust", title: "Faust", author: "Johann Wolfgang von Goethe", language: "de", year: 1808, gutenbergId: 2229 },
  { id: "grimm-maerchen", title: "Märchen der Gebrüder Grimm", author: "Brüder Grimm", language: "de", year: 1812, gutenbergId: 20050 },
];

interface Passage {
  id: string;
  title: string;
  author: string;
  language: string;
  year: number;
  text: string;
}

interface PassagePool {
  passages: Passage[];
}

// Run from the project root (npm script / CI both do), so cwd resolution is
// portable across CommonJS and ESM without needing __dirname / import.meta.
const POOL_PATH = path.resolve(process.cwd(), "public", "passages", "pool.json");
const MIN_WORDS = 60;
const MAX_WORDS = 110;
const PASSAGES_PER_BOOK = 4;

interface BookInfo {
  url: string;
  languages: string[];
  title: string;
}

/** Resolve a Gutenberg id to its plain-text URL plus the metadata we validate against. */
async function getBookInfo(gutenbergId: number): Promise<BookInfo | null> {
  try {
    const res = await fetch(`https://gutendex.com/books/${gutenbergId}`);
    if (!res.ok) {
      console.warn(`  [warn] Gutendex lookup failed for id ${gutenbergId}: HTTP ${res.status}`);
      return null;
    }
    const data = (await res.json()) as {
      formats?: Record<string, string>;
      languages?: string[];
      title?: string;
    };
    const formats = data.formats ?? {};
    const utf8Key = Object.keys(formats).find((k) => k.startsWith("text/plain") && k.includes("utf-8"));
    const anyTextKey = Object.keys(formats).find(
      (k) => k.startsWith("text/plain") && !formats[k].endsWith(".zip"),
    );
    const key = utf8Key ?? anyTextKey;
    if (!key) return null;
    return { url: formats[key], languages: data.languages ?? [], title: data.title ?? "" };
  } catch (err) {
    console.warn(`  [warn] Error querying Gutendex for id ${gutenbergId}:`, (err as Error).message);
    return null;
  }
}

/** A loose title match: do the two share a distinctive word (>3 letters)? Guards against a wrong id. */
function titlesAgree(expected: string, actual: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3);
  const a = new Set(norm(expected));
  return norm(actual).some((w) => a.has(w));
}

async function downloadText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  [warn] Failed to download text: HTTP ${res.status} (${url})`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`  [warn] Error downloading text from ${url}:`, (err as Error).message);
    return null;
  }
}

/** Drop Project Gutenberg's header/footer boilerplate. */
function stripGutenbergBoilerplate(raw: string): string {
  const lines = raw.split(/\r?\n/);
  const startLineIdx = lines.findIndex((l) => l.trim().toUpperCase().startsWith("*** START OF"));
  const startIdx = startLineIdx !== -1 ? startLineIdx + 1 : 0;
  const endLineIdx = lines.findIndex((l) => l.trim().toUpperCase().startsWith("*** END OF"));
  const endIdx = endLineIdx !== -1 ? endLineIdx : lines.length;
  return lines.slice(startIdx, endIdx).join("\n");
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** A passage reads badly if it is mostly front-matter cruft, so screen those out. */
function looksLikeProse(chunk: string): boolean {
  if (/gutenberg|ebook|copyright|transcrib|illustration|contents|chapter\s+[ivxlc0-9]+\s*$/i.test(chunk)) {
    return false;
  }
  const letters = (chunk.match(/[a-zA-Zà-üÀ-Ü]/g) ?? []).length;
  return letters / chunk.length > 0.7; // mostly words, not numbers/punctuation
}

/**
 * Extract one clean ~60–110 word passage starting at/after a character offset,
 * accumulating whole sentences and stopping on a sentence boundary in range.
 */
function passageAt(body: string, fromChar: number): string | null {
  let slice = body.slice(fromChar);
  // The anchor lands mid-sentence, so the first fragment is a sentence tail that
  // would start the passage on a lowercase word. Drop it: begin at the next
  // sentence boundary so the passage opens cleanly on a capital.
  const boundary = slice.search(/[.!?]["'”’]?\s+/);
  if (boundary !== -1) slice = slice.slice(boundary + 1).replace(/^["'”’\s]+/, "");
  const sentences = slice.split(/(?<=[.!?])\s+/);
  const chunk: string[] = [];
  let words = 0;
  for (const s of sentences) {
    const w = s.trim().split(/\s+/).filter(Boolean);
    if (!w.length) continue;
    if (/^(chapter|CHAPTER|[IVXLC]+\.?|\d+)\b/.test(s.trim()) && chunk.length === 0) continue;
    chunk.push(s.trim());
    words += w.length;
    if (words >= MIN_WORDS) {
      if (words > MAX_WORDS) return null;
      const text = chunk.join(" ");
      return looksLikeProse(text) ? text : null;
    }
  }
  return null;
}

/** Several passages from spread-out anchor points; the early anchors catch the famous openings. */
function extractPassages(cleaned: string, want: number): string[] {
  const anchors = [0.04, 0.16, 0.3, 0.45, 0.6, 0.74, 0.86];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const frac of anchors) {
    if (out.length >= want) break;
    // walk forward a little from the anchor until a clean passage appears
    for (let step = 0; step < 5; step++) {
      const from = Math.floor(cleaned.length * frac) + step * 900;
      const p = passageAt(cleaned, from);
      const keyStart = p?.slice(0, 40);
      if (p && keyStart && !seen.has(keyStart)) {
        seen.add(keyStart);
        out.push(p);
        break;
      }
    }
  }
  return out;
}

async function loadExistingPool(): Promise<PassagePool> {
  try {
    const parsed = JSON.parse(await readFile(POOL_PATH, "utf-8")) as PassagePool;
    return Array.isArray(parsed.passages) ? parsed : { passages: [] };
  } catch {
    return { passages: [] };
  }
}

async function main() {
  console.log(`Building daily passage pool from ${CURATED_BOOKS.length} curated books...\n`);

  // Merge with what's on disk by default, so a transient fetch failure in CI
  // never wipes committed passages. FRESH=1 rebuilds from scratch (used once
  // when the id scheme changed, to clear now-stale ids).
  const existing = process.env.FRESH === "1" ? { passages: [] } : await loadExistingPool();
  const byId = new Map<string, Passage>();
  for (const p of existing.passages) byId.set(p.id, p);

  let books = 0;
  let added = 0;
  let skipped = 0;

  for (const book of CURATED_BOOKS) {
    console.log(`"${book.title}" — ${book.author} (Gutenberg #${book.gutenbergId})`);

    const info = await getBookInfo(book.gutenbergId);
    if (!info) {
      console.warn(`  [skip] no plain-text format.`);
      skipped++;
      continue;
    }
    // The safety gate: Gutendex must agree on language and title.
    if (!info.languages.includes(book.language)) {
      console.warn(`  [skip] language mismatch: expected ${book.language}, Gutendex says ${info.languages.join("/") || "?"}.`);
      skipped++;
      continue;
    }
    if (info.title && !titlesAgree(book.title, info.title)) {
      console.warn(`  [skip] title mismatch: expected "${book.title}", Gutendex says "${info.title}".`);
      skipped++;
      continue;
    }

    const raw = await downloadText(info.url);
    if (!raw) {
      skipped++;
      continue;
    }

    const cleaned = collapseWhitespace(stripGutenbergBoilerplate(raw));
    const passages = extractPassages(cleaned, PASSAGES_PER_BOOK);
    if (!passages.length) {
      console.warn(`  [skip] no clean passage found.`);
      skipped++;
      continue;
    }

    passages.forEach((text, i) => {
      byId.set(`${book.id}-${i + 1}`, {
        id: `${book.id}-${i + 1}`,
        title: book.title,
        author: book.author,
        language: book.language,
        year: book.year,
        text,
      });
    });
    books++;
    added += passages.length;
    console.log(`  [ok] ${passages.length} passage(s).`);
  }

  const pool: PassagePool = { passages: Array.from(byId.values()) };
  await writeFile(POOL_PATH, JSON.stringify(pool, null, 2) + "\n", "utf-8");

  console.log("\n--- Summary ---");
  console.log(`Books used: ${books}/${CURATED_BOOKS.length} · passages written: ${added} · skipped: ${skipped}`);
  console.log(`Total passages in pool: ${pool.passages.length}`);
  console.log(`Written to: ${POOL_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error while building the passage pool:", err);
  process.exitCode = 1;
});
