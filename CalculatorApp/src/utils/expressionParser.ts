import { roundResult } from './calculator';

export type AngleMode = 'deg' | 'rad';

type TokenType = 'num' | 'op' | 'lparen' | 'rparen' | 'func' | 'postfix';

interface Token {
  type: TokenType;
  value: string;
}

export const FUNC_NAMES = [
  'sin',
  'cos',
  'tan',
  'log',
  'ln',
  'sqrt',
  'cbrt',
  'abs',
  'exp',
  'pow10',
] as const;

const OPERATORS = ['+', '-', '×', '÷', '^'];
const PRECEDENCE: Record<string, number> = {
  '+': 1,
  '-': 1,
  '×': 2,
  '÷': 2,
  '^': 3,
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function factorial(n: number): number {
  n = Math.floor(n);
  if (n < 0) return NaN;
  if (n > 170) return Infinity;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

function applyFunc(name: string, x: number, angle: AngleMode): number {
  switch (name) {
    case 'sin':
      return Math.sin(angle === 'deg' ? toRadians(x) : x);
    case 'cos':
      return Math.cos(angle === 'deg' ? toRadians(x) : x);
    case 'tan': {
      const r = Math.tan(angle === 'deg' ? toRadians(x) : x);
      return Math.abs(r) > 1e10 ? Infinity : r;
    }
    case 'log':
      return Math.log10(x);
    case 'ln':
      return Math.log(x);
    case 'sqrt':
      return Math.sqrt(x);
    case 'cbrt':
      return Math.cbrt(x);
    case 'abs':
      return Math.abs(x);
    case 'exp':
      return Math.exp(x);
    case 'pow10':
      return Math.pow(10, x);
    default:
      throw new Error(`未知函数: ${name}`);
  }
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const isUnaryPosition = (): boolean => {
    const prev = tokens[tokens.length - 1];
    return !prev || prev.type === 'op' || prev.type === 'lparen';
  };

  while (i < expr.length) {
    const ch = expr[i];

    if (ch === ' ') {
      i++;
      continue;
    }

    // number (with optional unary sign folded in)
    const signFollowedByDigit =
      (ch === '-' || ch === '+') &&
      isUnaryPosition() &&
      /[0-9.]/.test(expr[i + 1] ?? '');
    if (/[0-9.]/.test(ch) || signFollowedByDigit) {
      let num = '';
      if (ch === '-' || ch === '+') {
        if (ch === '-') num = '-';
        i++;
      }
      let dots = 0;
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        if (expr[i] === '.') {
          dots++;
          if (dots > 1) throw new Error('无效的数字');
        }
        num += expr[i];
        i++;
      }
      if (num === '' || num === '-') throw new Error('无效的数字');
      tokens.push({ type: 'num', value: num });
      continue;
    }

    if (ch === 'π') {
      tokens.push({ type: 'num', value: String(Math.PI) });
      i++;
      continue;
    }

    if (/[a-z]/i.test(ch)) {
      let name = '';
      while (i < expr.length && /[a-z0-9]/i.test(expr[i])) {
        name += expr[i];
        i++;
      }
      if (name === 'e') {
        tokens.push({ type: 'num', value: String(Math.E) });
        continue;
      }
      if (!(FUNC_NAMES as readonly string[]).includes(name)) {
        throw new Error(`未知函数: ${name}`);
      }
      tokens.push({ type: 'func', value: name });
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen', value: ch });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ch });
      i++;
      continue;
    }

    if (OPERATORS.includes(ch)) {
      // unary +/- before '(' , function, π or e → -1 × …
      if ((ch === '-' || ch === '+') && isUnaryPosition()) {
        if (ch === '-') {
          tokens.push({ type: 'num', value: '-1' });
          tokens.push({ type: 'op', value: '×' });
        }
        i++;
        continue;
      }
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    if (ch === '%' || ch === '!') {
      tokens.push({ type: 'postfix', value: ch });
      i++;
      continue;
    }

    throw new Error(`无效字符: ${ch}`);
  }

  // implicit multiplication: 2π, 2(3), )( , 2sin(…)
  const out: Token[] = [];
  for (const t of tokens) {
    const prev = out[out.length - 1];
    if (
      prev &&
      (prev.type === 'num' || prev.type === 'rparen' || prev.type === 'postfix') &&
      (t.type === 'num' || t.type === 'lparen' || t.type === 'func')
    ) {
      out.push({ type: 'op', value: '×' });
    }
    out.push(t);
  }
  return out;
}

function toPostfix(tokens: Token[]): Token[] {
  const out: Token[] = [];
  const stack: Token[] = [];

  for (const t of tokens) {
    if (t.type === 'num') {
      out.push(t);
    } else if (t.type === 'func') {
      stack.push(t);
    } else if (t.type === 'postfix') {
      // postfix operators (!, %) bind to the immediately preceding value
      out.push(t);
    } else if (t.type === 'op') {
      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type === 'func') {
          out.push(stack.pop()!);
          continue;
        }
        if (
          top.type === 'op' &&
          (PRECEDENCE[top.value] > PRECEDENCE[t.value] ||
            (PRECEDENCE[top.value] === PRECEDENCE[t.value] && t.value !== '^'))
        ) {
          out.push(stack.pop()!);
          continue;
        }
        break;
      }
      stack.push(t);
    } else if (t.type === 'lparen') {
      stack.push(t);
    } else if (t.type === 'rparen') {
      let found = false;
      while (stack.length > 0) {
        const top = stack.pop()!;
        if (top.type === 'lparen') {
          found = true;
          break;
        }
        out.push(top);
      }
      if (!found) throw new Error('括号不匹配');
      if (stack.length > 0 && stack[stack.length - 1].type === 'func') {
        out.push(stack.pop()!);
      }
    }
  }

  while (stack.length > 0) {
    const top = stack.pop()!;
    if (top.type === 'lparen') throw new Error('括号不匹配');
    out.push(top);
  }
  return out;
}

function evaluatePostfix(tokens: Token[], angle: AngleMode): number {
  const values: number[] = [];

  for (const t of tokens) {
    if (t.type === 'num') {
      values.push(parseFloat(t.value));
    } else if (t.type === 'postfix') {
      const x = values.pop();
      if (x === undefined) throw new Error('表达式无效');
      values.push(t.value === '%' ? x / 100 : factorial(x));
    } else if (t.type === 'func') {
      const x = values.pop();
      if (x === undefined) throw new Error('表达式无效');
      values.push(applyFunc(t.value, x, angle));
    } else if (t.type === 'op') {
      const b = values.pop();
      const a = values.pop();
      if (a === undefined || b === undefined) throw new Error('表达式无效');
      switch (t.value) {
        case '+':
          values.push(a + b);
          break;
        case '-':
          values.push(a - b);
          break;
        case '×':
          values.push(a * b);
          break;
        case '÷':
          if (b === 0) throw new Error('不能除以零');
          values.push(a / b);
          break;
        case '^':
          values.push(Math.pow(a, b));
          break;
      }
    }
  }

  if (values.length !== 1) throw new Error('表达式无效');
  return values[0];
}

export function evaluateExpression(expr: string, angle: AngleMode = 'deg'): number {
  const tokens = tokenize(expr);
  if (tokens.length === 0) throw new Error('表达式为空');
  return evaluatePostfix(toPostfix(tokens), angle);
}

function trimOneStep(s: string): string {
  const trailingIdent = s.match(/[a-z0-9]+$/i);
  if (trailingIdent && !/^\d*\.?\d*$/.test(trailingIdent[0])) {
    return s.slice(0, s.length - trailingIdent[0].length);
  }
  return s.slice(0, -1);
}

// incomplete input: trailing operator/lparen, unbalanced parens,
// dangling dot or partial function name
function endsIncomplete(s: string): boolean {
  if (!s) return false;
  const open = (s.match(/\(/g) || []).length;
  const close = (s.match(/\)/g) || []).length;
  if (open > close) return true;
  const last = s[s.length - 1];
  if ('+-×÷^('.includes(last) || last === '.') return true;
  if (/[a-z]/i.test(last)) {
    const ident = s.match(/[a-z0-9]+$/i);
    if (ident && ident[0] !== 'e') return true;
  }
  return false;
}

export function evalPreview(expr: string, angle: AngleMode): number | null {
  let s = expr.trim();
  for (let i = 0; i < 20 && s; i++) {
    try {
      const value = evaluateExpression(s, angle);
      return Number.isFinite(value) ? roundResult(value) : null;
    } catch {
      if (!endsIncomplete(s)) return null;
      s = trimOneStep(s);
    }
  }
  return null;
}

/**
 * Finds the start index of the trailing operand (number, constant,
 * parenthesized group or function call) used for wrapping operations
 * like sin(…), 1/x, x². Returns null when there is no trailing operand.
 */
export function findOperandStart(expr: string): number | null {
  if (!expr) return null;
  let i = expr.length - 1;

  while (i >= 0 && (expr[i] === '!' || expr[i] === '%')) i--;
  if (i < 0) return null;

  const ch = expr[i];

  if (/[0-9.]/.test(ch)) {
    while (i >= 0 && /[0-9.]/.test(expr[i])) i--;
    if (i >= 0 && expr[i] === '-' && (i === 0 || '+-×÷^('.includes(expr[i - 1]))) {
      i--;
    }
    return i + 1;
  }

  if (ch === 'π' || ch === 'e') {
    return i;
  }

  if (ch === ')') {
    let depth = 0;
    while (i >= 0) {
      if (expr[i] === ')') depth++;
      else if (expr[i] === '(') {
        depth--;
        if (depth === 0) break;
      }
      i--;
    }
    if (i < 0) return null;
    for (const name of FUNC_NAMES) {
      if (expr.slice(0, i).endsWith(name)) {
        return i - name.length;
      }
    }
    return i;
  }

  return null;
}

export function wrapOperand(expr: string, prefix: string, suffix: string): string {
  const start = findOperandStart(expr);
  if (start === null) return expr + prefix;
  return expr.slice(0, start) + prefix + expr.slice(start) + suffix;
}

export function appendToOperand(expr: string, suffix: string): string {
  const start = findOperandStart(expr);
  if (start === null) return expr;
  return expr + suffix;
}
