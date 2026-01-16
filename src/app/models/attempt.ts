export interface Attempt {
  id: string;
  letter: string;
  result?: 'miss' | 'present' | 'correct';
}
