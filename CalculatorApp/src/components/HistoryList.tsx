import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { colors } from '../constants/theme';
import { HistoryEntry } from '../types';

interface HistoryListProps {
  entries: HistoryEntry[];
  onUseEntry: (entry: HistoryEntry) => void;
  onClearAll: () => void;
}

export default function HistoryList({
  entries,
  onUseEntry,
  onClearAll,
}: HistoryListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          共 {entries.length} 条记录
        </Text>
        {entries.length > 0 && (
          <Pressable onPress={onClearAll} style={styles.clearBtn}>
            <Text style={styles.clearText}>清空</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={entries.length === 0 ? styles.emptyContainer : undefined}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() => onUseEntry(item)}
          >
            <Text style={styles.expression}>{item.expression}</Text>
            <Text style={styles.result}>{item.result}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>暂无计算记录</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    color: colors.secondaryText,
    fontSize: 13,
  },
  clearBtn: {
    backgroundColor: colors.numKey,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearText: {
    color: colors.displayText,
    fontSize: 13,
  },
  item: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  expression: {
    color: colors.secondaryText,
    fontSize: 14,
  },
  result: {
    color: colors.displayText,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: colors.secondaryText,
    fontSize: 15,
  },
});
