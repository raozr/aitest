import { useState, useCallback, useRef, useEffect } from 'react';
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
  backspace,
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
  handleBackspace: () => void;
  handleScientific: (func: string) => void;
  setDisplayValue: (value: string) => void;
  clearHistory: () => void;
  loadHistory: (entries: HistoryEntry[]) => void;
}

export function useCalculator(voiceEnabled: boolean = true): UseCalculatorReturn {
  const [state, setState] = useState<CalculatorState>(createInitialState);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const idCounterRef = useRef(0);
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;
  const pendingHistoryRef = useRef<HistoryEntry | null>(null);
  const pendingResultRef = useRef<string | null>(null);

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

  const handleDigit = useCallback((digit: string) => {
    setState((prev) => inputNumber(prev, digit));
  }, []);

  const handleOperation = useCallback((op: Operator) => {
    setState((prev) => inputOperation(prev, op));
  }, []);

  const handleEquals = useCallback(() => {
    setState((prev) => {
      if (!prev.operation || !prev.previousInput) return prev;

      let nextState: CalculatorState;
      let resultValue: string;

      try {
        nextState = calculateResult(prev);
        resultValue = nextState.currentInput;
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
        pendingHistoryRef.current = {
          id: String(idCounterRef.current++),
          expression: formatHistoryEntry(
            prev.previousInput,
            prev.operation!,
            prev.currentInput,
            resultValue
          ),
          result: resultValue,
          timestamp: Date.now(),
        };
      }

      pendingResultRef.current = resultValue;
      return nextState;
    });
  }, []);

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

  const handleBackspace = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentInput: backspace(prev.currentInput),
    }));
  }, []);

  const handleScientific = useCallback((func: string) => {
    setState((prev) => {
      const value = parseFloat(prev.currentInput);
      const result = scientificFunc(func, value);
      if (!isFinite(result)) {
        return {
          ...prev,
          currentInput: '错误',
          previousInput: '',
          operation: null,
          shouldResetDisplay: true,
        };
      }
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
      idCounterRef.current = Math.max(...entries.map((e) => parseInt(e.id, 10))) + 1;
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
    handleBackspace,
    handleScientific,
    setDisplayValue,
    clearHistory,
    loadHistory,
  };
}
