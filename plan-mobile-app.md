# Plan: 移动端计算器 App — 实施计划

## 导航与交互设计

### 导航结构

```
Root Stack Navigator
├── CalculatorScreen ← 默认首页
│   ├── SegmentedControl 切换 "基础" / "科学" (同屏内切换)
│   ├── headerLeft: 📋 → push HistoryScreen
│   └── headerRight: ☰ → 模式选择弹窗 (基础/科学/汇率)
├── CurrencyScreen ← 从 ☰ 菜单或快捷入口进入
└── HistoryScreen ← 从 📋 按钮进入
```

### 交互流程

1. 启动 → CalculatorScreen（基础模式，显示顶部显示屏 + 5×4 网格）
2. SegmentedControl → 切换基础/科学（同屏条件渲染，不导航）
3. ☰ 按钮 → 弹窗选择「汇率」→ push CurrencyScreen
4. 📋 按钮 → push HistoryScreen
5. 计算过程产生历史 → 自动写入 AsyncStorage
6. HistoryScreen 点击「使用」→ pop 回 CalculatorScreen 并填入结果值

### 依赖安装

```bash
# 导航（Stack only，无 BottomTab）
npx expo install @react-navigation/native-stack @react-navigation/native
npx expo install react-native-screens react-native-safe-area-context

# 其余依赖不变
```

### Git

- `package-lock.json` 需要提交到版本控制

## 实施阶段

### Phase 1: 项目脚手架

**步骤 1.1** — 初始化 Expo 项目 + TypeScript + 配置
```
npx create-expo-app CalculatorApp --template blank-typescript
cd CalculatorApp
```

**步骤 1.2** — 安装核心依赖
```bash
# 导航
npx expo install @react-navigation/native-stack @react-navigation/native
npx expo install react-native-screens react-native-safe-area-context

# 图标
npx expo install @expo/vector-icons

# 存储
npx expo install @react-native-async-storage/async-storage

# 测试
npm install --save-dev jest @testing-library/react-native @types/jest

# Web 预览（可选）
npx expo install react-dom react-native-web @expo/metro-runtime
```

**步骤 1.3** — 建立目录结构
```
src/
├── constants/theme.ts
├── types/index.ts
├── utils/calculator.ts
├── utils/formatters.ts
├── utils/rates.ts
├── hooks/useCalculator.ts
├── hooks/useExchangeRates.ts
├── components/Button.tsx
├── components/Display.tsx
├── components/CurrencySelector.tsx
├── components/HistoryList.tsx
├── components/ModeSwitcher.tsx
├── screens/CalculatorScreen.tsx
├── screens/CurrencyScreen.tsx
├── screens/HistoryScreen.tsx
├── navigation/AppNavigator.tsx
└── storage/history.ts
```

**验证：** `npx tsc --noEmit` 无错误，`npx expo start --web` 能看到空白页面

---

### Phase 2: 核心计算引擎

**步骤 2.1** — `src/constants/theme.ts`
```typescript
export const colors = {
  bg: '#000000',
  displayText: '#FFFFFF',
  numKey: '#333333',
  funcKey: '#A5A5A5',
  funcKeyText: '#000000',
  opKey: '#FF9500',
  keyText: '#FFFFFF',
  cardBg: '#1C1C1E',
  surfaceBg: '#2C2C2E',
  secondaryText: '#8E8E93',
  separator: '#38383A',
};

export const typography = {
  display: { fontSize: 48, fontWeight: '300' as const },
  keyNumber: { fontSize: 28, fontWeight: '400' as const },
  keyFunction: { fontSize: 24, fontWeight: '400' as const },
  keyOperator: { fontSize: 30, fontWeight: '500' as const },
};
```

**步骤 2.2** — `src/types/index.ts`
```typescript
export type Operator = '+' | '-' | '×' | '÷' | '^';

export interface CalculatorState {
  currentInput: string;
  previousInput: string;
  operation: Operator | null;
  shouldResetDisplay: boolean;
}

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  rate: number;
  color: string;
}
```

**步骤 2.3** — `src/utils/calculator.ts`
从 `cu.py` 移植全部计算函数：
- `inputNumber(state, digit)` → 新 state
- `inputOperation(state, op)` → 新 state
- `calculateResult(state)` → 新 state + result
- `clearAll()` → 初始 state
- `toggleSign(input)` → string
- `percentage(input)` → string
- `formatDisplay(input)` → string
- `scientificFunc(func, value)` → number

纯函数设计：输入 state → 输出 state，不操作 UI。

**步骤 2.4** — `src/utils/formatters.ts`
- `formatWithPrecision(value: number): string`
- `toExponential(value: number): string`
- `formatHistoryEntry(a, op, b, result): string`

**步骤 2.5** — 单元测试 `__tests__/calculator.test.ts`

```typescript
describe('calculateResult', () => {
  it('1 + 2 = 3', () => { ... });
  it('division by zero', () => { ... });
  it('0.1 + 0.2 handles float', () => { ... });
});

describe('toggleSign', () => {
  it('123 → -123', () => { ... });
  it('-123 → 123', () => { ... });
});

describe('formatDisplay', () => {
  it('short input unchanged', () => { ... });
  it('long input uses exponential', () => { ... });
});
```

**验证：** `npx jest` 全部通过

---

### Phase 3: 基础/科学模式 UI

**步骤 3.1** — `components/Button.tsx`

Props:
```typescript
interface ButtonProps {
  label: string;
  type: 'number' | 'function' | 'operator';
  onPress: () => void;
  span?: 1 | 2;       // 0 按钮跨 2 列
  size?: number;      // 按屏幕宽度计算
}
```

渲染：`Pressable` + 圆角背景 `borderRadius: size/4`。按下时 `opacity: 0.6` 动画。

**步骤 3.2** — `components/Display.tsx`

Props: `value: string`。渲染：右对齐大字，黑色背景。

**步骤 3.3** — `components/ModeSwitcher.tsx`

SegmentedControl 风格切换器：「基础」/「科学」，iOS UISegmentedControl 样式。

**步骤 3.4** — `screens/CalculatorScreen.tsx`

布局：
```
┌─────────────────────────┐
│         0.              │  ← Display (flex: 1)
├─────────────────────────┤
│  [基础]  [科学]          │  ← ModeSwitcher
├─────────────────────────┤
│  C    ±    %    ÷       │
│  7    8    9    ×       │  ← 5×4 网格 (flex: 3)
│  4    5    6    −       │
│  1    2    3    +       │
│  0         .    =       │
└─────────────────────────┘
```

按钮大小根据屏幕宽度自适应：
```
const screenWidth = Dimensions.get('window').width;
const gap = 8;
const cols = 4;
const btnSize = (screenWidth - gap * 5) / cols;
```

科学模式切换：同一 Screen 内条件渲染，不导航。

**验证：** Web 预览显示完整布局，按钮可点击且有视觉效果。

---

### Phase 4: 汇率模式 UI

**步骤 4.1** — `utils/rates.ts`
```typescript
const FALLBACK_RATES = { USD: 1, CNY: 7.25, ... };
export async function fetchRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    return data.rates;
  } catch {
    return FALLBACK_RATES;
  }
}
```

**步骤 4.2** — `hooks/useExchangeRates.ts`
- 首次挂载时 `fetchRates()`
- 返回 `{ rates, isLoading, error, refresh }`
- 缓存机制：5 分钟内不重复请求

**步骤 4.3** — `components/CurrencySelector.tsx`
- 显示当前货币代码 + 色点 + ▾ 箭头
- 点击弹出 Modal/BottomSheet 列出所有货币

**步骤 4.4** — `screens/CurrencyScreen.tsx`
布局（同桌面版卡片风格适配移动端）：
```
┌─────────────────────────┐
│  Amount                 │
│  [100        ]          │
│                          │
│  [CNY ▾]  ⇄  [USD ▾]    │
│                          │
│  [     转换     ]        │
│                          │
│  100 CNY (人民币)        │
│  = 13.79                 │
│  USD (美元)              │
├─────────────────────────┤
│  当前汇率                │
│  CNY  7.25               │
│  JPY  151.5              │
│  ...                     │
└─────────────────────────┘
```

**验证：** Web 预览显示完整汇率模式，选择货币切换正常，转换结果正确。

---

### Phase 5: 历史记录 + 持久化

**步骤 5.1** — `storage/history.ts`
```typescript
const STORAGE_KEY = '@calculator/history';
export async function loadHistory(): Promise<HistoryEntry[]>;
export async function saveHistory(entries: HistoryEntry[]): Promise<void>;
export async function clearHistory(): Promise<void>;
```

**步骤 5.2** — `components/HistoryList.tsx`
- FlatList 渲染历史条目
- 滑动删除（Swipeable）
- 空状态提示

**步骤 5.3** — `screens/HistoryScreen.tsx`
- 加载时从 AsyncStorage 读取
- 列表展示 + "使用"按钮 → 跳回计算器并填入结果
- "清空"按钮 → 确认弹窗 → 清除

**验证：** 产生计算 → 切历史 Tab → 能看到记录 → 清空 → 记录消失

---

### Phase 6: 导航 + 整合

**步骤 6.1** — `navigation/AppNavigator.tsx`
```typescript
<NavigationContainer theme={DarkTheme}>
  <Stack.Navigator screenOptions={{
    headerStyle: { backgroundColor: '#000000' },
    headerTintColor: '#FF9500',
    headerTitleStyle: { color: '#FFFFFF' },
    contentStyle: { backgroundColor: '#000000' },
  }}>
    <Stack.Screen name="Calculator" component={CalculatorScreen}
      options={{ title: '计算器' }} />
    <Stack.Screen name="Currency" component={CurrencyScreen}
      options={{ title: '汇率转换' }} />
    <Stack.Screen name="History" component={HistoryScreen}
      options={{ title: '历史记录' }} />
  </Stack.Navigator>
</NavigationContainer>
```

CalculatorScreen headerLeft 放 📋 按钮 → push HistoryScreen，headerRight 放 ☰ 按钮 → 弹窗选择模式。

**步骤 6.2** — `App.tsx`
包裹 NavigationContainer + SafeAreaProvider。

**验证：** Stack 导航 push/pop 正常，各 Screen 保持状态。

---

### Phase 7: 打磨 + 双平台适配

- SafeAreaView 适配刘海屏/打孔屏
- StatusBar 设置为 `light-content`
- 键盘行为：`keyboardShouldPersistTaps="handled"`
- Android 返回键行为
- 深色主题延续到 StatusBar / TabBar / 导航头
- 横屏锁定 `orientation: 'portrait'` (app.json)

---

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| Windows 无法编译 iOS | 无法验证 iOS 效果 | 使用 Expo Go 真机扫码预览；Expo 云端构建 |
| 汇率 API 免费层限制 | 频繁请求被限 | 缓存 5 分钟；失败时使用固定汇率兜底 |
| AsyncStorage 在 Web 模式下不可用 | 开发时无法测试持久化 | 核心逻辑用 Jest 测试；Android 真机验证 |
| 科学计算浮点精度问题 | 结果微小偏差 | 复用桌面版 `round(result, 10)` 策略 |
