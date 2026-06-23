# 🧮 计算器应用

一款功能强大、界面精美的 React Native 计算器应用，支持基础计算和科学计算两种模式。

![Expo SDK](https://img.shields.io/badge/Expo%20SDK-55-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.83.9-green)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue)
![Tests](https://img.shields.io/badge/Tests-113%20passed-brightgreen)

## ✨ 主要特性

### 🎯 双模式支持

- **基础模式**：19 个按钮，支持加减乘除、百分比、正负号等常用功能
- **科学模式**：20 个科学函数按钮 + 基础键盘，支持高级数学运算

### 🔬 科学计算功能

完整的科学计算模式，包含 20 个科学函数按钮（5 行 × 4 列）：

```
行1:  ⌫ (退格)  ( (左括号)  ) (右括号)  n! (阶乘)
行2:  π (圆周率) e (自然常数) |x| (绝对值) 1/x (倒数)
行3:  x² (平方)  x³ (立方)  xʸ (幂)  √ (平方根)
行4:  ∛ (立方根) log (常用对数) ln (自然对数) eˣ (自然指数)
行5:  sin (正弦) cos (余弦) tan (正切) 10ˣ (10的x次方)
```

**核心能力：**
- 支持括号表达式和复杂运算
- 完整的表达式解析引擎（词法分析 → 中缀转后缀 → 后缀求值）
- 运算符优先级正确处理
- 阶乘安全保护（>170 返回 Infinity）

### 🔊 中文语音播报

- 所有按钮操作都有中文语音反馈
- 计算结果自动播报
- 可通过工具栏按钮（🔊/🔇）控制开关
- 科学函数按钮播报专业术语（如"正弦"、"平方根"等）

### 📋 历史记录

- 自动保存所有计算记录
- 持久化存储（AsyncStorage）
- 支持查看和清除历史
- 500ms 防抖优化，减少写入频率

### 💱 汇率转换

- 实时获取最新汇率数据
- 5 分钟智能缓存机制
- 支持多种货币转换
- 精度控制（4 位小数）

## 🛠️ 技术栈

- **框架**: React Native 0.83.9 + Expo SDK 55
- **语言**: TypeScript 5.9.2（严格模式）
- **状态管理**: React Hooks（useState, useEffect, useCallback, useRef）
- **导航**: React Navigation 7.x（Native Stack）
- **存储**: AsyncStorage
- **语音**: expo-speech
- **测试**: Jest 29.7.0 + React Native Testing Library

## 📁 项目结构

```
CalculatorApp/
├── src/
│   ├── components/          # UI 组件
│   │   ├── Button.tsx       # 计算器按钮（支持 4 种类型）
│   │   ├── Display.tsx      # 数字显示屏（固定高度 100px）
│   │   ├── ModeSwitcher.tsx # 模式切换器
│   │   └── ErrorBoundary.tsx # 错误边界组件
│   ├── screens/             # 页面
│   │   ├── CalculatorScreen.tsx # 计算器主页面
│   │   ├── HistoryScreen.tsx    # 历史记录页面
│   │   └── CurrencyScreen.tsx   # 汇率转换页面
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useCalculator.ts     # 计算器逻辑（含副作用管理）
│   │   └── useExchangeRates.ts  # 汇率数据管理
│   ├── utils/               # 工具函数
│   │   ├── calculator.ts        # 计算逻辑（含科学函数）
│   │   ├── expressionParser.ts  # 表达式解析引擎
│   │   ├── speech.ts            # 语音播报
│   │   └── rates.ts             # 汇率转换
│   ├── storage/             # 数据存储
│   │   └── history.ts           # 历史记录持久化
│   ├── navigation/          # 导航配置
│   │   └── AppNavigator.tsx     # 应用导航器
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts
│   └── constants/           # 常量定义
│       └── theme.ts             # 主题颜色和样式
├── __tests__/               # 测试文件
│   ├── calculator.test.ts       # 计算器逻辑测试
│   ├── useCalculator.test.ts    # Hook 测试
│   ├── expressionParser.test.ts # 表达式解析器测试
│   └── rates.test.ts            # 汇率转换测试
├── app.json                 # Expo 配置
├── package.json             # 依赖管理
└── tsconfig.json            # TypeScript 配置
```

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.x
- npm 或 yarn
- Expo CLI

### 安装运行

```bash
# 克隆项目
git clone https://github.com/raozhengrong/CalculatorApp.git
cd CalculatorApp

# 安装依赖
npm install

# 启动开发服务器
npm start

# 在 iOS 模拟器运行
npm run ios

# 在 Android 模拟器运行
npm run android
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm test -- --coverage

# 运行特定测试文件
npm test __tests__/calculator.test.ts
```

**测试覆盖：**
- ✅ 113 个测试用例全部通过
- ✅ 覆盖计算器逻辑、Hook、表达式解析、汇率转换
- ✅ TypeScript 严格模式零错误

## 🎨 UI/UX 设计

### 布局架构

```
┌─────────────────────────┐
│ Display (固定高度 100px)  │
├─────────────────────────┤
│ [基础/科学] 模式切换栏    │
├─────────────────────────┤
│                         │
│    按钮区域              │
│   （支持滚动）           │
│                         │
└─────────────────────────┘
```

### 颜色主题

- **基础按钮**: `#333333`（深灰色）
- **功能按钮**: `#A5A5A5`（浅灰色）
- **科学按钮**: `#3A3A3C`（中深灰色）
- **运算符按钮**: `#FF9500`（橙色高亮）

### 响应式设计

- 使用 `useWindowDimensions` 动态计算按钮尺寸
- 支持屏幕旋转和不同设备尺寸
- 科学模式使用 ScrollView 确保内容可访问

## 🔧 核心实现

### 1. 副作用管理

使用 ref + useEffect 模式彻底消除 React 并发模式下的副作用重复问题：

```typescript
const pendingHistoryRef = useRef<HistoryEntry | null>(null);
const pendingResultRef = useRef<string | null>(null);

useEffect(() => {
  if (pendingHistoryRef.current) {
    addHistoryEntry(pendingHistoryRef.current);
  }
  if (pendingResultRef.current && voiceEnabledRef.current) {
    speakResult(pendingResultRef.current);
  }
}, [history]);
```

### 2. 表达式解析引擎

实现完整的数学表达式解析器：

```typescript
// 输入: "(2 + 3) × 4"
// 词法分析 → [Token: (, 2, +, 3, ), ×, 4]
// 中缀转后缀 → [2, 3, +, 4, ×]
// 后缀求值 → 20
```

支持特性：
- 括号嵌套
- 运算符优先级（^, ×, ÷, +, -）
- 右结合幂运算（2^3^2 = 2^(3^2)）
- 11 个科学函数

### 3. 语音播报系统

```typescript
// 科学函数语音映射
const SCIENTIFIC_TO_SPEECH = {
  'sin': '正弦',
  'cos': '余弦',
  '√': '平方根',
  'π': '派',
  // ... 20 个科学函数
};
```

### 4. 汇率缓存策略

```typescript
// 5 分钟缓存 + useRef 避免 stale closure
if (Date.now() - lastFetchRef.current < 5 * 60 * 1000) {
  return cachedRates;
}
```

## 📱 功能截图

### 基础计算模式
- 简洁的 5 行 × 4 列布局
- 大按钮易于点击
- 运算符橙色高亮

### 科学计算模式
- 科学函数区（上部分）
- 基础键盘区（下部分）
- 清晰的分隔线
- 支持滚动浏览

### 历史记录
- 自动保存计算过程
- 支持清除历史
- 点击恢复历史结果

## 🔄 版本历史

### v1.0.0 (当前版本)

**新增功能：**
- ✅ 科学计算模式（20 个科学函数）
- ✅ 中文语音播报系统
- ✅ 括号表达式支持
- ✅ 表达式解析引擎
- ✅ 历史记录持久化
- ✅ 汇率转换功能
- ✅ 错误边界组件

**代码质量：**
- ✅ TypeScript 严格模式零错误
- ✅ 113 个测试用例全覆盖
- ✅ React 19 兼容
- ✅ Expo SDK 55
- ✅ 消除所有副作用问题
- ✅ 优化性能（防抖、缓存）

**UI/UX 优化：**
- ✅ 响应式布局
- ✅ 科学按钮按功能分组
- ✅ 统一的按钮颜色和尺寸
- ✅ 语音开关控制
- ✅ 友好的错误处理界面

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👨‍💻 开发者

- **姓名**: raozhengrong
- **邮箱**: michael.rao@gmail.com
- **GitHub**: [@raozhengrong](https://github.com/raozhengrong)

---

**最后更新**: 2026-06-23  
**Expo SDK**: 55 | **React Native**: 0.83.9 | **TypeScript**: 5.9.2
