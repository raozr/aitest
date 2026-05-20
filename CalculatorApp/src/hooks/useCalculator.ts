import { useState, useCallback, useRef } from 'react';
import { CalculatorState, Operator, HistoryEntry } from '../types';
import { speakResult } from '../utils/speech';
import {
  createInitialState,
  inputNumber,
  inputOperation,
  calculateResult,
  clearAll,
  toggleSign,
  percentage,
  formatDisplay,
  formatHistoryEntry,
  scientificFunc,
} from '../utils/calculator';

interface UseCalculatorReturn {
  state: CalculatorState;
  display: string;
  history: HistoryEntry[];
  handleDigit: (digit: string) => void;
  handleOperation: (op: Operator) => void;
  handleEquals: () => void;
  handleClear: () => void;
  handleToggleSign: () => void;
  handlePercent: () => void;
  handleScientific: (func: string) => void;
  setDisplayValue: (value: string) => void;
  clearHistory: () => void;
  loadHistory: (entries: HistoryEntry[]) => void;
}

export function useCalculator(): UseCalculatorReturn {
  const [state, setState] = useState<CalculatorState>(createInitialState);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const idCounterRef = useRef(0);

  const addHistoryEntry = useCallback(
    (entry: HistoryEntry) => {
      setHistory((prev) => {
        const next = [...prev, entry];
        return next.length > 50 ? next.slice(-50) : next;
      });
    },
    []
  );

  const display = formatDisplay(state.currentInput);

  const handleDigit = useCallback((digit: string) => {
    setState((prev) => inputNumber(prev, digit));
  }, []);

  const handleOperation = useCallback((op: Operator) => {
    setState((prev) => inputOperation(prev, op));
  }, []);

  const handleEquals = useCallback(() => {
    let computedResult: string | null = null;
    setState((prev) => {
      if (!prev.operation || !prev.previousInput) return prev;
      try {
        const result = calculateResult(prev);
        computedResult = result.currentInput;
        const entry: HistoryEntry = {
          id: String(++idCounterRef.current),
          expression: formatHistoryEntry(
            prev.previousInput,
            prev.operation,
            prev.currentInput,
            result.currentInput
          ),
          result: result.currentInput,
          timestamp: Date.now(),
        };
        addHistoryEntry(entry);
        return result;
      } catch {
        computedResult = '错误';
        return {
          currentInput: '错误',
          previousInput: '',
          operation: null,
          shouldResetDisplay: true,
        };
      }
    });
    if (computedResult !== null) {
      speakResult(computedResult);
    }
  }, [addHistoryEntry]);

  const handleClear = useCallback(() => {
    setState(clearAll());
  }, []);

  const handleToggleSign = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentInput: toggleSign(prev.currentInput),
    }));
  }, []);

  const handlePercent = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentInput: percentage(prev.currentInput),
    }));
  }, []);

  const handleScientific = useCallback((func: string) => {
    setState((prev) => {
      const value = parseFloat(prev.currentInput);
      const result = scientificFunc(func, value);
      const resultStr = String(result);
      return {
        ...prev,
        currentInput: resultStr,
        shouldResetDisplay: true,
      };
    });
  }, []);

  const setDisplayValue = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      currentInput: value,
      shouldResetDisplay: true,
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const loadHistory = useCallback((entries: HistoryEntry[]) => {
    setHistory(entries);
    if (entries.length > 0) {
      idCounterRef.current = Math.max(...entries.map((e) => parseInt(e.id, 10)));
    }
  }, []);

  return {
    state,
    display,
    history,
    handleDigit,
    handleOperation,
    handleEquals,
    handleClear,
    handleToggleSign,
    handlePercent,
    handleScientific,
    setDisplayValue,
    clearHistory,
    loadHistory,
  };
}
