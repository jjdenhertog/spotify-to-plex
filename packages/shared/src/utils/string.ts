// String utility functions

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\d\sa-z]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function removeFeaturing(title: string): string {
  return title
    .replace(/\s*\(feat\.[^)]*\)/gi, '')
    .replace(/\s*\[feat\.[^\]]*]/gi, '')
    .replace(/\s*feat\.\s*.*/gi, '')
    .replace(/\s*ft\.\s*.*/gi, '')
    .trim();
}

export function createSearchString(title: string, artist?: string): string {
  let search = removeFeaturing(title);
  if (artist) {
    search = `${artist} ${search}`;
  }

  return normalizeString(search);
}

export function filterOutWords(text: string, wordsToFilter: string[]): string {
  let filtered = text;
  wordsToFilter.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '');
  });

  return filtered.replace(/\s+/g, ' ').trim();
}