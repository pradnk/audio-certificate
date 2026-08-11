import type { CertificateInput } from '@/app/admin/actions';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';

/**
 * Reads a student list pasted from a spreadsheet or uploaded as CSV.
 *
 * Copying a block of cells out of Excel or Google Sheets yields tab-separated
 * text, and a saved file is comma-separated, so both are handled by sniffing
 * the delimiter. Doing this properly matters: the alternative is a volunteer
 * retyping forty-five names, which is slow and is exactly where a
 * mistyped name would creep in.
 */

export const IMPORT_COLUMNS = [
  'Name',
  'Say it like',
  'School',
  'City',
  'Class',
  'Project title',
  'Description',
  'Award',
  'Language',
] as const;

/** Header spellings accepted for each field, all compared lowercased. */
const HEADER_ALIASES: Record<string, string[]> = {
  studentName: ['name', 'student', 'student name', 'full name'],
  namePronunciation: ['say it like', 'pronunciation', 'pronounce', 'phonetic', 'say as'],
  school: ['school', 'institution'],
  city: ['city', 'town', 'place'],
  className: ['class', 'grade', 'std', 'standard'],
  projectTitle: ['project title', 'project', 'exhibit', 'title', 'experiment'],
  projectBlurb: ['description', 'blurb', 'about', 'details', 'one line', 'summary'],
  award: ['award', 'prize', 'result', 'position'],
  language: ['language', 'lang'],
};

/** Splits delimited text, honouring quoted fields that contain the delimiter. */
function splitRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      // Swallow the second half of a CRLF pair.
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field);
  rows.push(row);
  return rows.filter((cells) => cells.some((cell) => cell.trim()));
}

/** Tabs win when present: that is what a spreadsheet paste looks like. */
function sniffDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  return firstLine.includes('\t') ? '\t' : ',';
}

function matchHeader(cell: string): string | undefined {
  const normalised = cell.trim().toLowerCase().replace(/[_-]+/g, ' ');
  return Object.keys(HEADER_ALIASES).find((field) =>
    HEADER_ALIASES[field].includes(normalised),
  );
}

function resolveLanguage(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const lower = trimmed.toLowerCase();
  const match = SUPPORTED_LANGUAGES.find(
    (language) =>
      language.tag.toLowerCase() === lower ||
      language.englishName.toLowerCase() === lower ||
      language.nativeName === trimmed ||
      language.englishName.toLowerCase().startsWith(lower),
  );
  return match?.tag ?? fallback;
}

export type ParseResult = {
  rows: CertificateInput[];
  /** Human-readable problems, one per rejected line. */
  problems: string[];
  usedHeader: boolean;
};

export function parseStudentList(
  text: string,
  options: { defaultLanguage: string; defaultAward?: string },
): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { rows: [], problems: [], usedHeader: false };

  const cells = splitRows(trimmed, sniffDelimiter(trimmed));
  const problems: string[] = [];

  // A first row whose cells look like column names is treated as a header, and
  // its order is used. Otherwise assume the documented column order.
  const headerMatches = cells[0].map(matchHeader);
  const usedHeader = headerMatches.filter(Boolean).length >= 2;

  const order = usedHeader
    ? headerMatches
    : [
        'studentName',
        'namePronunciation',
        'school',
        'city',
        'className',
        'projectTitle',
        'projectBlurb',
        'award',
        'language',
      ];

  const dataRows = usedHeader ? cells.slice(1) : cells;
  const rows: CertificateInput[] = [];

  dataRows.forEach((cellsInRow, index) => {
    const record: Record<string, string> = {};
    cellsInRow.forEach((value, column) => {
      const field = order[column];
      if (field) record[field] = value.trim();
    });

    const lineNumber = index + 1 + (usedHeader ? 1 : 0);

    if (!record.studentName) {
      problems.push(`Line ${lineNumber}: no student name, so this line was skipped.`);
      return;
    }

    const award = record.award || options.defaultAward || '';
    if (!award) {
      problems.push(
        `Line ${lineNumber}: "${record.studentName}" has no award. Add an Award column, or set a default award above.`,
      );
      return;
    }

    rows.push({
      studentName: record.studentName,
      namePronunciation: record.namePronunciation || null,
      school: record.school || null,
      city: record.city || null,
      className: record.className || null,
      projectTitle: record.projectTitle || null,
      projectBlurb: record.projectBlurb || null,
      award,
      language: resolveLanguage(record.language ?? '', options.defaultLanguage),
    });
  });

  return { rows, problems, usedHeader };
}

/** The template offered as a download, so the columns are never a guess. */
export function csvTemplate(): string {
  const example = [
    'Ravi Kumar',
    'RUH-vee KOO-mar',
    'ACTS Secondary School',
    'Bengaluru',
    'Class 8',
    'Talking Thermometer',
    'It measures the temperature and announces it aloud',
    'First Prize',
    'English (India)',
  ];
  return `${IMPORT_COLUMNS.join(',')}\n${example.map((cell) => `"${cell}"`).join(',')}\n`;
}
