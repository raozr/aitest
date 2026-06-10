export type Operator = '+' | '-' | '×' | '÷' | '^';

export interface CalculatorState {
  currentInput: string;
  previousInput: string;
  operation: Operator | null;
  shouldResetDisplay: boolean;
}

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  rate: number;
  color: string;
}

export type CalcMode = 'basic' | 'scientific';
