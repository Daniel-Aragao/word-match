export function compare(str1: string, str2: string): boolean {
  return str1.localeCompare(str2) === 0;
}

export function normalizeString(word: string): string {
  return word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
