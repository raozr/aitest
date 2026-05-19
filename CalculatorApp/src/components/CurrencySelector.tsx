import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors } from '../constants/theme';
import { CURRENCY_NAMES, CURRENCY_COLORS } from '../utils/rates';

interface CurrencySelectorProps {
  value: string;
  onChange: (code: string) => void;
}

export default function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const [visible, setVisible] = useState(false);

  const codes = ['USD', 'CNY', 'JPY', 'EUR', 'GBP', 'KRW'];

  const handleSelect = (code: string) => {
    onChange(code);
    setVisible(false);
  };

  return (
    <>
      <Pressable style={styles.selector} onPress={() => setVisible(true)}>
        <View
          style={[styles.dot, { backgroundColor: CURRENCY_COLORS[value] || colors.opKey }]}
        />
        <Text style={styles.code}>{value}</Text>
        <Text style={styles.arrow}>▾</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <SafeAreaView style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>选择货币</Text>
            <FlatList
              data={codes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = item === value;
                return (
                  <Pressable
                    style={[styles.item, isSelected && styles.selectedItem]}
                    onPress={() => handleSelect(item)}
                  >
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: CURRENCY_COLORS[item] || colors.opKey },
                      ]}
                    />
                    <View style={styles.itemText}>
                      <Text style={styles.itemCode}>{item}</Text>
                      <Text style={styles.itemName}>
                        {CURRENCY_NAMES[item] || ''}
                      </Text>
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  code: {
    color: colors.displayText,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  arrow: {
    color: colors.tertiaryText,
    fontSize: 10,
    marginLeft: 4,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingBottom: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.separator,
    alignSelf: 'center',
    marginVertical: 10,
  },
  title: {
    color: colors.displayText,
    fontSize: 17,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  selectedItem: {
    backgroundColor: colors.surfaceBg,
  },
  itemText: {
    flex: 1,
    marginLeft: 4,
  },
  itemCode: {
    color: colors.displayText,
    fontSize: 16,
    fontWeight: '600',
  },
  itemName: {
    color: colors.secondaryText,
    fontSize: 12,
    marginTop: 1,
  },
  checkmark: {
    color: colors.opKey,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
