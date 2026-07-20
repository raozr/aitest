import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../constants/theme';

interface ButtonProps {
  label: string;
  type: 'number' | 'function' | 'operator' | 'scientific';
  onPress: () => void;
  span?: 1 | 2;
  size?: number;
  width?: number;
  height?: number;
}

export default function Button({
  label,
  type,
  onPress,
  span = 1,
  size = 80,
  width,
  height,
}: ButtonProps) {
  const gap = 8;
  const btnWidth = width ?? size;
  const btnHeight = height ?? size;

  const bgColor =
    type === 'number'
      ? colors.numKey
      : type === 'function'
      ? colors.funcKey
      : type === 'scientific'
      ? colors.sciKey
      : colors.opKey;

  const textColor =
    type === 'function' ? colors.funcKeyText : colors.keyText;

  const fontSize =
    type === 'number' ? 28 : type === 'scientific' ? 22 : type === 'function' ? 24 : 30;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bgColor,
          width: span === 2 ? btnWidth * 2 + gap : btnWidth,
          height: btnHeight,
          borderRadius: Math.min(btnWidth, btnHeight) / 4,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: textColor, fontSize },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  label: {
    fontWeight: '400',
  } as TextStyle,
});
