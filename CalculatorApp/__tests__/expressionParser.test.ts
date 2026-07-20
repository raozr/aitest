import {
  evaluateExpression,
  evalPreview,
  findOperandStart,
  wrapOperand,
  appendToOperand,
} from '../src/utils/expressionParser';

// --- basic arithmetic & precedence ---
describe('evaluateExpression arithmetic', () => {
  it('evaluates a single number', () => {
    expect(evaluateExpression('42')).toBe(42);
  });

  it('2+3 = 5', () => {
    expect(evaluateExpression('2+3')).toBe(5);
  });

  it('respects multiplication precedence: 2+3×4 = 14', () => {
    expect(evaluateExpression('2+3×4')).toBe(14);
  });

  it('respects division precedence: 10-6÷2 = 7', () => {
    expect(evaluateExpression('10-6÷2')).toBe(7);
  });

  it('^ is right-associative: 2^3^2 = 512', () => {
    expect(evaluateExpression('2^3^2')).toBe(512);
  });

  it('decimal arithmetic: 0.1+0.2 ≈ 0.3', () => {
    expect(evaluateExpression('0.1+0.2')).toBeCloseTo(0.3, 10);
  });
});

// --- parentheses ---
describe('parentheses', () => {
  it('(2+3)×4 = 20', () => {
    expect(evaluateExpression('(2+3)×4')).toBe(20);
  });

  it('nested parens: ((2+3)×(4-1)) = 15', () => {
    expect(evaluateExpression('(2+3)×(4-1)')).toBe(15);
  });

  it('2×(3+4) = 14', () => {
    expect(evaluateExpression('2×(3+4)')).toBe(14);
  });

  it('throws on unbalanced open paren', () => {
    expect(() => evaluateExpression('(2+3')).toThrow('括号不匹配');
  });

  it('throws on unbalanced close paren', () => {
    expect(() => evaluateExpression('2+3)')).toThrow('括号不匹配');
  });
});

// --- unary minus ---
describe('unary minus', () => {
  it('leading negative: -5+3 = -2', () => {
    expect(evaluateExpression('-5+3')).toBe(-2);
  });

  it('negative after operator: 5×-3 = -15', () => {
    expect(evaluateExpression('5×-3')).toBe(-15);
  });

  it('negative exponent: 2^-3 = 0.125', () => {
    expect(evaluateExpression('2^-3')).toBe(0.125);
  });

  it('negated group: -(2+3) = -5', () => {
    expect(evaluateExpression('-(2+3)')).toBe(-5);
  });

  it('(-2)^2 = 4', () => {
    expect(evaluateExpression('(-2)^2')).toBe(4);
  });
});

// --- constants & implicit multiplication ---
describe('constants and implicit multiplication', () => {
  it('π', () => {
    expect(evaluateExpression('π')).toBeCloseTo(Math.PI, 10);
  });

  it('e', () => {
    expect(evaluateExpression('e')).toBeCloseTo(Math.E, 10);
  });

  it('2π', () => {
    expect(evaluateExpression('2π')).toBeCloseTo(2 * Math.PI, 10);
  });

  it('2(3+4) = 14', () => {
    expect(evaluateExpression('2(3+4)')).toBe(14);
  });

  it('(2+1)(3+1) = 12', () => {
    expect(evaluateExpression('(2+1)(3+1)')).toBe(12);
  });
});

// --- scientific functions ---
describe('scientific functions', () => {
  it('sin(30) = 0.5 in deg', () => {
    expect(evaluateExpression('sin(30)', 'deg')).toBeCloseTo(0.5, 10);
  });

  it('sin(π/6) ≈ 0.5 in rad', () => {
    expect(evaluateExpression('sin(π÷6)', 'rad')).toBeCloseTo(0.5, 10);
  });

  it('cos(60) = 0.5 in deg', () => {
    expect(evaluateExpression('cos(60)', 'deg')).toBeCloseTo(0.5, 10);
  });

  it('tan(45) = 1 in deg', () => {
    expect(evaluateExpression('tan(45)', 'deg')).toBeCloseTo(1, 10);
  });

  it('tan(90) is Infinity in deg', () => {
    expect(evaluateExpression('tan(90)', 'deg')).toBe(Infinity);
  });

  it('log(100) = 2', () => {
    expect(evaluateExpression('log(100)')).toBe(2);
  });

  it('ln(e) = 1', () => {
    expect(evaluateExpression('ln(e)')).toBeCloseTo(1, 10);
  });

  it('sqrt(9) = 3', () => {
    expect(evaluateExpression('sqrt(9)')).toBe(3);
  });

  it('cbrt(-8) = -2', () => {
    expect(evaluateExpression('cbrt(-8)')).toBe(-2);
  });

  it('abs(0-5) = 5', () => {
    expect(evaluateExpression('abs(0-5)')).toBe(5);
  });

  it('exp(1) = e', () => {
    expect(evaluateExpression('exp(1)')).toBeCloseTo(Math.E, 10);
  });

  it('pow10(3) = 1000', () => {
    expect(evaluateExpression('pow10(3)')).toBe(1000);
  });

  it('nested functions: sin(cos(60))', () => {
    expect(evaluateExpression('sin(cos(60))', 'deg')).toBeCloseTo(
      Math.sin((Math.cos((60 * Math.PI) / 180) * Math.PI) / 180),
      10
    );
  });

  it('function without parens operand: sqrt(9+16) = 5', () => {
    expect(evaluateExpression('sqrt(9+16)')).toBe(5);
  });
});

// --- postfix operators ---
describe('postfix operators', () => {
  it('5! = 120', () => {
    expect(evaluateExpression('5!')).toBe(120);
  });

  it('0! = 1', () => {
    expect(evaluateExpression('0!')).toBe(1);
  });

  it('(2+3)! = 120', () => {
    expect(evaluateExpression('(2+3)!')).toBe(120);
  });

  it('2^3! = 64', () => {
    expect(evaluateExpression('2^3!')).toBe(64);
  });

  it('50% = 0.5', () => {
    expect(evaluateExpression('50%')).toBe(0.5);
  });

  it('200+10% = 200.1', () => {
    expect(evaluateExpression('200+10%')).toBeCloseTo(200.1, 10);
  });
});

// --- errors ---
describe('errors', () => {
  it('division by zero throws', () => {
    expect(() => evaluateExpression('5÷0')).toThrow('不能除以零');
  });

  it('empty expression throws', () => {
    expect(() => evaluateExpression('')).toThrow();
  });

  it('invalid character throws', () => {
    expect(() => evaluateExpression('2@3')).toThrow('无效字符');
  });

  it('unknown function throws', () => {
    expect(() => evaluateExpression('foo(3)')).toThrow('未知函数');
  });

  it('dangling operator throws', () => {
    expect(() => evaluateExpression('2+')).toThrow();
  });
});

// --- evalPreview ---
describe('evalPreview', () => {
  it('evaluates complete expression', () => {
    expect(evalPreview('2+3', 'deg')).toBe(5);
  });

  it('trims trailing operator: 2+3+ → 5', () => {
    expect(evalPreview('2+3+', 'deg')).toBe(5);
  });

  it('trims trailing open paren: 2×(3+ → 2', () => {
    expect(evalPreview('2×(3+', 'deg')).toBe(2);
  });

  it('trims incomplete function: sin( → null', () => {
    expect(evalPreview('sin(', 'deg')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(evalPreview('', 'deg')).toBeNull();
  });

  it('returns null for non-finite result', () => {
    expect(evalPreview('5÷0', 'deg')).toBeNull();
  });
});

// --- operand helpers ---
describe('findOperandStart', () => {
  it('finds trailing number', () => {
    expect(findOperandStart('2+30')).toBe(2);
  });

  it('finds trailing negative number', () => {
    expect(findOperandStart('2+-3')).toBe(2);
  });

  it('finds constant', () => {
    expect(findOperandStart('2+π')).toBe(2);
  });

  it('finds parenthesized group', () => {
    expect(findOperandStart('2×(3+4)')).toBe(2);
  });

  it('includes function name of a call', () => {
    expect(findOperandStart('2+sin(30)')).toBe(2);
  });

  it('returns null after operator', () => {
    expect(findOperandStart('2+')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(findOperandStart('')).toBeNull();
  });
});

describe('wrapOperand', () => {
  it('wraps trailing number', () => {
    expect(wrapOperand('30', 'sin(', ')')).toBe('sin(30)');
  });

  it('wraps within larger expression', () => {
    expect(wrapOperand('2+30', 'sin(', ')')).toBe('2+sin(30)');
  });

  it('appends prefix when no operand', () => {
    expect(wrapOperand('2+', 'sin(', ')')).toBe('2+sin(');
  });

  it('wraps for 1/x', () => {
    expect(wrapOperand('5', '1÷(', ')')).toBe('1÷(5)');
  });
});

describe('appendToOperand', () => {
  it('appends ^2 to number', () => {
    expect(appendToOperand('5', '^2')).toBe('5^2');
  });

  it('appends ! to parenthesized group', () => {
    expect(appendToOperand('(2+3)', '!')).toBe('(2+3)!');
  });

  it('no-ops after operator', () => {
    expect(appendToOperand('2+', '!')).toBe('2+');
  });
});
