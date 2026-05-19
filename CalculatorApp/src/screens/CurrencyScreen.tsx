import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../constants/theme';
import { useExchangeRates } from '../hooks/useExchangeRates';
import { convertCurrency, CURRENCY_NAMES, CURRENCY_COLORS } from '../utils/rates';
import CurrencySelector from '../components/CurrencySelector';

export default function CurrencyScreen() {
  const { rates, isLoading, error, refresh } = useExchangeRates();
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('CNY');
  const [toCurrency, setToCurrency] = useState('USD');

  const result = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return null;
    const value = convertCurrency(num, fromCurrency, toCurrency, rates);
    const text = Number.isInteger(value) ? String(value) : value.toFixed(4);
    return { value, text };
  }, [amount, fromCurrency, toCurrency, rates]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const ratesList = useMemo(() => {
    return Object.entries(rates)
      .filter(([code]) => code !== 'USD')
      .map(([code, rate]) => ({ code, rate }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [rates]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Converter Card */}
      <View style={styles.card}>
        <Text style={styles.label}>金额</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholderTextColor={colors.tertiaryText}
        />

        <View style={styles.selectorRow}>
          <View style={styles.selectorCol}>
            <Text style={styles.label}>从</Text>
            <CurrencySelector value={fromCurrency} onChange={setFromCurrency} />
          </View>

          <View style={styles.swapCol}>
            <Text style={styles.swapBtn} onPress={handleSwap}>
              ⇄
            </Text>
          </View>

          <View style={styles.selectorCol}>
            <Text style={styles.label}>到</Text>
            <CurrencySelector value={toCurrency} onChange={setToCurrency} />
          </View>
        </View>

        {/* Result */}
        <View style={styles.resultBox}>
          {result && rates[fromCurrency] && (
            <>
              <Text style={styles.resultFrom}>
                {amount} {fromCurrency} ({CURRENCY_NAMES[fromCurrency] || ''})
              </Text>
              <Text style={styles.resultAmount}>{result.text}</Text>
              <Text style={styles.resultCurrency}>
                {toCurrency} ({CURRENCY_NAMES[toCurrency] || ''})
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Rates List */}
      <Text style={styles.ratesTitle}>当前汇率</Text>
      <View style={styles.ratesCard}>
        {isLoading && <ActivityIndicator color={colors.opKey} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {ratesList.map((item, i) => (
          <View key={item.code}>
            {i > 0 && <View style={styles.separator} />}
            <View style={styles.rateItem}>
              <View style={styles.rateLeft}>
                <View
                  style={[
                    styles.rateDot,
                    { backgroundColor: CURRENCY_COLORS[item.code] || colors.opKey },
                  ]}
                />
                <View>
                  <Text style={styles.rateCode}>{item.code}</Text>
                  <Text style={styles.rateName}>
                    {CURRENCY_NAMES[item.code] || ''}
                  </Text>
                </View>
              </View>
              <Text style={styles.rateValue}>
                {Number.isInteger(item.rate) ? String(item.rate) : item.rate.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
        {!isLoading && ratesList.length === 0 && !error && (
          <Text style={styles.emptyText}>暂无汇率数据，下拉刷新</Text>
        )}
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
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  selectorCol: {
    flex: 1,
  },
  swapCol: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  swapBtn: {
    color: colors.opKey,
    fontSize: 24,
    fontWeight: 'bold',
  },
  resultBox: {
    alignItems: 'center',
    paddingVertical: 8,
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
  resultCurrency: {
    color: colors.secondaryText,
    fontSize: 13,
  },
  ratesTitle: {
    color: colors.displayText,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  ratesCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 0,
  },
  rateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  rateCode: {
    color: colors.displayText,
    fontSize: 15,
    fontWeight: '600',
  },
  rateName: {
    color: colors.secondaryText,
    fontSize: 10,
    marginTop: 1,
  },
  rateValue: {
    color: colors.displayText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: colors.separator,
    marginHorizontal: 16,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    padding: 16,
  },
  emptyText: {
    color: colors.secondaryText,
    textAlign: 'center',
    padding: 16,
  },
});
