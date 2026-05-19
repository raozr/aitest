import { renderHook, act } from '@testing-library/react-native';
import { useCalculator } from '../src/hooks/useCalculator';

// --- useCalculator hook ---
describe('useCalculator', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useCalculator());
    expect(result.current.display).toBe('0');
    expect(result.current.history).toEqual([]);
  });

  describe('handleDigit', () => {
    it('appends a digit', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('5'));
      expect(result.current.display).toBe('5');
    });

    it('chains multiple digits', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('1'));
      act(() => result.current.handleDigit('2'));
      act(() => result.current.handleDigit('3'));
      expect(result.current.display).toBe('123');
    });
  });

  describe('handleEquals', () => {
    it('performs addition', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('1'));
      act(() => result.current.handleOperation('+'));
      act(() => result.current.handleDigit('2'));
      act(() => result.current.handleEquals());
      expect(result.current.display).toBe('3');
    });

    it('performs subtraction', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('1'));
      act(() => result.current.handleDigit('0'));
      act(() => result.current.handleOperation('-'));
      act(() => result.current.handleDigit('3'));
      act(() => result.current.handleEquals());
      expect(result.current.display).toBe('7');
    });

    it('performs multiplication', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('4'));
      act(() => result.current.handleOperation('×'));
      act(() => result.current.handleDigit('5'));
      act(() => result.current.handleEquals());
      expect(result.current.display).toBe('20');
    });

    it('performs division', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('1'));
      act(() => result.current.handleDigit('0'));
      act(() => result.current.handleOperation('÷'));
      act(() => result.current.handleDigit('2'));
      act(() => result.current.handleEquals());
      expect(result.current.display).toBe('5');
    });

    it('shows error on division by zero', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('5'));
      act(() => result.current.handleOperation('÷'));
      act(() => result.current.handleDigit('0'));
      act(() => result.current.handleEquals());
      expect(result.current.display).toBe('错误');
    });

    it('resets error state when a new digit is entered after divide by zero', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('5'));
      act(() => result.current.handleOperation('÷'));
      act(() => result.current.handleDigit('0'));
      act(() => result.current.handleEquals());
      expect(result.current.display).toBe('错误');
      act(() => result.current.handleDigit('3'));
      expect(result.current.display).toBe('3');
    });

    it('adds history entry on successful calculation', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('2'));
      act(() => result.current.handleOperation('+'));
      act(() => result.current.handleDigit('3'));
      act(() => result.current.handleEquals());
      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].expression).toBe('2 + 3 = 5');
      expect(result.current.history[0].result).toBe('5');
    });

    it('does not add history entry on divide by zero', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('5'));
      act(() => result.current.handleOperation('÷'));
      act(() => result.current.handleDigit('0'));
      act(() => result.current.handleEquals());
      expect(result.current.history).toHaveLength(0);
    });
  });

  describe('handleClear', () => {
    it('resets to initial state', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('5'));
      act(() => result.current.handleOperation('+'));
      act(() => result.current.handleDigit('3'));
      act(() => result.current.handleClear());
      expect(result.current.display).toBe('0');
      expect(result.current.state.operation).toBeNull();
    });
  });

  describe('handleToggleSign', () => {
    it('toggles positive to negative', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('5'));
      act(() => result.current.handleToggleSign());
      expect(result.current.display).toBe('-5');
    });

    it('toggles negative to positive', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('5'));
      act(() => result.current.handleToggleSign());
      act(() => result.current.handleToggleSign());
      expect(result.current.display).toBe('5');
    });
  });

  describe('handlePercent', () => {
    it('converts to percentage', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('5'));
      act(() => result.current.handleDigit('0'));
      act(() => result.current.handlePercent());
      expect(result.current.display).toBe('0.5');
    });
  });

  describe('handleScientific', () => {
    it('computes sin(30)', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('3'));
      act(() => result.current.handleDigit('0'));
      act(() => result.current.handleScientific('sin'));
      expect(result.current.display).toBe('0.5');
    });

    it('computes factorial 5', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('5'));
      act(() => result.current.handleScientific('n!'));
      expect(result.current.display).toBe('120');
    });
  });

  describe('clearHistory and loadHistory', () => {
    it('clears history', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.handleDigit('2');
        result.current.handleOperation('+');
        result.current.handleDigit('3');
        result.current.handleEquals();
      });
      expect(result.current.history).toHaveLength(1);
      act(() => result.current.clearHistory());
      expect(result.current.history).toHaveLength(0);
    });

    it('loads history and syncs idCounter', () => {
      const { result } = renderHook(() => useCalculator());
      const entries = [
        { id: '10', expression: '1 + 1 = 2', result: '2', timestamp: Date.now() },
      ];
      act(() => result.current.loadHistory(entries));
      expect(result.current.history).toHaveLength(1);
      // After loading history with id 10, next entry should have id 11
      act(() => result.current.handleDigit('3'));
      act(() => result.current.handleOperation('+'));
      act(() => result.current.handleDigit('3'));
      act(() => result.current.handleEquals());
      expect(result.current.history[1].id).toBe('11');
    });
  });
});
