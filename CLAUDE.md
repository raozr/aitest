# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本文件为 Claude Code (claude.ai/code) 提供在操作此代码库时的指导。

## 项目概览

这是一个使用 Python tkinter 库构建的简单桌面计算器应用程序。整个应用程序包含在一个文件中（`cu.py`），创建一个具有基本算术运算功能的 GUI 计算器。

## 运行应用程序

由于这是一个 tkinter GUI 应用程序，运行时需要显示服务器。在无头环境中，您可能会看到 tkinter 导入错误或显示连接错误——这是正常现象，不是代码问题。

```bash
# 运行计算器（需要图形界面显示）
python cu.py
```

## 代码架构

### 单文件结构

- **`cu.py`** - 完整的计算器应用程序
  - `Calculator` 类 - 封装 UI 和逻辑的主应用程序类
  - 使用 tkinter 的网格布局系统排列按钮
  - 窗口大小：480x760 像素（已缩小20%），不可调整大小

### 布局结构（7行 x 4列）

```
row 0: 显示屏（Entry，固定高度，weight=0）
row 1-5: 按钮区域（5行，weight=2，占据主要空间）
row 6: 历史记录区（Listbox，weight=1，位于底部）
```

### Calculator 类

`Calculator` 类管理以下内容：

1. **UI 组件**
   - `display_var` - 绑定到显示输入框的 StringVar
   - `history_listbox` - 历史记录列表（带滚动条）
   - 按钮网格布局为 4 列 × 5 行（第1-5行）
   - 按钮包括：数字 0-9、小数点 (.)、运算符 (+, -, ×, ÷)、等号 (=)、清除 (C)、符号切换 (±)、百分比 (%)

2. **状态管理**
   - `current_input` - 当前正在输入的数字（字符串）
   - `previous_input` - 二元运算的第一个操作数
   - `operation` - 当前运算符 (+, -, ×, ÷)
   - `should_reset_display` - 下次输入数字时重置显示的标志
   - `history` - 历史记录列表（最多保存50条）

3. **主要方法**
   - `on_button_click(value)` - 将按钮点击路由到对应处理程序
   - `input_number(num)` - 处理数字和小数点输入
   - `input_operation(op)` - 处理运算符选择
   - `calculate_result()` - 执行计算，并添加记录到历史
   - `clear_all()` - 重置计算器状态
   - `clear_history()` - 清除历史记录列表
   - `toggle_sign()` - 切换当前数值的正负号
   - `percentage()` - 除以 100
   - `update_display()` - 刷新显示并格式化（超过12位字符时切换为科学计数法）

### 显示行为

- 超过 12 个字符的数字将转换为科学计数法（`{:.6e}`）
- 除以零时会显示错误消息框并清除计算器
- 整数结果不带小数位显示
- 计算器使用 Unicode 运算符（×、÷）而非 ASCII 符号（*、/）

### 历史记录功能

- 每次完成计算（按下"="）后自动添加记录
- 格式：`前操作数 运算符 后操作数 = 结果`
- 示例：`12.0 + 5.0 = 17.0`
- 双击 **C** 按钮可清空历史记录
- 最多保存 50 条记录，超过时自动移除最旧的

### 网格权重配置

```python
self.window.grid_rowconfigure(0, weight=0)  # 显示屏固定
for i in range(1, 6):
    self.window.grid_rowconfigure(i, weight=2)  # 按钮区域主要空间
self.window.grid_rowconfigure(6, weight=1)  # 历史记录较少空间
```

## 开发注意事项

- 除 Python 标准库外无其他外部依赖
- 没有测试套件
- 无需构建过程
- 应用程序创建固定大小的窗口，字体 Arial 16-77 bold
- 所有按钮命令使用 lambda 在创建时捕获其文本值
- C 按钮支持双击事件绑定清除历史记录
