# 多功能计算器 (Multi-Mode Calculator)

iOS 深色风格计算器，支持**桌面端**（Python tkinter）和**移动端**（React Native + Expo）双平台。五种功能模式：基础、科学、汇率、单位、历史。

## 版本概览

| | 桌面版 | 移动版 |
|---|--------|--------|
| **目录** | `cu.py` | `CalculatorApp/` |
| **框架** | Python tkinter | React Native 0.83 + Expo SDK 55 |
| **语言** | Python 3.13 | TypeScript 5.9（严格模式） |
| **代码量** | ~2200 行（单文件） | 25+ 个模块 |
| **平台** | Windows / macOS / Linux（需 GUI） | iOS / Android / Web |
| **测试** | `test_cu_smoke.py`（86 项） | Jest（165 项，全部通过） |
| **构建** | PyInstaller → `dist/计算器.exe` | EAS Build / Expo Go |

---

## 桌面版 (cu.py)

单文件架构，仅依赖 Python 标准库，无需安装额外依赖。**功能与移动端完全对齐**。

### 快速开始

```bash
python cu.py
```

> 建议 Python 3.11+（`math.cbrt` 需要；旧版本已内置 `_cbrt` 回退，3.9+ 亦可运行）。

macOS（Homebrew Python 需单独安装 tkinter）：

```bash
brew install python-tk@3.13
/opt/homebrew/opt/python@3.13/bin/python3.13 cu.py
```

### 桌面端特性

- **双模式计算器**：基础模式 + 科学模式（表达式输入，与移动端同一套引擎逻辑）
- **表达式引擎**：括号、优先级、一元负号、隐式乘法、实时预览、DEG/RAD 切换
- **物理键盘输入**：数字/运算符直接输入，`*`→×、`/`→÷、回车→=、Backspace→退格、Esc→C、科学模式支持 `( ) ^ !`
- **Ctrl+C 复制结果**（对应移动端长按复制）
- **中文语音播报**：系统 TTS（macOS `say` / Windows SAPI / Linux `espeak`），可开关
- **汇率转换**：实时汇率后台线程加载（10s 超时 + 5 分钟缓存 + 预设汇率降级），含 HKD
- **单位换算**：长度/重量/温度
- **历史记录**：表达式 + 时间戳，双击回填，50 条上限

### 测试

```bash
python test_cu_smoke.py   # 86 项冒烟测试（引擎 + 状态机 + 换算）
```

### 构建独立应用

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --name "计算器" --distpath dist cu.py
# 产物在 dist/计算器.exe，约 10 MB
```

---

## 移动版 (CalculatorApp)

React Native + Expo 构建的移动端应用，TypeScript 类型安全。

### 快速开始

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm start` | 启动 Expo 开发服务器（Expo Go 扫码） |
| `npm run web` | 浏览器预览（用于布局验证） |
| `npm test` | 运行全部 165 项 Jest 测试 |
| `npx tsc --noEmit` | TypeScript 类型检查 |

### 核心特性

- **双模式计算器**：基础模式（经典即时求值）+ 科学模式（表达式输入）
- **表达式引擎**：括号嵌套、运算符优先级、一元负号、隐式乘法（`2π`）、实时结果预览
- **科学函数**：sin/cos/tan（DEG/RAD 切换）、log/ln、√/∛、xʸ、n!、|x|、1/x、eˣ、10ˣ、π/e
- **函数包裹**：输入 `30` 按 `sin` → `sin(30)`；退格智能删除整个函数 token
- **便捷手势**：重复等号、显示区横向滑动退格、长按复制结果、横屏自动科学模式
- **中文语音播报**：全按钮覆盖（含科学函数术语），开关状态持久化
- **汇率转换**：10s 超时 + 模块级缓存 + AsyncStorage 离线降级
- **单位换算**：长度（7 单位）/ 重量（5 单位）/ 温度（专用公式）
- **历史记录**：完整表达式 + 时间戳，50 条上限，点击回填
- **无障碍**：按钮 VoiceOver/TalkBack 标签

### 项目结构

```
CalculatorApp/
├── App.tsx                     # Expo 应用入口
├── index.ts                    # 注册根组件
├── package.json                # 依赖配置（Expo SDK 55）
├── app.json                    # Expo 配置（orientation: default 支持横屏）
├── tsconfig.json               # TypeScript 配置
├── eas.json                    # EAS Build 配置
├── assets/                     # 图标与启动画面
│
├── src/
│   ├── types/index.ts          # 类型定义（CalculatorState, Operator, CalcMode）
│   ├── constants/theme.ts      # 深色主题色板与字体定义
│   ├── utils/
│   │   ├── calculator.ts       # 基础模式纯函数计算引擎
│   │   ├── expressionParser.ts # 表达式解析引擎（Shunting-yard）
│   │   ├── speech.ts           # 中文 TTS 语音播报（expo-speech）
│   │   ├── rates.ts            # 汇率 API 客户端（10s 超时）+ 固定汇率回退
│   │   └── units.ts            # 单位换算（长度/重量/温度）
│   ├── hooks/
│   │   ├── useCalculator.ts    # 双模式计算器状态管理
│   │   └── useExchangeRates.ts # 汇率获取（模块级缓存 + 离线降级）
│   ├── components/             # 可复用 UI 组件
│   │   ├── Button.tsx          # iOS 风格按钮（含无障碍标签）
│   │   ├── Display.tsx         # 显示屏（结果 + 表达式预览行）
│   │   ├── ModeSwitcher.tsx    # 基础/科学模式切换
│   │   ├── CurrencySelector.tsx # 货币选择器（底部弹出 Modal）
│   │   ├── HistoryList.tsx     # 历史记录列表（含时间显示）
│   │   └── ErrorBoundary.tsx   # 错误边界
│   ├── screens/
│   │   ├── CalculatorScreen.tsx # 计算器主界面（手势 + 横屏自适应）
│   │   ├── CurrencyScreen.tsx   # 汇率转换页
│   │   ├── HistoryScreen.tsx    # 历史记录页
│   │   └── UnitScreen.tsx       # 单位换算页
│   ├── navigation/
│   │   └── AppNavigator.tsx    # React Navigation 栈导航配置
│   └── storage/
│       ├── history.ts          # 历史记录持久化
│       ├── settings.ts         # 语音开关持久化
│       └── rates.ts            # 汇率离线缓存
│
└── __tests__/                  # 165 项 Jest 测试
    ├── calculator.test.ts      # 基础计算引擎（含除零链式回归）
 │   ├── expressionParser.test.ts # 表达式解析器（66 项）
    ├── useCalculator.test.ts   # Hook 双模式状态测试
    ├── rates.test.ts           # 汇率转换
    └── units.test.ts           # 单位换算
```

---

## 架构决策 (ADRs)

### 双模式计算引擎
- 基础模式：经典即时求值状态机（`utils/calculator.ts` 纯函数）
- 科学模式：表达式字符串模型，由 `expressionParser.ts` 统一求值
- 两种模式共享同一 Hook（`useCalculator(voiceEnabled, mode)`），状态互不干扰
- 计算逻辑全部为纯函数，测试无需 React 环境

### 表达式解析（Shunting-yard）
- 词法分析 → 中缀转后缀 → 后缀求值，三段式管线
- 一元负号折叠进数字 token 或转为 `-1 ×`；后缀 `!`/`%` 直接作用于前值
- `evalPreview` 对未完成输入逐步裁剪重试，驱动实时预览
- 函数按钮通过 `findOperandStart` 定位尾部操作数并包裹

### 副作用管理
- setState 回调内不写历史/不播报（React 严格模式下会重复执行）
- 统一使用 `pendingRef + useEffect` 模式转移副作用

### 汇率容错链
```
fetch（10s AbortController 超时）
  → 成功：模块级缓存 + AsyncStorage
  → 失败：模块级缓存 → AsyncStorage 缓存 → 预设汇率
```

### 深色主题统一
- 移动版与桌面版共享同一 iOS 深色配色方案
- 所有颜色在 `constants/theme.ts` 中集中定义

---

## 五种功能模式

| 模式 | 桌面版布局 | 移动版布局 | 功能 |
|------|-----------|-----------|------|
| **基础** | 5×4 网格，iOS 按钮布局 | 4 列自适应网格 | 四则运算、正负切换、百分比、重复等号、滑动退格 |
| **科学** | 4×4 网格，16 种函数 | 5×4 科学键区 + 基础键盘 | 表达式输入、括号、优先级、DEG/RAD、实时预览 |
| **汇率** | 卡片布局，可滚动容器 | 卡片布局 + 底部弹出选择 | 7 种货币实时汇率，离线降级 |
| **单位** | — | 分类切换 + 芯片选择 | 长度/重量/温度换算 |
| **历史** | Listbox 深色主题 | FlatList 滑动列表 | 表达式 + 时间戳，50 条上限，点击回填 |

---

## 设计主题

iOS 深色风格，双平台统一配色：

```
背景       #000000    纯黑
数字键     #333333    深灰
功能键     #A5A5A5    浅灰（文字黑色）
科学键     #3A3A3C    中深灰
操作符     #FF9500    橙色
卡片       #1C1C1E    深色卡片背景
表面       #2C2C2E    次级表面背景
文字       #FFFFFF    主文字
次级文字   #8E8E93    次要提示文字
分隔线     #38383A    列表分隔线
错误       #FF3B30    错误提示红色
```

### 行为约定

- 基础模式显示屏超过 12 字符自动转科学计数法，输入上限 15 位有效数字
- 科学模式表达式上限 100 字符，三角函数支持 DEG/RAD 切换
- 浮点结果截断到 10 位小数
- 除以零显示"错误"，输入新数字自动重置
- 历史记录上限 50 条，超出自动移除最早条目
- 全按钮中文语音播报（expo-speech zh-CN，语速 0.75），可开关并持久化

---

## 文件清单

```
aitest/
├── cu.py                   # 桌面版主程序（Python tkinter，~2200 行）
├── test_cu_smoke.py        # 桌面版冒烟测试（86 项）
├── CalculatorApp/          # 移动版完整项目
│   ├── App.tsx             # Expo 应用入口
│   ├── src/                # TypeScript 源码（25+ 模块）
│   ├── __tests__/          # 165 项 Jest 测试
│   └── README.md           # 移动版详细文档
├── CLAUDE.md               # Claude Code 项目指引
├── spec-mobile-app.md      # 移动版迁移规范
├── spec-voice.md           # 语音播报功能规范
├── spec-ios-ui.md          # iOS UI 规范
├── spec-packaging.md       # 打包规范
├── plan-mobile-app.md      # 移动版实施计划
├── README.md               # 本文件
└── .gitignore              # Git 忽略规则
```

## License

MIT
