import { type BibleVerse, scriptureLibrary } from './bible';
import { type SlideData } from './lyrics';

// ─── Auto-detection: Scan text for Bible verse references ─────────────────────
// Matches patterns like: John 3:16, 1 Cor 13:4, Ps 23:1-3, Romans 8:28
// Also handles voice-spoken patterns recognised by the Web Speech API.

// ── Short abbreviation → canonical book name ──────────────────────────────────
const BOOK_MAP: Record<string, string> = {
  // Pentateuch
  gen: 'Genesis',   ge: 'Genesis',
  ex: 'Exodus',     exo: 'Exodus',   exod: 'Exodus',
  lev: 'Leviticus', lv: 'Leviticus',
  num: 'Numbers',   nm: 'Numbers',   nu: 'Numbers',
  deut: 'Deuteronomy', dt: 'Deuteronomy', deu: 'Deuteronomy',
  // History
  josh: 'Joshua',   jos: 'Joshua',
  judg: 'Judges',   jdg: 'Judges',
  ruth: 'Ruth',     rt: 'Ruth',
  '1sam': '1 Samuel', '1 sam': '1 Samuel',
  '2sam': '2 Samuel', '2 sam': '2 Samuel',
  '1ki': '1 Kings', '1 kgs': '1 Kings',
  '2ki': '2 Kings', '2 kgs': '2 Kings',
  '1ch': '1 Chronicles', '1 chr': '1 Chronicles',
  '2ch': '2 Chronicles', '2 chr': '2 Chronicles',
  ezr: 'Ezra',
  neh: 'Nehemiah',
  esth: 'Esther',   est: 'Esther',
  // Poetry / Wisdom
  job: 'Job',
  ps: 'Psalms',    psa: 'Psalms',   psalm: 'Psalms',   pss: 'Psalms',
  prov: 'Proverbs', pv: 'Proverbs', prv: 'Proverbs',
  eccl: 'Ecclesiastes', ecc: 'Ecclesiastes',
  song: 'Song of Solomon', sos: 'Song of Solomon', sg: 'Song of Solomon',
  // Prophets
  isa: 'Isaiah',
  jer: 'Jeremiah', jr: 'Jeremiah',
  lam: 'Lamentations',
  ezek: 'Ezekiel', eze: 'Ezekiel', ez: 'Ezekiel',
  dan: 'Daniel',   dn: 'Daniel',
  hos: 'Hosea',
  joel: 'Joel',    jl: 'Joel',
  amos: 'Amos',    am: 'Amos',
  obad: 'Obadiah',
  jonah: 'Jonah',  jon: 'Jonah',
  mic: 'Micah',
  nah: 'Nahum',    na: 'Nahum',
  hab: 'Habakkuk',
  zeph: 'Zephaniah', zep: 'Zephaniah',
  hag: 'Haggai',   hg: 'Haggai',
  zech: 'Zechariah', zec: 'Zechariah',
  mal: 'Malachi',
  // Gospels
  matt: 'Matthew',  mt: 'Matthew',
  mk: 'Mark',       mar: 'Mark',    mrk: 'Mark',
  lk: 'Luke',       luk: 'Luke',
  john: 'John',     jn: 'John',    joh: 'John',
  // Acts
  acts: 'Acts',     act: 'Acts',
  // Epistles
  rom: 'Romans',    roms: 'Romans', ro: 'Romans',
  '1cor': '1 Corinthians', '1 cor': '1 Corinthians',
  '2cor': '2 Corinthians', '2 cor': '2 Corinthians',
  gal: 'Galatians',
  eph: 'Ephesians', ephs: 'Ephesians',
  phil: 'Philippians', php: 'Philippians', phpp: 'Philippians',
  col: 'Colossians', cols: 'Colossians',
  '1th': '1 Thessalonians', '1 thess': '1 Thessalonians',
  '2th': '2 Thessalonians', '2 thess': '2 Thessalonians',
  '1tim': '1 Timothy', '1 tim': '1 Timothy',
  '2tim': '2 Timothy', '2 tim': '2 Timothy',
  tit: 'Titus',
  phlm: 'Philemon',
  heb: 'Hebrews',   hebs: 'Hebrews',
  jas: 'James',     jms: 'James',
  '1pe': '1 Peter',  '1 pet': '1 Peter', '1 pe': '1 Peter',
  '2pe': '2 Peter',  '2 pet': '2 Peter', '2 pe': '2 Peter',
  '1jn': '1 John',   '1 john': '1 John',
  '2jn': '2 John',   '2 john': '2 John',
  '3jn': '3 John',   '3 john': '3 John',
  jude: 'Jude',
  rev: 'Revelation', revs: 'Revelation', apoc: 'Revelation',
};

// ── Full name → canonical ─────────────────────────────────────────────────────
const FULL_BOOK_MAP: Record<string, string> = {
  genesis: 'Genesis', exodus: 'Exodus', leviticus: 'Leviticus',
  numbers: 'Numbers', deuteronomy: 'Deuteronomy', joshua: 'Joshua',
  judges: 'Judges', ruth: 'Ruth', psalms: 'Psalms', proverbs: 'Proverbs',
  ecclesiastes: 'Ecclesiastes', isaiah: 'Isaiah', jeremiah: 'Jeremiah',
  lamentations: 'Lamentations', ezekiel: 'Ezekiel', daniel: 'Daniel',
  hosea: 'Hosea', joel: 'Joel', amos: 'Amos', obadiah: 'Obadiah',
  jonah: 'Jonah', micah: 'Micah', nahum: 'Nahum', habakkuk: 'Habakkuk',
  zephaniah: 'Zephaniah', haggai: 'Haggai', zechariah: 'Zechariah',
  malachi: 'Malachi', matthew: 'Matthew', mark: 'Mark', luke: 'Luke',
  john: 'John', acts: 'Acts', romans: 'Romans', galatians: 'Galatians',
  ephesians: 'Ephesians', philippians: 'Philippians', colossians: 'Colossians',
  titus: 'Titus', philemon: 'Philemon', hebrews: 'Hebrews',
  james: 'James', jude: 'Jude', revelation: 'Revelation',
};

// ── Number words → digits (for voice-spoken references) ─────────────────────
const WORD_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90, hundred: 100,
};

/**
 * Convert spoken number words to integers.
 * e.g. "three sixteen" → "3:16", "twenty three one" → "23:1"
 */
function wordsToVerseRef(text: string): string {
  // Try to replace compound spoken references like "chapter 3 verse 16" or "3 16"
  return text
    .replace(/chapter\s+(\d+)\s+verse\s+(\d+)/gi, '$1:$2')
    .replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+(one|two|three|four|five|six|seven|eight|nine)\b/gi, (_, tens, ones) => 
      String((WORD_NUM[tens.toLowerCase()] || 0) + (WORD_NUM[ones.toLowerCase()] || 0))
    )
    .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\b/gi, (w) =>
      String(WORD_NUM[w.toLowerCase()] ?? w)
    );
}

// ── Exported types ────────────────────────────────────────────────────────────

export interface DetectedReference {
  raw: string;     // Original matched string, e.g. "John 3:16"
  book: string;
  chapter: number;
  verse: number;
  match?: BibleVerse; // Local library match if available (may be undefined for live-API-only refs)
}

// ── Core detection function ───────────────────────────────────────────────────

/**
 * Scans arbitrary text (typed OR voice transcript) for Bible verse references.
 * Returns structured matches with optional local library lookup.
 *
 * Handles:
 *   - "John 3:16"
 *   - "john three sixteen" (voice)
 *   - "Psalm 23:1-3"
 *   - "1 Cor 13:4"
 *   - "Romans 8:28"
 */
export function detectVerseReferences(text: string): DetectedReference[] {
  if (!text.trim()) return [];

  // Pre-process: convert spoken number words → digits
  const normalized = wordsToVerseRef(text);

  // Pattern: Optional "1 " prefix, Book name, space, chapter:verse(-endverse)?
  const pattern = /\b(1\s+|2\s+|3\s+)?([a-zA-Z]+)\s+(\d+)[:\s](\d+)(?:-\d+)?/gi;
  const found: DetectedReference[] = [];
  const seen = new Set<string>();

  let m: RegExpExecArray | null;
  while ((m = pattern.exec(normalized)) !== null) {
    const prefix = (m[1] || '').trim().toLowerCase();
    const bookRaw = m[2].toLowerCase();
    const chapter = parseInt(m[3], 10);
    const verse = parseInt(m[4], 10);

    const bookKey = prefix ? `${prefix}${bookRaw}` : bookRaw;
    const bookName = BOOK_MAP[bookKey] || FULL_BOOK_MAP[bookRaw] || null;
    if (!bookName) continue;

    const ref = `${bookName} ${chapter}:${verse}`;
    if (seen.has(ref)) continue;
    seen.add(ref);

    // Local library hit (instant, no network)
    const bibMatch = scriptureLibrary.find(v =>
      v.book === bookName && v.chapter === chapter && v.verse === verse
    );

    found.push({ raw: m[0], book: bookName, chapter, verse, match: bibMatch });
  }

  return found;
}

// ── Custom slide builder ──────────────────────────────────────────────────────

export function buildCustomSlide(
  text: string,
  type: 'lyric' | 'scripture' = 'lyric',
  reference?: string,
): SlideData {
  return {
    id: `custom-${Date.now()}`,
    type,
    title: reference || 'Custom',
    content: text.trim(),
    reference,
  };
}
