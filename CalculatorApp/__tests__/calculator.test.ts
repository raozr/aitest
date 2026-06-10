import {
  createInitialState,
  inputNumber,
  inputOperation,
  calculateResult,
  clearAll,
  toggleSign,
  percentage,
  backspace,
  formatDisplay,
  formatHistoryEntry,
  scientificFunc,
} from '../src/utils/calculator';

// --- createInitialState ---
describe('createInitialState', () => {
  it('returns initial state', () => {
    const s = createInitialState();
    expect(s.currentInput).toBe('0');
    expect(s.previousInput).toBe('');
    expect(s.operation).toBeNull();
    expect(s.shouldResetDisplay).toBe(false);
  });
});

// --- inputNumber ---
describe('inputNumber', () => {
  it('appends digit', () => {
    const s = inputNumber(createInitialState(), '5');
    expect(s.currentInput).toBe('5');
  });

  it('replaces leading zero', () => {
    const s = inputNumber(createInitialState(), '3');
    expect(s.currentInput).toBe('3');
  });

  it('chains multiple digits', () => {
    let s = createInitialState();
    s = inputNumber(s, '1');
    s = inputNumber(s, '2');
    s = inputNumber(s, '3');
    expect(s.currentInput).toBe('123');
  });

  it('handles decimal point', () => {
    let s = createInitialState();
    s = inputNumber(s, '1');
    s = inputNumber(s, '.');
    s = inputNumber(s, '5');
    expect(s.currentInput).toBe('1.5');
  });

  it('prevents second decimal point', () => {
    let s = createInitialState();
    s = inputNumber(s, '1');
    s = inputNumber(s, '.');
    s = inputNumber(s, '.');
    expect(s.currentInput).toBe('1.');
  });

  it('resets display when shouldResetDisplay is true', () => {
    const s = inputNumber(
      { currentInput: '42', previousInput: '10', operation: '+', shouldResetDisplay: true },
      '9'
    );
    expect(s.currentInput).toBe('9');
    expect(s.shouldResetDisplay).toBe(false);
  });

  it('rejects input beyond 15 significant digits', () => {
    let s = createInitialState();
    for (let i = 0; i < 15; i++) {
      s = inputNumber(s, '1');
    }
    expect(s.currentInput).toBe('111111111111111');
    const overflow = inputNumber(s, '2');
    expect(overflow.currentInput).toBe('111111111111111');
  });
});

// --- inputOperation ---
describe('inputOperation', () => {
  it('sets operation and stores previous input', () => {
    const s = inputOperation(createInitialState(), '+');
    expect(s.operation).toBe('+');
    expect(s.previousInput).toBe('0');
    expect(s.shouldResetDisplay).toBe(true);
  });

  it('chains calculation on second operation', () => {
    let s = createInitialState();
    s = inputNumber(s, '5');
    s = inputOperation(s, '+');
    s = inputNumber(s, '3');
    s = inputOperation(s, '-');
    expect(s.currentInput).toBe('8');
    expect(s.previousInput).toBe('8');
    expect(s.operation).toBe('-');
  });
});

// --- calculateResult ---
describe('calculateResult', () => {
  it('1 + 2 = 3', () => {
    let s = createInitialState();
    s = inputNumber(s, '1');
    s = inputOperation(s, '+');
    s = inputNumber(s, '2');
    s = calculateResult(s);
    expect(s.currentInput).toBe('3');
    expect(s.operation).toBeNull();
  });

  it('10 - 3 = 7', () => {
    let s = createInitialState();
    s = inputNumber(s, '1');
    s = inputNumber(s, '0');
    s = inputOperation(s, '-');
    s = inputNumber(s, '3');
    s = calculateResult(s);
    expect(s.currentInput).toBe('7');
  });

  it('4 × 5 = 20', () => {
    let s = createInitialState();
    s = inputNumber(s, '4');
    s = inputOperation(s, '×');
    s = inputNumber(s, '5');
    s = calculateResult(s);
    expect(s.currentInput).toBe('20');
  });

  it('10 ÷ 2 = 5', () => {
    let s = createInitialState();
    s = inputNumber(s, '1');
    s = inputNumber(s, '0');
    s = inputOperation(s, '÷');
    s = inputNumber(s, '2');
    s = calculateResult(s);
    expect(s.currentInput).toBe('5');
  });

  it('throws on division by zero', () => {
    let s = createInitialState();
    s = inputNumber(s, '5');
    s = inputOperation(s, '÷');
    s = inputNumber(s, '0');
    expect(() => calculateResult(s)).toThrow('不能除以零');
  });

  it('2 ^ 3 = 8', () => {
    let s = createInitialState();
    s = inputNumber(s, '2');
    s = inputOperation(s, '^');
    s = inputNumber(s, '3');
    s = calculateResult(s);
    expect(s.currentInput).toBe('8');
  });

  it('returns state unchanged when no operation set', () => {
    const s = createInitialState();
    const result = calculateResult(s);
    expect(result).toBe(s);
  });

  it('returns state unchanged when no previous input', () => {
    const s = { currentInput: '5', previousInput: '', operation: '+' as const, shouldResetDisplay: false };
    const result = calculateResult(s);
    expect(result).toBe(s);
  });

  it('throws Chinese error message on division by zero', () => {
    let s = createInitialState();
    s = inputNumber(s, '5');
    s = inputOperation(s, '÷');
    s = inputNumber(s, '0');
    expect(() => calculateResult(s)).toThrow('不能除以零');
  });
});

// --- toggleSign ---
describe('toggleSign', () => {
  it('123 → -123', () => {
    expect(toggleSign('123')).toBe('-123');
  });

  it('-123 → 123', () => {
    expect(toggleSign('-123')).toBe('123');
  });

  it('0 → 0', () => {
    expect(toggleSign('0')).toBe('0');
  });
});

// --- percentage ---
describe('percentage', () => {
  it('50 → 0.5', () => {
    expect(percentage('50')).toBe('0.5');
  });

  it('100 → 1', () => {
    expect(percentage('100')).toBe('1');
  });
});

// --- formatDisplay ---
describe('formatDisplay', () => {
  it('keeps short input unchanged', () => {
    expect(formatDisplay('123')).toBe('123');
  });

  it('keeps 12-char input unchanged', () => {
    expect(formatDisplay('12345678901')).toBe('12345678901');
  });

  it('converts long input to exponential', () => {
    const result = formatDisplay('1234567890123');
    expect(result).toMatch(/^1\.234568e\+12$/);
  });
});

// --- formatHistoryEntry ---
describe('formatHistoryEntry', () => {
  it('formats correctly', () => {
    expect(formatHistoryEntry('5', '+', '3', '8')).toBe('5 + 3 = 8');
  });
});

// --- scientificFunc ---
describe('scientificFunc', () => {
  it('sin(30) ≈ 0.5', () => {
    expect(scientificFunc('sin', 30)).toBeCloseTo(0.5, 1);
  });

  it('cos(60) ≈ 0.5', () => {
    expect(scientificFunc('cos', 60)).toBeCloseTo(0.5, 1);
  });

  it('π', () => {
    expect(scientificFunc('π', 0)).toBeCloseTo(Math.PI);
  });

  it('e', () => {
    expect(scientificFunc('e', 0)).toBeCloseTo(Math.E);
  });

  it('n! 5 = 120', () => {
    expect(scientificFunc('n!', 5)).toBe(120);
  });

  it('1/x 4 = 0.25', () => {
    expect(scientificFunc('1/x', 4)).toBe(0.25);
  });

  it('n! negative returns NaN', () => {
    expect(scientificFunc('n!', -5)).toBeNaN();
  });

  it('n! 170 returns Infinity', () => {
    expect(scientificFunc('n!', 171)).toBe(Infinity);
  });

  it('n! 0 = 1', () => {
    expect(scientificFunc('n!', 0)).toBe(1);
  });

  it('n! 170 is finite', () => {
    expect(scientificFunc('n!', 170)).toBeLessThan(Infinity);
  });
});

// --- backspace ---
describe('backspace', () => {
  it('removes last digit', () => {
    expect(backspace('123')).toBe('12');
  });

  it('single digit becomes 0', () => {
    expect(backspace('5')).toBe('0');
  });

  it('0 stays 0', () => {
    expect(backspace('0')).toBe('0');
  });

  it('negative two chars becomes 0', () => {
    expect(backspace('-5')).toBe('0');
  });

  it('negative number removes last digit', () => {
    expect(backspace('-123')).toBe('-12');
  });

  it('decimal removes last digit', () => {
    expect(backspace('1.5')).toBe('1.');
  });

  it('错误 becomes 0', () => {
    expect(backspace('错误')).toBe('0');
  });
});

// --- formatDisplay edge cases ---
describe('formatDisplay edge cases', () => {
  it('passes through 错误 unchanged', () => {
    expect(formatDisplay('错误')).toBe('错误');
  });

  it('long NaN input returns 错误', () => {
    expect(formatDisplay('abcdefghijklm')).toBe('错误');
  });
});
