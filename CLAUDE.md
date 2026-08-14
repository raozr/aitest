# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本文件为 Claude Code (claude.ai/code) 提供在操作此代码库时的指导。

## 项目概览

双平台计算器应用：**桌面版**（Python tkinter）和**移动版**（React Native + Expo）。共享 iOS 深色风格、五种计算模式（基础/科学/汇率/单位/历史）和相同的浮点处理策略。

| | 桌面版 | 移动版 |
|---|---|---|
| **目录** | `cu.py`（单文件，~2200 行） | `CalculatorApp/`（25 个源模块） |
| **框架** | Python tkinter（仅标准库，建议 3.11+） | React Native 0.83 + Expo SDK 55 |
| **测试** | `test_cu_smoke.py`（86 项冒烟测试） | Jest（165 项，5 套件） |
| **构建** | PyInstaller → `dist/计算器.exe` | EAS Build / Gradle |

---

## 桌面版 (`cu.py`)

### 运行与构建命令

```bash
python cu.py                                              # 运行计算器（需图形界面）
python test_cu_smoke.py                                   # 运行 86 项冒烟测试（引擎 + 状态机 + 换算）
pip install pyinstaller                                   # 首次打包前安装
pyinstaller --onefile --windowed --name "计算器" --distpath dist cu.py  # 打包 exe
py -c "import py_compile; py_compile.compile('cu.py', doraise=True)"  # 语法检查
```

- 仅依赖 Python 标准库（tkinter, math），无外部依赖
- **建议 Python 3.11+**：`math.cbrt` 需要 3.11，旧版本已通过 `_cbrt` 回退兼容
- macOS（Homebrew Python 需单独安装 tkinter）：
  ```bash
  brew install python-tk@3.13
  /opt/homebrew/opt/python@3.13/bin/python3.13 cu.py
  ```

### 代码结构

```
表达式引擎（模块级）    — Shunting-yard 词法→中缀转后缀→后缀求值，与移动端 expressionParser.ts 对齐
语音播报（模块级）      — 系统 TTS（macOS say / Windows SAPI / Linux espeak），后台线程 + 静默失败
RoundedButton 类       — iOS 圆角矩形按钮（tk.Canvas + create_polygon smooth）
BaseMode 类            — 基础四则运算（5×4 网格，深色 iOS 按钮布局）
ScientificMode 类      — 科学模式（表达式输入：5 行科学键区 + 基础键盘）
CurrencyMode 类        — 汇率转换（卡片式布局，可滚动 Canvas，7 币种实时汇率 + 降级）
UnitMode 类            — 单位换算（长度/重量/温度）
HistoryMode 类         — 历史记录（Listbox + 使用/清空按钮）
Calculator 类          — 主应用：窗口、显示屏、状态变量、模式切换
main 入口              — 创建 Calculator 实例
```

### 模式系统

五种模式通过 `Calculator.modes` 字典管理，遵循统一接口：
- `show()` — 将 `self.frame` 用 `grid()` 显示到 `content_frame`
- `hide()` — 用 `grid_forget()` 从 `content_frame` 移除

```
Calculator
├── 窗口: tk.Tk (480×750 / 480×880 科学 / 480×650 历史)
│   ├── row 0: top_frame
│   │   ├── icon_frame（📋 历史 | DEG/RAD | mode_label | 🔊 语音 | ☰ 菜单）
│   │   ├── preview_label（表达式预览行，小字右对齐）
│   │   └── display Entry（Arial 44 bold，#000000 bg，仅基础/科学模式显示）
│   └── row 1: content_frame（weight=1，grid 容器）
├── 状态变量: current_input, previous_input, operation, should_reset_display, history
├── 科学状态: expression, expr_result, angle_mode
└── modes: {"基础", "科学", "汇率", "单位", "历史"}
```

#### 显示屏可见性
- **基础/科学模式**：显示
- **汇率/单位模式**：隐藏（用不到）
- **历史模式**：隐藏（用不到）
- 通过 `display.pack()` / `display.pack_forget()` 控制，切换模式时自动调整

### 关键设计

#### `RoundedButton` — iOS 风格按钮
- 继承 `tk.Canvas`，绑定 `<Configure>` 事件实现自适应重绘
- `create_rounded_rect()` 使用 12 点 polygon + `smooth=True` 绘制圆角矩形
- 颜色变换：`_lighten()`（`f=1.2`）和 `_darken()`（`f=0.75`）系数作用于 RGB 通道
- 交互：悬停变亮、按下变暗、手型光标
- **不指定大小时默认 80×80**，通过 `uniform="row"/"col"` 权重布局

#### 计算状态机（基础模式）
- 状态变量：`current_input` / `previous_input` / `operation` / `should_reset_display`，另加 `last_operation` / `last_operand` 支持重复等号
- 超过 12 字符自动 `"{:.6e}"` 科学计数法截断，输入上限 15 位有效数字
- 浮点结果 `round(result, 10)` 减轻误差
- `history` 列表最多 50 条，格式 `{"expr", "result", "ts"}`

#### 表达式引擎（科学模式，模块级纯函数）
- 词法分析 → Shunting-yard 中缀转后缀 → 后缀求值，三段式管线
- 支持：括号、优先级、一元负号、隐式乘法（`2π`、`2(3+4)`）、DEG/RAD、后缀 `!`/`%`
- `eval_preview()` 对未完成输入逐步裁剪重试，驱动实时预览
- `wrap_operand()` / `append_to_operand()` 实现函数包裹（`sin(`、`^2`、`!`）

#### CurrencyMode（汇率模式）
- `FALLBACK_RATES`（以 USD 为基准，7 币种含 HKD）、`CURRENCY_NAMES`、`CURRENCY_COLORS`
- 实时汇率后台线程加载（10s 超时 + 5 分钟缓存），失败切固定汇率降级
- 双卡片布局：转换卡片 + 汇率列表卡片，可滚动 Canvas 容器 + 鼠标滚轮
- 货币选择通过 `tk.Menu` 弹出菜单，`_bind_children()` 递归绑定确保整行可点击

#### UnitMode（单位模式）
- 长度（7 单位）/ 重量（5 单位）/ 温度（C/F/K 专用公式）
- 分类切换按钮 + 换算卡片 + 单位选择器 + 实时结果

#### HistoryMode（历史模式）
- 深色主题 Listbox（`#1C1C1E` bg，`#FF9500` 选中色），表达式 + 时间戳
- 双击或点击"使用"触发 `use_history_item()`，调用 `restore_value()` 回填并 `switch_to_calc_mode()` 回切
- 清空需要 `messagebox.askyesno()` 确认

#### 模式切换（Calculator）
- **📋 按钮**：`show_history_mode()` — 历史模式下隐藏显示屏，窗口缩至 480×650
- **☰ 按钮**：`show_mode_selector()` — 创建深色卡片风格 Toplevel，含四个模式选项
  - 历史模式下点击 ☰ 不弹窗，直接 `switch_to_calc_mode()` 回退
- **`switch_mode()`**：隐藏当前 → 显示目标 → 更新 `current_mode` / `calc_mode` → 调整显示屏和窗口尺寸
- 当前模式在弹窗中橙色高亮（`#FF9500`）并带 ✓ 标记

#### 模式选择弹窗（show_mode_selector）
- Toplevel 窗口，深色主题（`#1C1C1E` bg，`#FF9500` 强调色）
- 四个模式卡片（基础/科学/汇率/单位），通过 `_set_card_bg()` 递归遍历所有子控件统一变色
- 悬停效果：非当前卡片背景从 `#2C2C2E` 变为 `#3A3A3C`，外框变 `#FF9500`
- 所有子控件（Frames + Labels）均绑定 `<Button-1>`，确保点击任何位置均响应

---

## 移动版 (`CalculatorApp/`)

React Native + Expo，TypeScript 严格模式，纯函数计算引擎。

### 常用命令

| 命令 | 说明 |
|------|------|
| `cd CalculatorApp && npm install` | 安装依赖 |
| `npm start` | 启动 Expo 开发服务器 |
| `npm run android` | Android 真机/模拟器运行 |
| `npm run ios` | iOS 真机/模拟器运行 |
| `npm run web` | 浏览器预览 |
| `npm test` | 运行全部 Jest 测试（165 项） |
| `npx jest --watch` | 交互式调试单测 |
| `npx tsc --noEmit` | TypeScript 类型检查 |
| `npx expo export --platform web` | Web 静态导出 |

### 架构

```
CalculatorApp/
├── App.tsx                        # Expo 入口
├── index.ts                       # 根组件注册
├── src/
│   ├── types/index.ts             # 核心类型（CalculatorState, Operator, CalcMode 等）
│   ├── constants/theme.ts         # iOS 深色主题色板与字体
│   ├── utils/
│   │   ├── calculator.ts          # 基础模式纯函数计算引擎（无副作用，可直接测试）
│   │   ├── expressionParser.ts    # 表达式解析引擎（Shunting-yard）
│   │   ├── rates.ts               # 汇率 API 客户端（10s 超时）+ 固定汇率降级
│   │   ├── units.ts               # 单位换算（长度/重量/温度）
│   │   └── speech.ts              # 中文 TTS 语音播报
│   ├── hooks/
│   │   ├── useCalculator.ts       # 双模式计算器状态机
│   │   └── useExchangeRates.ts    # 实时汇率获取（5 分钟缓存 + 离线降级）
│   ├── components/                # 可复用 UI
│   │   ├── Button.tsx, Display.tsx, ModeSwitcher.tsx
│   │   ├── CurrencySelector.tsx, HistoryList.tsx, ErrorBoundary.tsx
│   ├── screens/
│   │   ├── CalculatorScreen.tsx   # 主界面（工具栏 + 自适应计算器网格 + 手势）
│   │   ├── CurrencyScreen.tsx     # 汇率转换页
│   │   ├── UnitScreen.tsx         # 单位换算页
│   │   └── HistoryScreen.tsx      # 历史记录页
│   ├── navigation/
│   │   └── AppNavigator.tsx       # React Navigation 栈导航
│   └── storage/
│       ├── history.ts             # 历史记录持久化
│       ├── settings.ts            # 语音开关持久化
│       └── rates.ts               # 汇率离线缓存
└── __tests__/
    ├── calculator.test.ts         # 基础计算引擎（含除零链式回归）
    ├── expressionParser.test.ts   # 表达式解析器
    ├── useCalculator.test.ts      # Hook 双模式状态测试
    ├── rates.test.ts              # 汇率转换
    └── units.test.ts              # 单位换算
```

### 移动版关键设计

- **双模式计算引擎**：基础模式经典即时求值（`utils/calculator.ts` 纯函数），科学模式表达式字符串（`expressionParser.ts` 统一求值），共享同一 Hook
- **汇率 API 降级**：优先 `open.er-api.com` 实时汇率（10s 超时），失败切模块级缓存 → AsyncStorage → 固定汇率，5 分钟缓存
- **中文语音播报**：全按钮覆盖（expo-speech，zh-CN，语速 0.75），开关持久化
- **深色主题**：与桌面版一致的配色方案，颜色集中在 `constants/theme.ts`
- **TypeScript 严格模式**：`types/index.ts` 统一定义状态、操作符、货币枚举

---

## 通用深色主题配色

```python
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

## 边界约定

- **三角函数使用角度制（DEG）**，内部 `_to_radians()` / `toRadians()` 转弧度，支持 DEG/RAD 切换
- **浮点截断**：`round(result, 10)` 仅减轻误差，不消除（如 `0.1 + 0.2 = 0.30000000000000004`）
- **除以零**：显示"错误"（基础/科学均内联显示，不弹窗），输入新数字自动重置
- **科学模式特殊按钮**：`xʸ` 追加 `^`，`(` / `)` 追加到表达式，`n!`/`x²`/`x³` 后缀追加，其余函数包裹尾部操作数
- **科学模式表达式上限 100 字符**，基础模式输入上限 15 位有效数字，历史记录上限 50 条
- **Always do:** 保持深色主题一致，显式指定 RoundedButton 尺寸，递归绑定所有子控件以确保交互完整性
- **Ask first:** 修改窗口尺寸、增减功能按钮、改变模式切换逻辑、添加外部依赖、修改 cu.py 源代码
- **Never do:** 不引入外部依赖（桌面版）、不改核心计算逻辑、不提交 `.exe` 到 git

## 文件清单

```
cu.py                     — 桌面版主程序（Python tkinter，~2200 行）
test_cu_smoke.py          — 桌面版冒烟测试（86 项：引擎 + 状态机 + 换算）
CalculatorApp/            — 移动版完整项目（React Native + Expo SDK 55）
CLAUDE.md                 — 本文件
README.md                 — 项目说明
spec-ios-ui.md            — iOS 风格 UI 改造规范（已实施）
spec-packaging.md         — PyInstaller 打包规范（已实施）
spec-mobile-app.md        — 移动版迁移规范
spec-voice.md             — 语音播报功能规范
plan-mobile-app.md        — 移动版实施计划
dist/计算器.exe            — 打包产物（gitignored）
.specstory/               — 开发日志（gitignored）
```
