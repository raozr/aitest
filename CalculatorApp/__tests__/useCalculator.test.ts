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

  describe('handleBackspace', () => {
    it('removes last digit', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('1'));
      act(() => result.current.handleDigit('2'));
      act(() => result.current.handleDigit('3'));
      expect(result.current.display).toBe('123');
      act(() => result.current.handleBackspace());
      expect(result.current.display).toBe('12');
    });

    it('single digit becomes 0', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('5'));
      act(() => result.current.handleBackspace());
      expect(result.current.display).toBe('0');
    });

    it('0 stays 0', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleBackspace());
      expect(result.current.display).toBe('0');
    });
  });

  describe('handleScientific (expression mode)', () => {
    it('computes sin(30)', () => {
      const { result } = renderHook(() => useCalculator(true, 'scientific'));
      act(() => result.current.handleDigit('3'));
      act(() => result.current.handleDigit('0'));
      act(() => result.current.handleScientific('sin'));
      expect(result.current.display).toBe('sin(30)');
      act(() => result.current.handleEquals());
      expect(result.current.display).toBe('0.5');
    });

    it('computes factorial 5', () => {
      const { result } = renderHook(() => useCalculator(true, 'scientific'));
      act(() => result.current.handleDigit('5'));
      act(() => result.current.handleScientific('n!'));
      act(() => result.current.handleEquals());
      expect(result.current.display).toBe('120');
    });

    it('respects operator precedence: 2+3×4 = 14', () => {
      const { result } = renderHook(() => useCalculator(true, 'scientific'));
      act(() => result.current.handleDigit('2'));
      act(() => result.current.handleOperation('+'));
      act(() => result.current.handleDigit('3'));
      act(() => result.current.handleOperation('×'));
      act(() => result.current.handleDigit('4'));
      act(() => result.current.handleEquals());
      expect(result.current.display).toBe('14');
    });

    it('supports parentheses: (2+3)×4 = 20', () => {
      const { result } = renderHook(() => useCalculator(true, 'scientific'));
      act(() => result.current.handleParen('('));
      act(() => result.current.handleDigit('2'));
      act(() => result.current.handleOperation('+'));
      act(() => result.current.handleDigit('3'));
      act(() => result.current.handleParen(')'));
      act(() => result.current.handleOperation('×'));
      act(() => result.current.handleDigit('4'));
      act(() => result.current.handleEquals());
      expect(result.current.display).toBe('20');
    });

    it('adds history entry with full expression', () => {
      const { result } = renderHook(() => useCalculator(true, 'scientific'));
      act(() => result.current.handleDigit('5'));
      act(() => result.current.handleScientific('n!'));
      act(() => result.current.handleEquals());
      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].expression).toBe('5! = 120');
      expect(result.current.history[0].result).toBe('120');
    });

    it('shows live preview while typing', () => {
      const { result } = renderHook(() => useCalculator(true, 'scientific'));
      act(() => result.current.handleDigit('2'));
      act(() => result.current.handleOperation('+'));
      act(() => result.current.handleDigit('3'));
      expect(result.current.expressionPreview).toBe('= 5');
    });

    it('backspace trims a whole function token', () => {
      const { result } = renderHook(() => useCalculator(true, 'scientific'));
      act(() => result.current.handleDigit('3'));
      act(() => result.current.handleScientific('sin'));
      expect(result.current.display).toBe('sin(3)');
      act(() => result.current.handleBackspace());
      expect(result.current.display).toBe('sin(3');
    });

    it('is a no-op in basic mode', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('5'));
      act(() => result.current.handleScientific('sin'));
      expect(result.current.display).toBe('5');
    });
  });

  describe('repeated equals', () => {
    it('repeats the last operation', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('3'));
      act(() => result.current.handleOperation('+'));
      act(() => result.current.handleDigit('3'));
      act(() => result.current.handleEquals());
      expect(result.current.display).toBe('6');
      act(() => result.current.handleEquals());
      expect(result.current.display).toBe('9');
      act(() => result.current.handleEquals());
      expect(result.current.display).toBe('12');
    });

    it('adds a history entry for each repeat', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.handleDigit('3'));
      act(() => result.current.handleOperation('+'));
      act(() => result.current.handleDigit('3'));
      act(() => result.current.handleEquals());
      act(() => result.current.handleEquals());
      expect(result.current.history).toHaveLength(2);
      expect(result.current.history[1].expression).toBe('6 + 3 = 9');
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
