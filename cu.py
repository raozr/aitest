import tkinter as tk
from tkinter import messagebox
import json
import math
import platform
import re
import subprocess
import threading
import time
import urllib.request


# ======================================================================
# 表达式解析引擎（与移动端 expressionParser.ts 保持一致）
# ======================================================================

FUNC_NAMES = ("sin", "cos", "tan", "log", "ln", "sqrt", "cbrt", "abs", "exp", "pow10")
OPERATORS = ("+", "-", "×", "÷", "^")
PRECEDENCE = {"+": 1, "-": 1, "×": 2, "÷": 2, "^": 3}

MAX_EXPR_LENGTH = 100
MAX_INPUT_LENGTH = 15


def round_result(value):
    """浮点结果截断到 10 位小数（与移动端 roundResult 一致）"""
    if isinstance(value, int):
        return value
    if float(value).is_integer():
        return int(value)
    return round(value, 10)


def _to_radians(degrees):
    return degrees * math.pi / 180


def _factorial(n):
    n = math.floor(n)
    if n < 0:
        return math.nan
    if n > 170:
        return math.inf
    result = 1.0
    for i in range(2, n + 1):
        result *= i
    return result


def _apply_func(name, x, angle):
    if name == "sin":
        return math.sin(_to_radians(x) if angle == "DEG" else x)
    if name == "cos":
        return math.cos(_to_radians(x) if angle == "DEG" else x)
    if name == "tan":
        r = math.tan(_to_radians(x) if angle == "DEG" else x)
        return math.inf if abs(r) > 1e10 else r
    if name == "log":
        return math.log10(x)
    if name == "ln":
        return math.log(x)
    if name == "sqrt":
        return math.sqrt(x)
    if name == "cbrt":
        return math.cbrt(x)
    if name == "abs":
        return abs(x)
    if name == "exp":
        return math.exp(x)
    if name == "pow10":
        return 10.0 ** x
    raise ValueError(f"未知函数: {name}")


def _tokenize(expr):
    """词法分析：字符串 → token 列表 (type, value)"""
    tokens = []
    i = 0
    n = len(expr)

    def is_unary_position():
        if not tokens:
            return True
        return tokens[-1][0] in ("op", "lparen")

    while i < n:
        ch = expr[i]

        if ch == " ":
            i += 1
            continue

        # 数字（一元正负号折叠进数字）
        sign_followed_by_digit = (
            ch in "+-"
            and is_unary_position()
            and i + 1 < n
            and (expr[i + 1].isdigit() or expr[i + 1] == ".")
        )
        if ch.isdigit() or ch == "." or sign_followed_by_digit:
            num = ""
            if ch in "+-":
                if ch == "-":
                    num = "-"
                i += 1
            dots = 0
            while i < n and (expr[i].isdigit() or expr[i] == "."):
                if expr[i] == ".":
                    dots += 1
                    if dots > 1:
                        raise ValueError("无效的数字")
                num += expr[i]
                i += 1
            if num in ("", "-"):
                raise ValueError("无效的数字")
            tokens.append(("num", num))
            continue

        if ch == "π":
            tokens.append(("num", repr(math.pi)))
            i += 1
            continue

        if ch.isalpha():
            name = ""
            while i < n and expr[i].isalnum():
                name += expr[i]
                i += 1
            if name == "e":
                tokens.append(("num", repr(math.e)))
                continue
            if name not in FUNC_NAMES:
                raise ValueError(f"未知函数: {name}")
            tokens.append(("func", name))
            continue

        if ch == "(":
            tokens.append(("lparen", ch))
            i += 1
            continue

        if ch == ")":
            tokens.append(("rparen", ch))
            i += 1
            continue

        if ch in OPERATORS:
            # 一元 +/- 出现在 '('、函数、π、e 之前 → -1 × …
            if ch in "+-" and is_unary_position():
                if ch == "-":
                    tokens.append(("num", "-1"))
                    tokens.append(("op", "×"))
                i += 1
                continue
            tokens.append(("op", ch))
            i += 1
            continue

        if ch in "%!":
            tokens.append(("postfix", ch))
            i += 1
            continue

        raise ValueError(f"无效字符: {ch}")

    # 隐式乘法：2π、2(3)、)(、2sin(…)
    out = []
    for t in tokens:
        if out:
            prev = out[-1]
            if prev[0] in ("num", "rparen", "postfix") and t[0] in ("num", "lparen", "func"):
                out.append(("op", "×"))
        out.append(t)
    return out


def _to_postfix(tokens):
    """Shunting-yard：中缀 → 后缀"""
    out = []
    stack = []

    for ttype, value in tokens:
        if ttype == "num":
            out.append((ttype, value))
        elif ttype == "func":
            stack.append((ttype, value))
        elif ttype == "postfix":
            # 后缀运算符（! %）直接作用于前一个值
            out.append((ttype, value))
        elif ttype == "op":
            while stack:
                top_type, top_value = stack[-1]
                if top_type == "func":
                    out.append(stack.pop())
                    continue
                if top_type == "op" and (
                    PRECEDENCE[top_value] > PRECEDENCE[value]
                    or (PRECEDENCE[top_value] == PRECEDENCE[value] and value != "^")
                ):
                    out.append(stack.pop())
                    continue
                break
            stack.append((ttype, value))
        elif ttype == "lparen":
            stack.append((ttype, value))
        elif ttype == "rparen":
            found = False
            while stack:
                top = stack.pop()
                if top[0] == "lparen":
                    found = True
                    break
                out.append(top)
            if not found:
                raise ValueError("括号不匹配")
            if stack and stack[-1][0] == "func":
                out.append(stack.pop())

    while stack:
        top = stack.pop()
        if top[0] == "lparen":
            raise ValueError("括号不匹配")
        out.append(top)
    return out


def _evaluate_postfix(tokens, angle):
    values = []

    for ttype, value in tokens:
        if ttype == "num":
            values.append(float(value))
        elif ttype == "postfix":
            if not values:
                raise ValueError("表达式无效")
            x = values.pop()
            values.append(x / 100 if value == "%" else _factorial(x))
        elif ttype == "func":
            if not values:
                raise ValueError("表达式无效")
            values.append(_apply_func(value, values.pop(), angle))
        elif ttype == "op":
            if len(values) < 2:
                raise ValueError("表达式无效")
            b = values.pop()
            a = values.pop()
            if value == "+":
                values.append(a + b)
            elif value == "-":
                values.append(a - b)
            elif value == "×":
                values.append(a * b)
            elif value == "÷":
                if b == 0:
                    raise ValueError("不能除以零")
                values.append(a / b)
            elif value == "^":
                values.append(math.pow(a, b))

    if len(values) != 1:
        raise ValueError("表达式无效")
    return values[0]


def evaluate_expression(expr, angle="DEG"):
    """求值完整表达式，失败抛 ValueError"""
    tokens = _tokenize(expr)
    if not tokens:
        raise ValueError("表达式为空")
    return _evaluate_postfix(_to_postfix(tokens), angle)


def _trim_one_step(s):
    """裁剪一步：优先去掉尾部函数名，否则去掉最后一个字符"""
    i = len(s)
    while i > 0 and s[i - 1].isalnum() and not s[i - 1].isdigit():
        i -= 1
    if i < len(s):
        return s[:i]
    return s[:-1]


def _ends_incomplete(s):
    """表达式是否处于未完成状态（尾随运算符/未闭合括号/悬空小数点/函数名）"""
    if not s:
        return False
    if s.count("(") > s.count(")"):
        return True
    last = s[-1]
    if last in "+-×÷^(" or last == ".":
        return True
    if last.isalpha():
        i = len(s)
        while i > 0 and s[i - 1].isalnum():
            i -= 1
        if s[i:] != "e":
            return True
    return False


def eval_preview(expr, angle):
    """实时预览：对未完成输入逐步裁剪重试，无法求值返回 None"""
    s = expr.strip()
    for _ in range(20):
        if not s:
            return None
        try:
            value = evaluate_expression(s, angle)
            return round_result(value) if math.isfinite(value) else None
        except (ValueError, OverflowError):
            if not _ends_incomplete(s):
                return None
            s = _trim_one_step(s)
    return None


def find_operand_start(expr):
    """定位尾部操作数（数字/常量/括号组/函数调用）的起始下标，无则返回 None"""
    if not expr:
        return None
    i = len(expr) - 1

    while i >= 0 and expr[i] in "!%":
        i -= 1
    if i < 0:
        return None

    ch = expr[i]

    if ch.isdigit() or ch == ".":
        while i >= 0 and (expr[i].isdigit() or expr[i] == "."):
            i -= 1
        if i >= 0 and expr[i] == "-" and (i == 0 or expr[i - 1] in "+-×÷^("):
            i -= 1
        return i + 1

    if ch in "πe":
        return i

    if ch == ")":
        depth = 0
        while i >= 0:
            if expr[i] == ")":
                depth += 1
            elif expr[i] == "(":
                depth -= 1
                if depth == 0:
                    break
            i -= 1
        if i < 0:
            return None
        for name in FUNC_NAMES:
            if expr[:i].endswith(name):
                return i - len(name)
        return i

    return None


def wrap_operand(expr, prefix, suffix):
    """包裹尾部操作数：30 → sin(30)"""
    start = find_operand_start(expr)
    if start is None:
        return expr + prefix
    return expr[:start] + prefix + expr[start:] + suffix


def append_to_operand(expr, suffix):
    """在尾部操作数后追加：5 → 5^2"""
    start = find_operand_start(expr)
    if start is None:
        return expr
    return expr + suffix


def format_number(value):
    """计算结果格式化"""
    if isinstance(value, float):
        if value.is_integer():
            return str(int(value))
        return str(round(value, 10))
    return str(value)


# ======================================================================
# 语音播报（系统 TTS，与移动端 speech.ts 对齐，失败静默）
# ======================================================================

DIGIT_TO_CHINESE = {
    "0": "零", "1": "一", "2": "二", "3": "三", "4": "四",
    "5": "五", "6": "六", "7": "七", "8": "八", "9": "九", ".": "点",
}

OPERATOR_TO_SPEECH = {
    "+": "加", "-": "减", "×": "乘", "÷": "除", "=": "等于", "%": "百分之",
}

SCIENTIFIC_TO_SPEECH = {
    "⌫": "退格", "(": "左括号", ")": "右括号",
    "DEG": "角度制", "RAD": "弧度制",
    "n!": "阶乘", "π": "派", "e": "自然常数", "|x|": "绝对值",
    "1/x": "倒数", "x²": "平方", "x³": "立方", "xʸ": "幂",
    "√": "平方根", "∛": "立方根", "log": "常用对数", "ln": "自然对数",
    "eˣ": "e 的指数", "sin": "正弦", "cos": "余弦", "tan": "正切",
    "10ˣ": "10 的指数",
}

_speech_proc = None
_speech_lock = threading.Lock()


def stop_speech():
    global _speech_proc
    with _speech_lock:
        if _speech_proc is not None and _speech_proc.poll() is None:
            try:
                _speech_proc.terminate()
            except Exception:
                pass
        _speech_proc = None


def speak(text):
    """后台线程调用系统 TTS（macOS say / Windows SAPI / Linux espeak）"""
    if not text:
        return
    stop_speech()

    def worker():
        global _speech_proc
        try:
            system = platform.system()
            if system == "Darwin":
                cmd = ["say", text]
            elif system == "Windows":
                cmd = [
                    "powershell", "-Command",
                    'Add-Type -AssemblyName System.Speech; '
                    '(New-Object System.Speech.Synthesis.SpeechSynthesizer)'
                    f'.Speak("{text}")',
                ]
            else:
                cmd = ["espeak", text]
            with _speech_lock:
                proc = subprocess.Popen(
                    cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
                )
                _speech_proc = proc
            proc.wait()
        except Exception:
            pass

    threading.Thread(target=worker, daemon=True).start()


def speak_digit(digit):
    text = DIGIT_TO_CHINESE.get(digit)
    if text:
        speak(text)


def speak_operator(op):
    text = OPERATOR_TO_SPEECH.get(op)
    if text:
        speak(text)


def speak_scientific(func):
    text = SCIENTIFIC_TO_SPEECH.get(func)
    if text:
        speak(text)


def speak_result(value):
    text = "".join("负" if ch == "-" else DIGIT_TO_CHINESE.get(ch, ch) for ch in value)
    speak(text)


# ======================================================================
# UI 组件
# ======================================================================

class RoundedButton(tk.Canvas):
    """圆角矩形按钮组件 - iOS 风格"""

    def __init__(self, parent, text, command=None, corner_radius=22,
                 bg_color="#333333", fg_color="#FFFFFF", font=("Arial", 24, "normal"),
                 width=None, height=None):
        if width is None:
            width = 80
        if height is None:
            height = 80
        super().__init__(parent, width=width, height=height,
                        highlightthickness=0, bg=parent["bg"])

        self.corner_radius = corner_radius
        self.bg_color = bg_color
        self.fg_color = fg_color
        self.button_text = text
        self.font = font
        self.command = command
        self._hovered = False

        self.bind("<Configure>", self._on_resize)
        self.bind("<Button-1>", self._on_press)
        self.bind("<ButtonRelease-1>", self._on_release)
        self.bind("<Enter>", self._on_enter)
        self.bind("<Leave>", self._on_leave)

    def set_text(self, text):
        self.button_text = text
        self._draw(self.winfo_width(), self.winfo_height())

    def _lighten(self, color):
        r, g, b = int(color[1:3], 16), int(color[3:5], 16), int(color[5:7], 16)
        f = 1.2
        return f"#{min(255, int(r*f)):02x}{min(255, int(g*f)):02x}{min(255, int(b*f)):02x}"

    def _darken(self, color):
        r, g, b = int(color[1:3], 16), int(color[3:5], 16), int(color[5:7], 16)
        f = 0.75
        return f"#{int(r*f):02x}{int(g*f):02x}{int(b*f):02x}"

    def _draw(self, w, h, bg_color=None):
        self.delete("all")
        if w < 2 or h < 2:
            return
        color = bg_color or self.bg_color
        r = min(self.corner_radius, w // 2, h // 2)
        self.create_rounded_rect(2, 2, w - 2, h - 2, r, fill=color, outline="")
        self.create_text(w // 2, h // 2, text=self.button_text,
                         font=self.font, fill=self.fg_color)

    def create_rounded_rect(self, x1, y1, x2, y2, r, **kwargs):
        points = [
            x1 + r, y1,
            x2 - r, y1,
            x2, y1,
            x2, y1 + r,
            x2, y2 - r,
            x2, y2,
            x2 - r, y2,
            x1 + r, y2,
            x1, y2,
            x1, y2 - r,
            x1, y1 + r,
            x1, y1,
        ]
        return self.create_polygon(points, smooth=True, **kwargs)

    def _on_resize(self, event):
        self._draw(event.width, event.height)

    def _on_press(self, event):
        self._draw(self.winfo_width(), self.winfo_height(),
                   bg_color=self._darken(self.bg_color))

    def _on_release(self, event):
        self._draw(self.winfo_width(), self.winfo_height(),
                   bg_color=self._lighten(self.bg_color) if self._hovered else self.bg_color)
        if self.command:
            self.command()

    def _on_enter(self, event):
        self._hovered = True
        self.config(cursor="hand2")
        self._draw(self.winfo_width(), self.winfo_height(),
                   bg_color=self._lighten(self.bg_color))

    def _on_leave(self, event):
        self._hovered = False
        self._draw(self.winfo_width(), self.winfo_height())


# ======================================================================
# 基础模式
# ======================================================================

class BaseMode:
    """基础模式 - iOS 风格计算器"""

    BG_NUMBER  = "#333333"
    BG_FUNC    = "#A5A5A5"
    BG_OP      = "#FF9500"
    FG_NUMBER  = "#FFFFFF"
    FG_FUNC    = "#000000"
    FG_OP      = "#FFFFFF"
    GAP = 8

    BUTTONS = [
        ("C",  0, 0, 1, "func"), ("±",  0, 1, 1, "func"),
        ("%",  0, 2, 1, "func"), ("÷",  0, 3, 1, "op"),
        ("7",  1, 0, 1, "num"), ("8",  1, 1, 1, "num"),
        ("9",  1, 2, 1, "num"), ("×",  1, 3, 1, "op"),
        ("4",  2, 0, 1, "num"), ("5",  2, 1, 1, "num"),
        ("6",  2, 2, 1, "num"), ("-",  2, 3, 1, "op"),
        ("1",  3, 0, 1, "num"), ("2",  3, 1, 1, "num"),
        ("3",  3, 2, 1, "num"), ("+",  3, 3, 1, "op"),
        ("0",  4, 0, 2, "num"), (".",  4, 2, 1, "num"),
        ("=",  4, 3, 1, "op"),
    ]

    FONT_SIZES = {"num": 28, "func": 24, "op": 30}
    ROW_OFFSET = 0

    @classmethod
    def build_buttons(cls, frame, calculator, row_offset=0):
        """在指定 frame 中构建基础键盘（科学模式复用）"""
        for text, row, col, colspan, btn_type in cls.BUTTONS:
            if btn_type == "num":
                bg, fg = cls.BG_NUMBER, cls.FG_NUMBER
            elif btn_type == "func":
                bg, fg = cls.BG_FUNC, cls.FG_FUNC
            else:
                bg, fg = cls.BG_OP, cls.FG_OP

            container = tk.Frame(frame, bg="#000000")
            container.grid(row=row + row_offset, column=col, columnspan=colspan,
                          padx=cls.GAP // 2, pady=cls.GAP // 2, sticky="nsew")
            container.grid_rowconfigure(0, weight=1)
            container.grid_columnconfigure(0, weight=1)

            btn = RoundedButton(container, text,
                             corner_radius=22,
                             bg_color=bg, fg_color=fg,
                             font=("Arial", cls.FONT_SIZES[btn_type], "bold"),
                             command=lambda t=text: calculator.on_button_click(t))
            btn.grid(row=0, column=0, sticky="nsew")

    def __init__(self, parent, calculator):
        self.parent = parent
        self.calc = calculator
        self.frame = tk.Frame(parent, bg="#000000")

        for i in range(5):
            self.frame.grid_rowconfigure(i, weight=1, uniform="row")
        for i in range(4):
            self.frame.grid_columnconfigure(i, weight=1, uniform="col")

        self.build_buttons(self.frame, calculator)

    def show(self):
        self.frame.grid(row=0, column=0, sticky="nsew")

    def hide(self):
        self.frame.grid_forget()


# ======================================================================
# 科学模式（表达式输入，与移动端对齐）
# ======================================================================

class ScientificMode:
    """科学模式 - 表达式输入：5 行科学键区 + 基础键盘"""

    GAP = 8

    # 与移动端 SCIENTIFIC_BUTTONS 一致
    SCI_BUTTONS = [
        ("⌫", 0, 0), ("(", 0, 1), (")", 0, 2), ("n!", 0, 3),
        ("π", 1, 0), ("e", 1, 1), ("|x|", 1, 2), ("1/x", 1, 3),
        ("x²", 2, 0), ("x³", 2, 1), ("xʸ", 2, 2), ("√", 2, 3),
        ("∛", 3, 0), ("log", 3, 1), ("ln", 3, 2), ("eˣ", 3, 3),
        ("sin", 4, 0), ("cos", 4, 1), ("tan", 4, 2), ("10ˣ", 4, 3),
    ]

    BG_SCI = "#3A3A3C"
    BG_OP = "#FF9500"

    def __init__(self, parent, calculator):
        self.parent = parent
        self.calc = calculator
        self.frame = tk.Frame(parent, bg="#000000")

        for i in range(11):
            self.frame.grid_rowconfigure(i, weight=1, uniform="row")
        for i in range(4):
            self.frame.grid_columnconfigure(i, weight=1, uniform="col")

        # 科学键区
        for text, row, col in self.SCI_BUTTONS:
            is_op = text in ("⌫", "xʸ")
            container = tk.Frame(self.frame, bg="#000000")
            container.grid(row=row, column=col,
                          padx=self.GAP // 2, pady=self.GAP // 2, sticky="nsew")
            container.grid_rowconfigure(0, weight=1)
            container.grid_columnconfigure(0, weight=1)

            btn = RoundedButton(container, text, corner_radius=22,
                             bg_color=self.BG_OP if is_op else self.BG_SCI,
                             fg_color="#FFFFFF",
                             font=("Arial", 16, "bold"),
                             command=lambda t=text: self.on_sci_button(t))
            btn.grid(row=0, column=0, sticky="nsew")

        # 分隔线（第 5 行）
        sep = tk.Frame(self.frame, bg="#38383A", height=1)
        sep.grid(row=5, column=0, columnspan=4, sticky="ew", padx=8)

        # 基础键盘（第 6-10 行）
        BaseMode.build_buttons(self.frame, calculator, row_offset=6)

    def on_sci_button(self, text):
        if text == "⌫":
            self.calc.expr_backspace()
        elif text in ("(", ")"):
            self.calc.expr_paren(text)
        elif text == "xʸ":
            self.calc.expr_append_operator("^")
            if self.calc.voice_enabled:
                speak_scientific("xʸ")
        else:
            self.calc.expr_scientific(text)

    def show(self):
        self.frame.grid(row=0, column=0, sticky="nsew")

    def hide(self):
        self.frame.grid_forget()


# ======================================================================
# 汇率模式
# ======================================================================

class CurrencyMode:
    """汇率模式 - 实时汇率（10s 超时 + 5 分钟缓存 + 固定汇率降级）"""

    # 固定汇率（API 失败时降级使用，与移动端 FALLBACK_RATES 一致）
    FALLBACK_RATES = {
        "HKD": 7.8, "USD": 1.0, "CNY": 7.25, "JPY": 151.5,
        "EUR": 0.92, "GBP": 0.79, "KRW": 1350.0,
    }

    CURRENCY_NAMES = {
        "HKD": "港币", "USD": "美元", "CNY": "人民币", "JPY": "日元",
        "EUR": "欧元", "GBP": "英镑", "KRW": "韩元",
    }

    CURRENCY_COLORS = {
        "HKD": "#FF9500", "USD": "#007AFF", "CNY": "#FF3B30", "JPY": "#AF52DE",
        "EUR": "#007AFF", "GBP": "#34C759", "KRW": "#FF9500",
    }

    CACHE_DURATION = 300  # 5 分钟缓存
    API_URL = "https://open.er-api.com/v6/latest/USD"

    CARD_BG = "#1C1C1E"
    SURFACE_BG = "#2C2C2E"
    PRIMARY = "#FF9500"
    TEXT_PRIMARY = "#FFFFFF"
    TEXT_SECONDARY = "#8E8E93"
    TEXT_TERTIARY = "#636366"
    SEPARATOR = "#38383A"
    ERROR = "#FF3B30"

    def __init__(self, parent, calculator):
        self.parent = parent
        self.calc = calculator
        self.frame = tk.Frame(parent, bg="#000000")

        self.rates = dict(self.FALLBACK_RATES)
        self._last_fetch = 0.0
        self._fetching = False

        # 主容器（可滚动）
        canvas = tk.Canvas(self.frame, bg="#000000", highlightthickness=0)
        scrollbar = tk.Scrollbar(self.frame, orient="vertical", command=canvas.yview,
                                 bg=self.SURFACE_BG, troughcolor="#000000")
        self.scrollable = tk.Frame(canvas, bg="#000000")
        self.scrollable.bind("<Configure>", lambda e: canvas.configure(
            scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=self.scrollable, anchor="nw", tags="inner")
        canvas.configure(yscrollcommand=scrollbar.set)
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
        canvas.bind("<MouseWheel>", _on_mousewheel)
        canvas.bind("<Button-4>", lambda e: canvas.yview_scroll(-3, "units"))
        canvas.bind("<Button-5>", lambda e: canvas.yview_scroll(3, "units"))

        main = self.scrollable

        # ===== CONVERTER CARD =====
        card = tk.Frame(main, bg=self.CARD_BG)
        card.pack(fill="x", padx=16, pady=(0, 16))
        inner = tk.Frame(card, bg=self.CARD_BG)
        inner.pack(fill="both", expand=True, padx=16, pady=16)

        tk.Label(inner, text="金额", font=("Arial", 11),
                bg=self.CARD_BG, fg=self.TEXT_PRIMARY).pack(anchor="w", pady=(0, 8))

        amount_bg = tk.Frame(inner, bg=self.SURFACE_BG)
        amount_bg.pack(fill="x", pady=(0, 16))
        amount_bg.grid_columnconfigure(0, weight=1)

        self.amount_var = tk.StringVar(value="100")
        self.amount_entry = tk.Entry(amount_bg, textvariable=self.amount_var,
                                     font=("Arial", 24, "bold"), justify="right",
                                     bg=self.SURFACE_BG, fg=self.PRIMARY,
                                     bd=0, highlightthickness=0, relief="flat")
        self.amount_entry.grid(row=0, column=0, sticky="ew", padx=12, pady=12)

        # --- 货币选择器 ---
        sel_row = tk.Frame(inner, bg=self.CARD_BG)
        sel_row.pack(fill="x", pady=(0, 16))

        def _bind_children(widget, callback):
            widget.bind("<Button-1>", callback)
            for child in widget.winfo_children():
                _bind_children(child, callback)

        from_frame = tk.Frame(sel_row, bg=self.CARD_BG)
        from_frame.pack(side="left", fill="x", expand=True)
        tk.Label(from_frame, text="从", font=("Arial", 10),
                bg=self.CARD_BG, fg=self.TEXT_SECONDARY).pack(anchor="w", pady=(0, 6))

        self.from_var = tk.StringVar(value="CNY")
        from_selector = tk.Frame(from_frame, bg=self.SURFACE_BG, cursor="hand2")
        from_selector.pack(fill="x")
        from_inner = tk.Frame(from_selector, bg=self.SURFACE_BG)
        from_inner.pack(fill="x", padx=12, pady=10)
        self.from_dot = tk.Frame(from_inner, bg=self.CURRENCY_COLORS["CNY"],
                                 width=10, height=10)
        self.from_dot.pack(side="left", fill="y", padx=(0, 8))
        self.from_dot.pack_propagate(False)
        self.from_label = tk.Label(from_inner, text="CNY", font=("Arial", 16, "bold"),
                                   bg=self.SURFACE_BG, fg=self.TEXT_PRIMARY)
        self.from_label.pack(side="left")
        tk.Label(from_inner, text="▾", font=("Arial", 10),
                bg=self.SURFACE_BG, fg=self.TEXT_TERTIARY).pack(side="right")
        _bind_children(from_selector, lambda e: self._show_currency_menu("from"))

        swap_frame = tk.Frame(sel_row, bg=self.CARD_BG)
        swap_frame.pack(side="left", padx=12, pady=(24, 0))
        self.swap_btn = RoundedButton(swap_frame, "⇄", corner_radius=22,
                                     bg_color=self.PRIMARY, fg_color="#FFFFFF",
                                     font=("Arial", 14, "bold"),
                                     width=44, height=44,
                                     command=self.swap_currencies)
        self.swap_btn.pack()

        to_frame = tk.Frame(sel_row, bg=self.CARD_BG)
        to_frame.pack(side="left", fill="x", expand=True)
        tk.Label(to_frame, text="到", font=("Arial", 10),
                bg=self.CARD_BG, fg=self.TEXT_SECONDARY).pack(anchor="w", pady=(0, 6))

        self.to_var = tk.StringVar(value="USD")
        to_selector = tk.Frame(to_frame, bg=self.SURFACE_BG, cursor="hand2")
        to_selector.pack(fill="x")
        to_inner = tk.Frame(to_selector, bg=self.SURFACE_BG)
        to_inner.pack(fill="x", padx=12, pady=10)
        self.to_dot = tk.Frame(to_inner, bg=self.CURRENCY_COLORS["USD"],
                               width=10, height=10)
        self.to_dot.pack(side="left", fill="y", padx=(0, 8))
        self.to_dot.pack_propagate(False)
        self.to_label = tk.Label(to_inner, text="USD", font=("Arial", 16, "bold"),
                                 bg=self.SURFACE_BG, fg=self.TEXT_PRIMARY)
        self.to_label.pack(side="left")
        tk.Label(to_inner, text="▾", font=("Arial", 10),
                bg=self.SURFACE_BG, fg=self.TEXT_TERTIARY).pack(side="right")
        _bind_children(to_selector, lambda e: self._show_currency_menu("to"))

        # --- 转换按钮 ---
        convert_frame = tk.Frame(inner, bg=self.CARD_BG)
        convert_frame.pack(fill="x")
        self.convert_btn = RoundedButton(convert_frame, "转换", corner_radius=22,
                                        bg_color=self.PRIMARY, fg_color="#FFFFFF",
                                        font=("Arial", 16, "bold"),
                                        height=50,
                                        command=self.convert)
        self.convert_btn.pack(fill="x")

        # --- 结果显示 ---
        result_frame = tk.Frame(inner, bg=self.CARD_BG)
        result_frame.pack(fill="x", pady=(16, 0))
        self.result_from = tk.Label(result_frame, text="", font=("Arial", 12),
                                    bg=self.CARD_BG, fg=self.TEXT_TERTIARY)
        self.result_from.pack()
        self.result_amount = tk.Label(result_frame, text="",
                                      font=("Arial", 28, "bold"), bg=self.CARD_BG,
                                      fg=self.PRIMARY)
        self.result_amount.pack()
        self.result_currency = tk.Label(result_frame, text="",
                                        font=("Arial", 12), bg=self.CARD_BG,
                                        fg=self.TEXT_SECONDARY)
        self.result_currency.pack()

        # ===== RATES LIST =====
        rates_header = tk.Frame(main, bg="#000000")
        rates_header.pack(fill="x", padx=16, pady=(0, 8))
        tk.Label(rates_header, text="当前汇率", font=("Arial", 17, "bold"),
                bg="#000000", fg=self.TEXT_PRIMARY).pack(side="left")
        self.source_label = tk.Label(rates_header, text="  预设汇率", font=("Arial", 11),
                bg="#000000", fg=self.TEXT_SECONDARY)
        self.source_label.pack(side="left", pady=(4, 0))

        self.rates_card = tk.Frame(main, bg=self.CARD_BG)
        self.rates_card.pack(fill="x", padx=16, pady=(0, 16))
        self._build_rates_list()

        tk.Frame(main, bg="#000000", height=20).pack(fill="x")

        self.amount_entry.bind("<Return>", lambda e: self.convert())

    def _build_rates_list(self):
        for widget in self.rates_card.winfo_children():
            widget.destroy()
        codes = sorted(c for c in self.rates if c != "USD")
        for i, code in enumerate(codes):
            rate = self.rates[code]
            name = self.CURRENCY_NAMES.get(code, "")
            color = self.CURRENCY_COLORS.get(code, self.PRIMARY)

            item = tk.Frame(self.rates_card, bg=self.CARD_BG)
            item.pack(fill="x", padx=0, pady=0)

            if i > 0:
                sep = tk.Frame(item, bg=self.SEPARATOR, height=1)
                sep.pack(fill="x")

            row = tk.Frame(item, bg=self.CARD_BG)
            row.pack(fill="x", padx=16, pady=12)

            left = tk.Frame(row, bg=self.CARD_BG)
            left.pack(side="left")

            dot = tk.Frame(left, bg=color, width=8, height=8)
            dot.pack(side="left", padx=(0, 8), pady=(6, 0))
            dot.pack_propagate(False)

            text_col = tk.Frame(left, bg=self.CARD_BG)
            text_col.pack(side="left")
            tk.Label(text_col, text=code, font=("Arial", 15, "bold"),
                    bg=self.CARD_BG, fg=self.TEXT_PRIMARY).pack(anchor="w")
            tk.Label(text_col, text=name, font=("Arial", 10),
                    bg=self.CARD_BG, fg=self.TEXT_SECONDARY).pack(anchor="w")

            rate_text = f"{rate:.2f}" if rate != int(rate) else str(int(rate))
            tk.Label(row, text=rate_text, font=("Arial", 16, "bold"),
                    bg=self.CARD_BG, fg=self.TEXT_PRIMARY).pack(side="right")

    def _show_currency_menu(self, target):
        var = self.from_var if target == "from" else self.to_var
        label = self.from_label if target == "from" else self.to_label
        dot = self.from_dot if target == "from" else self.to_dot

        menu = tk.Menu(self.frame, tearoff=0, bg=self.SURFACE_BG, fg=self.TEXT_PRIMARY,
                       activebackground=self.SURFACE_BG, activeforeground=self.PRIMARY,
                       font=("Arial", 14), bd=0, relief="flat")
        menu.configure(activeborderwidth=0, borderwidth=0)

        for code in self.rates:
            name = self.CURRENCY_NAMES.get(code, "")
            menu.add_command(
                label=f"  {code}    {name}",
                command=lambda c=code, v=var, l=label, d=dot: self._set_currency(v, c, l, d)
            )

        x = self.calc.window.winfo_x() + 60
        y = self.calc.window.winfo_y() + 200
        menu.post(x, y)

    def _set_currency(self, var, code, label, dot):
        var.set(code)
        label.config(text=code)
        dot.config(bg=self.CURRENCY_COLORS.get(code, self.PRIMARY))
        self.convert()

    def show(self):
        self.frame.grid(row=0, column=0, sticky="nsew")
        if time.time() - self._last_fetch > self.CACHE_DURATION:
            self._fetch_rates()

    def hide(self):
        self.frame.grid_forget()

    def _fetch_rates(self):
        """后台线程获取实时汇率，10 秒超时，失败保持现有汇率"""
        if self._fetching:
            return
        self._fetching = True
        self._last_fetch = time.time()

        def worker():
            try:
                req = urllib.request.Request(
                    self.API_URL, headers={"User-Agent": "calculator/1.0"}
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                api_rates = data.get("rates") or {}
                new_rates = {
                    code: float(api_rates[code])
                    for code in self.rates
                    if code in api_rates
                }
                if new_rates:
                    self.frame.after(0, lambda: self._on_rates_updated(new_rates, True))
            except Exception:
                self.frame.after(0, lambda: self._on_rates_updated({}, False))

        threading.Thread(target=worker, daemon=True).start()

    def _on_rates_updated(self, new_rates, success):
        self._fetching = False
        if success:
            self.rates.update(new_rates)
            self.source_label.config(text="  实时汇率（USD 基准）")
            self._build_rates_list()
            self.convert()
        else:
            self.source_label.config(text="  获取失败，使用预设汇率")

    def swap_currencies(self):
        from_val = self.from_var.get()
        to_val = self.to_var.get()
        from_color = self.from_dot.cget("bg")
        to_color = self.to_dot.cget("bg")

        self.from_var.set(to_val)
        self.to_var.set(from_val)
        self.from_label.config(text=to_val)
        self.to_label.config(text=from_val)
        self.from_dot.config(bg=to_color)
        self.to_dot.config(bg=from_color)
        self.convert()

    def convert(self):
        try:
            amount_text = self.amount_var.get().strip()
            if not amount_text:
                raise ValueError("empty")

            amount = float(amount_text)
            from_curr = self.from_var.get()
            to_curr = self.to_var.get()

            result = amount * (self.rates[to_curr] / self.rates[from_curr])
            result_text = f"{int(result)}" if result.is_integer() else f"{result:.4f}"

            from_name = self.CURRENCY_NAMES.get(from_curr, "")
            to_name = self.CURRENCY_NAMES.get(to_curr, "")

            self.result_from.config(text=f"{amount} {from_curr} ({from_name})")
            self.result_amount.config(text=result_text)
            self.result_currency.config(text=f"{to_curr} ({to_name})")
        except (ValueError, KeyError, ZeroDivisionError):
            self.result_from.config(text="")
            self.result_amount.config(text="")
            self.result_currency.config(text="")


# ======================================================================
# 单位换算模式（与移动端 units.ts 对齐）
# ======================================================================

class UnitMode:
    """单位换算 - 长度 / 重量 / 温度"""

    # 基准单位：长度 = 米，重量 = 克
    LINEAR_UNITS = {
        "长度": {
            "m": ("米", 1), "km": ("千米", 1000), "cm": ("厘米", 0.01),
            "mm": ("毫米", 0.001), "mi": ("英里", 1609.344),
            "ft": ("英尺", 0.3048), "in": ("英寸", 0.0254),
        },
        "重量": {
            "kg": ("千克", 1000), "g": ("克", 1), "mg": ("毫克", 0.001),
            "lb": ("磅", 453.59237), "oz": ("盎司", 28.349523125),
        },
    }

    TEMPERATURE_UNITS = {"C": "摄氏度", "F": "华氏度", "K": "开尔文"}

    CATEGORIES = ["长度", "重量", "温度"]

    CARD_BG = "#1C1C1E"
    SURFACE_BG = "#2C2C2E"
    PRIMARY = "#FF9500"
    TEXT_PRIMARY = "#FFFFFF"
    TEXT_SECONDARY = "#8E8E93"
    TEXT_TERTIARY = "#636366"

    def __init__(self, parent, calculator):
        self.parent = parent
        self.calc = calculator
        self.frame = tk.Frame(parent, bg="#000000")

        main = tk.Frame(self.frame, bg="#000000")
        main.pack(fill="both", expand=True, padx=16, pady=(0, 16))

        # ===== 分类切换 =====
        cat_row = tk.Frame(main, bg=self.SURFACE_BG)
        cat_row.pack(fill="x", pady=(0, 16))
        self.category_buttons = {}
        for cat in self.CATEGORIES:
            container = tk.Frame(cat_row, bg=self.SURFACE_BG)
            container.pack(side="left", fill="x", expand=True, padx=2, pady=2)
            btn = RoundedButton(container, cat, corner_radius=8,
                               bg_color=self.SURFACE_BG, fg_color=self.TEXT_SECONDARY,
                               font=("Arial", 14, "bold"), height=40,
                               command=lambda c=cat: self.set_category(c))
            btn.pack(fill="x")
            self.category_buttons[cat] = btn

        # ===== 换算卡片 =====
        card = tk.Frame(main, bg=self.CARD_BG)
        card.pack(fill="x")
        inner = tk.Frame(card, bg=self.CARD_BG)
        inner.pack(fill="both", expand=True, padx=16, pady=16)

        tk.Label(inner, text="数值", font=("Arial", 11),
                bg=self.CARD_BG, fg=self.TEXT_PRIMARY).pack(anchor="w", pady=(0, 8))

        amount_bg = tk.Frame(inner, bg=self.SURFACE_BG)
        amount_bg.pack(fill="x", pady=(0, 16))
        amount_bg.grid_columnconfigure(0, weight=1)

        self.amount_var = tk.StringVar(value="1")
        self.amount_entry = tk.Entry(amount_bg, textvariable=self.amount_var,
                                     font=("Arial", 24, "bold"), justify="right",
                                     bg=self.SURFACE_BG, fg=self.PRIMARY,
                                     bd=0, highlightthickness=0, relief="flat")
        self.amount_entry.grid(row=0, column=0, sticky="ew", padx=12, pady=12)

        # --- 单位选择器 ---
        sel_row = tk.Frame(inner, bg=self.CARD_BG)
        sel_row.pack(fill="x", pady=(0, 8))

        def _bind_children(widget, callback):
            widget.bind("<Button-1>", callback)
            for child in widget.winfo_children():
                _bind_children(child, callback)

        from_frame = tk.Frame(sel_row, bg=self.CARD_BG)
        from_frame.pack(side="left", fill="x", expand=True)
        tk.Label(from_frame, text="从", font=("Arial", 10),
                bg=self.CARD_BG, fg=self.TEXT_SECONDARY).pack(anchor="w", pady=(0, 6))

        from_selector = tk.Frame(from_frame, bg=self.SURFACE_BG, cursor="hand2")
        from_selector.pack(fill="x")
        from_inner = tk.Frame(from_selector, bg=self.SURFACE_BG)
        from_inner.pack(fill="x", padx=12, pady=10)
        self.from_label = tk.Label(from_inner, text="米", font=("Arial", 16, "bold"),
                                   bg=self.SURFACE_BG, fg=self.TEXT_PRIMARY)
        self.from_label.pack(side="left")
        tk.Label(from_inner, text="▾", font=("Arial", 10),
                bg=self.SURFACE_BG, fg=self.TEXT_TERTIARY).pack(side="right")
        _bind_children(from_selector, lambda e: self._show_unit_menu("from"))

        swap_frame = tk.Frame(sel_row, bg=self.CARD_BG)
        swap_frame.pack(side="left", padx=12, pady=(24, 0))
        self.swap_btn = RoundedButton(swap_frame, "⇄", corner_radius=22,
                                     bg_color=self.PRIMARY, fg_color="#FFFFFF",
                                     font=("Arial", 14, "bold"),
                                     width=44, height=44,
                                     command=self.swap_units)
        self.swap_btn.pack()

        to_frame = tk.Frame(sel_row, bg=self.CARD_BG)
        to_frame.pack(side="left", fill="x", expand=True)
        tk.Label(to_frame, text="到", font=("Arial", 10),
                bg=self.CARD_BG, fg=self.TEXT_SECONDARY).pack(anchor="w", pady=(0, 6))

        to_selector = tk.Frame(to_frame, bg=self.SURFACE_BG, cursor="hand2")
        to_selector.pack(fill="x")
        to_inner = tk.Frame(to_selector, bg=self.SURFACE_BG)
        to_inner.pack(fill="x", padx=12, pady=10)
        self.to_label = tk.Label(to_inner, text="千米", font=("Arial", 16, "bold"),
                                 bg=self.SURFACE_BG, fg=self.TEXT_PRIMARY)
        self.to_label.pack(side="left")
        tk.Label(to_inner, text="▾", font=("Arial", 10),
                bg=self.SURFACE_BG, fg=self.TEXT_TERTIARY).pack(side="right")
        _bind_children(to_selector, lambda e: self._show_unit_menu("to"))

        # --- 结果显示 ---
        result_frame = tk.Frame(inner, bg=self.CARD_BG)
        result_frame.pack(fill="x", pady=(16, 0))
        self.result_from = tk.Label(result_frame, text="", font=("Arial", 12),
                                    bg=self.CARD_BG, fg=self.TEXT_TERTIARY)
        self.result_from.pack()
        self.result_amount = tk.Label(result_frame, text="",
                                      font=("Arial", 28, "bold"), bg=self.CARD_BG,
                                      fg=self.PRIMARY)
        self.result_amount.pack()
        self.result_unit = tk.Label(result_frame, text="",
                                    font=("Arial", 12), bg=self.CARD_BG,
                                    fg=self.TEXT_SECONDARY)
        self.result_unit.pack()

        self.amount_entry.bind("<Return>", lambda e: self.convert())
        self.amount_entry.bind("<KeyRelease>", lambda e: self.convert())

        # 默认分类
        self.category = "长度"
        self.from_unit = "m"
        self.to_unit = "km"
        self._refresh_category_buttons()
        self.convert()

    def get_units(self, category):
        """返回 [(code, name), ...]"""
        if category == "温度":
            return list(self.TEMPERATURE_UNITS.items())
        return list(self.LINEAR_UNITS[category].items())

    def get_unit_name(self, category, code):
        if category == "温度":
            return self.TEMPERATURE_UNITS.get(code, code)
        return self.LINEAR_UNITS[category].get(code, (code, 1))[0]

    def set_category(self, category):
        self.category = category
        units = self.get_units(category)
        self.from_unit = units[0][0]
        self.to_unit = units[1][0] if len(units) > 1 else units[0][0]
        self.from_label.config(text=units[0][1])
        self.to_label.config(text=self.get_unit_name(category, self.to_unit))
        self._refresh_category_buttons()
        self.convert()

    def _refresh_category_buttons(self):
        for cat, btn in self.category_buttons.items():
            active = cat == self.category
            btn.bg_color = self.PRIMARY if active else self.SURFACE_BG
            btn.fg_color = "#FFFFFF" if active else self.TEXT_SECONDARY
            btn._draw(btn.winfo_width(), btn.winfo_height())

    def _show_unit_menu(self, target):
        label = self.from_label if target == "from" else self.to_label

        menu = tk.Menu(self.frame, tearoff=0, bg=self.SURFACE_BG, fg=self.TEXT_PRIMARY,
                       activebackground=self.SURFACE_BG, activeforeground=self.PRIMARY,
                       font=("Arial", 14), bd=0, relief="flat")
        menu.configure(activeborderwidth=0, borderwidth=0)

        for code, name in self.get_units(self.category):
            menu.add_command(
                label=f"  {name}（{code}）",
                command=lambda c=code, n=name, t=target, l=label: self._set_unit(t, c, n, l)
            )

        x = self.calc.window.winfo_x() + 60
        y = self.calc.window.winfo_y() + 240
        menu.post(x, y)

    def _set_unit(self, target, code, name, label):
        if target == "from":
            self.from_unit = code
        else:
            self.to_unit = code
        label.config(text=name)
        self.convert()

    def swap_units(self):
        self.from_unit, self.to_unit = self.to_unit, self.from_unit
        self.from_label.config(text=self.get_unit_name(self.category, self.from_unit))
        self.to_label.config(text=self.get_unit_name(self.category, self.to_unit))
        self.convert()

    @staticmethod
    def convert_temperature(value, from_unit, to_unit):
        if from_unit == "C":
            celsius = value
        elif from_unit == "F":
            celsius = (value - 32) * 5 / 9
        else:
            celsius = value - 273.15

        if to_unit == "C":
            out = celsius
        elif to_unit == "F":
            out = celsius * 9 / 5 + 32
        else:
            out = celsius + 273.15
        return round(out, 6)

    def convert(self):
        try:
            amount_text = self.amount_var.get().strip()
            if not amount_text:
                raise ValueError("empty")
            value = float(amount_text)

            if self.category == "温度":
                result = self.convert_temperature(value, self.from_unit, self.to_unit)
            else:
                units = self.LINEAR_UNITS[self.category]
                result = round(value * units[self.from_unit][1] / units[self.to_unit][1], 6)

            result_text = f"{int(result)}" if float(result).is_integer() else str(result)

            self.result_from.config(
                text=f"{amount_text} {self.get_unit_name(self.category, self.from_unit)}")
            self.result_amount.config(text=result_text)
            self.result_unit.config(text=self.get_unit_name(self.category, self.to_unit))
        except (ValueError, KeyError, ZeroDivisionError):
            self.result_from.config(text="")
            self.result_amount.config(text="")
            self.result_unit.config(text="")

    def show(self):
        self.frame.grid(row=0, column=0, sticky="nsew")

    def hide(self):
        self.frame.grid_forget()


# ======================================================================
# 历史记录模式
# ======================================================================

class HistoryMode:
    """历史记录模式 - 表达式 + 时间戳"""

    def __init__(self, parent, calculator):
        self.parent = parent
        self.calc = calculator
        self.frame = tk.Frame(parent, bg="#000000")

        title_frame = tk.Frame(self.frame, bg="#000000")
        title_frame.pack(fill="x", padx=20, pady=(15, 10))

        tk.Label(title_frame, text="计算历史", font=("Arial", 16, "bold"),
                bg="#000000", fg="#FFFFFF").pack(side="left")

        self.stats_var = tk.StringVar(value="共 0 条记录")
        tk.Label(title_frame, textvariable=self.stats_var,
                font=("Arial", 11), bg="#000000", fg="#AAAAAA").pack(side="right")

        list_frame = tk.Frame(self.frame, bg="#000000")
        list_frame.pack(fill="both", expand=True, padx=20, pady=5)

        scrollbar = tk.Scrollbar(list_frame, bg="#333333", troughcolor="#1C1C1E")
        scrollbar.pack(side="right", fill="y")

        self.history_listbox = tk.Listbox(list_frame, font=("Arial", 13),
                                          height=20,
                                          yscrollcommand=scrollbar.set,
                                          bg="#1C1C1E", fg="#FFFFFF",
                                          selectbackground="#FF9500",
                                          selectforeground="#FFFFFF",
                                          relief="flat", highlightthickness=0)
        self.history_listbox.pack(fill="both", expand=True)
        scrollbar.config(command=self.history_listbox.yview)

        self.history_listbox.bind("<Double-Button-1>", self.use_history_item)

        btn_frame = tk.Frame(self.frame, bg="#000000")
        btn_frame.pack(fill="x", padx=20, pady=(10, 20))

        use_container = tk.Frame(btn_frame, bg="#000000")
        use_container.pack(side="left", padx=(0, 20))
        use_btn = RoundedButton(use_container, "使用", corner_radius=22,
                             bg_color="#FF9500", fg_color="#FFFFFF",
                             font=("Arial", 12, "bold"),
                             command=self.use_selected_value)
        use_btn.pack()

        clear_container = tk.Frame(btn_frame, bg="#000000")
        clear_container.pack(side="left")
        clear_btn = RoundedButton(clear_container, "清空", corner_radius=22,
                               bg_color="#333333", fg_color="#FFFFFF",
                               font=("Arial", 12, "bold"),
                               command=self.clear_all_history)
        clear_btn.pack()

        tk.Label(self.frame, text="提示: 双击记录可将结果值用于计算",
                font=("Arial", 10), bg="#000000", fg="#666666").pack(pady=(0, 15))

    @staticmethod
    def _format_timestamp(ts):
        entry_time = time.localtime(ts)
        now = time.localtime()
        hm = time.strftime("%H:%M", entry_time)
        if (entry_time.tm_year, entry_time.tm_mon, entry_time.tm_mday) == \
                (now.tm_year, now.tm_mon, now.tm_mday):
            return hm
        return time.strftime("%m-%d ", entry_time) + hm

    def show(self):
        self.frame.grid(row=0, column=0, sticky="nsew")
        self.refresh_history()

    def hide(self):
        self.frame.grid_forget()

    def refresh_history(self):
        self.history_listbox.delete(0, "end")
        for entry in self.calc.history:
            time_text = self._format_timestamp(entry["ts"])
            self.history_listbox.insert("end", f'{entry["expr"]}    {time_text}')
        self.stats_var.set(f"共 {len(self.calc.history)} 条记录")

    def use_history_item(self, event=None):
        selection = self.history_listbox.curselection()
        if selection:
            entry = self.calc.history[selection[0]]
            self.calc.restore_value(entry["result"])
            self.calc.switch_to_calc_mode()

    def use_selected_value(self):
        self.use_history_item()

    def clear_all_history(self):
        if self.calc.history:
            if messagebox.askyesno("确认", "确定要清空所有历史记录吗？"):
                self.calc.clear_history()
                self.refresh_history()


# ======================================================================
# 计算器主类
# ======================================================================

class Calculator:
    # 科学函数包裹映射（与移动端 WRAP_FUNCS 一致）
    WRAP_FUNCS = {
        "sin": "sin", "cos": "cos", "tan": "tan", "log": "log", "ln": "ln",
        "√": "sqrt", "∛": "cbrt", "|x|": "abs", "eˣ": "exp", "10ˣ": "pow10",
    }
    # 后缀追加映射（与移动端 APPEND_OPS 一致）
    APPEND_OPS = {"x²": "^2", "x³": "^3", "n!": "!"}
    # 智能退格的函数 token
    FUNC_TOKENS = ("pow10(", "sqrt(", "cbrt(", "sin(", "cos(", "tan(",
                   "log(", "ln(", "abs(", "exp(")

    def __init__(self):
        self.window = tk.Tk()
        self.window.title("计算器")
        self.window.geometry("480x750")
        self.window.resizable(False, False)
        self.window.configure(bg="#000000")

        # 历史记录 [{"expr", "result", "ts"}]
        self.history = []

        # 基础模式状态
        self.current_input = "0"
        self.previous_input = ""
        self.operation = ""
        self.should_reset_display = False
        self.last_operation = ""   # 重复等号
        self.last_operand = ""

        # 科学模式状态（表达式输入）
        self.expression = ""
        self.expr_result = None
        self.angle_mode = "DEG"

        # 语音开关
        self.voice_enabled = True

        # 当前模式 (基础/科学/汇率/单位/历史)
        self.current_mode = "基础"
        self.calc_mode = "基础"
        self.modes = {}

        self._create_ui()
        self._bind_keyboard()

    # ---------------- UI 构建 ----------------

    def _create_ui(self):
        top_frame = tk.Frame(self.window, bg="#000000")
        top_frame.grid(row=0, column=0, columnspan=4, sticky="nsew", padx=8, pady=(8, 4))

        # 图标按钮区域
        icon_frame = tk.Frame(top_frame, bg="#000000")
        icon_frame.pack(fill="x", pady=(0, 5))

        # 左侧：历史 + DEG/RAD
        left_group = tk.Frame(icon_frame, bg="#000000")
        left_group.pack(side="left")

        history_container = tk.Frame(left_group, bg="#000000")
        history_container.pack(side="left")
        history_btn = RoundedButton(history_container, "📋", corner_radius=22,
                                 bg_color="#333333", fg_color="#FFFFFF",
                                 font=("Arial", 14),
                                 width=44, height=44,
                                 command=self.show_history_mode)
        history_btn.pack()

        self.angle_btn = RoundedButton(left_group, "DEG", corner_radius=22,
                                 bg_color="#000000", fg_color="#8E8E93",
                                 font=("Arial", 12, "bold"),
                                 width=52, height=44,
                                 command=self.toggle_angle)

        # 中间：模式标签
        self.mode_label = tk.Label(icon_frame, text="基础模式", font=("Arial", 14, "bold"),
                                   bg="#000000", fg="#FFFFFF")
        self.mode_label.pack(side="left", padx=(15, 0))

        # 右侧：语音开关 + 菜单
        right_group = tk.Frame(icon_frame, bg="#000000")
        right_group.pack(side="right")

        self.voice_btn = RoundedButton(right_group, "🔊", corner_radius=22,
                              bg_color="#333333", fg_color="#FFFFFF",
                              font=("Arial", 14),
                              width=44, height=44,
                              command=self.toggle_voice)
        self.voice_btn.pack(side="left", padx=(0, 8))

        menu_container = tk.Frame(right_group, bg="#000000")
        menu_container.pack(side="left")
        menu_btn = RoundedButton(menu_container, "☰", corner_radius=22,
                              bg_color="#333333", fg_color="#FFFFFF",
                              font=("Arial", 14, "bold"),
                              width=44, height=44,
                              command=self.show_mode_selector)
        menu_btn.pack()

        # 表达式预览行（小字，右对齐）
        self.preview_var = tk.StringVar(value=" ")
        self.preview_label = tk.Label(top_frame, textvariable=self.preview_var,
                          font=("Arial", 18), justify="right",
                          bg="#000000", fg="#8E8E93", anchor="e")
        self.preview_label.pack(fill="x")

        # 显示屏
        self.display_var = tk.StringVar(value="0")
        self.display = tk.Entry(top_frame, textvariable=self.display_var,
                          font=("Arial", 44, "bold"), justify="right",
                          state="readonly", bg="#000000", fg="#FFFFFF",
                          readonlybackground="#000000",
                          highlightthickness=0, bd=0)
        self.display.pack(fill="x", pady=(0, 10))

        # 内容区域
        self.content_frame = tk.Frame(self.window, bg="#000000")
        self.content_frame.grid(row=1, column=0, columnspan=4, sticky="nsew", padx=8, pady=4)
        self.content_frame.grid_rowconfigure(0, weight=1)
        self.content_frame.grid_columnconfigure(0, weight=1)

        # 创建五种模式
        self.modes["基础"] = BaseMode(self.content_frame, self)
        self.modes["科学"] = ScientificMode(self.content_frame, self)
        self.modes["汇率"] = CurrencyMode(self.content_frame, self)
        self.modes["单位"] = UnitMode(self.content_frame, self)
        self.modes["历史"] = HistoryMode(self.content_frame, self)

        self.modes["基础"].show()

        self.window.grid_rowconfigure(0, weight=0)
        self.window.grid_rowconfigure(1, weight=1)
        for i in range(4):
            self.window.grid_columnconfigure(i, weight=1)

    # ---------------- 键盘绑定 ----------------

    def _bind_keyboard(self):
        self.window.bind("<Key>", self._on_key)
        self.window.bind("<Control-c>", lambda e: self.copy_display())
        self.window.protocol("WM_DELETE_WINDOW", self._on_close)

    def _on_close(self):
        stop_speech()
        self.window.destroy()

    def _on_key(self, event):
        """物理键盘输入（对齐移动端手势与按键能力）"""
        focused = self.window.focus_get()
        if isinstance(focused, tk.Entry) and focused is not self.display:
            return  # 汇率/单位输入框自行处理
        if self.current_mode not in ("基础", "科学"):
            return

        keysym = event.keysym
        ch = event.char

        if ch and ch.isdigit():
            self.on_button_click(ch)
        elif ch == ".":
            self.on_button_click(".")
        elif ch in "+-":
            self.on_button_click(ch)
        elif ch in ("*", "x", "X"):
            self.on_button_click("×")
        elif ch == "/":
            self.on_button_click("÷")
        elif keysym in ("Return", "equal"):
            self.on_button_click("=")
        elif keysym == "BackSpace":
            self.on_button_click("⌫")
        elif keysym == "Escape":
            self.on_button_click("C")
        elif ch == "%":
            self.on_button_click("%")
        elif self.current_mode == "科学":
            if ch == "(":
                self.expr_paren("(")
            elif ch == ")":
                self.expr_paren(")")
            elif ch == "^":
                self.expr_append_operator("^")
            elif ch == "!":
                self.expr_scientific("n!")

    def copy_display(self):
        """Ctrl+C 复制显示内容（对齐移动端长按复制）"""
        self.window.clipboard_clear()
        self.window.clipboard_append(self.display_var.get())

    # ---------------- 模式切换 ----------------

    def show_history_mode(self):
        if self.current_mode != "历史":
            if self.current_mode in ("基础", "科学", "汇率", "单位"):
                self.calc_mode = self.current_mode
            self.modes[self.current_mode].hide()
            self.display.pack_forget()
            self.preview_label.pack_forget()
            self.modes["历史"].show()
            self.current_mode = "历史"
            self.mode_label.config(text="历史记录")
            self.window.geometry("480x650")

    def switch_to_calc_mode(self):
        if self.current_mode == "历史":
            self.modes["历史"].hide()
            target_mode = self.calc_mode if self.calc_mode in ("基础", "科学", "汇率", "单位") else "基础"
            self._show_calc_mode(target_mode)

    def _show_calc_mode(self, mode):
        self.modes[mode].show()
        self.current_mode = mode
        self.mode_label.config(text=f"{mode}模式" if mode in ("基础", "科学") else mode)
        self._update_angle_button()
        self._update_display_visibility(mode)
        self.update_display()
        self.window.geometry("480x880" if mode == "科学" else "480x750")

    def _update_display_visibility(self, mode):
        if mode in ("汇率", "单位"):
            self.display.pack_forget()
            self.preview_label.pack_forget()
        else:
            if not self.preview_label.winfo_ismapped():
                self.preview_label.pack(fill="x")
            if not self.display.winfo_ismapped():
                self.display.pack(fill="x", pady=(0, 10))

    def _update_angle_button(self):
        if self.current_mode == "科学":
            self.angle_btn.pack(side="left", padx=(8, 0))
        else:
            self.angle_btn.pack_forget()

    def show_mode_selector(self):
        if self.current_mode == "历史":
            self.switch_to_calc_mode()
            return

        popup = tk.Toplevel(self.window)
        popup.withdraw()  # 先隐藏，定位完成后再显示，避免屏幕中央闪现
        popup.title("选择计算模式")
        popup.resizable(False, False)
        popup.transient(self.window)
        popup.configure(bg="#1C1C1E")

        main_frame = tk.Frame(popup, bg="#1C1C1E", padx=25, pady=20)
        main_frame.pack(fill="both", expand=True)

        title_frame = tk.Frame(main_frame, bg="#1C1C1E")
        title_frame.pack(fill="x")

        tk.Label(title_frame, text="⚙️", font=("Arial", 16),
                bg="#1C1C1E", fg="#FF9500").pack(side="left")
        tk.Label(title_frame, text="选择计算器模式", font=("Arial", 16, "bold"),
                bg="#1C1C1E", fg="#FFFFFF").pack(side="left")
        tk.Label(main_frame, text="请选择您需要的计算功能",
                font=("Arial", 11), bg="#1C1C1E", fg="#AAAAAA").pack(anchor="w", pady=(5, 20))

        modes_frame = tk.Frame(main_frame, bg="#1C1C1E")
        modes_frame.pack(fill="x", pady=10)

        modes = [
            ("基础", "标准计算器", "➕", "标准四则运算"),
            ("科学", "科学计算器", "🔬", "表达式、三角函数、对数"),
            ("汇率", "汇率转换", "💱", "多币种实时汇率"),
            ("单位", "单位换算", "📏", "长度、重量、温度"),
        ]

        for mode_name, title, icon, desc in modes:
            is_current = mode_name == self.current_mode
            card_bg = "#FF9500" if is_current else "#2C2C2E"
            desc_fg = "#FFFFFF" if is_current else "#AAAAAA"

            btn_outer = tk.Frame(modes_frame, bg=card_bg, padx=2, pady=2)
            btn_outer.pack(fill="x", pady=6)

            btn_inner = tk.Frame(btn_outer, bg=card_bg, padx=15, pady=12)
            btn_inner.pack(fill="x")

            icon_label = tk.Label(btn_inner, text=icon, font=("Arial", 20),
                                  bg=card_bg, fg="#FFFFFF")
            icon_label.pack(side="left")

            text_frame = tk.Frame(btn_inner, bg=card_bg)
            text_frame.pack(side="left", padx=(8, 0))

            title_label = tk.Label(text_frame, text=title, font=("Arial", 13, "bold"),
                                   bg=card_bg, fg="#FFFFFF")
            title_label.pack(anchor="w")

            desc_label = tk.Label(text_frame, text=desc, font=("Arial", 10),
                                  bg=card_bg, fg=desc_fg)
            desc_label.pack(anchor="w")

            check_label = None
            if is_current:
                check_label = tk.Label(btn_inner, text="✓", font=("Arial", 18, "bold"),
                                       bg="#FF9500", fg="white")
                check_label.pack(side="right")

            card_widgets = [btn_inner, btn_outer, text_frame, icon_label, title_label, desc_label]
            if check_label:
                card_widgets.append(check_label)

            cmd = lambda e, m=mode_name: (self.switch_mode(m), popup.destroy())
            on_enter = lambda e, f=btn_inner, o=btn_outer, ic=is_current: self._on_mode_btn_hover(f, o, ic)
            on_leave = lambda e, f=btn_inner, o=btn_outer, ic=is_current: self._on_mode_btn_leave(f, o, ic)

            for widget in card_widgets:
                widget.bind("<Button-1>", cmd)
                widget.bind("<Enter>", on_enter)
                widget.bind("<Leave>", on_leave)

        close_btn = tk.Button(main_frame, text="关闭", font=("Arial", 11),
                             bg="#333333", fg="#FFFFFF", width=12, height=1,
                             command=popup.destroy, cursor="hand2", relief="flat",
                             bd=0, highlightthickness=0)
        close_btn.pack(pady=(20, 10))

        # 隐藏状态下 winfo_width/height 不可靠，用固定尺寸计算居中位置
        x = self.window.winfo_x() + (self.window.winfo_width() - 320) // 2
        y = self.window.winfo_y() + (self.window.winfo_height() - 480) // 2
        popup.geometry(f"320x480+{x}+{y}")
        popup.deiconify()  # 定位完成后直接显示在应用窗口中心
        popup.grab_set()

    def _set_card_bg(self, widget, color):
        try:
            widget.config(bg=color)
        except tk.TclError:
            pass
        for child in widget.winfo_children():
            self._set_card_bg(child, color)

    def _on_mode_btn_hover(self, frame, outer, is_current):
        if not is_current:
            outer.config(bg="#FF9500")
            self._set_card_bg(frame, "#3A3A3C")

    def _on_mode_btn_leave(self, frame, outer, is_current):
        if not is_current:
            outer.config(bg="#2C2C2E")
            self._set_card_bg(frame, "#2C2C2E")

    def switch_mode(self, new_mode):
        if new_mode != self.current_mode:
            self.modes[self.current_mode].hide()
            self.calc_mode = new_mode
            self._show_calc_mode(new_mode)

    # ---------------- 语音 / 角度 ----------------

    def toggle_voice(self):
        self.voice_enabled = not self.voice_enabled
        self.voice_btn.set_text("🔊" if self.voice_enabled else "🔇")
        if not self.voice_enabled:
            stop_speech()

    def toggle_angle(self):
        self.angle_mode = "RAD" if self.angle_mode == "DEG" else "DEG"
        self.angle_btn.set_text(self.angle_mode)
        if self.voice_enabled:
            speak_scientific(self.angle_mode)
        self.update_display()

    # ---------------- 按钮分发 ----------------

    def on_button_click(self, value):
        if self.current_mode == "科学":
            self._on_scientific_button(value)
            return

        if value.isdigit() or value == ".":
            self.input_number(value)
        elif value in ("+", "-", "×", "÷", "^"):
            if self.voice_enabled:
                speak_operator(value)
            self.input_operation(value)
        elif value == "=":
            if self.voice_enabled:
                speak_operator("=")
            self.calculate_result()
        elif value == "C":
            self.clear_all()
        elif value == "±":
            self.toggle_sign()
        elif value == "%":
            if self.voice_enabled:
                speak_operator("%")
            self.percentage()
        elif value == "⌫":
            if self.voice_enabled:
                speak_scientific("⌫")
            self.backspace()

    # ---------------- 基础模式逻辑 ----------------

    def input_number(self, num):
        if self.should_reset_display:
            self.current_input = "0"
            self.should_reset_display = False

        if num == ".":
            if "." not in self.current_input:
                self.current_input += "."
        else:
            if self.current_input == "0":
                self.current_input = num
            else:
                digits = self.current_input.replace("-", "").replace(".", "")
                if len(digits) >= MAX_INPUT_LENGTH:
                    self.update_display()
                    return
                self.current_input += num

        if self.voice_enabled:
            speak_digit(num)
        self.update_display()

    def input_operation(self, op):
        if self.operation and not self.should_reset_display:
            self._compute(a=self.previous_input, op=self.operation, b=self.current_input,
                          add_history=False)
            if self.current_input == "错误":
                self.update_display()
                return

        self.previous_input = self.current_input
        self.operation = op
        self.should_reset_display = True
        self.update_display()

    def calculate_result(self):
        """等号：支持重复等号（对齐移动端）"""
        if self.operation and self.previous_input:
            a, op, b = self.previous_input, self.operation, self.current_input
        elif self.last_operation and self.last_operand:
            a, op, b = self.current_input, self.last_operation, self.last_operand
        else:
            return

        result = self._compute(a=a, op=op, b=b, add_history=True)
        if result is not None:
            self.last_operation = op
            self.last_operand = b
        self.update_display()

    def _compute(self, a, op, b, add_history):
        """二元运算，结果写入 current_input；成功返回结果字符串，失败返回 None"""
        try:
            prev_num = float(a)
            curr_num = float(b)

            if op == "+":
                result = prev_num + curr_num
            elif op == "-":
                result = prev_num - curr_num
            elif op == "×":
                result = prev_num * curr_num
            elif op == "÷":
                if curr_num == 0:
                    raise ZeroDivisionError("不能除以零")
                result = prev_num / curr_num
            elif op == "^":
                result = math.pow(prev_num, curr_num)
            else:
                return None

            if not math.isfinite(result):
                raise OverflowError("结果溢出")
            result = round_result(result)
            result_str = format_number(result)

            if add_history:
                self.add_history(f"{a} {op} {b} = {result_str}", result_str)

            self.current_input = result_str
            self.operation = ""
            self.previous_input = ""
            self.should_reset_display = True
            if add_history and self.voice_enabled:
                speak_result(result_str)
            return result_str
        except (ValueError, ZeroDivisionError, OverflowError):
            self.current_input = "错误"
            self.operation = ""
            self.previous_input = ""
            self.should_reset_display = True
            if add_history and self.voice_enabled:
                speak("错误")
            return None

    def clear_all(self):
        self.current_input = "0"
        self.previous_input = ""
        self.operation = ""
        self.should_reset_display = False
        self.update_display()

    def toggle_sign(self):
        if self.current_input in ("0", "错误"):
            return
        if self.current_input.startswith("-"):
            self.current_input = self.current_input[1:]
        else:
            self.current_input = "-" + self.current_input
        self.update_display()

    def percentage(self):
        try:
            value = float(self.current_input)
        except ValueError:
            return
        self.current_input = format_number(round_result(value / 100))
        self.update_display()

    def backspace(self):
        if self.current_input in ("0", "错误"):
            self.current_input = "0"
        elif len(self.current_input) == 1 or \
                (self.current_input.startswith("-") and len(self.current_input) == 2):
            self.current_input = "0"
        else:
            self.current_input = self.current_input[:-1]
        self.update_display()

    # ---------------- 科学模式逻辑（表达式输入） ----------------

    def _on_scientific_button(self, value):
        if value.isdigit():
            self.expr_append_digit(value)
            if self.voice_enabled:
                speak_digit(value)
        elif value == ".":
            self.expr_append_dot()
            if self.voice_enabled:
                speak_digit(".")
        elif value in ("+", "-", "×", "÷", "^"):
            self.expr_append_operator(value)
            if self.voice_enabled:
                speak_operator(value)
        elif value == "=":
            if self.voice_enabled:
                speak_operator("=")
            self.expr_equals()
        elif value == "C":
            self.expression = ""
            self.expr_result = None
            self.update_display()
        elif value == "±":
            self.expr_toggle_sign()
        elif value == "%":
            if self.voice_enabled:
                speak_operator("%")
            self.expr_percent()
        elif value == "⌫":
            self.expr_backspace()

    def expr_append_digit(self, digit):
        base = "" if self.expr_result is not None else self.expression
        if len(base) + 1 > MAX_EXPR_LENGTH:
            return
        self.expression = base + digit
        self.expr_result = None
        self.update_display()

    def expr_append_dot(self):
        base = "" if self.expr_result is not None else self.expression
        i = len(base)
        while i > 0 and (base[i - 1].isdigit() or base[i - 1] == "."):
            i -= 1
        if "." in base[i:]:
            return
        if not base or base[-1] in "+-×÷^(":
            base += "0."
        else:
            base += "."
        if len(base) > MAX_EXPR_LENGTH:
            return
        self.expression = base
        self.expr_result = None
        self.update_display()

    def expr_append_operator(self, op):
        expr = self.expr_result if self.expr_result is not None else self.expression
        if expr == "错误":
            expr = ""
        if not expr:
            if op == "-":
                self.expression = "-"
                self.expr_result = None
                self.update_display()
            return
        last = expr[-1]
        if last in "+-×÷^":
            if op == "-" and last != "-":
                expr += op  # 允许 "5×-" 输入负数
            else:
                expr = expr[:-1] + op
        elif last == "(":
            if op != "-":
                return
            expr += op
        else:
            if len(expr) + 1 > MAX_EXPR_LENGTH:
                return
            expr += op
        self.expression = expr
        self.expr_result = None
        self.update_display()

    def expr_equals(self):
        if self.expr_result is not None or not self.expression:
            return
        try:
            value = round_result(evaluate_expression(self.expression, self.angle_mode))
            result_str = format_number(value) if math.isfinite(value) else "错误"
        except (ValueError, OverflowError):
            result_str = "错误"

        if result_str != "错误":
            self.add_history(f"{self.expression} = {result_str}", result_str)
        self.expr_result = result_str
        self.update_display()
        if self.voice_enabled:
            speak_result(result_str) if result_str != "错误" else speak("错误")

    def expr_toggle_sign(self):
        if self.expr_result is not None:
            if self.expr_result in ("错误", "0"):
                return
            self.expr_result = (self.expr_result[1:] if self.expr_result.startswith("-")
                                else "-" + self.expr_result)
            self.update_display()
            return

        expr = self.expression
        if not expr:
            self.expression = "-"
            self.update_display()
            return

        # 去掉尾部包裹 "(-N)"
        wrapped = re.search(r"\(-(\d*\.?\d*)\)$", expr)
        if wrapped:
            self.expression = expr[:wrapped.start()] + wrapped.group(1)
            self.update_display()
            return

        # 切换尾部数字的一元负号
        trailing = re.search(r"(\d*\.?\d*)$", expr)
        if trailing and trailing.group(1):
            num_start = trailing.start(1)
            before = expr[num_start - 1] if num_start > 0 else ""
            if before == "-" and (num_start - 1 == 0 or expr[num_start - 2] in "+-×÷^("):
                self.expression = expr[:num_start - 1] + trailing.group(1)
            else:
                self.expression = expr[:num_start] + "(-" + trailing.group(1) + ")"
            self.update_display()

    def expr_percent(self):
        if self.expr_result is not None:
            try:
                value = float(self.expr_result)
            except ValueError:
                return
            self.expr_result = format_number(round_result(value / 100))
            self.update_display()
            return
        if not self.expression or self.expression[-1] in "+-×÷^(":
            return
        self.expression += "%"
        self.update_display()

    def expr_backspace(self):
        if self.voice_enabled:
            speak_scientific("⌫")
        if self.expr_result is not None:
            self.expr_result = None
            self.update_display()
            return
        expr = self.expression
        for token in self.FUNC_TOKENS:
            if expr.endswith(token):
                self.expression = expr[:-len(token)]
                self.update_display()
                return
        self.expression = expr[:-1]
        self.update_display()

    def expr_scientific(self, func):
        if self.voice_enabled:
            speak_scientific(func)
        expr = self.expr_result if self.expr_result is not None else self.expression
        if expr == "错误":
            expr = ""

        if func in self.WRAP_FUNCS:
            next_expr = wrap_operand(expr, f"{self.WRAP_FUNCS[func]}(", ")")
        elif func in self.APPEND_OPS:
            next_expr = append_to_operand(expr, self.APPEND_OPS[func])
        elif func == "1/x":
            next_expr = wrap_operand(expr, "1÷(", ")")
        elif func in ("π", "e"):
            next_expr = expr + func
        else:
            return

        if len(next_expr) > MAX_EXPR_LENGTH:
            return
        self.expression = next_expr
        self.expr_result = None
        self.update_display()

    def expr_paren(self, paren):
        if self.voice_enabled:
            speak_scientific(paren)
        expr = "" if self.expr_result is not None else self.expression
        if paren == "(":
            if len(expr) + 1 > MAX_EXPR_LENGTH:
                return
            self.expression = expr + "("
        else:
            if expr.count("(") <= expr.count(")"):
                return
            if not expr or expr[-1] in "+-×÷^(":
                return
            self.expression = expr + ")"
        self.expr_result = None
        self.update_display()

    # ---------------- 历史记录 ----------------

    def add_history(self, expr, result):
        self.history.append({"expr": expr, "result": result, "ts": time.time()})
        if len(self.history) > 50:
            self.history.pop(0)

    def clear_history(self):
        self.history.clear()

    def restore_value(self, result):
        """从历史记录回填结果（基础/科学两种模式下均可见可续算）"""
        self.current_input = result
        self.should_reset_display = True
        self.expression = result
        self.expr_result = None
        self.update_display()

    # ---------------- 显示 ----------------

    @staticmethod
    def format_display(text):
        if text == "错误":
            return text
        if len(text) <= 12:
            return text
        try:
            num = float(text)
            if math.isnan(num):
                return "错误"
            return "{:.6e}".format(num)
        except (ValueError, OverflowError):
            return "错误"

    def update_display(self):
        if self.current_mode == "科学":
            if self.expr_result is not None:
                self.display_var.set(self.format_display(self.expr_result))
                self.preview_var.set(f"{self.expression} =")
            else:
                self.display_var.set(self.expression if self.expression else "0")
                preview = eval_preview(self.expression, self.angle_mode) if self.expression else None
                is_plain_number = bool(self.expression) and all(
                    c in "0123456789.-" for c in self.expression)
                if preview is not None and not is_plain_number:
                    self.preview_var.set(f"= {format_number(preview)}")
                else:
                    self.preview_var.set(" ")
        else:
            self.display_var.set(self.format_display(self.current_input))
            if self.operation:
                self.preview_var.set(f"{self.previous_input} {self.operation}")
            else:
                self.preview_var.set(" ")

    def run(self):
        self.window.mainloop()


if __name__ == "__main__":
    calc = Calculator()
    calc.run()
