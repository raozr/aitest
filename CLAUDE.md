# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本文件为 Claude Code (claude.ai/code) 提供在操作此代码库时的指导。

## 项目概览

一个使用 Python tkinter 构建的多功能桌面计算器，iOS 深色风格 UI，支持基础计算、科学计算、汇率转换和历史记录四种模式。单文件架构（`cu.py`，约 1070 行），仅依赖 Python 标准库。

## 运行命令

```bash
python cu.py              # 运行计算器（需要图形界面）
pip install pyinstaller    # 首次打包前安装
pyinstaller --onefile --windowed --name "计算器" --distpath dist cu.py  # 打包为 Windows exe
py -c "import py_compile; py_compile.compile('cu.py', doraise=True); print('OK')"  # 语法检查
```

- **无外部依赖**：仅使用 Python 标准库（tkinter, math）
- **没有测试套件**，手动验证

## 代码架构

### 单文件结构 (`cu.py`)

```
RoundedButton 类         — iOS 风格圆角矩形按钮（tk.Canvas 绘制，smooth polygon）
BaseMode 类              — 基础四则运算（5×4 网格，iOS 按钮布局）
ScientificMode 类        — 科学计算（4×4 网格，16 种函数）
CurrencyMode 类          — 汇率转换（卡片式布局，滚动容器，6 种货币固定汇率）
HistoryMode 类           — 历史记录查看（Listbox + 使用/清空按钮）
Calculator 类            — 主应用：窗口、显示屏、状态管理、模式切换
main 入口                — 创建 Calculator 实例
```

### 核心架构：模式系统

四种模式通过 `Calculator.modes` 字典管理，每个模式遵循统一接口：

- `show()` — 将 `self.frame` 用 `grid()` 显示到 `content_frame`
- `hide()` — 用 `grid_forget()` 从 `content_frame` 移除

```
Calculator
├── 顶层窗口: tk.Tk (480×750 / 480×650)
│   ├── row 0: top_frame
│   │   ├── icon_frame（📋 + mode_label + ☰）
│   │   └── display Entry（只读，Arial 48 bold，汇率/历史模式下隐藏）
│   └── row 1: content_frame（weight=1，模式界面容器，grid 布局）
├── 状态变量: current_input, previous_input, operation, should_reset_display, history
└── modes: {"基础": BaseMode, "科学": ScientificMode, "汇率": CurrencyMode, "历史": HistoryMode}
```

### 关键设计决策

#### `RoundedButton` — iOS 风格按钮
- 继承 `tk.Canvas`，用 `create_polygon(smooth=True)` 绘制圆角矩形
- 构造参数：`text, command, corner_radius=22, bg_color, fg_color, font, width, height`
- 按钮类型分三种配色：数字键深灰 `#333333`、功能键浅灰 `#A5A5A5`+黑字、操作符橙色 `#FF9500`
- 交互：悬停变亮 (`_lighten`)、按下变暗 (`_darken`)、手型光标
- **显式指定 width/height**（默认 80×80），否则 Canvas 默认尺寸 378×265 会破坏 pack() 布局

#### 显示屏可见性
- 基础/科学模式：显示
- 汇率模式：隐藏（用不到）
- 历史模式：隐藏（用不到）
- 切换模式时通过 `pack()` / `pack_forget()` 控制

#### 计算状态机
- `current_input` / `previous_input` / `operation` / `should_reset_display` 四个状态变量
- 超过 12 字符自动转科学计数法 `"{:.6e}"`
- 浮点结果做 `round(result, 10)` 截断
- `history` 列表最多 50 条，格式 `"a op b = result"`

#### 汇率模式 (CurrencyMode)
- `RATES` 字典（以 USD 为基准的固定汇率），`CURRENCY_NAMES`，`CURRENCY_COLORS`
- 可滚动 Canvas 容器，卡片式布局（#1C1C1E 卡片 / #2C2C2E 表面 / #FF9500 强调色）
- 转换结果直接在转换卡片内显示（result_from / result_amount / result_currency）
- 货币选择通过 `tk.Menu` 弹出菜单

#### 三角函数
- 使用角度制输入，内部通过 `math.radians()` 转弧度

#### 模式切换
- 📋 按钮直接切换到历史模式
- ☰ 弹出模式选择弹窗（深色卡片风格），仅列出基础/科学/汇率三种
- 历史模式下点击 ☰ 不弹窗，直接 `switch_to_calc_mode()` 回到上一个计算模式
- 历史记录双击或点击「使用」将结果写回显示屏并切回计算模式

#### PyInstaller 打包
- 使用 `--onefile --windowed` 参数，输出 `dist/计算器.exe`
- 打包后约 10 MB，可在无 Python 环境的 Windows 10/11 上运行

## 配色方案

```python
# iOS 计算器深色主题
COLOR_BG        = "#000000"      # 窗口背景
COLOR_NUM       = "#333333"      # 数字键
COLOR_FUNC      = "#A5A5A5"      # 功能键（C/±/%）
COLOR_OP        = "#FF9500"      # 操作符键（÷×-+=）
COLOR_FUNC_TEXT = "#000000"      # 功能键文字
COLOR_DISPLAY_TEXT = "#FFFFFF"
CARD_BG         = "#1C1C1E"      # 卡片背景（汇率模式）
SURFACE_BG      = "#2C2C2E"      # 表面背景（汇率模式）
```

## 各模式按钮布局

**基础模式** (5×4):
```
C     ±     %     ÷
7     8     9     ×
4     5     6     -
1     2     3     +
0 (colspan=2)  .   =
```

**科学模式** (4×4):
```
sin  cos  tan  ln
log  x²   x³   xʸ
√    ∛    π    e
(    )    n!   1/x
```

## 灰度模式和边界情况

- 浮点误差：`0.1 + 0.2` 会显示 `0.30000000000000004`，只用 `round(result, 10)` 减轻
- 除以零：弹出 `messagebox.showerror` 并清空
- 显示屏截断：超过 12 字符 → `"{:.6e}"` 科学计数法
- 历史记录上限 50 条，超出时从头部移除
- 汇率输入验证：无效输入静默忽略，不清空

## 文件清单

```
cu.py                  — 主程序（单文件，约 1070 行）
CLAUDE.md              — 本文件
README.md              — 项目说明
spec-ios-ui.md         — iOS 风格 UI 改造规范（已实施）
spec-packaging.md      — PyInstaller 打包规范（已实施）
dist/计算器.exe         — 打包产物（gitignored）
```

## 边界约定

- **Always do:** 保持所有模式深色主题一致，保留全部计算逻辑不改 backend，显式指定 RoundedButton 的 width/height
- **Ask first:** 修改窗口尺寸、增减功能按钮、改变模式切换逻辑、添加外部依赖
- **Never do:** 不引入外部依赖、不改核心计算逻辑、不提交 `.exe` 到 git
