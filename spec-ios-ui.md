# Spec: 计算器 iOS 风格 UI 改造

## Objective

将现有的桌面计算器 UI 从当前的浅色圆形按钮风格改造为 iOS iPhone 计算器风格（深色背景、圆角矩形按钮、橙色操作符按钮），保留现有的四模式架构（基础/科学/汇率/历史）。

## Background

当前界面特点：
- 浅灰色背景（`#f0f0f0`）
- 圆形按钮（`RoundButton` 类，用 `create_oval` 实现）
- 蓝色主题色（`#2E86AB`）
- 轻量、简洁但风格老旧

目标：模仿 iOS 计算器特有的黑底 + 圆角矩形按钮 + 操作符高亮视觉语言，同时适配到多模式场景。

## ASSUMPTIONS

1. 所有四种模式（基础/科学/汇率/历史）都保留，视觉风格统一为 iOS 深色设计
2. 使用 Python 标准库 tkinter 实现，**不引入外部依赖**
3. 圆角矩形通过 tkinter Canvas `create_polygon(smooth=True)` 实现
4. `RoundButton` 类将被替换为新的 `RoundedButton` 类（圆角矩形），不向后兼容
5. 显示屏字体偏好保留：Arial 96 bold（来自用户记忆）
6. 窗口尺寸保留：基础/科学模式 480×750，历史模式 480×650

## Tech Stack

- Python 3.x + tkinter（标准库）
- math（标准库）
- 无外部依赖

## Commands

```bash
python cu.py      # 运行计算器
```

## Project Structure

```
cu.py             — 单文件应用程序（约 1000 行）
spec-ios-ui.md    — 本规范文件
```

## Code Style

### 关键变化

1. **新按钮类**：`RoundedButton` 替代 `RoundButton`
   - 绘制圆角矩形（通过 Canvas `create_polygon` with `smooth=True`）
   - 支持三种颜色类型：数字键（深灰）、功能键（浅灰）、操作符键（橙色）
   - 悬停/按下效果：亮度变化（同现有逻辑）
   - 0 号按钮支持跨列（columnspan=2）

2. **配色方案**
   ```python
   # iOS 计算器配色
   COLOR_BG        = "#000000"      # 窗口背景 - 纯黑
   COLOR_NUM       = "#333333"      # 数字键背景 - 深灰
   COLOR_FUNC      = "#A5A5A5"      # 功能键背景（C/±/%）- 浅灰
   COLOR_OP        = "#FF9500"      # 操作符键（÷×-+=）- 橙色
   COLOR_FUNC_TEXT = "#000000"      # 功能键文字色 - 黑色
   COLOR_WHITE_TEXT= "#FFFFFF"      # 数字/操作符文字色
   COLOR_DISPLAY   = "#000000"      # 显示屏背景
   COLOR_DISPLAY_TEXT = "#FFFFFF"   # 显示屏文字色
   ```

3. **布局变化（基础模式）**
   ```
   Row 0: C        , ±     , %     , ÷
   Row 1: 7        , 8     , 9     , ×
   Row 2: 4        , 5     , 6     , -
   Row 3: 1        , 2     , 3     , +
   Row 4: 0 (colspan=2), .  , =
   ```
   - **⌫ 按钮移除**（符合 iOS 设计，没有退格键，使用 C 清空）
   - **= 变为橙色**（操作符统一颜色）
   - 按钮间距：~10px（gap）
   - 按钮圆角半径：约 1/4 按钮宽度

### 新按钮接口示例

```python
class RoundedButton(tk.Canvas):
    def __init__(self, parent, text, command=None, width=80, height=80,
                 corner_radius=20, bg_color="#333333", fg_color="#FFFFFF",
                 font=("Arial", 24, "normal")):
        # 使用 create_polygon(smooth=True) 绘制圆角矩形
        # 支持 columnspan 布局（0 按钮跨两列）
        ...
```

### 各模式 UI 适配

**基础模式**：全黑底 + iOS 按钮网格布局，显示屏右对齐白字大号

**科学模式**：同样黑底深色，科学函数按钮使用深灰底色 + 浅色文字，保持 4×4 网格布局适配深色主题

**汇率模式**：深色卡片风格，输入/选择区域用深灰卡片 + 白色文字，转换按钮用橙色

**历史模式**：深色列表背景，白色文字，按钮风格统一

**模式选择器**：从浅色卡片改为深色卡片风格

### 按钮尺寸设计

以窗口宽度 480px、4 列、gap 10px 计算：
- 总横向间隙：5 × 10 = 50px
- 每列按钮宽度：(480 - 50) / 4 ≈ 107px
- 0 按钮宽度：107 × 2 + 10 = 224px
- 按钮高度 ≈ 宽度 ≈ 80-85px（留出纵向空间给显示屏）
- 圆角半径 ≈ 22px

## Testing Strategy

无自动化测试。通过 `python cu.py` 手动验证：
1. 所有模式下按钮正确渲染和响应
2. 深色主题在各模式间一致
3. 基础模式布局符合 iOS 网格（0 跨两列，操作符在右侧）
4. 计算功能无回归
5. 按钮悬停/按下效果正常
6. 历史记录功能正常
7. 模式切换正常

## Boundaries

- **Always do:**
  - 所有模式保持深色主题一致
  - 保留现有全部计算功能逻辑（不改 backend）
  - 保持全键盘可用（所有按钮绑定正常）

- **Ask first:**
  - 移除现有功能按钮（如 ⌫，已在 spec 中计划）
  - 改变窗口尺寸
  - 修改按钮与现有点击逻辑的绑定

- **Never do:**
  - 不引入外部依赖
  - 不改变核心计算逻辑（on_button_click、input_number、calculate_result 等）
  - 不删除功能（仅替换 UI 表现方式）

## Success Criteria

1. 启动后界面为纯黑底 (`#000000`)，非浅灰
2. 按钮为圆角矩形（非圆形），有清晰的 gap 分隔
3. 配色与 iOS 一致：数字键深灰、功能键浅灰、操作符橙色
4. "0" 按钮跨两列宽度，视觉上与其他按钮对齐
5. 显示屏白色大字体右对齐，与 iOS 风格一致
6. 四种模式（基础/科学/汇率/历史）全部为深色主题
7. 模式选择器同样为深色风格
8. 所有按钮悬停、按下效果正常
9. 所有计算功能无回归

## Open Questions

- [已确认] 基础模式要不要保留 ⌫ 按钮？→ **不保留**，符合 iOS 设计
- [已确认] 是否保留 `RoundButton` 类？→ **删除**，用 `RoundedButton` 替代
- [待定] 科学模式的第一行是否需要更紧凑的布局以适应深色主题？
- [待定] 汇率模式的交换按钮 ⇄ 颜色是否适配橙色主题？
