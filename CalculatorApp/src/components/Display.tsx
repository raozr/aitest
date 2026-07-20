import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../constants/theme';

interface DisplayProps {
  value: string;
  expression?: string;
}

export default function Display({ value, expression }: DisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.expression} numberOfLines={1}>
        {expression || ' '}
      </Text>
      <Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    height: 100,
  },
  expression: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.secondaryText,
    marginBottom: 4,
  },
  text: {
    ...typography.display,
    color: colors.displayText,
  },
});
