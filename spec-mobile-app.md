# Spec: 计算器移动端 App（React Native）

## Objective

将现有的 Python/tkinter 桌面计算器移植为 iOS + Android 双平台移动应用，保持四种计算模式（基础/科学/汇率/历史）不变，UI 按移动端原生体验重设计。

**用户场景：**
- 在手机上单手操作计算器
- 实时汇率换算（联网拉取）
- 历史记录跨会话持久化

**成功标准：**
- iOS 和 Android 双平台编译运行
- 四种模式功能无回归
- UI 适配移动端屏幕（触摸交互、安全区域、深色主题）
- 汇率实时从 API 拉取

## Tech Stack

| 层 | 技术 |
|---|------|
| 框架 | React Native 0.76+ (New Architecture) |
| 语言 | TypeScript 5.x |
| 导航 | React Navigation 7.x (Stack + Bottom Tab) |
| 状态管理 | React Context + useReducer |
| 存储 | AsyncStorage（历史记录持久化） |
| 网络 | fetch / axios（汇率 API） |
| 图标 | react-native-vector-icons 或 SF Symbols 等效 |
| 构建 | Expo SDK 52+（推荐）或 bare React Native |

## 汇率 API

使用免费层级的公开汇率 API：
- **exchangerate-api.com** — 免费 1500 次/月，支持 160+ 币种
- 或 **open.er-api.com** — 完全免费，无需 API Key
- 兜底策略：请求失败时使用内置固定汇率（同桌面版）

## Development Workflow (Windows)

### 环境要求

| 工具 | 用途 |
|------|------|
| Node.js 20+ | JavaScript 运行时 |
| VS Code | 推荐编辑器 |
| Android Studio | Android 模拟器（可选，也可以用真机） |
| Expo Go | iOS/Android 真机扫码预览（App Store / 应用市场下载） |
| WSL2 (可选) | 如果遇到 Windows 路径问题，可在 WSL2 中运行 |

### 快速预览（推荐 — 无需模拟器）

```bash
# 1. 初始化项目
npx create-expo-app CalculatorApp --template blank-typescript

# 2. 启动开发服务器
cd CalculatorApp && npx expo start

# 3. 用手机扫码
#    - iPhone: 用系统相机扫 QR 码 → 在 Expo Go 中打开
#    - Android: 打开 Expo Go App 扫 QR 码
#    确保手机和电脑在同一个 WiFi 网络
```

### 真实机测试（Windows 方案）

| 平台 | 方式 |
|------|------|
| **Android 真机** | USB 连接电脑 → 开启 USB 调试 → `npx expo run:android` 或扫码 |
| **Android 模拟器** | Android Studio 创建 AVD → `npx expo start` → 按 `a` 键连接 |
| **iOS** | Windows 无法直接编译 iOS。方案：推送到 Git → Mac 队友拉取编译，或使用 Expo 云端构建 `npx expo run:ios --cloud` |

### Web 预览（快速验证 UI）

Expo 支持 Web 模式，适合开发时快速看布局效果：

```bash
npx expo install react-dom react-native-web @expo/metro-runtime
npx expo start --web
# 浏览器打开 http://localhost:8081
```

> Web 模式只用于 UI 布局验证，原生 API（AsyncStorage 等）在 Web 上可能不可用。

### 代码质量检查

```bash
# TypeScript 类型检查
npx tsc --noEmit

# 运行单元测试（计算逻辑）
npx jest --watch

# 指定测试文件
npx jest __tests__/calculator.test.ts

# ESLint 检查
npx expo lint
```

### 构建产物

```bash
# Android APK（需要在 Windows 上安装 Android Studio + SDK）
npx expo run:android

# iOS IPA（需要 macOS，或使用 Expo Application Services 云端构建）
npx expo run:ios --cloud   # Expo 云端打包
```

## Project Structure

```
CalculatorApp/
├── app.json                  # Expo 配置
├── App.tsx                   # 入口 + 导航容器
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx  # 导航栈 + 底部 Tab
│   ├── screens/
│   │   ├── HomeScreen.tsx    # 启动页 / 模式选择
│   │   ├── BasicScreen.tsx   # 基础计算
│   │   ├── ScientificScreen.tsx # 科学计算
│   │   ├── CurrencyScreen.tsx   # 汇率转换
│   │   └── HistoryScreen.tsx    # 历史记录
│   ├── components/
│   │   ├── Button.tsx        # iOS 风格圆角按钮
│   │   ├── Display.tsx       # 显示屏组件
│   │   ├── CurrencySelector.tsx # 汇率货币选择器
│   │   └── HistoryList.tsx   # 历史记录列表
│   ├── hooks/
│   │   ├── useCalculator.ts  # 计算逻辑状态机
│   │   └── useExchangeRates.ts # 汇率 API 拉取
│   ├── utils/
│   │   ├── calculator.ts     # 纯计算函数（从 cu.py 移植）
│   │   ├── formatters.ts     # 数字格式化/科学计数法
│   │   └── rates.ts          # 汇率 API 客户端 + 兜底固定汇率
│   ├── constants/
│   │   └── theme.ts          # 配色/字体/间距常量
│   └── types/
│       └── index.ts          # TypeScript 类型定义
└── __tests__/
    ├── calculator.test.ts    # 计算逻辑测试
    └── formatters.test.ts    # 格式化测试
```

## 核心类型定义

```typescript
// src/types/index.ts

type CalcMode = 'basic' | 'scientific' | 'currency' | 'history';
type Operator = '+' | '-' | '×' | '÷' | '^';

interface CalculatorState {
  currentInput: string;    // 当前输入，初始 "0"
  previousInput: string;   // 操作符左侧值
  operation: Operator | null;
  shouldResetDisplay: boolean;
  history: string[];       // 最多 50 条
}

interface CurrencyRate {
  code: string;
  name: string;
  rate: number;           // 以 USD 为基准
  color: string;
}
```

## Code Style

```typescript
// 计算逻辑移植示例 — 纯函数，无 UI 依赖
// src/utils/calculator.ts

export function calculateResult(
  prev: number, curr: number, op: Operator
): number {
  switch (op) {
    case '+': return prev + curr;
    case '-': return prev - curr;
    case '×': return prev * curr;
    case '÷':
      if (curr === 0) throw new Error('不能除以零');
      return prev / curr;
    case '^': return Math.pow(prev, curr);
  }
}

export function formatDisplay(input: string): string {
  if (input.length <= 12) return input;
  const num = parseFloat(input);
  return num.toExponential(6);
}
```

**命名约定：**
- 文件/文件夹：camelCase（`basicScreen.tsx`, `useCalculator.ts`）
- 组件：PascalCase（`<CurrencySelector />`）
- 函数/变量：camelCase（`calculateResult`, `currentInput`）
- 常量：UPPER_SNAKE_CASE（`MAX_HISTORY = 50`）

## UI 设计

延续 iOS 深色主题（从桌面版移植）：

| Token | Value | 用途 |
|-------|-------|------|
| `bg` | `'#000000'` | 窗口背景 |
| `numKeyBg` | `'#333333'` | 数字键 |
| `funcKeyBg` | `'#A5A5A5'` | 功能键 |
| `opKeyBg` | `'#FF9500'` | 操作符键 |
| `cardBg` | `'#1C1C1E'` | 卡片背景 |
| `surfaceBg` | `'#2C2C2E'` | 表面背景 |

- 显示屏字体：系统粗体 ~48dp，右对齐
- 按钮圆角：约 1/4 按钮宽度
- "0" 按钮跨两列
- 底部 Tab 导航：Convert / History / Trends
- 汇率模式：卡片布局，可滚动列表
- 支持 SafeArea（刘海屏/圆角屏适配）
- 仅竖屏（portrait）

## 状态管理

```
App State (useReducer)
├── mode: CalcMode
├── calculator: CalculatorState  ← useCalculator hook
│   ├── currentInput
│   ├── previousInput
│   ├── operation
│   ├── shouldResetDisplay
│   └── history[]
├── exchangeRates: CurrencyRate[]
└── isRatesLoading: boolean
```

数据流：
1. 基础/科学模式 → 修改 calculator state → 触发重渲染
2. 每次 `=` → history push → AsyncStorage.setItem 持久化
3. 汇率模式 → useExchangeRates 拉取 → 缓存到内存
4. 历史模式 → AsyncStorage.getItem 读取 → 列表渲染

## Testing Strategy

- **框架**：Jest + React Native Testing Library
- **单元测试**：`__tests__/calculator.test.ts` — 全部计算逻辑（四则运算、科学函数、边界条件）
- **组件测试**：`__tests__/Button.test.tsx` — 按钮渲染和点击回调
- **覆盖率目标**：utils/ 目录 90%+

```typescript
// __tests__/calculator.test.ts 示例
test('1 + 2 = 3', () => {
  expect(calculateResult(1, 2, '+')).toBe(3);
});

test('division by zero throws', () => {
  expect(() => calculateResult(1, 0, '÷')).toThrow('不能除以零');
});

test('formatDisplay over 12 chars', () => {
  expect(formatDisplay('1234567890123')).toBe('1.234568e+12');
});
```

## Implementation Order

```
Phase 1: 项目脚手架
  ├── Expo 初始化 + TypeScript 配置
  ├── 导航结构（Stack + Bottom Tab）
  └── 主题常量定义

Phase 2: 核心计算引擎
  ├── calculator.ts 纯函数（从 cu.py 移植）
  ├── formatters.ts 数字格式化
  ├── useCalculator hook（状态机）
  └── 单元测试

Phase 3: 基础模式 UI
  ├── Button 组件 + Display 组件
  ├── BasicScreen 布局（5×4 网格）
  └── 交互逻辑绑定

Phase 4: 科学模式 UI
  ├── ScientificScreen 布局（4×4 网格）
  └── 科学函数接入

Phase 5: 汇率模式 UI
  ├── CurrencySelector 组件
  ├── CurrencyScreen 卡片布局
  ├── useExchangeRates hook（API 拉取）
  └── 兜底固定汇率

Phase 6: 历史模式
  ├── HistoryList 组件
  ├── HistoryScreen 布局
  └── AsyncStorage 持久化

Phase 7: 打磨
  ├── SafeArea / 安全区域适配
  ├── 深色主题一致性检查
  └── 双平台真机测试
```

## Boundaries

- **Always do:**
  - TypeScript 严格模式
  - 计算逻辑与 UI 解耦（纯函数）
  - 汇率 API 失败时使用固定汇率兜底
  - 历史记录跨会话持久化
  - 适配 SafeArea + 安全区域

- **Ask first:**
  - 添加新的外部依赖/NPM 包
  - 修改四种模式的数量或功能
  - 改变导航结构（Tab 增删）
  - 引入 Redux 等重型状态库
  - 添加后端服务或认证

- **Never do:**
  - 不提交 API Key 到 git
  - 不删除桌面版 `cu.py`（作为逻辑参考源）
  - 不使用 class component（全部 Function Component + Hooks）
  - 不添加非必要的 native module

## Open Questions

1. Expo 还是 bare React Native？推荐 Expo（简化构建流程），除非需要特定的原生模块
2. 汇率 API 选型：exchange rate API 还是 open.er-api.com（后者完全免费无需 key）
3. 是否保留桌面版 `cu.py` 在仓库中作为参考？建议保留
4. 是否需要 splash screen / app icon？
