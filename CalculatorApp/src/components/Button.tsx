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
  type: 'number' | 'function' | 'operator';
  onPress: () => void;
  span?: 1 | 2;
  size?: number;
}

export default function Button({
  label,
  type,
  onPress,
  span = 1,
  size = 80,
}: ButtonProps) {
  const gap = 8;
  const btnWidth = size;
  const btnHeight = size;

  const bgColor =
    type === 'number'
      ? colors.numKey
      : type === 'function'
      ? colors.funcKey
      : colors.opKey;

  const textColor =
    type === 'function' ? colors.funcKeyText : colors.keyText;

  const fontSize =
    type === 'number' ? 28 : type === 'function' ? 24 : 30;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bgColor,
          width: span === 2 ? btnWidth * 2 + gap : btnWidth,
          height: btnHeight,
          borderRadius: btnWidth / 4,
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
