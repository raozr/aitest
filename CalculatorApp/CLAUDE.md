# CLAUDE.md — CalculatorApp

This file provides guidance to Claude Code (claude.ai/code) when working on this React Native Expo calculator app.

Mobile version of the Python tkinter calculator (`cu.py` in the parent directory). Expo SDK 55.

## Commands

```bash
npm start           # Start Expo dev server (QR code for Expo Go)
npm run web         # Preview in browser (for UI layout verification)
npm test            # Run Jest tests
npx tsc --noEmit    # TypeScript type check
npx expo start --web  # Web preview
```

## Architecture

```
src/
├── types/index.ts             — TypeScript types (CalculatorState, Operator, CalcMode, etc.)
├── constants/theme.ts         — iOS dark theme colors & typography
├── utils/calculator.ts        — Basic-mode pure calculation functions (ported from cu.py)
├── utils/expressionParser.ts  — Expression parser (Shunting-yard) for scientific mode
├── utils/rates.ts             — Exchange rate API client + fallback rates
├── utils/units.ts             — Unit conversion (length/weight/temperature)
├── utils/speech.ts            — Chinese TTS speech (expo-speech, zh-CN)
├── hooks/useCalculator.ts     — Dual-mode calculator state machine hook
├── hooks/useExchangeRates.ts  — Rate fetching with 5-min cache + offline fallback
├── components/                — Reusable UI components (Button, Display, ModeSwitcher,
│                                CurrencySelector, HistoryList, ErrorBoundary)
├── screens/                   — Calculator, Currency, Unit, History screens
├── navigation/AppNavigator.ts — Stack navigator setup
└── storage/                   — history.ts, settings.ts, rates.ts (AsyncStorage)
```

## Key rules

- **All calculation logic in pure functions** in `utils/calculator.ts` and `utils/expressionParser.ts` — NO UI logic
- iOS dark theme: `#000000` bg, `#333333` num keys, `#FF9500` operators
- SegmentedControl (ModeSwitcher) switches basic/scientific mode in CalculatorScreen; landscape forces scientific
- Exchange rate API failure → module cache → AsyncStorage cache → fallback to hardcoded rates
- `package-lock.json` committed to git
