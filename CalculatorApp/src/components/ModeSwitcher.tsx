import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';
import { CalcMode } from '../types';

interface ModeSwitcherProps {
  mode: CalcMode;
  onModeChange: (mode: CalcMode) => void;
}

export default function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.segment, mode === 'basic' && styles.activeSegment]}
        onPress={() => onModeChange('basic')}
      >
        <Text style={[styles.label, mode === 'basic' && styles.activeLabel]}>
          基础
        </Text>
      </Pressable>
      <Pressable
        style={[styles.segment, mode === 'scientific' && styles.activeSegment]}
        onPress={() => onModeChange('scientific')}
      >
        <Text
          style={[styles.label, mode === 'scientific' && styles.activeLabel]}
        >
          科学
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceBg,
    borderRadius: 8,
    padding: 2,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeSegment: {
    backgroundColor: colors.opKey,
  },
  label: {
    color: colors.secondaryText,
    fontSize: 15,
    fontWeight: '500',
  },
  activeLabel: {
    color: '#FFFFFF',
  },
});
