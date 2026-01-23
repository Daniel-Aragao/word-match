export function dateKey(date: Date): string {
  return `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
}
