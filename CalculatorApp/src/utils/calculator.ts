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
    const result = calculateResult(state);
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
  if (input === '0') return input;
  if (input.startsWith('-')) return input.slice(1);
  return '-' + input;
}

export function percentage(input: string): string {
  const result = parseFloat(input) / 100;
  return String(roundResult(result));
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

export function scientificFunc(func: string, value: number): number {
  switch (func) {
    case 'sin':
      return roundResult(Math.sin(toRadians(value)));
    case 'cos':
      return roundResult(Math.cos(toRadians(value)));
    case 'tan':
      return roundResult(Math.tan(toRadians(value)));
    case 'ln':
      return roundResult(Math.log(value));
    case 'log':
      return roundResult(Math.log10(value));
    case 'x²':
      return roundResult(value ** 2);
    case 'x³':
      return roundResult(value ** 3);
    case '√':
      return roundResult(Math.sqrt(value));
    case '∛':
      return roundResult(value ** (1 / 3));
    case 'π':
      return Math.PI;
    case 'e':
      return Math.E;
    case 'n!':
      return roundResult(factorial(Math.floor(value)));
    case '1/x':
      return roundResult(1 / value);
    case '|x|':
      return roundResult(Math.abs(value));
    case 'eˣ':
      return roundResult(Math.exp(value));
    case '10ˣ':
      return roundResult(Math.pow(10, value));
    default:
      return value;
  }
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n > 170) return Infinity;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

export function roundResult(value: number): number {
  if (Number.isInteger(value)) return value;
  return parseFloat(value.toFixed(10));
}
