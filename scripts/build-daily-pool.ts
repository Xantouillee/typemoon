/**
 * build-daily-pool.ts
 * -------------------------------------------------------------------------
 * Fetches a curated set of famous, public-domain books from Project Gutenberg
 * (via the Gutendex API: https://gutendex.com/books) and extracts a clean,
 * ~60-110 word passage from each one. The results are merged into
 * `public/passages/pool.json`, de-duplicated by passage id.
 *
 * Run with:
 *   npx tsx scripts/build-daily-pool.ts
 *
 * Requirements:
 *   - Node 18+ (for the built-in global `fetch`)
 *   - tsx (already a devDependency / run via npx) — no other npm packages
 *     are required; only built-in Node APIs (fs, path) are used.
 * -------------------------------------------------------------------------
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// ---------------------------------------------------------------------------
// 1. Curated list of famous, verifiably public-domain books.
//    Gutenberg book IDs -> metadata we want stamped onto each passage.
//    (IDs were looked up on gutenberg.org / gutendex.com and are stable.)
// ---------------------------------------------------------------------------
interface BookMeta {
  id: string; // slug used as the passage id, e.g. "austen-pride-and-prejudice"
  title: string;
  author: string;
  language: "en" | "fr" | "es" | "de";
  year: number;
  gutenbergId: number;
}

const CURATED_BOOKS: BookMeta[] = [
  { id: "austen-pride-and-prejudice", title: "Pride and Prejudice", author: "Jane Austen", language: "en", year: 1813, gutenbergId: 1342 },
  { id: "dickens-tale-of-two-cities", title: "A Tale of Two Cities", author: "Charles Dickens", language: "en", year: 1859, gutenbergId: 98 },
  { id: "dickens-great-expectations", title: "Great Expectations", author: "Charles Dickens", language: "en", year: 1861, gutenbergId: 1400 },
  { id: "melville-moby-dick", title: "Moby-Dick", author: "Herman Melville", language: "en", year: 1851, gutenbergId: 2701 },
  { id: "shelley-frankenstein", title: "Frankenstein", author: "Mary Shelley", language: "en", year: 1818, gutenbergId: 84 },
  { id: "carroll-alice-in-wonderland", title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", language: "en", year: 1865, gutenbergId: 11 },
  { id: "doyle-sherlock-holmes", title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", language: "en", year: 1892, gutenbergId: 1661 },
  { id: "stoker-dracula", title: "Dracula", author: "Bram Stoker", language: "en", year: 1897, gutenbergId: 345 },
  { id: "hugo-les-miserables", title: "Les Misérables", author: "Victor Hugo", language: "fr", year: 1862, gutenbergId: 17489 },
  { id: "flaubert-madame-bovary", title: "Madame Bovary", author: "Gustave Flaubert", language: "fr", year: 1857, gutenbergId: 2413 },
  { id: "voltaire-candide", title: "Candide", author: "Voltaire", language: "fr", year: 1759, gutenbergId: 19942 },
  { id: "cervantes-don-quijote", title: "Don Quijote de la Mancha", author: "Miguel de Cervantes", language: "es", year: 1605, gutenbergId: 2000 },
  { id: "clarin-la-regenta", title: "La Regenta", author: "Leopoldo Alas «Clarín»", language: "es", year: 1884, gutenbergId: 17231 },
  { id: "kafka-die-verwandlung", title: "Die Verwandlung", author: "Franz Kafka", language: "de", year: 1915, gutenbergId: 5200 },
  { id: "goethe-werther", title: "Die Leiden des jungen Werthers", author: "Johann Wolfgang von Goethe", language: "de", year: 1774, gutenbergId: 2407 },
];

// ---------------------------------------------------------------------------
// Types & paths
// ---------------------------------------------------------------------------
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

const POOL_PATH = path.resolve(__dirname, "..", "public", "passages", "pool.json");
const MIN_WORDS = 60;
const MAX_WORDS = 110;

// ---------------------------------------------------------------------------
// 2. Gutendex lookup: resolve a Gutenberg book id to its plain-text UTF-8
//    download URL. Gutendex exposes `formats` with a "text/plain; charset=utf-8"
//    key (sometimes just "text/plain").
// ---------------------------------------------------------------------------
async function getPlainTextUrl(gutenbergId: number): Promise<string | null> {
  const apiUrl = `https://gutendex.com/books/${gutenbergId}`;
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      console.warn(`  [warn] Gutendex lookup failed for id ${gutenbergId}: HTTP ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { formats?: Record<string, string> };
    const formats = data.formats ?? {};
    // Prefer an explicit UTF-8 plain text format, then fall back to any
    // "text/plain" variant.
    const utf8Key = Object.keys(formats).find(
      (k) => k.startsWith("text/plain") && k.includes("utf-8")
    );
    const anyTextKey = Object.keys(formats).find((k) => k.startsWith("text/plain"));
    const key = utf8Key ?? anyTextKey;
    return key ? formats[key] : null;
  } catch (err) {
    console.warn(`  [warn] Error querying Gutendex for id ${gutenbergId}:`, (err as Error).message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 3. Download the raw plain-text book body.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// 4. Strip Project Gutenberg's boilerplate header/footer.
//    Header ends at the line beginning "*** START OF" (inclusive).
//    Footer begins at the line beginning "*** END OF" (inclusive), everything
//    after is discarded.
// ---------------------------------------------------------------------------
function stripGutenbergBoilerplate(raw: string): string {
  const lines = raw.split(/\r?\n/);

  let startIdx = 0;
  const startLineIdx = lines.findIndex((l) => l.trim().toUpperCase().startsWith("*** START OF"));
  if (startLineIdx !== -1) {
    startIdx = startLineIdx + 1; // drop everything up to & including this line
  }

  let endIdx = lines.length;
  const endLineIdx = lines.findIndex((l) => l.trim().toUpperCase().startsWith("*** END OF"));
  if (endLineIdx !== -1) {
    endIdx = endLineIdx; // drop this line and everything after
  }

  return lines.slice(startIdx, endIdx).join("\n");
}

// ---------------------------------------------------------------------------
// 5. Collapse all whitespace (newlines, tabs, repeated spaces) into single
//    spaces, and trim.
// ---------------------------------------------------------------------------
function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// 6. Extract a clean, self-contained ~60-110 word paragraph from the cleaned
//    book body. We look a fair way into the text (skip preliminary matter
//    like tables of contents / dedications), scan candidate "sentences"
//    (split naively on ". ") and greedily accumulate them into a chunk of
//    the desired length, stopping at a sentence boundary.
// ---------------------------------------------------------------------------
function extractPassage(cleanedText: string): string | null {
  // Skip roughly the first 3% of the body (front matter) but not more than
  // 4000 characters, to land somewhere inside the actual narrative.
  const skipChars = Math.min(4000, Math.floor(cleanedText.length * 0.03));
  const body = cleanedText.slice(skipChars);

  // Split into naive sentences on ". ", "! ", "? " while keeping the
  // delimiter attached to the sentence that precedes it.
  const sentences = body.split(/(?<=[.!?])\s+/);

  let chunk: string[] = [];
  let wordCount = 0;

  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    // Skip sentences that look like footnote markers, chapter headings, or
    // stray numbers-only fragments.
    if (/^(chapter|CHAPTER|\d+)\b/.test(sentence.trim())) {
      if (chunk.length === 0) continue; // haven't started a chunk yet, skip heading
    }

    chunk.push(sentence.trim());
    wordCount += words.length;

    if (wordCount >= MIN_WORDS) {
      // Stop as soon as we're within the target window; prefer stopping
      // right after crossing MIN_WORDS rather than overshooting MAX_WORDS.
      if (wordCount <= MAX_WORDS) {
        return chunk.join(" ");
      }
      // We overshot; back off to just the sentences that keep us in range,
      // or fail this attempt and let the caller try further into the text.
      return null;
    }
  }

  return null; // never reached the minimum word count in this window
}

// ---------------------------------------------------------------------------
// 7. Load the existing pool.json (if present) so we can merge & de-dupe.
// ---------------------------------------------------------------------------
async function loadExistingPool(): Promise<PassagePool> {
  try {
    const raw = await readFile(POOL_PATH, "utf-8");
    const parsed = JSON.parse(raw) as PassagePool;
    if (Array.isArray(parsed.passages)) return parsed;
    return { passages: [] };
  } catch {
    return { passages: [] };
  }
}

// ---------------------------------------------------------------------------
// 8. Main driver: fetch each curated book, extract a passage, merge into
//    the pool, de-duplicate by id (new fetch wins), and write back to disk.
// ---------------------------------------------------------------------------
async function main() {
  console.log(`Building daily passage pool from ${CURATED_BOOKS.length} curated Gutenberg books...\n`);

  const existingPool = await loadExistingPool();
  const byId = new Map<string, Passage>();
  for (const p of existingPool.passages) byId.set(p.id, p);

  let fetched = 0;
  let skipped = 0;

  for (const book of CURATED_BOOKS) {
    console.log(`Fetching "${book.title}" by ${book.author} (Gutenberg #${book.gutenbergId})...`);

    const textUrl = await getPlainTextUrl(book.gutenbergId);
    if (!textUrl) {
      console.warn(`  [skip] No plain-text format found for "${book.title}".`);
      skipped++;
      continue;
    }

    const raw = await downloadText(textUrl);
    if (!raw) {
      console.warn(`  [skip] Could not download text for "${book.title}".`);
      skipped++;
      continue;
    }

    const stripped = stripGutenbergBoilerplate(raw);
    const cleaned = collapseWhitespace(stripped);

    const passageText = extractPassage(cleaned);
    if (!passageText) {
      console.warn(`  [skip] Could not extract a ${MIN_WORDS}-${MAX_WORDS} word passage for "${book.title}".`);
      skipped++;
      continue;
    }

    byId.set(book.id, {
      id: book.id,
      title: book.title,
      author: book.author,
      language: book.language,
      year: book.year,
      text: passageText,
    });

    fetched++;
    console.log(`  [ok] Extracted ${passageText.split(/\s+/).length} words.`);
  }

  const mergedPool: PassagePool = { passages: Array.from(byId.values()) };

  await writeFile(POOL_PATH, JSON.stringify(mergedPool, null, 2) + "\n", "utf-8");

  console.log("\n--- Summary ---");
  console.log(`Curated books processed: ${CURATED_BOOKS.length}`);
  console.log(`Passages fetched/updated: ${fetched}`);
  console.log(`Skipped (errors or extraction failures): ${skipped}`);
  console.log(`Total passages now in pool: ${mergedPool.passages.length}`);
  console.log(`Written to: ${POOL_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error while building the passage pool:", err);
  process.exitCode = 1;
});
