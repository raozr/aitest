# 多功能计算器 (Multi-Mode Calculator)

iOS 深色风格计算器，支持**桌面端**（Python tkinter）和**移动端**（React Native + Expo）双平台。四种计算模式：基础、科学、汇率、历史。

## 版本概览

| | 桌面版 | 移动版 |
|---|--------|--------|
| **目录** | `cu.py` | `CalculatorApp/` |
| **框架** | Python tkinter | React Native + Expo SDK 54 |
| **语言** | Python 3.6+ | TypeScript 5.9 |
| **代码量** | ~1070 行（单文件） | ~550 行（18 个模块） |
| **平台** | Windows / macOS / Linux（需 GUI） | iOS / Android / Web |
| **测试** | 手动 | Jest（63 项，全部通过） |
| **构建** | PyInstaller → `dist/计算器.exe` | Gradle → APK / EAS Build |

---

## 桌面版 (cu.py)

单文件架构，仅依赖 Python 标准库，无需安装额外依赖。

### 快速开始

```bash
python cu.py
```

### 构建独立应用

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --name "计算器" --distpath dist cu.py
# 产物在 dist/计算器.exe，约 10 MB
```

---

## 移动版 (CalculatorApp)

React Native + Expo 构建的移动端应用，TypeScript 类型安全，纯函数计算引擎。

### 快速开始

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm start` | 启动 Expo 开发服务器（Expo Go 扫码） |
| `npm run web` | 浏览器预览（用于布局验证） |
| `npm test` | 运行全部 63 项 Jest 测试 |
| `npx tsc --noEmit` | TypeScript 类型检查 |

### Android 构建

```bash
# 本地 Gradle 构建（在中国网络环境需配置阿里云 Maven 镜像）
cd CalculatorApp/android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

### 项目结构

```
CalculatorApp/
├── App.tsx                     # Expo 应用入口
├── index.ts                    # 注册根组件
├── package.json                # 依赖配置（Expo SDK 54）
├── app.json                    # Expo 配置（Android 包名、图标等）
├── tsconfig.json               # TypeScript 配置
├── eas.json                    # EAS Build 配置
├── assets/                     # 图标与启动画面
│
├── src/
│   ├── types/index.ts          # 类型定义（CalculatorState, Operator, etc.）
│   ├── constants/theme.ts      # 深色主题色板与字体定义
│   ├── utils/
│   │   ├── calculator.ts       # 纯函数计算引擎（从 cu.py 移植）
│   │   ├── rates.ts            # 汇率 API 客户端 + 固定汇率回退
  │   └── speech.ts           # 中文 TTS 语音播报（expo-speech）
│   ├── hooks/
│   │   ├── useCalculator.ts    # 计算器状态机（useReducer 替代方案）
│   │   └── useExchangeRates.ts # 汇率获取（5 分钟缓存）
│   ├── components/             # 可复用 UI 组件
│   │   ├── Button.tsx          # iOS 风格圆角按钮
│   │   ├── Display.tsx         # 只读显示屏
│   │   ├── ModeSwitcher.tsx    # 基础/科学模式切换（SegmentedControl）
│   │   ├── CurrencySelector.tsx # 货币选择器（底部弹出 Modal）
│   │   └── HistoryList.tsx     # 历史记录列表（FlatList）
│   ├── screens/
│   │   ├── CalculatorScreen.tsx # 计算器主界面（工具栏 + 模式自适应布局）
│   │   ├── CurrencyScreen.tsx   # 汇率转换页（卡片布局 + 实时汇率列表）
│   │   └── HistoryScreen.tsx    # 历史记录页
│   ├── navigation/
│   │   └── AppNavigator.tsx    # React Navigation 栈导航配置
│   └── storage/
│       └── history.ts          # AsyncStorage 历史记录持久化
│
└── __tests__/
    ├── calculator.test.ts      # 纯函数测试（30 项，含边缘用例）
    ├── rates.test.ts           # 汇率 API 与数据完整性（12 项）
    └── useCalculator.test.ts   # Hook 状态机测试（18 项）
```

---

## 架构决策 (ADRs)

### 纯函数计算引擎
- 所有计算逻辑集中在 `utils/calculator.ts`，纯函数无副作用
- Hook `useCalculator` 仅负责状态管理，不包含计算逻辑
- 测试可以直接验证纯函数，无需 React 环境

### 汇率 API 降级策略
- 优先通过 `open.er-api.com` 获取实时汇率
- API 失败（网络问题/HTTP 错误）时自动切换到固定汇率回退
- 5 分钟缓存避免频繁请求

### 深色主题统一
- 移动版与桌面版共享同一 iOS 深色配色方案
- 所有颜色在 `constants/theme.ts` 中集中定义

### 中文语音播报
- 数字键按下时逐个播报中文单字（123 → "一二三"）
- 操作符播报中文读音（+ → "加"，= → "等于"）
- 计算结果通过系统 TTS 朗读完整数值（expo-speech，zh-CN，语速 0.75）
- 科学函数按键、清空、正负切换不播报

---

## 四种计算模式

| 模式 | 桌面版布局 | 移动版布局 | 功能 |
|------|-----------|-----------|------|
| **基础** | 5×4 网格，iOS 按钮布局 | 4 列自适应网格 | 四则运算、正负切换、百分比、中文语音播报 |
| **科学** | 4×4 网格，16 种函数 | 4 列网格 + Segment 切换 | sin/cos/tan、ln/log、幂/开方、阶乘、π/e |
| **汇率** | 卡片布局，可滚动容器 | 卡片布局 + 底部弹出选择 | HKD/USD/CNY/JPY/EUR/GBP/KRW 实时汇率 |
| **历史** | Listbox 深色主题 | FlatList 滑动列表 | 最多 50 条，点击回填结果 |

---

## 设计主题

iOS 深色风格，双平台统一配色：

```
背景       #000000    纯黑
数字键     #333333    深灰
功能键     #A5A5A5    浅灰（文字黑色）
操作符     #FF9500    橙色
卡片       #1C1C1E    深色卡片背景
表面       #2C2C2E    次级表面背景
文字       #FFFFFF    主文字
次级文字   #8E8E93    次要提示文字
分隔线     #38383A    列表分隔线
错误       #FF3B30    错误提示红色
```

### 行为约定

- 显示屏超过 12 字符自动转科学计数法
- 三角函数使用角度制输入
- 浮点结果截断到 10 位小数
- 除以零显示"错误"并允许重置
- 历史记录上限 50 条，超出自动移除最早条目
- 数字键入时逐个中文单字语音播报（expo-speech zh-CN）

---

## 文件清单

```
D:\Ai/
├── cu.py                   # 桌面版主程序（Python tkinter，~1070 行）
├── CalculatorApp/          # 移动版完整项目
│   ├── App.tsx             # Expo 应用入口
│   ├── src/                # TypeScript 源码（~500 行）
│   ├── __tests__/          # 63 项 Jest 测试
│   └── package.json        # 依赖管理
├── CLAUDE.md               # Claude Code 项目指引
├── spec-mobile-app.md      # 移动版迁移规范
├── spec-voice.md           # 语音播报功能规范
├── plan-mobile-app.md      # 移动版实施计划
├── README.md               # 本文件
└── .gitignore              # Git 忽略规则
```

## License

MIT
