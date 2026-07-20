import { Operator, CalculatorState } from '../types';

export function createInitialState(): CalculatorState {
  return {
    currentInput: '0',
    previousInput: '',
    operation: null,
    shouldResetDisplay: false,
  };
}

const MAX_INPUT_LENGTH = 15;

export function inputNumber(state: CalculatorState, digit: string): CalculatorState {
  let currentInput = state.currentInput;

  if (state.shouldResetDisplay) {
    currentInput = '0';
  }

  if (digit === '.') {
    if (currentInput.includes('.')) return state;
    return { ...state, currentInput: currentInput + '.', shouldResetDisplay: false };
  }

  if (currentInput === '0') {
    return { ...state, currentInput: digit, shouldResetDisplay: false };
  }

  if (currentInput.replace(/[-.]/g, '').length >= MAX_INPUT_LENGTH) return state;

  return { ...state, currentInput: currentInput + digit, shouldResetDisplay: false };
}

export function inputOperation(state: CalculatorState, op: Operator): CalculatorState {
  if (state.operation && !state.shouldResetDisplay) {
    let result: CalculatorState;
    try {
      result = calculateResult(state);
    } catch {
      return {
        currentInput: '错误',
        previousInput: '',
        operation: null,
        shouldResetDisplay: true,
      };
    }
    return {
      ...result,
      previousInput: result.currentInput,
      operation: op,
      shouldResetDisplay: true,
    };
  }

  return {
    ...state,
    previousInput: state.currentInput,
    operation: op,
    shouldResetDisplay: true,
  };
}

export function calculateResult(state: CalculatorState): CalculatorState {
  if (!state.operation || !state.previousInput) return state;

  const prev = parseFloat(state.previousInput);
  const curr = parseFloat(state.currentInput);
  let result: number;

  switch (state.operation) {
    case '+':
      result = prev + curr;
      break;
    case '-':
      result = prev - curr;
      break;
    case '×':
      result = prev * curr;
      break;
    case '÷':
      if (curr === 0) throw new Error('不能除以零');
      result = prev / curr;
      break;
    case '^':
      result = Math.pow(prev, curr);
      break;
    default:
      return state;
  }

  result = roundResult(result);

  return {
    currentInput: String(result),
    previousInput: '',
    operation: null,
    shouldResetDisplay: true,
  };
}

export function clearAll(): CalculatorState {
  return createInitialState();
}

export function toggleSign(input: string): string {
  if (input === '0' || input === '错误') return input;
  if (input.startsWith('-')) return input.slice(1);
  return '-' + input;
}

export function percentage(input: string): string {
  const value = parseFloat(input);
  if (isNaN(value)) return input;
  return String(roundResult(value / 100));
}

export function backspace(input: string): string {
  if (input === '0' || input === '错误') return '0';
  if (input.length === 1 || (input.startsWith('-') && input.length === 2)) return '0';
  return input.slice(0, -1);
}

export function formatDisplay(input: string): string {
  if (input === '错误') return input;
  if (input.length <= 12) return input;
  const num = parseFloat(input);
  if (isNaN(num)) return '错误';
  return num.toExponential(6);
}

export function formatHistoryEntry(
  a: string,
  op: string,
  b: string,
  result: string
): string {
  return `${a} ${op} ${b} = ${result}`;
}

export function roundResult(value: number): number {
  if (Number.isInteger(value)) return value;
  return parseFloat(value.toFixed(10));
}
