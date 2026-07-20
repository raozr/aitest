import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { colors } from '../constants/theme';
import {
  UnitCategory,
  CATEGORIES,
  CATEGORY_NAMES,
  getUnits,
  getUnitName,
  convertUnit,
} from '../utils/units';

export default function UnitScreen() {
  const [category, setCategory] = useState<UnitCategory>('length');
  const [amount, setAmount] = useState('1');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('km');

  const units = useMemo(() => getUnits(category), [category]);

  const handleCategoryChange = (next: UnitCategory) => {
    const nextUnits = getUnits(next);
    setCategory(next);
    setFromUnit(nextUnits[0].code);
    setToUnit(nextUnits[1]?.code ?? nextUnits[0].code);
  };

  const result = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num)) return null;
    const value = convertUnit(category, num, fromUnit, toUnit);
    return Number.isInteger(value) ? String(value) : String(value);
  }, [amount, category, fromUnit, toUnit]);

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const renderChips = (selected: string, onSelect: (code: string) => void) => (
    <View style={styles.chipGrid}>
      {units.map((u) => {
        const active = u.code === selected;
        return (
          <Pressable
            key={u.code}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(u.code)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {u.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Category switcher */}
      <View style={styles.categoryRow}>
        {CATEGORIES.map((c) => {
          const active = c === category;
          return (
            <Pressable
              key={c}
              style={[styles.categoryBtn, active && styles.categoryBtnActive]}
              onPress={() => handleCategoryChange(c)}
            >
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                {CATEGORY_NAMES[c]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>数值</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numbers-and-punctuation"
          placeholderTextColor={colors.tertiaryText}
        />

        <Text style={styles.label}>从</Text>
        {renderChips(fromUnit, setFromUnit)}

        <Pressable style={styles.swapBtn} onPress={handleSwap} hitSlop={8}>
          <Text style={styles.swapIcon}>⇄</Text>
        </Pressable>

        <Text style={styles.label}>到</Text>
        {renderChips(toUnit, setToUnit)}

        <View style={styles.resultBox}>
          {result !== null && (
            <>
              <Text style={styles.resultFrom}>
                {amount} {getUnitName(category, fromUnit)}
              </Text>
              <Text style={styles.resultAmount}>{result}</Text>
              <Text style={styles.resultUnit}>{getUnitName(category, toUnit)}</Text>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  categoryRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceBg,
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  categoryBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  categoryBtnActive: {
    backgroundColor: colors.opKey,
  },
  categoryText: {
    color: colors.secondaryText,
    fontSize: 15,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
  },
  label: {
    color: colors.displayText,
    fontSize: 11,
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  amountInput: {
    backgroundColor: colors.surfaceBg,
    color: colors.opKey,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    backgroundColor: colors.surfaceBg,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: colors.opKey,
  },
  chipText: {
    color: colors.displayText,
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  swapBtn: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  swapIcon: {
    color: colors.opKey,
    fontSize: 24,
    fontWeight: 'bold',
  },
  resultBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resultFrom: {
    color: colors.tertiaryText,
    fontSize: 13,
    marginBottom: 4,
  },
  resultAmount: {
    color: colors.opKey,
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  resultUnit: {
    color: colors.secondaryText,
    fontSize: 13,
  },
});
