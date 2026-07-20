# 🧮 计算器应用

一款功能强大、界面精美的 React Native 计算器应用，支持基础计算、科学计算、汇率转换和单位换算。

![Expo SDK](https://img.shields.io/badge/Expo%20SDK-55-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.83.9-green)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue)
![Tests](https://img.shields.io/badge/Tests-163%20passed-brightgreen)

## ✨ 主要特性

### 🎯 双模式计算器

- **基础模式**：经典 iOS 风格，支持加减乘除、百分比、正负号、连续运算
- **科学模式**：表达式输入模式，支持括号、运算符优先级、实时结果预览
- **横屏自动切换**：旋转屏幕自动进入科学模式（iOS 经典交互）

### 🔬 科学计算（表达式引擎）

完整的表达式解析引擎（词法分析 → Shunting-yard 中缀转后缀 → 后缀求值）：

- **括号与优先级**：`(2+3)×4 = 20`，`2+3×4 = 14`，右结合幂运算 `2^3^2 = 512`
- **一元负号**：`-5+3`、`5×-3`、`2^-3`、`-(2+3)`
- **隐式乘法**：`2π`、`2(3+4)`、`(2+1)(3+1)`
- **实时预览**：输入过程中小字实时显示计算结果
- **后缀运算**：`5!`（阶乘）、`50%`（百分号）

科学按钮（5 行 × 4 列）：

```
行1:  ⌫      (      )      n!
行2:  π      e      |x|    1/x
行3:  x²     x³     xʸ     √
行4:  ∛      log    ln     eˣ
行5:  sin    cos    tan    10ˣ
```

- 函数按钮自动包裹当前操作数：输入 `30` 按 `sin` → `sin(30)`
- **DEG/RAD 角度切换**（工具栏按钮，影响三角函数）
- 退格键智能删除整个函数 token（如 `sin(`）

### 🔊 中文语音播报

- 所有按钮操作均有中文语音反馈，计算结果自动播报
- 科学函数播报专业术语（"正弦"、"平方根"等）
- 工具栏 🔊/🔇 开关，设置持久化保存

### 👆 便捷手势

- **滑动退格**：在显示区域横向滑动删除最后一位（iOS 风格）
- **长按复制**：长按显示区域将结果复制到剪贴板
- **重复等号**：连按 `=` 重复上次运算（`3+3=` → 6，再按 → 9）

### 📋 历史记录

- 自动保存计算记录（含完整表达式和时间戳），上限 50 条
- AsyncStorage 持久化 + 500ms 防抖写入
- 点击历史条目恢复结果到计算器

### 💱 汇率转换

- 实时汇率（10 秒超时保护），5 分钟模块级缓存
- 离线降级：网络失败时依次使用本地缓存 / 预设汇率
- 支持 7 种货币，4 位小数精度

### 📏 单位换算

- **长度**：米/千米/厘米/毫米/英里/英尺/英寸
- **重量**：千克/克/毫克/磅/盎司
- **温度**：摄氏度/华氏度/开尔文（专用换算公式）

## 🛠️ 技术栈

- **框架**: React Native 0.83.9 + Expo SDK 55
- **语言**: TypeScript 5.9.2（严格模式）
- **状态管理**: React Hooks
- **导航**: React Navigation 7.x（Native Stack）
- **存储**: AsyncStorage（历史 / 语音设置 / 汇率缓存）
- **语音**: expo-speech
- **剪贴板**: expo-clipboard
- **测试**: Jest 29.7.0 + React Native Testing Library

## 📁 项目结构

```
CalculatorApp/
├── src/
│   ├── components/          # UI 组件
│   │   ├── Button.tsx       # 计算器按钮（含无障碍标签）
│   │   ├── Display.tsx      # 显示屏（结果 + 表达式预览行）
│   │   ├── ModeSwitcher.tsx # 模式切换器
│   │   ├── HistoryList.tsx  # 历史列表（含时间显示）
│   │   ├── CurrencySelector.tsx # 货币选择器
│   │   └── ErrorBoundary.tsx # 错误边界
│   ├── screens/             # 页面
│   │   ├── CalculatorScreen.tsx # 计算器主页面
│   │   ├── HistoryScreen.tsx    # 历史记录
│   │   ├── CurrencyScreen.tsx   # 汇率转换
│   │   └── UnitScreen.tsx       # 单位换算
│   ├── hooks/
│   │   ├── useCalculator.ts     # 双模式计算逻辑
│   │   └── useExchangeRates.ts  # 汇率数据（缓存/超时/降级）
│   ├── utils/
│   │   ├── calculator.ts        # 基础计算逻辑
│   │   ├── expressionParser.ts  # 表达式解析引擎
│   │   ├── speech.ts            # 语音播报
│   │   ├── rates.ts             # 汇率转换
│   │   └── units.ts             # 单位换算
│   ├── storage/
│   │   ├── history.ts           # 历史持久化
│   │   ├── settings.ts          # 语音开关持久化
│   │   └── rates.ts             # 汇率离线缓存
│   ├── navigation/AppNavigator.tsx
│   ├── types/index.ts
│   └── constants/theme.ts
├── __tests__/               # 163 个测试用例
│   ├── calculator.test.ts
│   ├── useCalculator.test.ts
│   ├── expressionParser.test.ts
│   ├── rates.test.ts
│   └── units.test.ts
├── app.json
├── package.json
└── tsconfig.json
```

## 🚀 快速开始

```bash
git clone https://github.com/raozhengrong/CalculatorApp.git
cd CalculatorApp
npm install
npm start        # 启动开发服务器
npm run ios      # iOS 模拟器
npm run android  # Android 模拟器
```

环境要求：Node.js >= 20.19.x

## 🧪 测试

```bash
npm test                          # 运行所有测试
npm test -- --coverage            # 覆盖率报告
npm test __tests__/calculator.test.ts  # 指定测试文件
```

**测试覆盖：**
- ✅ 163 个测试用例全部通过
- ✅ 覆盖基础计算、Hook 双模式、表达式解析器、汇率、单位换算
- ✅ TypeScript 严格模式零错误

## 🔧 核心实现

### 1. 双模式状态管理

基础模式使用经典即时求值状态机；科学模式使用表达式字符串模型，共享同一 Hook：

```typescript
useCalculator(voiceEnabled, mode)
// basic:      currentInput / operation / lastOperation（重复等号）
// scientific: expression / result / angleMode（DEG/RAD）
```

### 2. 表达式解析引擎

```typescript
evaluateExpression('(2+3)×4', 'deg')
// 词法分析 → [(, 2, +, 3, ), ×, 4]
// Shunting-yard → [2, 3, +, 4, ×]
// 后缀求值 → 20
```

- 函数按钮通过 `findOperandStart` 定位尾部操作数并包裹：`30` + `sin` → `sin(30)`
- `evalPreview` 对未完成输入（尾随运算符/未闭合括号）逐步裁剪求值，实现实时预览

### 3. 副作用管理

ref + useEffect 模式消除 React 并发模式下 setState 回调内副作用重复执行的问题：

```typescript
const pendingHistoryRef = useRef<HistoryEntry | null>(null);
const pendingResultRef = useRef<string | null>(null);
useEffect(() => {
  if (pendingHistoryRef.current) { addHistoryEntry(...); }
  if (pendingResultRef.current && voiceEnabledRef.current) { speakResult(...); }
});
```

### 4. 汇率容错链

```
fetch（10s 超时）→ 成功：更新模块级缓存 + AsyncStorage
                  → 失败：模块级缓存 → AsyncStorage 缓存 → 预设汇率
```

## 🔄 版本历史

### v1.1.0 (当前版本)

**新增功能：**
- ✅ 科学模式表达式引擎（括号、优先级、一元负号、隐式乘法、实时预览）
- ✅ DEG/RAD 角度切换
- ✅ 单位换算（长度/重量/温度）
- ✅ 重复等号、滑动退格、长按复制结果
- ✅ 横屏自动进入科学模式
- ✅ 显示屏运算上下文预览、历史时间戳
- ✅ 无障碍标签（VoiceOver/TalkBack）

**问题修复：**
- ✅ 连续运算符遇除零导致 App 崩溃（P0）
- ✅ 历史记录启动保存竞态（P0）
- ✅ 负数立方根误报错误（Math.cbrt）
- ✅ 错误状态下 ±/% 产生乱码
- ✅ tan(90°) 显示天文数字
- ✅ 语音开关启动写入竞态
- ✅ 汇率请求无超时、缓存跨页面失效

### v1.0.0

- 基础/科学双模式、中文语音播报、历史记录持久化、汇率转换、错误边界

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👨‍💻 开发者

- **GitHub**: [@raozhengrong](https://github.com/raozhengrong)

---

**最后更新**: 2026-07-20  
**Expo SDK**: 55 | **React Native**: 0.83.9 | **TypeScript**: 5.9.2
