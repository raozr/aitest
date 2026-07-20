import { useState, useCallback, useRef, useEffect } from 'react';
import { CalculatorState, Operator, HistoryEntry, CalcMode } from '../types';
import { speakResult } from '../utils/speech';
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
  roundResult,
} from '../utils/calculator';
import {
  evaluateExpression,
  evalPreview,
  wrapOperand,
  appendToOperand,
  AngleMode,
} from '../utils/expressionParser';

const EXPR_MAX_LENGTH = 100;

// scientific function buttons that wrap the trailing operand: sin(…), √(…)
const WRAP_FUNCS: Record<string, string> = {
  sin: 'sin',
  cos: 'cos',
  tan: 'tan',
  log: 'log',
  ln: 'ln',
  '√': 'sqrt',
  '∛': 'cbrt',
  '|x|': 'abs',
  'eˣ': 'exp',
  '10ˣ': 'pow10',
};

// scientific buttons appended after the trailing operand
const APPEND_OPS: Record<string, string> = {
  'x²': '^2',
  'x³': '^3',
  'n!': '!',
};

const FUNC_TOKEN_PATTERN = /(pow10|sqrt|cbrt|sin|cos|tan|log|ln|abs|exp)\($/;

interface ExprState {
  expression: string;
  result: string | null;
}

interface UseCalculatorReturn {
  state: CalculatorState;
  display: string;
  expressionPreview: string;
  history: HistoryEntry[];
  angleMode: AngleMode;
  handleDigit: (digit: string) => void;
  handleOperation: (op: Operator) => void;
  handleEquals: () => void;
  handleClear: () => void;
  handleToggleSign: () => void;
  handlePercent: () => void;
  handleBackspace: () => void;
  handleScientific: (func: string) => void;
  handleParen: (paren: string) => void;
  handleToggleAngle: () => void;
  setDisplayValue: (value: string) => void;
  clearHistory: () => void;
  loadHistory: (entries: HistoryEntry[]) => void;
}

export function useCalculator(
  voiceEnabled: boolean = true,
  mode: CalcMode = 'basic'
): UseCalculatorReturn {
  const [state, setState] = useState<CalculatorState>(createInitialState);
  const [exprState, setExprState] = useState<ExprState>({ expression: '', result: null });
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const idCounterRef = useRef(0);
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const angleModeRef = useRef(angleMode);
  angleModeRef.current = angleMode;
  const pendingHistoryRef = useRef<HistoryEntry | null>(null);
  const pendingResultRef = useRef<string | null>(null);

  const addHistoryEntry = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => {
      const next = [...prev, entry];
      return next.length > 50 ? next.slice(-50) : next;
    });
  }, []);

  const pushEntry = useCallback((expression: string, result: string) => {
    pendingHistoryRef.current = {
      id: String(idCounterRef.current++),
      expression,
      result,
      timestamp: Date.now(),
    };
    pendingResultRef.current = result;
  }, []);

  useEffect(() => {
    if (pendingHistoryRef.current) {
      addHistoryEntry(pendingHistoryRef.current);
      pendingHistoryRef.current = null;
    }
    if (pendingResultRef.current !== null) {
      if (voiceEnabledRef.current) {
        speakResult(pendingResultRef.current);
      }
      pendingResultRef.current = null;
    }
  });

  // ---------- expression mode (scientific) ----------

  const exprAppend = useCallback((text: string) => {
    setExprState((prev) => {
      const base = prev.result !== null ? '' : prev.expression;
      if (base.length + text.length > EXPR_MAX_LENGTH) return prev;
      return { expression: base + text, result: null };
    });
  }, []);

  const exprAppendOperator = useCallback((op: string) => {
    setExprState((prev) => {
      let expr = prev.result !== null ? prev.result : prev.expression;
      if (expr === '错误') expr = '';
      if (expr === '') {
        return op === '-' ? { expression: '-', result: null } : prev;
      }
      const last = expr[expr.length - 1];
      if ('+-×÷^'.includes(last)) {
        // allow "5×-" for entering a negative operand
        if (op === '-' && last !== '-') {
          return { expression: expr + op, result: null };
        }
        return { expression: expr.slice(0, -1) + op, result: null };
      }
      if (last === '(') {
        return op === '-' ? { expression: expr + op, result: null } : prev;
      }
      if (expr.length + 1 > EXPR_MAX_LENGTH) return prev;
      return { expression: expr + op, result: null };
    });
  }, []);

  const exprEquals = useCallback(() => {
    setExprState((prev) => {
      if (prev.result !== null || prev.expression === '') return prev;
      let resultValue: string;
      try {
        const value = roundResult(evaluateExpression(prev.expression, angleModeRef.current));
        resultValue = Number.isFinite(value) ? String(value) : '错误';
      } catch {
        resultValue = '错误';
      }
      if (resultValue !== '错误') {
        pushEntry(`${prev.expression} = ${resultValue}`, resultValue);
      } else {
        pendingResultRef.current = resultValue;
      }
      return { ...prev, result: resultValue };
    });
  }, [pushEntry]);

  const exprToggleSign = useCallback(() => {
    setExprState((prev) => {
      if (prev.result !== null) {
        if (prev.result === '错误' || prev.result === '0') return prev;
        const toggled = prev.result.startsWith('-')
          ? prev.result.slice(1)
          : '-' + prev.result;
        return { ...prev, result: toggled };
      }
      const expr = prev.expression;
      if (expr === '') return { expression: '-', result: null };
      // unwrap trailing "(-N)"
      const wrapped = expr.match(/\(-(\d*\.?\d*)\)$/);
      if (wrapped) {
        return { expression: expr.slice(0, expr.length - wrapped[0].length) + wrapped[1], result: null };
      }
      // toggle a leading unary minus of the trailing number
      const trailing = expr.match(/(\d*\.?\d*)$/);
      if (trailing && trailing[1] !== '') {
        const numStart = expr.length - trailing[1].length;
        const before = expr[numStart - 1];
        if (before === '-' && (numStart - 1 === 0 || '+-×÷^('.includes(expr[numStart - 2]))) {
          return { expression: expr.slice(0, numStart - 1) + trailing[1], result: null };
        }
        return { expression: expr.slice(0, numStart) + '(-' + trailing[1] + ')', result: null };
      }
      return prev;
    });
  }, []);

  const exprBackspace = useCallback(() => {
    setExprState((prev) => {
      if (prev.result !== null) return { ...prev, result: null };
      const expr = prev.expression;
      const funcMatch = expr.match(FUNC_TOKEN_PATTERN);
      if (funcMatch) {
        return { expression: expr.slice(0, expr.length - funcMatch[0].length), result: null };
      }
      return { expression: expr.slice(0, -1), result: null };
    });
  }, []);

  const exprScientific = useCallback((func: string) => {
    setExprState((prev) => {
      let expr = prev.result !== null ? prev.result : prev.expression;
      if (expr === '错误') expr = '';
      let next: string;
      if (WRAP_FUNCS[func]) {
        next = wrapOperand(expr, `${WRAP_FUNCS[func]}(`, ')');
      } else if (APPEND_OPS[func]) {
        next = appendToOperand(expr, APPEND_OPS[func]);
      } else if (func === '1/x') {
        next = wrapOperand(expr, '1÷(', ')');
      } else if (func === 'π' || func === 'e') {
        next = expr + func;
      } else {
        return prev;
      }
      if (next === expr && !WRAP_FUNCS[func]) return prev;
      if (next.length > EXPR_MAX_LENGTH) return prev;
      return { expression: next, result: null };
    });
  }, []);

  const exprParen = useCallback((paren: string) => {
    setExprState((prev) => {
      let expr = prev.result !== null ? '' : prev.expression;
      if (paren === '(') {
        if (expr.length + 1 > EXPR_MAX_LENGTH) return prev;
        return { expression: expr + '(', result: null };
      }
      // ')': only when an open paren is pending and last char is closable
      const open = (expr.match(/\(/g) || []).length;
      const close = (expr.match(/\)/g) || []).length;
      if (open <= close) return prev;
      const last = expr[expr.length - 1];
      if (!last || '+-×÷^('.includes(last)) return prev;
      return { expression: expr + ')', result: null };
    });
  }, []);

  // ---------- public handlers ----------

  const handleDigit = useCallback(
    (digit: string) => {
      if (modeRef.current === 'scientific') {
        if (digit === '.') {
          setExprState((prev) => {
            const expr = prev.result !== null ? '' : prev.expression;
            const trailing = expr.match(/(\d*\.?\d*)$/);
            if (trailing && trailing[1].includes('.')) return prev;
            if (expr === '' || '+-×÷^('.includes(expr[expr.length - 1])) {
              return { expression: expr + '0.', result: null };
            }
            if (expr.length + 1 > EXPR_MAX_LENGTH) return prev;
            return { expression: expr + '.', result: null };
          });
          return;
        }
        exprAppend(digit);
        return;
      }
      setState((prev) => inputNumber(prev, digit));
    },
    [exprAppend]
  );

  const handleOperation = useCallback(
    (op: Operator) => {
      if (modeRef.current === 'scientific') {
        exprAppendOperator(op);
        return;
      }
      setState((prev) => inputOperation(prev, op));
    },
    [exprAppendOperator]
  );

  const handleEquals = useCallback(() => {
    if (modeRef.current === 'scientific') {
      exprEquals();
      return;
    }
    setState((prev) => {
      let a: string;
      let op: Operator;
      let b: string;
      if (prev.operation && prev.previousInput) {
        a = prev.previousInput;
        op = prev.operation;
        b = prev.currentInput;
      } else if (prev.lastOperation && prev.lastOperand) {
        // repeated equals: apply the last operation again
        a = prev.currentInput;
        op = prev.lastOperation;
        b = prev.lastOperand;
      } else {
        return prev;
      }

      let nextState: CalculatorState;
      let resultValue: string;
      try {
        const computed = calculateResult({
          ...prev,
          previousInput: a,
          operation: op,
          currentInput: b,
        });
        resultValue = computed.currentInput;
        nextState = { ...computed, lastOperation: op, lastOperand: b };
      } catch {
        nextState = {
          currentInput: '错误',
          previousInput: '',
          operation: null,
          shouldResetDisplay: true,
        };
        resultValue = '错误';
      }

      if (resultValue !== '错误') {
        pushEntry(formatHistoryEntry(a, op, b, resultValue), resultValue);
      } else {
        pendingResultRef.current = resultValue;
      }
      return nextState;
    });
  }, [exprEquals, pushEntry]);

  const handleClear = useCallback(() => {
    if (modeRef.current === 'scientific') {
      setExprState({ expression: '', result: null });
      return;
    }
    setState(clearAll());
  }, []);

  const handleToggleSign = useCallback(() => {
    if (modeRef.current === 'scientific') {
      exprToggleSign();
      return;
    }
    setState((prev) => ({
      ...prev,
      currentInput: toggleSign(prev.currentInput),
    }));
  }, [exprToggleSign]);

  const handlePercent = useCallback(() => {
    if (modeRef.current === 'scientific') {
      setExprState((prev) => {
        if (prev.result !== null) {
          const value = parseFloat(prev.result);
          if (isNaN(value)) return prev;
          return { ...prev, result: String(roundResult(value / 100)) };
        }
        const last = prev.expression[prev.expression.length - 1];
        if (!last || '+-×÷^('.includes(last)) return prev;
        return { expression: prev.expression + '%', result: null };
      });
      return;
    }
    setState((prev) => ({
      ...prev,
      currentInput: percentage(prev.currentInput),
    }));
  }, []);

  const handleBackspace = useCallback(() => {
    if (modeRef.current === 'scientific') {
      exprBackspace();
      return;
    }
    setState((prev) => ({
      ...prev,
      currentInput: backspace(prev.currentInput),
    }));
  }, [exprBackspace]);

  const handleScientific = useCallback(
    (func: string) => {
      if (modeRef.current === 'scientific') {
        exprScientific(func);
      }
    },
    [exprScientific]
  );

  const handleParen = useCallback(
    (paren: string) => {
      if (modeRef.current === 'scientific') {
        exprParen(paren);
      }
    },
    [exprParen]
  );

  const handleToggleAngle = useCallback(() => {
    setAngleMode((prev) => (prev === 'deg' ? 'rad' : 'deg'));
  }, []);

  const setDisplayValue = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      currentInput: value,
      shouldResetDisplay: true,
    }));
    setExprState({ expression: '', result: null });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const loadHistory = useCallback((entries: HistoryEntry[]) => {
    setHistory(entries);
    if (entries.length > 0) {
      idCounterRef.current = Math.max(...entries.map((e) => parseInt(e.id, 10))) + 1;
    }
  }, []);

  // ---------- display ----------

  let display: string;
  let expressionPreview: string;
  if (mode === 'scientific') {
    if (exprState.result !== null) {
      display = exprState.result;
      expressionPreview = `${exprState.expression} =`;
    } else {
      display = exprState.expression === '' ? '0' : exprState.expression;
      const preview = evalPreview(exprState.expression, angleMode);
      expressionPreview =
        preview !== null && !/^-?\d*\.?\d*$/.test(exprState.expression)
          ? `= ${preview}`
          : '';
    }
  } else {
    display = formatDisplay(state.currentInput);
    expressionPreview = state.operation
      ? `${state.previousInput} ${state.operation}`
      : '';
  }

  return {
    state,
    display,
    expressionPreview,
    history,
    angleMode,
    handleDigit,
    handleOperation,
    handleEquals,
    handleClear,
    handleToggleSign,
    handlePercent,
    handleBackspace,
    handleScientific,
    handleParen,
    handleToggleAngle,
    setDisplayValue,
    clearHistory,
    loadHistory,
  };
}
