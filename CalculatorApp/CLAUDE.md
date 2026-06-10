# CLAUDE.md — CalculatorApp

This file provides guidance to Claude Code (claude.ai/code) when working on this React Native Expo calculator app.

Mobile version of the Python tkinter calculator (`cu.py` in the parent directory).

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
├── types/index.ts          — TypeScript types (CalculatorState, Operator, etc.)
├── constants/theme.ts      — iOS dark theme colors & typography
├── utils/calculator.ts     — Pure calculation functions (ported from cu.py)
├── utils/rates.ts          — Exchange rate API client + fallback rates
├── utils/speech.ts         — Chinese TTS speech (expo-speech, zh-CN)
├── hooks/useCalculator.ts  — Calculator state machine hook
├── hooks/useExchangeRates.ts — Rate fetching with 5-min cache
├── components/             — Reusable UI components
├── screens/                — Screen-level components
├── navigation/             — Stack navigator setup
│   storage/history.ts      — AsyncStorage read/write
```

## Key rules

- **All calculation logic in pure functions** in `utils/calculator.ts` — NO UI logic
- iOS dark theme: `#000000` bg, `#333333` num keys, `#FF9500` operators
- SegmentedControl switches basic/scientific mode in CalculatorScreen
- Exchange rate API failure → fallback to hardcoded rates
- `package-lock.json` committed to git
