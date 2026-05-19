import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CalculatorScreen from '../screens/CalculatorScreen';
import CurrencyScreen from '../screens/CurrencyScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { colors } from '../constants/theme';

export type RootStackParamList = {
  Calculator: { restoreValue?: string } | undefined;
  Currency: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.opKey,
        headerTitleStyle: { color: colors.displayText },
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Calculator"
        component={CalculatorScreen}
        options={{ title: '计算器' }}
      />
      <Stack.Screen
        name="Currency"
        component={CurrencyScreen}
        options={{ title: '汇率转换' }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: '历史记录' }}
      />
    </Stack.Navigator>
  );
}
