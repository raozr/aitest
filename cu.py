import tkinter as tk
from tkinter import messagebox, ttk
import math


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

        self.shape = None
        self.label = None

        self.bind("<Configure>", self._on_resize)
        self.bind("<Button-1>", self._on_press)
        self.bind("<ButtonRelease-1>", self._on_release)
        self.bind("<Enter>", self._on_enter)
        self.bind("<Leave>", self._on_leave)

    def _lighten(self, color):
        r, g, b = int(color[1:3], 16), int(color[3:5], 16), int(color[5:7], 16)
        f = 1.2  # 亮度系数
        return f"#{min(255, int(r*f)):02x}{min(255, int(g*f)):02x}{min(255, int(b*f)):02x}"

    def _darken(self, color):
        r, g, b = int(color[1:3], 16), int(color[3:5], 16), int(color[5:7], 16)
        f = 0.75  # 暗度系数
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
        """通过 polygon smooth 绘制圆角矩形"""
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


class BaseMode:
    """基础模式 - iOS 风格计算器"""

    # iOS 配色
    BG_NUMBER  = "#333333"
    BG_FUNC    = "#A5A5A5"
    BG_OP      = "#FF9500"
    FG_NUMBER  = "#FFFFFF"
    FG_FUNC    = "#000000"
    FG_OP      = "#FFFFFF"
    GAP = 8

    # 按钮布局: (text, row, col, colspan, type)
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

    # 每种按钮类型的字体大小
    FONT_SIZES = {"num": 28, "func": 24, "op": 30}

    def __init__(self, parent, calculator):
        self.parent = parent
        self.calc = calculator
        self.frame = tk.Frame(parent, bg="#000000")
        self.buttons = {}

        for i in range(5):
            self.frame.grid_rowconfigure(i, weight=1, uniform="row")
        for i in range(4):
            self.frame.grid_columnconfigure(i, weight=1, uniform="col")

        for text, row, col, colspan, btn_type in self.BUTTONS:
            if btn_type == "num":
                bg, fg = self.BG_NUMBER, self.FG_NUMBER
            elif btn_type == "func":
                bg, fg = self.BG_FUNC, self.FG_FUNC
            else:
                bg, fg = self.BG_OP, self.FG_OP

            font_size = self.FONT_SIZES[btn_type]

            container = tk.Frame(self.frame, bg="#000000")
            container.grid(row=row, column=col, columnspan=colspan,
                          padx=self.GAP//2, pady=self.GAP//2, sticky="nsew")
            container.grid_rowconfigure(0, weight=1)
            container.grid_columnconfigure(0, weight=1)

            btn = RoundedButton(container, text,
                             corner_radius=22,
                             bg_color=bg, fg_color=fg,
                             font=("Arial", font_size, "bold"),
                             command=lambda t=text: self.calc.on_button_click(t))
            btn.grid(row=0, column=0, sticky="nsew")

            self.buttons[text] = btn

    def show(self):
        self.frame.grid(row=0, column=0, sticky="nsew")

    def hide(self):
        self.frame.grid_forget()


class ScientificMode:
    """科学模式 - 科学计算器"""

    GAP = 8

    def __init__(self, parent, calculator):
        self.parent = parent
        self.calc = calculator
        self.frame = tk.Frame(parent, bg="#000000")

        # 科学计算按钮配置
        sci_buttons = [
            ("sin", 0, 0), ("cos", 0, 1), ("tan", 0, 2), ("ln", 0, 3),
            ("log", 1, 0), ("x²", 1, 1), ("x³", 1, 2), ("xʸ", 1, 3),
            ("√", 2, 0), ("∛", 2, 1), ("π", 2, 2), ("e", 2, 3),
            ("(", 3, 0), (")", 3, 1), ("n!", 3, 2), ("1/x", 3, 3)
        ]

        for i in range(4):
            self.frame.grid_columnconfigure(i, weight=1, uniform="col")
            self.frame.grid_rowconfigure(i, weight=1, uniform="row")

        for (text, row, col) in sci_buttons:
            container = tk.Frame(self.frame, bg="#000000")
            container.grid(row=row, column=col,
                          padx=self.GAP//2, pady=self.GAP//2, sticky="nsew")
            container.grid_rowconfigure(0, weight=1)
            container.grid_columnconfigure(0, weight=1)

            btn = RoundedButton(container, text, corner_radius=22,
                             bg_color="#333333", fg_color="#FFFFFF",
                             font=("Arial", 16, "bold"),
                             command=lambda t=text: self.on_sci_button(t))
            btn.grid(row=0, column=0, sticky="nsew")

    def show(self):
        self.frame.grid(row=0, column=0, sticky="nsew")

    def hide(self):
        self.frame.grid_forget()

    def on_sci_button(self, func):
        """处理科学计算按钮"""
        try:
            value = float(self.calc.current_input)
            result = None

            if func == "sin":
                result = math.sin(math.radians(value))
            elif func == "cos":
                result = math.cos(math.radians(value))
            elif func == "tan":
                result = math.tan(math.radians(value))
            elif func == "ln":
                result = math.log(value)
            elif func == "log":
                result = math.log10(value)
            elif func == "x²":
                result = value ** 2
            elif func == "x³":
                result = value ** 3
            elif func == "xʸ":
                self.calc.previous_input = str(value)
                self.calc.operation = "^"
                self.calc.should_reset_display = True
                return
            elif func == "√":
                result = math.sqrt(value)
            elif func == "∛":
                result = value ** (1/3)
            elif func == "π":
                result = math.pi
            elif func == "e":
                result = math.e
            elif func == "n!":
                result = math.factorial(int(value))
            elif func == "1/x":
                result = 1 / value
            elif func == "(":
                self.calc.current_input += "("
                self.calc.update_display()
                return
            elif func == ")":
                self.calc.current_input += ")"
                self.calc.update_display()
                return

            if result is not None:
                if isinstance(result, float):
                    if result.is_integer():
                        result = int(result)
                    else:
                        result = round(result, 10)
                self.calc.current_input = str(result)
                self.calc.should_reset_display = True
                self.calc.update_display()

        except Exception as e:
            messagebox.showerror("错误", f"计算错误: {str(e)}")
            self.calc.clear_all()


class CurrencyMode:
    """汇率模式 - 汇率转换（卡片式布局）"""

    RATES = {
        "USD": 1.0, "CNY": 7.25, "JPY": 151.5,
        "EUR": 0.92, "GBP": 0.79, "KRW": 1350.0
    }

    CURRENCY_NAMES = {
        "USD": "美元", "CNY": "人民币", "JPY": "日元",
        "EUR": "欧元", "GBP": "英镑", "KRW": "韩元"
    }

    # 货币对应的显示颜色
    CURRENCY_COLORS = {
        "USD": "#007AFF", "CNY": "#FF3B30", "JPY": "#AF52DE",
        "EUR": "#007AFF", "GBP": "#34C759", "KRW": "#FF9500"
    }

    CARD_BG = "#1C1C1E"
    SURFACE_BG = "#2C2C2E"
    PRIMARY = "#FF9500"
    TEXT_PRIMARY = "#FFFFFF"
    TEXT_SECONDARY = "#8E8E93"
    TEXT_TERTIARY = "#636366"
    SEPARATOR = "#38383A"

    def __init__(self, parent, calculator):
        self.parent = parent
        self.calc = calculator
        self.frame = tk.Frame(parent, bg="#000000")

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

        # --- 金额输入 ---
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

        # From
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

        # Swap
        swap_frame = tk.Frame(sel_row, bg=self.CARD_BG)
        swap_frame.pack(side="left", padx=12, pady=(24, 0))
        self.swap_btn = RoundedButton(swap_frame, "⇄", corner_radius=22,
                                     bg_color=self.PRIMARY, fg_color="#FFFFFF",
                                     font=("Arial", 14, "bold"),
                                     width=44, height=44,
                                     command=self.swap_currencies)
        self.swap_btn.pack()

        # To
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
        tk.Label(rates_header, text="  以 USD 为基准", font=("Arial", 11),
                bg="#000000", fg=self.TEXT_SECONDARY).pack(side="left", pady=(4, 0))

        rates_card = tk.Frame(main, bg=self.CARD_BG)
        rates_card.pack(fill="x", padx=16, pady=(0, 16))
        self._build_rates_list(rates_card)

        # 底部留白
        tk.Frame(main, bg="#000000", height=20).pack(fill="x")

        # 绑定回车键
        self.amount_entry.bind("<Return>", lambda e: self.convert())

    def _build_rates_list(self, parent):
        """构建汇率列表项"""
        codes = [c for c in self.RATES if c != "USD"]
        for i, code in enumerate(codes):
            rate = self.RATES[code]
            name = self.CURRENCY_NAMES.get(code, "")
            color = self.CURRENCY_COLORS.get(code, self.PRIMARY)

            item = tk.Frame(parent, bg=self.CARD_BG)
            item.pack(fill="x", padx=0, pady=0)

            if i > 0:
                sep = tk.Frame(item, bg=self.SEPARATOR, height=1)
                sep.pack(fill="x")

            row = tk.Frame(item, bg=self.CARD_BG)
            row.pack(fill="x", padx=16, pady=12)

            # 左侧：色点 + 代码 + 名称
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

            # 右侧：汇率值
            rate_text = f"{rate:.2f}" if rate == int(rate) else str(rate)
            tk.Label(row, text=rate_text, font=("Arial", 16, "bold"),
                    bg=self.CARD_BG, fg=self.TEXT_PRIMARY).pack(side="right")

    def _show_currency_menu(self, target):
        """显示货币选择下拉菜单"""
        var = self.from_var if target == "from" else self.to_var
        label = self.from_label if target == "from" else self.to_label
        dot = self.from_dot if target == "from" else self.to_dot

        menu = tk.Menu(self.frame, tearoff=0, bg=self.SURFACE_BG, fg=self.TEXT_PRIMARY,
                       activebackground=self.SURFACE_BG, activeforeground=self.PRIMARY,
                       font=("Arial", 14), bd=0, relief="flat")
        menu.configure(activeborderwidth=0, borderwidth=0)

        for code in self.RATES:
            name = self.CURRENCY_NAMES.get(code, "")
            menu.add_command(
                label=f"  {code}    {name}",
                command=lambda c=code, v=var, l=label, d=dot: self._set_currency(v, c, l, d)
            )

        x = self.calc.window.winfo_x() + 60
        y = self.calc.window.winfo_y() + 200
        menu.post(x, y)

    def _set_currency(self, var, code, label, dot):
        """设置货币并更新显示"""
        var.set(code)
        label.config(text=code)
        dot.config(bg=self.CURRENCY_COLORS.get(code, self.PRIMARY))
        self.convert()

    def show(self):
        self.frame.grid(row=0, column=0, sticky="nsew")

    def hide(self):
        self.frame.grid_forget()

    def swap_currencies(self):
        from_val = self.from_var.get()
        to_val = self.to_var.get()
        from_label_text = self.from_label.cget("text")
        to_label_text = self.to_label.cget("text")
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
        """执行汇率转换"""
        try:
            amount_text = self.amount_var.get().strip()
            if not amount_text:
                self.result_from.config(text="")
                self.result_amount.config(text="")
                self.result_currency.config(text="")
                return

            amount = float(amount_text)
            from_curr = self.from_var.get()
            to_curr = self.to_var.get()

            from_rate = self.RATES[from_curr]
            to_rate = self.RATES[to_curr]
            result = amount * (to_rate / from_rate)

            if result.is_integer():
                result_text = f"{int(result)}"
            else:
                result_text = f"{result:.4f}"

            from_name = self.CURRENCY_NAMES.get(from_curr, "")
            to_name = self.CURRENCY_NAMES.get(to_curr, "")

            self.result_from.config(text=f"{amount} {from_curr} ({from_name})")
            self.result_amount.config(text=result_text)
            self.result_currency.config(text=f"{to_curr} ({to_name})")
        except Exception:
            self.result_from.config(text="")
            self.result_amount.config(text="")
            self.result_currency.config(text="")


class HistoryMode:
    """历史记录模式 - 显示计算历史"""

    def __init__(self, parent, calculator):
        self.parent = parent
        self.calc = calculator
        self.frame = tk.Frame(parent, bg="#000000")

        # 标题区域
        title_frame = tk.Frame(self.frame, bg="#000000")
        title_frame.pack(fill="x", padx=20, pady=(15, 10))

        tk.Label(title_frame, text="计算历史", font=("Arial", 16, "bold"),
                bg="#000000", fg="#FFFFFF").pack(side="left")

        # 统计信息
        self.stats_var = tk.StringVar(value="共 0 条记录")
        tk.Label(title_frame, textvariable=self.stats_var,
                font=("Arial", 11), bg="#000000", fg="#AAAAAA").pack(side="right")

        # 历史记录列表框架
        list_frame = tk.Frame(self.frame, bg="#000000")
        list_frame.pack(fill="both", expand=True, padx=20, pady=5)

        # 滚动条
        scrollbar = tk.Scrollbar(list_frame, bg="#333333", troughcolor="#1C1C1E")
        scrollbar.pack(side="right", fill="y")

        # 列表框
        self.history_listbox = tk.Listbox(list_frame, font=("Arial", 13),
                                          height=20,
                                          yscrollcommand=scrollbar.set,
                                          bg="#1C1C1E", fg="#FFFFFF",
                                          selectbackground="#FF9500",
                                          selectforeground="#FFFFFF",
                                          relief="flat", highlightthickness=0)
        self.history_listbox.pack(fill="both", expand=True)
        scrollbar.config(command=self.history_listbox.yview)

        # 绑定双击事件 - 使用选中的历史记录值
        self.history_listbox.bind("<Double-Button-1>", self.use_history_item)

        # 按钮区域
        btn_frame = tk.Frame(self.frame, bg="#000000")
        btn_frame.pack(fill="x", padx=20, pady=(10, 20))

        # 使用选中值按钮
        use_container = tk.Frame(btn_frame, bg="#000000")
        use_container.pack(side="left", padx=(0, 20))
        use_btn = RoundedButton(use_container, "使用", corner_radius=22,
                             bg_color="#FF9500", fg_color="#FFFFFF",
                             font=("Arial", 12, "bold"),
                             command=self.use_selected_value)
        use_btn.pack()

        # 清空按钮
        clear_container = tk.Frame(btn_frame, bg="#000000")
        clear_container.pack(side="left")
        clear_btn = RoundedButton(clear_container, "清空", corner_radius=22,
                               bg_color="#333333", fg_color="#FFFFFF",
                               font=("Arial", 12, "bold"),
                               command=self.clear_all_history)
        clear_btn.pack()

        # 提示标签
        tk.Label(self.frame, text="提示: 双击记录可将结果值用于计算",
                font=("Arial", 10), bg="#000000", fg="#666666").pack(pady=(0, 15))

    def show(self):
        self.frame.grid(row=0, column=0, sticky="nsew")
        self.refresh_history()

    def hide(self):
        self.frame.grid_forget()

    def refresh_history(self):
        """刷新历史记录显示"""
        self.history_listbox.delete(0, "end")
        for entry in self.calc.history:
            self.history_listbox.insert("end", entry)
        self.stats_var.set(f"共 {len(self.calc.history)} 条记录")

    def use_history_item(self, event=None):
        """双击使用历史记录中的结果值"""
        selection = self.history_listbox.curselection()
        if selection:
            index = selection[0]
            entry = self.calc.history[index]
            # 解析记录获取结果值 (格式: "a op b = result")
            try:
                result = entry.split(" = ")[1]
                self.calc.current_input = result
                self.calc.update_display()
                # 切换回之前的计算模式
                self.calc.switch_to_calc_mode()
            except IndexError:
                pass

    def use_selected_value(self):
        """使用选中的历史记录值"""
        self.use_history_item()

    def clear_all_history(self):
        """清空所有历史记录"""
        if self.calc.history:
            result = messagebox.askyesno("确认", "确定要清空所有历史记录吗？")
            if result:
                self.calc.clear_history()
                self.refresh_history()


class Calculator:
    def __init__(self):
        self.window = tk.Tk()
        self.window.title("计算器")
        self.window.geometry("480x750")
        self.window.resizable(False, False)
        self.window.configure(bg="#000000")

        # 历史记录列表
        self.history = []

        # 计算器状态变量
        self.current_input = "0"
        self.previous_input = ""
        self.operation = ""
        self.should_reset_display = False

        # 当前模式 (基础/科学/汇率/历史)
        self.current_mode = "基础"
        self.calc_mode = "基础"  # 记录上一个计算模式
        self.modes = {}

        self._create_ui()

    def _create_ui(self):
        """创建用户界面"""
        # 顶部区域 - 图标按钮和显示
        top_frame = tk.Frame(self.window, bg="#000000")
        top_frame.grid(row=0, column=0, columnspan=4, sticky="nsew", padx=8, pady=(8, 4))

        # 图标按钮区域
        icon_frame = tk.Frame(top_frame, bg="#000000")
        icon_frame.pack(fill="x", pady=(0, 5))

        # 历史记录图标按钮（左侧）
        history_container = tk.Frame(icon_frame, bg="#000000")
        history_container.pack(side="left")
        history_btn = RoundedButton(history_container, "📋", corner_radius=22,
                                 bg_color="#333333", fg_color="#FFFFFF",
                                 font=("Arial", 14),
                                 width=44, height=44,
                                 command=self.show_history_mode)
        history_btn.pack()

        # 当前模式标签（中间）
        self.mode_label = tk.Label(icon_frame, text="基础模式", font=("Arial", 14, "bold"),
                                   bg="#000000", fg="#FFFFFF")
        self.mode_label.pack(side="left", padx=(15, 0))

        # 菜单图标按钮（右侧）
        menu_container = tk.Frame(icon_frame, bg="#000000")
        menu_container.pack(side="right")
        menu_btn = RoundedButton(menu_container, "☰", corner_radius=22,
                              bg_color="#333333", fg_color="#FFFFFF",
                              font=("Arial", 14, "bold"),
                              width=44, height=44,
                              command=self.show_mode_selector)
        menu_btn.pack()

        # 显示屏
        self.display_var = tk.StringVar()
        self.display_var.set("0")
        self.display = tk.Entry(top_frame, textvariable=self.display_var,
                          font=("Arial", 48, "bold"), justify="right",
                          state="readonly", bg="#000000", fg="#FFFFFF",
                          readonlybackground="#000000",
                          highlightthickness=0, bd=0)
        self.display.pack(fill="x", pady=10)

        # 内容区域 - 根据模式切换
        self.content_frame = tk.Frame(self.window, bg="#000000")
        self.content_frame.grid(row=1, column=0, columnspan=4, sticky="nsew", padx=8, pady=4)

        # 配置内容框架的网格权重
        self.content_frame.grid_rowconfigure(0, weight=1)
        self.content_frame.grid_columnconfigure(0, weight=1)

        # 创建四种模式
        self.modes["基础"] = BaseMode(self.content_frame, self)
        self.modes["科学"] = ScientificMode(self.content_frame, self)
        self.modes["汇率"] = CurrencyMode(self.content_frame, self)
        self.modes["历史"] = HistoryMode(self.content_frame, self)

        # 显示默认模式
        self.modes["基础"].show()

        # 配置网格权重
        self.window.grid_rowconfigure(0, weight=0)
        self.window.grid_rowconfigure(1, weight=1)
        for i in range(4):
            self.window.grid_columnconfigure(i, weight=1)

    def show_history_mode(self):
        """显示历史记录模式"""
        if self.current_mode != "历史":
            # 保存当前计算模式
            if self.current_mode in ["基础", "科学", "汇率"]:
                self.calc_mode = self.current_mode

            # 隐藏当前模式
            self.modes[self.current_mode].hide()

            # 历史模式下隐藏顶部显示屏
            self.display.pack_forget()

            # 显示历史记录模式
            self.modes["历史"].show()
            self.current_mode = "历史"
            self.mode_label.config(text="历史记录")
            self.window.geometry("480x650")

    def switch_to_calc_mode(self):
        """切换回计算模式"""
        if self.current_mode == "历史":
            self.modes["历史"].hide()

            # 切换回之前的计算模式
            target_mode = self.calc_mode if self.calc_mode in ["基础", "科学", "汇率"] else "基础"
            self.modes[target_mode].show()
            self.current_mode = target_mode
            self.mode_label.config(text=f"{target_mode}模式")

            # 汇率模式下隐藏显示屏，其他模式显示
            if target_mode == "汇率":
                self.display.pack_forget()
            elif not self.display.winfo_ismapped():
                self.display.pack(fill="x", pady=10)

            # 调整窗口大小
            self.window.geometry("480x750")

    def show_mode_selector(self):
        """显示模式选择弹窗"""
        # 如果当前在历史记录模式，先切换回计算模式
        if self.current_mode == "历史":
            self.switch_to_calc_mode()
            return

        # 创建弹窗
        popup = tk.Toplevel(self.window)
        popup.title("选择计算模式")
        popup.geometry("320x420")
        popup.resizable(False, False)
        popup.transient(self.window)
        popup.grab_set()
        popup.configure(bg="#1C1C1E")

        # 主容器
        main_frame = tk.Frame(popup, bg="#1C1C1E", padx=25, pady=20)
        main_frame.pack(fill="both", expand=True)

        # 标题
        title_frame = tk.Frame(main_frame, bg="#1C1C1E")
        title_frame.pack(fill="x", pady=(0, 20))

        icon_label = tk.Label(title_frame, text="⚙️", font=("Arial", 16),
                              bg="#1C1C1E", fg="#FF9500")
        icon_label.pack(side="left")

        tk.Label(title_frame, text="选择计算器模式", font=("Arial", 16, "bold"),
                bg="#1C1C1E", fg="#FFFFFF").pack(side="left")

        tk.Label(title_frame, text="请选择您需要的计算功能",
                font=("Arial", 11), bg="#1C1C1E", fg="#AAAAAA").pack(pady=(5, 0))

        # 模式按钮区域
        modes_frame = tk.Frame(main_frame, bg="#1C1C1E")
        modes_frame.pack(fill="x", pady=10)

        modes = [
            ("基础", "标准计算器", "➕", "标准四则运算"),
            ("科学", "科学计算器", "🔬", "三角函数、对数、幂运算"),
            ("汇率", "汇率转换", "💱", "多币种汇率换算")
        ]

        for mode_name, title, icon, desc in modes:
            is_current = mode_name == self.current_mode

            if is_current:
                card_bg = "#FF9500"
                text_fg = "#FFFFFF"
                desc_fg = "#FFFFFF"
                icon_fg = "#FFFFFF"
            else:
                card_bg = "#2C2C2E"
                text_fg = "#FFFFFF"
                desc_fg = "#AAAAAA"
                icon_fg = "#FFFFFF"

            # 卡片外框（悬停时变色用）
            btn_outer = tk.Frame(modes_frame, bg=card_bg, padx=2, pady=2)
            btn_outer.pack(fill="x", pady=6)

            # 卡片主体
            btn_inner = tk.Frame(btn_outer, bg=card_bg, padx=15, pady=12)
            btn_inner.pack(fill="x")

            # 图标
            icon_label = tk.Label(btn_inner, text=icon, font=("Arial", 20),
                                  bg=card_bg, fg=icon_fg)
            icon_label.pack(side="left")

            # 文字区域
            text_frame = tk.Frame(btn_inner, bg=card_bg)
            text_frame.pack(side="left", padx=(8, 0))

            title_label = tk.Label(text_frame, text=title, font=("Arial", 13, "bold"),
                                   bg=card_bg, fg=text_fg)
            title_label.pack(anchor="w")

            desc_label = tk.Label(text_frame, text=desc, font=("Arial", 10),
                                  bg=card_bg, fg=desc_fg)
            desc_label.pack(anchor="w")

            # 选中标记
            check_label = None
            if is_current:
                check_label = tk.Label(btn_inner, text="✓", font=("Arial", 18, "bold"),
                                       bg="#FF9500", fg="white")
                check_label.pack(side="right")

            # 绑定点击事件到卡片内所有控件
            geometries = {"基础": "480x750", "科学": "480x750", "汇率": "480x750"}
            card_widgets = [btn_inner, btn_outer, text_frame, icon_label, title_label, desc_label]
            if check_label:
                card_widgets.append(check_label)

            cmd = lambda e, m=mode_name, g=geometries[mode_name]: self.switch_mode_and_close(m, g, popup)
            on_enter = lambda e, f=btn_inner, o=btn_outer, ic=is_current: self._on_mode_btn_hover(f, o, ic)
            on_leave = lambda e, f=btn_inner, o=btn_outer, ic=is_current: self._on_mode_btn_leave(f, o, ic)

            for widget in card_widgets:
                widget.bind("<Button-1>", cmd)
                widget.bind("<Enter>", on_enter)
                widget.bind("<Leave>", on_leave)

        # 关闭按钮
        close_btn = tk.Button(main_frame, text="关闭", font=("Arial", 11),
                             bg="#333333", fg="#FFFFFF", width=12, height=1,
                             command=popup.destroy, cursor="hand2", relief="flat",
                             bd=0, highlightthickness=0)
        close_btn.pack(pady=(20, 10))

        # 居中显示
        popup.update_idletasks()
        x = self.window.winfo_x() + (self.window.winfo_width() - popup.winfo_width()) // 2
        y = self.window.winfo_y() + (self.window.winfo_height() - popup.winfo_height()) // 2
        popup.geometry(f"+{x}+{y}")

    def _set_card_bg(self, widget, color):
        """递归设置卡片内所有控件的背景色"""
        try:
            widget.config(bg=color)
        except tk.TclError:
            pass
        for child in widget.winfo_children():
            self._set_card_bg(child, color)

    def _on_mode_btn_hover(self, frame, outer, is_current):
        """模式按钮悬停效果"""
        if not is_current:
            outer.config(bg="#FF9500")
            self._set_card_bg(frame, "#3A3A3C")

    def _on_mode_btn_leave(self, frame, outer, is_current):
        """模式按钮离开效果"""
        if not is_current:
            outer.config(bg="#2C2C2E")
            self._set_card_bg(frame, "#2C2C2E")

    def switch_mode_and_close(self, new_mode, geometry, popup):
        """切换模式并关闭弹窗"""
        self.switch_mode(new_mode, geometry, popup)

    def switch_mode(self, new_mode, geometry, popup):
        """切换模式并关闭弹窗"""
        if new_mode != self.current_mode:
            # 隐藏当前模式
            self.modes[self.current_mode].hide()

            # 显示新模式
            self.modes[new_mode].show()
            self.current_mode = new_mode
            self.calc_mode = new_mode  # 更新计算模式记录

            # 更新模式标签
            self.mode_label.config(text=f"{new_mode}模式")

            # 汇率模式下隐藏显示屏，其他模式显示
            if new_mode == "汇率":
                self.display.pack_forget()
            elif not self.display.winfo_ismapped():
                self.display.pack(fill="x", pady=10)

            # 调整窗口大小
            self.window.geometry(geometry)

        popup.destroy()

    def on_button_click(self, value):
        if value.isdigit() or value == ".":
            self.input_number(value)
        elif value in ["+", "-", "×", "÷", "^"]:
            self.input_operation(value)
        elif value == "=":
            self.calculate_result()
        elif value == "C":
            self.clear_all()
        elif value == "±":
            self.toggle_sign()
        elif value == "%":
            self.percentage()
        elif value == "⌫":
            self.backspace()

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
                self.current_input += num

        self.update_display()

    def input_operation(self, op):
        if self.operation and not self.should_reset_display:
            self.calculate_result()

        self.previous_input = self.current_input
        self.operation = op
        self.should_reset_display = True

    def calculate_result(self):
        if self.operation and self.previous_input:
            try:
                prev_num = float(self.previous_input)
                curr_num = float(self.current_input)

                if self.operation == "+":
                    result = prev_num + curr_num
                elif self.operation == "-":
                    result = prev_num - curr_num
                elif self.operation == "×":
                    result = prev_num * curr_num
                elif self.operation == "÷":
                    if curr_num == 0:
                        messagebox.showerror("错误", "不能除以零！")
                        self.clear_all()
                        return
                    result = prev_num / curr_num
                elif self.operation == "^":
                    result = prev_num ** curr_num

                # 格式化结果
                if isinstance(result, float):
                    if result.is_integer():
                        result = int(result)
                    else:
                        result = round(result, 10)

                self.current_input = str(result)

                # 添加到历史记录
                history_entry = f"{prev_num} {self.operation} {curr_num} = {result}"
                self.history.append(history_entry)

                # 限制历史记录数量
                if len(self.history) > 50:
                    self.history.pop(0)

                self.operation = ""
                self.previous_input = ""
                self.should_reset_display = True
                self.update_display()
            except Exception as e:
                messagebox.showerror("错误", f"计算错误: {str(e)}")
                self.clear_all()

    def clear_all(self):
        self.current_input = "0"
        self.previous_input = ""
        self.operation = ""
        self.should_reset_display = False
        self.update_display()

    def clear_history(self):
        """清除历史记录"""
        self.history.clear()

    def toggle_sign(self):
        if self.current_input != "0":
            if self.current_input.startswith("-"):
                self.current_input = self.current_input[1:]
            else:
                self.current_input = "-" + self.current_input
            self.update_display()

    def percentage(self):
        try:
            result = float(self.current_input) / 100
            if isinstance(result, float):
                if result.is_integer():
                    result = int(result)
                else:
                    result = round(result, 10)
            self.current_input = str(result)
            self.update_display()
        except:
            messagebox.showerror("错误", "无法转换为百分比")

    def backspace(self):
        """退格功能 - 删除最后一个字符"""
        if self.current_input == "0":
            return
        if len(self.current_input) == 1 or (self.current_input.startswith("-") and len(self.current_input) == 2):
            self.current_input = "0"
        else:
            self.current_input = self.current_input[:-1]
        self.update_display()

    def update_display(self):
        # 限制显示长度，防止溢出
        display_text = self.current_input
        if len(display_text) > 12:
            try:
                num = float(display_text)
                display_text = "{:.6e}".format(num)
            except:
                display_text = "错误"

        self.display_var.set(display_text)

    def run(self):
        self.window.mainloop()


if __name__ == "__main__":
    calc = Calculator()
    calc.run()
