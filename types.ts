export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  text: string;
  options: [Option, Option];
  comment?: string;
}

export type AppState = 'start' | 'quiz' | 'loading' | 'result';
