import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../constants/theme';

interface DisplayProps {
  value: string;
}

export default function Display({ value }: DisplayProps) {
  return (
    <View style={styles.container}>
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
  text: {
    ...typography.display,
    color: colors.displayText,
  },
});
