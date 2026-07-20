"""cu.py 冒烟测试：表达式引擎 + 计算器状态机（无 GUI 主循环）"""
import math
import cu

passed = 0
failed = 0


def check(name, actual, expected, approx=False):
    global passed, failed
    ok = False
    if approx:
        ok = actual is not None and abs(actual - expected) < 1e-9
    else:
        ok = actual == expected
    if ok:
        passed += 1
    else:
        failed += 1
        print(f"FAIL: {name}  expected={expected!r}  actual={actual!r}")


# ---------- 表达式引擎 ----------
check("2+3", cu.evaluate_expression("2+3"), 5)
check("precedence 2+3×4", cu.evaluate_expression("2+3×4"), 14)
check("parens (2+3)×4", cu.evaluate_expression("(2+3)×4"), 20)
check("right assoc 2^3^2", cu.evaluate_expression("2^3^2"), 512)
check("unary -5+3", cu.evaluate_expression("-5+3"), -2)
check("5×-3", cu.evaluate_expression("5×-3"), -15)
check("2^-3", cu.evaluate_expression("2^-3"), 0.125)
check("-(2+3)", cu.evaluate_expression("-(2+3)"), -5)
check("(-2)^2", cu.evaluate_expression("(-2)^2"), 4)
check("2π", cu.evaluate_expression("2π"), 2 * math.pi, approx=True)
check("implicit 2(3+4)", cu.evaluate_expression("2(3+4)"), 14)
check("implicit (2+1)(3+1)", cu.evaluate_expression("(2+1)(3+1)"), 12)
check("sin(30) DEG", cu.evaluate_expression("sin(30)", "DEG"), 0.5, approx=True)
check("sin(π÷6) RAD", cu.evaluate_expression("sin(π÷6)", "RAD"), 0.5, approx=True)
check("cos(60)", cu.evaluate_expression("cos(60)", "DEG"), 0.5, approx=True)
check("tan(45)", cu.evaluate_expression("tan(45)", "DEG"), 1, approx=True)
check("tan(90) inf", cu.evaluate_expression("tan(90)", "DEG"), math.inf)
check("log(100)", cu.evaluate_expression("log(100)"), 2)
check("ln(e)", cu.evaluate_expression("ln(e)"), 1, approx=True)
check("sqrt(9)", cu.evaluate_expression("sqrt(9)"), 3)
check("cbrt(-8)", cu.evaluate_expression("cbrt(-8)"), -2)
check("abs(0-5)", cu.evaluate_expression("abs(0-5)"), 5)
check("exp(1)", cu.evaluate_expression("exp(1)"), math.e, approx=True)
check("pow10(3)", cu.evaluate_expression("pow10(3)"), 1000)
check("5!", cu.evaluate_expression("5!"), 120)
check("0!", cu.evaluate_expression("0!"), 1)
check("(2+3)!", cu.evaluate_expression("(2+3)!"), 120)
check("2^3!", cu.evaluate_expression("2^3!"), 64)
check("50%", cu.evaluate_expression("50%"), 0.5)
check("sqrt(9+16)", cu.evaluate_expression("sqrt(9+16)"), 5)

for bad, msg in [("5÷0", "不能除以零"), ("", "表达式为空"), ("2@3", "无效字符"),
                 ("foo(3)", "未知函数"), ("(2+3", "括号不匹配"), ("2+", "表达式无效")]:
    try:
        cu.evaluate_expression(bad)
        check(f"raise {bad!r}", "no error", msg)
    except ValueError as e:
        check(f"raise {bad!r}", str(e).startswith(msg), True)

check("preview 2+3", cu.eval_preview("2+3", "DEG"), 5)
check("preview 2+3+", cu.eval_preview("2+3+", "DEG"), 5)
check("preview 2×(3+", cu.eval_preview("2×(3+", "DEG"), 2)
check("preview sin( → None", cu.eval_preview("sin(", "DEG"), None)
check("preview 5÷0 → None", cu.eval_preview("5÷0", "DEG"), None)
check("preview '' → None", cu.eval_preview("", "DEG"), None)

check("operand 2+30", cu.find_operand_start("2+30"), 2)
check("operand 2+-3", cu.find_operand_start("2+-3"), 2)
check("operand 2+π", cu.find_operand_start("2+π"), 2)
check("operand 2×(3+4)", cu.find_operand_start("2×(3+4)"), 2)
check("operand 2+sin(30)", cu.find_operand_start("2+sin(30)"), 2)
check("operand 2+ → None", cu.find_operand_start("2+"), None)
check("wrap 30", cu.wrap_operand("30", "sin(", ")"), "sin(30)")
check("wrap 2+30", cu.wrap_operand("2+30", "sin(", ")"), "2+sin(30)")
check("wrap 2+", cu.wrap_operand("2+", "sin(", ")"), "2+sin(")
check("wrap 5 1/x", cu.wrap_operand("5", "1÷(", ")"), "1÷(5)")
check("append 5 ^2", cu.append_to_operand("5", "^2"), "5^2")
check("append (2+3) !", cu.append_to_operand("(2+3)", "!"), "(2+3)!")
check("append 2+ !", cu.append_to_operand("2+", "!"), "2+")

# ---------- 计算器状态机（需要 GUI 环境构建窗口） ----------
try:
    calc = cu.Calculator()
    calc.voice_enabled = False  # 测试中静音

    # 基础模式
    calc.on_button_click("3")
    calc.on_button_click("+")
    check("basic preview", calc.preview_var.get(), "3 +")
    calc.on_button_click("3")
    calc.on_button_click("=")
    check("basic 3+3", calc.display_var.get(), "6")
    calc.on_button_click("=")
    check("repeat equals", calc.display_var.get(), "9")
    calc.on_button_click("=")
    check("repeat equals 2", calc.display_var.get(), "12")
    check("history len", len(calc.history), 3)
    check("history expr", calc.history[-1]["expr"], "9 + 3 = 12")

    calc.on_button_click("C")
    calc.on_button_click("5")
    calc.on_button_click("÷")
    calc.on_button_click("0")
    calc.on_button_click("=")
    check("div by zero inline", calc.display_var.get(), "错误")
    calc.on_button_click("3")
    check("recover after error", calc.display_var.get(), "3")

    # 链式运算符遇除零不崩溃
    calc.on_button_click("C")
    calc.on_button_click("5")
    calc.on_button_click("÷")
    calc.on_button_click("0")
    calc.on_button_click("+")
    check("chained div-zero no crash", calc.display_var.get(), "错误")

    # ±/% 在错误状态下
    calc.on_button_click("±")
    check("toggle on error", calc.display_var.get(), "错误")
    calc.on_button_click("%")
    check("percent on error", calc.display_var.get(), "错误")

    # 科学模式
    calc.switch_mode("科学")
    check("sci mode", calc.current_mode, "科学")
    calc.on_button_click("3")
    calc.on_button_click("0")
    calc.expr_scientific("sin")
    check("sci wrap sin", calc.expression, "sin(30)")
    calc.on_button_click("=")
    check("sci sin(30)", calc.display_var.get(), "0.5")
    check("sci history", calc.history[-1]["expr"], "sin(30) = 0.5")

    calc.on_button_click("C")
    calc.on_button_click("2")
    calc.on_button_click("+")
    calc.on_button_click("3")
    calc.on_button_click("×")
    calc.on_button_click("4")
    check("sci precedence preview", calc.preview_var.get(), "= 14")
    calc.on_button_click("=")
    check("sci precedence", calc.display_var.get(), "14")

    calc.on_button_click("C")
    calc.expr_paren("(")
    calc.on_button_click("2")
    calc.on_button_click("+")
    calc.on_button_click("3")
    calc.expr_paren(")")
    calc.on_button_click("×")
    calc.on_button_click("4")
    calc.on_button_click("=")
    check("sci parens", calc.display_var.get(), "20")

    calc.on_button_click("C")
    calc.on_button_click("5")
    calc.expr_scientific("n!")
    calc.on_button_click("=")
    check("sci factorial", calc.display_var.get(), "120")

    calc.on_button_click("C")
    calc.on_button_click("8")
    calc.on_button_click("±")
    calc.expr_scientific("∛")
    calc.on_button_click("=")
    check("sci cbrt negative", calc.display_var.get(), "-2")

    # DEG/RAD 切换（先按 sin 再输入 π÷6）
    calc.on_button_click("C")
    calc.expr_scientific("sin")
    calc.expr_scientific("π")
    calc.on_button_click("÷")
    calc.on_button_click("6")
    calc.expr_paren(")")
    calc.toggle_angle()
    check("angle RAD", calc.angle_mode, "RAD")
    check("rad expression", calc.expression, "sin(π÷6)")
    calc.on_button_click("=")
    check("sci rad sin(π/6)", calc.display_var.get(), "0.5")
    calc.toggle_angle()

    # 智能退格
    calc.on_button_click("C")
    calc.on_button_click("3")
    calc.expr_scientific("sin")
    check("before backspace", calc.expression, "sin(3)")
    calc.expr_backspace()
    check("smart backspace", calc.expression, "sin(3")

    # 历史回填
    calc.restore_value("42")
    calc.switch_mode("基础")
    check("restore value", calc.display_var.get(), "42")

    # 单位换算
    check("unit 1km→m", cu.UnitMode.LINEAR_UNITS["长度"]["km"][1], 1000)
    um = calc.modes["单位"]
    um.amount_var.set("1")
    um.from_unit, um.to_unit = "km", "m"
    um.convert()
    check("unit convert", um.result_amount.cget("text"), "1000")
    um.set_category("温度")
    um.amount_var.set("100")
    um.from_unit, um.to_unit = "C", "F"
    um.convert()
    check("unit temp", um.result_amount.cget("text"), "212")

    # 汇率
    cm = calc.modes["汇率"]
    cm.amount_var.set("100")
    cm.from_var.set("CNY")
    cm.to_var.set("USD")
    cm.convert()
    check("currency convert", cm.result_amount.cget("text") != "", True)
    check("currency has HKD", "HKD" in cm.rates, True)

    calc.window.destroy()
except tk.TclError as e:
    print(f"SKIP UI tests (no display): {e}")

print(f"\n{passed} passed, {failed} failed")
exit(1 if failed else 0)
