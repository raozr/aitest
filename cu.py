import tkinter as tk
from tkinter import messagebox

class Calculator:
    def __init__(self):
        self.window = tk.Tk()
        self.window.title("计算器")
        self.window.geometry("480x760")  # 窗口尺寸缩小20% (原600x950)
        self.window.resizable(False, False)

        # 历史记录列表
        self.history = []

        # 显示屏
        self.display_var = tk.StringVar()
        self.display_var.set("0")

        display = tk.Entry(self.window, textvariable=self.display_var, font=("Arial", 77, "bold"),  # 字体缩小20% (原96)
                          justify="right", state="readonly", bg="white")
        display.grid(row=0, column=0, columnspan=4, padx=8, pady=8, sticky="nsew")  # 边距缩小20%
        
        # 按钮配置
        buttons = [
            ("C", 1, 0), ("±", 1, 1), ("%", 1, 2), ("÷", 1, 3),
            ("7", 2, 0), ("8", 2, 1), ("9", 2, 2), ("×", 2, 3),
            ("4", 3, 0), ("5", 3, 1), ("6", 3, 2), ("-", 3, 3),
            ("1", 4, 0), ("2", 4, 1), ("3", 4, 2), ("+", 4, 3),
            ("0", 5, 0), (".", 5, 2), ("=", 5, 3)
        ]
        
        # 创建按钮
        for (text, row, col) in buttons:
            if text == "0":
                # 0 按钮占据两列
                btn = tk.Button(self.window, text=text, font=("Arial", 16),  # 字体缩小20% (原20)
                               command=lambda t=text: self.on_button_click(t))
                btn.grid(row=row, column=col, columnspan=2, padx=3, pady=3, sticky="nsew")  # 边距缩小20%
            elif text == "C":
                # C 按钮支持双击清除历史记录
                btn = tk.Button(self.window, text=text, font=("Arial", 20),
                               command=lambda t=text: self.on_button_click(t))
                btn.grid(row=row, column=col, padx=3, pady=3, sticky="nsew")  # 边距缩小20%
                btn.bind("<Double-Button-1>", lambda e: self.clear_history())
            else:
                btn = tk.Button(self.window, text=text, font=("Arial", 16),  # 字体缩小20% (原20)
                               command=lambda t=text: self.on_button_click(t))
                btn.grid(row=row, column=col, padx=3, pady=3, sticky="nsew")  # 边距缩小20%

        # 历史记录框架（位于窗口底部）
        history_frame = tk.Frame(self.window, bg="#f0f0f0")
        history_frame.grid(row=6, column=0, columnspan=4, padx=8, pady=(8, 8), sticky="nsew")  # 边距缩小20%

        # 历史记录标签
        history_label = tk.Label(history_frame, text="历史记录", font=("Arial", 10), bg="#f0f0f0")  # 字体缩小 (原12)
        history_label.pack(anchor="w")

        # 历史记录列表（带滚动条）
        history_scrollbar = tk.Scrollbar(history_frame)
        history_scrollbar.pack(side="right", fill="y")

        self.history_listbox = tk.Listbox(history_frame, font=("Arial", 11), height=4,  # 字体缩小20%，高度调整 (原14/5)
                                          justify="right", yscrollcommand=history_scrollbar.set)
        self.history_listbox.pack(fill="both", expand=True)
        history_scrollbar.config(command=self.history_listbox.yview)

        # 配置网格权重（7行：0-显示屏, 1-5按钮, 6-历史记录）
        for i in range(7):
            self.window.grid_rowconfigure(i, weight=1)
        for i in range(4):
            self.window.grid_columnconfigure(i, weight=1)
            
        # 计算器状态变量
        self.current_input = "0"
        self.previous_input = ""
        self.operation = ""
        self.should_reset_display = False
        
    def on_button_click(self, value):
        if value.isdigit() or value == ".":
            self.input_number(value)
        elif value in ["+", "-", "×", "÷"]:
            self.input_operation(value)
        elif value == "=":
            self.calculate_result()
        elif value == "C":
            self.clear_all()
        elif value == "±":
            self.toggle_sign()
        elif value == "%":
            self.percentage()
    
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
                
                # 格式化结果
                if result.is_integer():
                    result = int(result)
                    
                self.current_input = str(result)

                # 添加到历史记录
                history_entry = f"{prev_num} {self.operation} {curr_num} = {result}"
                self.history.append(history_entry)
                self.history_listbox.insert("end", history_entry)
                self.history_listbox.see("end")  # 自动滚动到最新记录

                # 限制历史记录数量（最多50条）
                if len(self.history) > 50:
                    self.history.pop(0)
                    self.history_listbox.delete(0)

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
        self.history_listbox.delete(0, "end")
    
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
            if result.is_integer():
                result = int(result)
            self.current_input = str(result)
            self.update_display()
        except:
            messagebox.showerror("错误", "无法转换为百分比")
    
    def update_display(self):
        # 限制显示长度，防止溢出
        display_text = self.current_input
        if len(display_text) > 12:
            try:
                num = float(display_text)
                display_text = "{:.6e}".format(num)  # 科学计数法
            except:
                display_text = "错误"
        
        self.display_var.set(display_text)
    
    def run(self):
        self.window.mainloop()

if __name__ == "__main__":
    calc = Calculator()
    calc.run()