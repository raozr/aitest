import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CalcMode, Operator } from '../types';
import { colors } from '../constants/theme';
import { useCalculator } from '../hooks/useCalculator';
import { loadHistory, saveHistory } from '../storage/history';
import { loadVoiceEnabled, saveVoiceEnabled } from '../storage/settings';
import Display from '../components/Display';
import ModeSwitcher from '../components/ModeSwitcher';
import { speakDigit, speakOperator, speakScientific, stopSpeech } from '../utils/speech';
import Button from '../components/Button';
import { RootStackParamList } from '../navigation/AppNavigator';

interface BtnDef {
  label: string;
  type: 'number' | 'function' | 'operator' | 'scientific';
  span?: 1 | 2;
  action?: 'digit' | 'op' | 'equals' | 'clear' | 'toggle' | 'percent' | 'power' | 'backspace';
}

const BASIC_BUTTONS: BtnDef[] = [
  { label: 'C', type: 'function', action: 'clear' },
  { label: '±', type: 'function', action: 'toggle' },
  { label: '%', type: 'function', action: 'percent' },
  { label: '÷', type: 'operator', action: 'op' },
  { label: '7', type: 'number', action: 'digit' },
  { label: '8', type: 'number', action: 'digit' },
  { label: '9', type: 'number', action: 'digit' },
  { label: '×', type: 'operator', action: 'op' },
  { label: '4', type: 'number', action: 'digit' },
  { label: '5', type: 'number', action: 'digit' },
  { label: '6', type: 'number', action: 'digit' },
  { label: '-', type: 'operator', action: 'op' },
  { label: '1', type: 'number', action: 'digit' },
  { label: '2', type: 'number', action: 'digit' },
  { label: '3', type: 'number', action: 'digit' },
  { label: '+', type: 'operator', action: 'op' },
  { label: '0', type: 'number', span: 2, action: 'digit' },
  { label: '.', type: 'number', action: 'digit' },
  { label: '=', type: 'operator', action: 'equals' },
];

const SCIENTIFIC_BUTTONS: BtnDef[] = [
  { label: '⌫', type: 'operator', action: 'backspace' },
  { label: 'n!', type: 'scientific' },
  { label: 'π', type: 'scientific' },
  { label: 'e', type: 'scientific' },
  { label: '|x|', type: 'scientific' },
  { label: '1/x', type: 'scientific' },
  { label: 'x²', type: 'scientific' },
  { label: 'x³', type: 'scientific' },
  { label: 'xʸ', type: 'operator', action: 'power' },
  { label: '√', type: 'scientific' },
  { label: '∛', type: 'scientific' },
  { label: 'log', type: 'scientific' },
  { label: 'ln', type: 'scientific' },
  { label: 'eˣ', type: 'scientific' },
  { label: 'sin', type: 'scientific' },
  { label: 'cos', type: 'scientific' },
  { label: 'tan', type: 'scientific' },
  { label: '10ˣ', type: 'scientific' },
];

const MODE_LABELS: Record<string, string> = {
  basic: '基础',
  scientific: '科学',
};

const OP_MAP: Record<string, Operator> = {
  '+': '+',
  '-': '-',
  '×': '×',
  '÷': '÷',
};

export default function CalculatorScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Calculator'>>();

  const [calcMode, setCalcMode] = useState<CalcMode>('basic');
  const [menuVisible, setMenuVisible] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const insets = useSafeAreaInsets();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
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
    loadHistory: loadCalcHistory,
  } = useCalculator(voiceEnabled);

  useEffect(() => {
    loadHistory().then((entries) => {
      loadCalcHistory(entries);
    });
  }, []);

  useEffect(() => {
    loadVoiceEnabled().then(setVoiceEnabled);
  }, []);

  useEffect(() => {
    saveVoiceEnabled(voiceEnabled);
  }, [voiceEnabled]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveHistory(history);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [history]);

  useEffect(() => {
    return () => stopSpeech();
  }, []);

  useEffect(() => {
    if (route.params?.restoreValue) {
      setDisplayValue(route.params.restoreValue);
      navigation.setParams({ restoreValue: undefined });
    }
  }, [route.params?.restoreValue]);

  const { width: screenWidth } = useWindowDimensions();
  const cols = 4;
  const gap = 8;
  const btnSize = (screenWidth - gap * (cols + 1)) / cols;

  const buttonActions: Record<string, (label: string) => void> = {
    digit: (l) => { if (l) { handleDigit(l); if (voiceEnabled) speakDigit(l); } },
    op: (l) => { if (l && OP_MAP[l]) { handleOperation(OP_MAP[l]); if (voiceEnabled) speakOperator(l); } },
    equals: () => { if (voiceEnabled) speakOperator('='); handleEquals(); },
    clear: () => handleClear(),
    toggle: () => handleToggleSign(),
    percent: () => { if (voiceEnabled) speakOperator('%'); handlePercent(); },
    power: () => { if (voiceEnabled) speakScientific('xʸ'); handleOperation('^'); },
    backspace: () => { if (voiceEnabled) speakScientific('⌫'); handleBackspace(); },
  };

  const onButtonPress = (btn: BtnDef) => {
    if (btn.action) {
      const action = buttonActions[btn.action];
      action(btn.label);
    } else {
      if (voiceEnabled) speakScientific(btn.label);
      handleScientific(btn.label);
    }
  };

  const buildRows = (buttons: BtnDef[]) => {
    const gridCols = 4;
    const rows: BtnDef[][] = [];
    let row: BtnDef[] = [];
    let colCount = 0;

    buttons.forEach((btn) => {
      const span = btn.span || 1;
      if (colCount + span > gridCols) {
        rows.push(row);
        row = [];
        colCount = 0;
      }
      row.push(btn);
      colCount += span;
    });
    if (row.length > 0) rows.push(row);
    return rows;
  };

  const renderScientificButtons = () => {
    const rows = buildRows(SCIENTIFIC_BUTTONS);
    return rows.map((rowBtns, ri) => (
      <View key={`sci-${ri}`} style={styles.gridRow}>
        {rowBtns.map((btn, ci) => (
          <View
            key={`sci-${ri}-${ci}`}
            style={ci < rowBtns.length - 1 ? { marginRight: gap } : undefined}
          >
            <Button
              label={btn.label}
              type={btn.type}
              width={btnSize}
              height={btnSize * 0.85}
              onPress={() => onButtonPress(btn)}
            />
          </View>
        ))}
      </View>
    ));
  };

  const renderBasicButtons = () => {
    const rows = buildRows(BASIC_BUTTONS);
    return rows.map((rowBtns, ri) => (
      <View key={ri} style={styles.gridRow}>
        {rowBtns.map((btn, ci) => (
          <View
            key={`${ri}-${ci}`}
            style={
              btn.span === 2
                ? { width: btnSize * 2 + gap, marginRight: gap / 2 }
                : ci < rowBtns.length - 1
                ? { marginRight: gap }
                : undefined
            }
          >
            <Button
              label={btn.label}
              type={btn.type}
              span={btn.span}
              size={btnSize}
              onPress={() => onButtonPress(btn)}
            />
          </View>
        ))}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.toolbar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={styles.toolbarBtn}
          onPress={() => navigation.navigate('History')}
          hitSlop={8}
        >
          <Text style={styles.toolbarBtnText}>📋</Text>
        </Pressable>
        <Text style={styles.toolbarTitle}>计算器</Text>
        <Pressable
          style={styles.toolbarBtn}
          onPress={() => setVoiceEnabled(!voiceEnabled)}
          hitSlop={8}
        >
          <Text style={styles.toolbarBtnText}>{voiceEnabled ? '🔊' : '🔇'}</Text>
        </Pressable>
        <Pressable
          style={styles.toolbarBtn}
          onPress={() => setMenuVisible(true)}
          hitSlop={8}
        >
          <Text style={styles.toolbarBtnText}>☰</Text>
        </Pressable>
      </View>
      <Display value={display} />
      <ModeSwitcher mode={calcMode} onModeChange={setCalcMode} />
      {calcMode === 'scientific' ? (
        <ScrollView style={styles.gridScroll} contentContainerStyle={styles.gridScrollContent}>
          {renderScientificButtons()}
          <View style={styles.sectionDivider} />
          {renderBasicButtons()}
        </ScrollView>
      ) : (
        <View style={styles.grid}>
          {renderBasicButtons()}
        </View>
      )}

      {/* Mode selector modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <Text style={styles.menuTitle}>选择计算模式</Text>
            {[
              { label: '基础', icon: '➕' },
              { label: '科学', icon: '🔬' },
              { label: '汇率', icon: '💱' },
            ].map((item) => {
              const isCurrent = item.label === MODE_LABELS[calcMode];
              return (
                <Pressable
                  key={item.label}
                  style={[styles.menuItem, isCurrent && styles.menuItemActive]}
                  onPress={() => {
                    setMenuVisible(false);
                    if (item.label === '汇率') {
                      navigation.navigate('Currency');
                    } else {
                      setCalcMode(item.label === MODE_LABELS.basic ? 'basic' : 'scientific');
                    }
                  }}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={[styles.menuLabel, isCurrent && styles.menuLabelActive]}>
                    {item.label}
                  </Text>
                  {isCurrent && <Text style={styles.menuCheck}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  toolbarBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarBtnText: {
    color: colors.opKey,
    fontSize: 22,
  },
  toolbarTitle: {
    color: colors.displayText,
    fontSize: 17,
    fontWeight: '600',
  },
  grid: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  gridScroll: {
    flex: 1,
  },
  gridScrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginVertical: 12,
    marginHorizontal: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  menuSheet: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 24,
    width: '75%',
    maxWidth: 320,
  },
  menuTitle: {
    color: colors.displayText,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  menuItemActive: {
    backgroundColor: colors.opKey,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuLabel: {
    color: colors.displayText,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  menuLabelActive: {
    fontWeight: '700',
  },
  menuCheck: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
