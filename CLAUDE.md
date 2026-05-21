# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本文件为 Claude Code (claude.ai/code) 提供在操作此代码库时的指导。

## 项目概览

双平台计算器应用：**桌面版**（Python tkinter）和**移动版**（React Native + Expo）。共享 iOS 深色风格、四种计算模式（基础/科学/汇率/历史）和相同的浮点处理策略。

| | 桌面版 | 移动版 |
|---|---|---|
| **目录** | `cu.py`（单文件，~1130 行） | `CalculatorApp/`（~550 行，18 模块） |
| **框架** | Python tkinter（仅标准库） | React Native + Expo SDK 54 |
| **测试** | 手动 | Jest（63 项） |
| **构建** | PyInstaller → `dist/计算器.exe` | EAS Build / Gradle |

---

## 桌面版 (`cu.py`)

### 运行与构建命令

```bash
python cu.py                                              # 运行计算器（需图形界面）
pip install pyinstaller                                   # 首次打包前安装
pyinstaller --onefile --windowed --name "计算器" --distpath dist cu.py  # 打包 exe
py -c "import py_compile; py_compile.compile('cu.py', doraise=True)"  # 语法检查
```

- 仅依赖 Python 标准库（tkinter, math），无外部依赖
- 没有测试套件，手动验证功能

### 代码结构

```
RoundedButton 类       — iOS 圆角矩形按钮（tk.Canvas + create_polygon smooth）
BaseMode 类            — 基础四则运算（5×4 网格，深色 iOS 按钮布局）
ScientificMode 类      — 科学计算（4×4 网格，16 种函数）
CurrencyMode 类        — 汇率转换（卡片式布局，可滚动 Canvas，6 种固定汇率）
HistoryMode 类         — 历史记录（Listbox + 使用/清空按钮）
Calculator 类          — 主应用：窗口、显示屏、状态变量、模式切换
main 入口              — 创建 Calculator 实例
```

### 模式系统

四种模式通过 `Calculator.modes` 字典管理，遵循统一接口：
- `show()` — 将 `self.frame` 用 `grid()` 显示到 `content_frame`
- `hide()` — 用 `grid_forget()` 从 `content_frame` 移除

```
Calculator
├── 窗口: tk.Tk (480×750 / 480×650)
│   ├── row 0: top_frame
│   │   ├── icon_frame（📋 历史按钮 | mode_label | ☰ 菜单按钮）
│   │   └── display Entry（Arial 48 bold，#000000 bg，仅基础/科学模式显示）
│   └── row 1: content_frame（weight=1，grid 容器）
├── 状态变量: current_input, previous_input, operation, should_reset_display, history
└── modes: {"基础": BaseMode, "科学": ScientificMode, "汇率": CurrencyMode, "历史": HistoryMode}
```

#### 显示屏可见性
- **基础/科学模式**：显示
- **汇率模式**：隐藏（用不到）
- **历史模式**：隐藏（用不到）
- 通过 `display.pack()` / `display.pack_forget()` 控制，切换模式时自动调整

### 关键设计

#### `RoundedButton` — iOS 风格按钮
- 继承 `tk.Canvas`，绑定 `<Configure>` 事件实现自适应重绘
- `create_rounded_rect()` 使用 12 点 polygon + `smooth=True` 绘制圆角矩形
- 颜色变换：`_lighten()`（`f=1.2`）和 `_darken()`（`f=0.75`）系数作用于 RGB 通道
- 交互：悬停变亮、按下变暗、手型光标
- **不指定大小时默认 80×80**，通过 `uniform="row"/"col"` 权重布局

#### 计算状态机
- 四个状态变量：`current_input` / `previous_input` / `operation` / `should_reset_display`
- 超过 12 字符自动 `"{:.6e}"` 科学计数法截断
- 浮点结果 `round(result, 10)` 减轻误差
- `history` 列表最多 50 条，格式 `f"{a} {op} {b} = {result}"`

#### CurrencyMode（汇率模式）
- `RATES`（以 USD 为基准的固定汇率）、`CURRENCY_NAMES`、`CURRENCY_COLORS`
- 双卡片布局：转换卡片 + 汇率列表卡片
- 可滚动 Canvas 容器，鼠标滚轮支持
- 货币选择通过 `tk.Menu` 弹出菜单，`_bind_children()` 递归绑定确保整行可点击
- 色点（圆点 Frame）+ 货币代码 + 货币名称 + 汇率值

#### HistoryMode（历史模式）
- 深色主题 Listbox（`#1C1C1E` bg，`#FF9500` 选中色）
- 双击或点击"使用"触发 `use_history_item()`，解析 `" = "` 取结果值，调用 `switch_to_calc_mode()` 回切
- 清空需要 `messagebox.askyesno()` 确认

#### 模式切换（Calculator）
- **📋 按钮**：`show_history_mode()` — 历史模式下隐藏显示屏，窗口缩至 480×650
- **☰ 按钮**：`show_mode_selector()` — 创建深色卡片风格 Toplevel，含三个模式选项
  - 历史模式下点击 ☰ 不弹窗，直接 `switch_to_calc_mode()` 回退
- **`switch_mode()`**：隐藏当前 → 显示目标 → 更新 `current_mode` / `calc_mode` → 调整显示屏和窗口尺寸
- 当前模式在弹窗中橙色高亮（`#FF9500`）并带 ✓ 标记

#### 模式选择弹窗（show_mode_selector）
- Toplevel 窗口，深色主题（`#1C1C1E` bg，`#FF9500` 强调色）
- 三个模式卡片，通过 `_set_card_bg()` 递归遍历所有子控件统一变色
- 悬停效果：非当前卡片背景从 `#2C2C2E` 变为 `#3A3A3C`，外框变 `#FF9500`
- 所有子控件（Frames + Labels）均绑定 `<Button-1>`，确保点击任何位置均响应

---

## 移动版 (`CalculatorApp/`)

React Native + Expo，TypeScript 类型安全，纯函数计算引擎。

### 常用命令

| 命令 | 说明 |
|------|------|
| `cd CalculatorApp && npm install` | 安装依赖 |
| `npm start` | 启动 Expo 开发服务器 |
| `npm run web` | 浏览器预览 |
| `npm test` | 运行全部 Jest 测试（63 项） |
| `npx tsc --noEmit` | TypeScript 类型检查 |
| `npx expo export --platform web` | Web 静态导出 |

### 架构

```
CalculatorApp/
├── App.tsx                        # Expo 入口
├── index.ts                       # 根组件注册
├── src/
│   ├── types/index.ts             # 核心类型（CalculatorState, Operator, Currency 等）
│   ├── constants/theme.ts         # iOS 深色主题色板
│   ├── utils/
│   │   ├── calculator.ts          # 纯函数计算引擎（无副作用，可直接测试）
│   │   ├── rates.ts               # 汇率 API 客户端 + 固定汇率降级
│   │   └── speech.ts              # 中文 TTS 语音播报
│   ├── hooks/
│   │   ├── useCalculator.ts       # 计算器状态机（useReducer 替代方案）
│   │   └── useExchangeRates.ts    # 实时汇率获取（5 分钟缓存）
│   ├── components/                # 可复用 UI
│   │   ├── Button.tsx, Display.tsx, ModeSwitcher.tsx
│   │   ├── CurrencySelector.tsx, HistoryList.tsx
│   ├── screens/
│   │   ├── CalculatorScreen.tsx   # 主界面（工具栏 + 自适应计算器网格）
│   │   ├── CurrencyScreen.tsx     # 汇率转换页
│   │   └── HistoryScreen.tsx      # 历史记录页
│   ├── navigation/
│   │   └── AppNavigator.tsx       # React Navigation 栈导航
│   └── storage/
│       └── history.ts             # AsyncStorage 历史持久化
└── __tests__/
    ├── calculator.test.ts         # 纯函数测试（30 项）
    ├── rates.test.ts              # 汇率数据完整性（12 项）
    └── useCalculator.test.ts      # 状态机测试（18 项）
```

### 移动版关键设计

- **纯函数计算引擎**：所有逻辑在 `utils/calculator.ts`，无副作用，可直接 Jest 测试
- **汇率 API 降级**：优先 `open.er-api.com` 实时汇率，失败切固定汇率，5 分钟缓存
- **中文语音播报**：数字逐字播报（expo-speech，zh-CN，语速 0.75）
- **深色主题**：与桌面版一致的配色方案
- **TypeScript 类型安全**：`types/index.ts` 统一定义状态、操作符、货币枚举

---

## 通用深色主题配色

```python
背景       #000000    纯黑
数字键     #333333    深灰
功能键     #A5A5A5    浅灰（文字黑色）
操作符     #FF9500    橙色
卡片       #1C1C1E    深色卡片背景
表面       #2C2C2E    次级表面背景
文字       #FFFFFF    主文字
次级文字   #8E8E93    次要提示文字
分隔线     #38383A    列表分隔线
```

## 边界约定

- **三角函数使用角度制**，内部 `math.radians()` 转弧度
- **浮点截断**：`round(result, 10)` 仅减轻误差，不消除（如 `0.1 + 0.2 = 0.30000000000000004`）
- **除以零**：弹出 `messagebox.showerror` 并 `clear_all()` 清空
- **科学模式特殊按钮**：`xʸ` 触发二元操作（存 `operation = "^"`），`(` 和 `)` 追加到 `current_input`
- **Always do:** 保持深色主题一致，显式指定 RoundedButton 尺寸，递归绑定所有子控件以确保交互完整性
- **Ask first:** 修改窗口尺寸、增减功能按钮、改变模式切换逻辑、添加外部依赖、修改 cu.py 源代码
- **Never do:** 不引入外部依赖（桌面版）、不改核心计算逻辑、不提交 `.exe` 到 git

## 文件清单

```
cu.py                     — 桌面版主程序（Python tkinter，~1130 行）
CalculatorApp/            — 移动版完整项目（React Native + Expo）
CLAUDE.md                 — 本文件
README.md                 — 项目说明
spec-ios-ui.md            — iOS 风格 UI 改造规范（已实施）
spec-packaging.md         — PyInstaller 打包规范（已实施）
spec-mobile-app.md        — 移动版迁移规范
spec-voice.md             — 语音播报功能规范
plan-mobile-app.md        — 移动版实施计划
dist/计算器.exe            — 打包产物（gitignored）
```
