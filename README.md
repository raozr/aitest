# 多功能计算器 (Multi-Mode Calculator)

iOS 深色风格计算器，支持**桌面端**（Python tkinter）和**移动端**（React Native + Expo）双平台。四种计算模式：基础、科学、汇率、历史。

## 版本概览

| | 桌面版 | 移动版 |
|---|--------|--------|
| **目录** | `cu.py` | `CalculatorApp/` |
| **框架** | Python tkinter | React Native + Expo SDK 54 |
| **语言** | Python 3.6+ | TypeScript 5.9 |
| **平台** | Windows / macOS / Linux (需 GUI) | iOS / Android / Web |
| **测试** | 手动 | Jest (63 项) |
| **构建** | PyInstaller → `dist/计算器.exe` | Gradle / EAS → APK |

---

## 桌面版 (cu.py)

单文件架构，仅依赖 Python 标准库。

### 快速开始

```bash
python cu.py
```

### 构建独立应用

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --name "计算器" --distpath dist cu.py
# 产物在 dist/计算器.exe，约 10 MB，无需 Python 环境
```

---

## 移动版 (CalculatorApp)

### 快速开始

```bash
cd CalculatorApp
npm install        # 安装依赖
npm start          # Expo 开发服务器（Expo Go 扫码）
npm run web        # 浏览器预览
```

### 测试与类型检查

```bash
npm test           # 63 项 Jest 测试
npx tsc --noEmit   # TypeScript 类型检查
```

### Android 构建

```bash
cd CalculatorApp/android
./gradlew assembleDebug
# APK 输出: android/app/build/outputs/apk/debug/app-debug.apk
```

### 项目架构

```
CalculatorApp/src/
├── types/index.ts           # 类型定义
├── constants/theme.ts       # 深色主题色板
├── utils/
│   ├── calculator.ts        # 纯函数计算引擎（从 cu.py 移植）
│   ├── rates.ts             # 汇率 API 客户端 + 固定汇率回退
│   └── formatters.ts        # 数字格式化
├── hooks/
│   ├── useCalculator.ts     # 计算器状态机
│   └── useExchangeRates.ts  # 汇率数据（5 分钟缓存）
├── components/              # 可复用组件
├── screens/                 # 页面级组件
├── navigation/              # 导航配置
└── storage/history.ts       # AsyncStorage 持久化
```

---

## 四种计算模式

| 模式 | 桌面版布局 | 移动版布局 | 功能 |
|------|-----------|-----------|------|
| **基础** | 5×4 网格，iOS 按钮布局 | 4 列自适应网格 | 四则运算、正负切换、百分比 |
| **科学** | 4×4 网格，16 种函数 | 4 列网格 + Segment 切换 | sin/cos/tan、ln/log、幂/开方、阶乘、π/e |
| **汇率** | 卡片布局，可滚动容器 | 卡片布局 + 底部弹出选择 | USD/CNY/JPY/EUR/GBP/KRW 实时汇率（API 失败时使用固定汇率） |
| **历史** | Listbox 深色主题 | FlatList 滑动列表 | 最多 50 条，点击回填结果 |

---

## 设计主题

iOS 深色风格，双平台统一配色：

```python
背景       #000000    纯黑
数字键     #333333    深灰
功能键     #A5A5A5    浅灰（黑字）
操作符     #FF9500    橙色
卡片       #1C1C1E    深色卡片
表面       #2C2C2E    次级表面
```

- 显示屏超过 12 字符自动转科学计数法
- 三角函数使用角度制
- 浮点结果截断到 10 位小数
- 除以零显示"错误"

---

## 文件清单

```
cu.py                  — 桌面版主程序（~1070 行）
CalculatorApp/         — 移动版完整项目
  ├── App.tsx          — Expo 入口
  ├── __tests__/       — 63 项 Jest 测试
  ├── src/             — TypeScript 源码
  └── package.json     — 依赖配置
CLAUDE.md              — 项目指引
README.md              — 本文件
```

## License

MIT
