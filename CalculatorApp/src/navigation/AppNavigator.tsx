import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CalculatorScreen from '../screens/CalculatorScreen';
import CurrencyScreen from '../screens/CurrencyScreen';
import HistoryScreen from '../screens/HistoryScreen';
import UnitScreen from '../screens/UnitScreen';
import { colors } from '../constants/theme';
import { ErrorBoundary } from '../components/ErrorBoundary';

export type RootStackParamList = {
  Calculator: { restoreValue?: string } | undefined;
  Currency: undefined;
  History: undefined;
  Unit: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <ErrorBoundary>
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
          options={{ headerShown: false }}
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
        <Stack.Screen
          name="Unit"
          component={UnitScreen}
          options={{ title: '单位换算' }}
        />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
