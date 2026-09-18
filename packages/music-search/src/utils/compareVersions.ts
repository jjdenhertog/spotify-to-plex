import { getState } from "../functions/state/getState";

// "(radio edit)", "[live]", "{dub}" and the trailing " - Radio Edit" form Spotify uses
const BRACKETED = /\(([^)]*)\)|\[([^\]]*)]|{([^}]*)}/g;
const TRAILING_DASH = /\s-\s(.+)$/;

// "(feat. X)", "(with X)", "(& X)" - a credit, not a version of the recording
const CREDIT = /^(?:feat|feats|featuring|ft|with|w)\b|^[&+]/;
// "From \"8 Mile\" Soundtrack" - provenance, not a version
const PROVENANCE = /^from\b/;
const YEAR = /\b(?:19|20)\d{2}\b/g;

// Qualifiers that name no particular version. Longest first so "main mix" is
// removed whole rather than leaving a bare "mix" behind
const STRUCTURAL = ['album version', 'bonus track', 'main mix', 'radio mix', 'main', 'deluxe', 'explicit', 'clean', 'mono', 'stereo'];

// A fragment shorter than this carries no version meaning on its own
const MIN_QUALIFIER_LENGTH = 3;

function escapeForRegex(word: string) {
    return word.replace(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`);
}

/**
 * Remove a noise word, but only where it stands as a whole word. Removing it as
 * a plain substring would eat the middle of real words - "main" out of
 * "Germaine", "clean" out of "cleaner" - and silently invent a version match
 */
function removeWord(text: string, word: string) {
    const pattern = new RegExp(String.raw`\b${escapeForRegex(word.toLowerCase())}\b`, 'g');

    return text.replace(pattern, ' ');
}

/**
 * The version qualifier of a title - "acoustic", "jauz remix", "uk edit" - or ''
 * when the title names no particular version. Credits, provenance and words the
 * user treats as noise are not version distinctions.
 */
export function extractVersion(title: string, filterOutWords: string[]): string {
    const segments: string[] = [];

    for (const match of title.matchAll(BRACKETED))
        segments.push(match[1] ?? match[2] ?? match[3] ?? '');

    const trailing = TRAILING_DASH.exec(title.replace(BRACKETED, ''));
    if (trailing?.[1])
        segments.push(trailing[1]);

    const meaningful = segments
        .map(segment => segment.toLowerCase().trim())
        .filter(segment => !CREDIT.test(segment) && !PROVENANCE.test(segment))
        .map(segment => {
            let result = segment;

            for (const word of [...filterOutWords, ...STRUCTURAL])
                result = removeWord(result, word);

            return result
                .replace(YEAR, ' ')
                .replace(/[^\d a-z]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        })
        .filter(segment => segment.length >= MIN_QUALIFIER_LENGTH);

    return meaningful.join(' ');
}

/**
 * Whether two titles name the same version. Duration cannot separate two
 * different remixes of equal length, so this compares what the titles claim.
 */
export function compareVersions(a?: string, b?: string) {
    if (!a || !b)
        return { match: false, contains: false, similarity: 0 };

    const filterOutWords = getState().musicSearchConfig?.textProcessing?.filterOutWords ?? [];
    const versionA = extractVersion(a, filterOutWords);
    const versionB = extractVersion(b, filterOutWords);

    const match = versionA === versionB;

    // One side naming a version the other does not is the mismatch worth
    // catching: "Language" offered for "Language - UK Edit"
    const contains = !!versionA && !!versionB && (versionA.includes(versionB) || versionB.includes(versionA));

    return { match, contains, similarity: match ? 1 : 0 };
}
