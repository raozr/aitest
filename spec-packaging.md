# Spec: 计算器 - 独立 Windows 应用打包

## Objective

将现有的 tkinter 计算器 `cu.py` 打包为独立的 Windows `.exe` 应用程序，使其无需 Python 环境即可在任何 Windows 机器上运行。

**用户场景：**
- 普通 Windows 用户双击 `.exe` 即可启动计算器
- 无需安装 Python、无需配置环境变量
- 可以作为独立工具分发（单文件，便于传输）

**成功标准：**
- 打包后的 `.exe` 能在 Windows 10/11 上正常运行
- 四种模式（基础、科学、汇率、历史）功能完整
- 无控制台窗口弹出（纯 GUI 应用）
- 单文件分发，大小合理

## Tech Stack

- **Python 3.13.3** — 位于 `C:\Users\rzr\AppData\Local\Programs\Python\Python313\`
- **PyInstaller** (最新版) — 将 Python 脚本打包为独立可执行文件
- **tkinter** — UI 框架（Python 标准库，由 PyInstaller 自动打包）
- **无其他外部依赖** — 计算器本身只使用 Python 标准库

## Commands

```bash
# 安装 PyInstaller（首次）
pip install pyinstaller

# 打包为单文件 Windows 应用
pyinstaller --onefile --windowed --name "计算器" --distpath dist cu.py

# 打包产物位置
dist/计算器.exe

# 清理中间文件
rm -rf build __pycache__ *.spec
```

### PyInstaller 参数说明

| 参数 | 作用 |
|------|------|
| `--onefile` | 打包为单个 exe 文件（非文件夹模式） |
| `--windowed` | 不显示控制台窗口（纯 GUI 应用） |
| `--name "计算器"` | exe 文件名为 `计算器.exe` |
| `--distpath dist` | 输出目录为 `dist/` |
| `--icon` | 未使用（采用默认图标） |

### 可选附加参数（需评估后添加）

```
--hidden-import tkinter  # 显式声明 tkinter（PyInstaller 通常自动检测）
--add-data "path;."      # 如需添加额外资源文件
--version-file version.txt  # 如需添加文件版本信息
```

## Project Structure

```
D:\Ai\
├── cu.py                  # 源代码（不变）
├── spec-packaging.md      # 本规范文档（打包完成后可删除）
├── dist/                  # 打包输出目录（新建）
│   └── 计算器.exe         # 最终产物
├── build/                 # PyInstaller 临时编译目录（可忽略，可删除）
├── __pycache__/           # Python 缓存（可删除）
└── 计算器.spec            # PyInstaller 生成的 spec 文件（可删除）
```

## Code Style

**本次不修改源代码。** 打包过程不涉及代码风格变更。如需适配打包，最小化修改原则：

- 不改变现有代码逻辑
- 不重构、不优化
- 仅在必要时添加打包兼容性处理（如 `sys.executable` 路径处理、资源文件访问）

代码风格的现有实践（保持）：
- 类名：PascalCase（`RoundButton`, `BaseMode`, `Calculator`）
- 函数/变量：snake_case（`input_number`, `current_input`）
- 中文注释（已存在）

## Testing Strategy

**测试方式：手动验证**

由于这是 GUI 应用，无测试套件，验证方式为：

1. **构建验证**：`pyinstaller` 命令成功退出，生成 `dist/计算器.exe`
2. **启动验证**：双击 `计算器.exe`，窗口正常弹出，无控制台窗口
3. **功能冒烟测试**：
   - 基础模式：输入 `1 + 2 =` → 显示 `3`
   - 科学模式：`sin(30)` → 显示 `0.5`
   - 汇率模式：100 CNY → USD → 显示正确结果
   - 历史模式：检查历史记录显示正常
4. **异常测试**：
   - 除以零 → 弹出错误提示
   - 大数输入 → 科学计数法截断
5. **独立环境测试（可选）**：拷贝 `.exe` 到一台没有 Python 的干净 Windows 机器上测试

## Boundaries

### Always
- 保持源代码 `cu.py` 不变（零修改原则）
- 使用 `--windowed` 确保无控制台窗口
- 打包前确认 `pip install pyinstaller` 安装成功
- 生成的 `.exe` 放在 `dist/` 目录下

### Ask first
- 修改 `cu.py` 源代码以适应打包（当前预期不需要）
- 添加 `--hidden-import` 或其他 PyInstaller 参数
- 添加应用图标（.ico）
- 添加版本信息文件
- 修改项目目录结构

### Never
- 不修改 `cu.py` 中任何功能代码
- 不添加新的外部依赖
- 不将 `.exe` 提交到 git 仓库
- 不删除 `cu.py` 源代码

## Success Criteria

- [x] `pyinstaller` 命令成功执行，返回码为 0
- [x] `dist/计算器.exe` 文件存在且可执行
- [x] Windows 上双击 `.exe` 正常启动，无控制台窗口
- [x] 四种模式（基础、科学、汇率、历史）功能正常
- [x] `.exe` 可脱离 Python 环境独立运行

## Open Questions

1. **tkinter 兼容性**：PyInstaller 对 Python 3.13 的 tkinter 支持是否完善？如果打包后运行出错，可能需要添加 `--hidden-import tkinter`。
2. **文件体积**：单文件模式下 `.exe` 的大小（预估 10-30MB），是否在可接受范围内？
3. **Windows Defender**：PyInstaller 打包的 exe 有时会被 Windows Defender 误报。如出现此情况，可考虑代码签名或添加排除项。
