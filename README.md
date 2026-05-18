# 多功能计算器 (Multi-Mode Calculator)

一个使用 Python tkinter 构建的桌面计算器，iOS 深色风格 UI，支持基础运算、科学计算、汇率转换和历史记录四种模式。

![Python Version](https://img.shields.io/badge/python-3.6+-blue.svg)

## 快速开始

```bash
python cu.py
```

需要图形界面环境。仅依赖 Python 标准库，无需安装额外包。

## 四种模式

| 模式 | 功能 | 尺寸 |
|------|------|------|
| **基础** | 四则运算、正负切换、百分比 | 480×750 |
| **科学** | sin/cos/tan、ln/log、幂/开方、阶乘、π/e | 480×750 |
| **汇率** | USD/CNY/JPY/EUR/GBP/KRW 六币种转换（固定汇率） | 480×750 |
| **历史** | 查看、使用、清空计算记录（最多50条） | 480×650 |

## 操作方式

- **📋 左上** — 切换到历史记录模式
- **☰ 右上** — 打开模式选择菜单（基础/科学/汇率，计算模式下有效）
- **双击/使用按钮** — 在历史记录中将结果值送回计算器
- 顶部显示屏在汇率模式和 **历史模式下自动隐藏**

## 技术特点

- **单文件架构**（`cu.py`，约 1070 行）
- **iOS 深色主题**：纯黑背景 `#000000`，数字键深灰 `#333333`，操作符橙色 `#FF9500`
- **圆角矩形按钮**（`RoundedButton`，基于 `tk.Canvas` + `create_polygon(smooth=True)` 绘制）
- **模式系统**：四种模式通过统一 `show()` / `hide()` 接口管理
- **汇率模式卡片布局**：可滚动容器，`#1C1C1E` 深色卡片，`#2C2C2E` 表面背景，弹出菜单选择货币
- 显示屏超过 12 字符自动转科学计数法
- 三角函数使用角度制输入

## 项目结构

```
cu.py
├── RoundedButton        # iOS 圆角矩形按钮组件
├── Calculator           # 主应用：窗口、显示屏、模式切换
│   ├── BaseMode         # 基础计算（5×4 iOS 网格布局）
│   ├── ScientificMode   # 科学计算（4×4 网格，16 种函数）
│   ├── CurrencyMode     # 汇率转换（卡片式布局，滚动容器）
│   └── HistoryMode      # 历史记录（Listbox 深色主题）
└── 入口: Calculator() → tk.mainloop()
```

## 构建独立 Windows 应用

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --name "计算器" --distpath dist cu.py
# 产物在 dist/计算器.exe
```

- 可在 Windows 10/11 上直接运行，无需 Python 环境
- 文件大小约 10 MB

## License

MIT
