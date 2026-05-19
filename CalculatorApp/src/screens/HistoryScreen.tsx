import React, { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HistoryEntry } from '../types';
import { loadHistory, saveHistory, clearHistory as clearStorage } from '../storage/history';
import HistoryList from '../components/HistoryList';

export default function HistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setEntries);
    }, [])
  );

  const handleUseEntry = async (entry: HistoryEntry) => {
    navigation.navigate('Calculator', {
      restoreValue: entry.result,
    });
  };

  const handleClearAll = () => {
    Alert.alert('确认', '确定要清空所有历史记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: async () => {
          await clearStorage();
          setEntries([]);
        },
      },
    ]);
  };

  return (
    <HistoryList
      entries={entries}
      onUseEntry={handleUseEntry}
      onClearAll={handleClearAll}
    />
  );
}
