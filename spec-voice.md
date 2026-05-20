# Spec: 计算器语音播报功能

## Objective

为基础/科学计算模式添加语音播报。每次按下数字键、操作符键或计算结果时，通过系统 TTS 引擎发出清晰的中文语音反馈，提升听觉交互体验。

用户已确认的需求：
- **播报范围**：数字键 + 操作符（÷×-+=%）+ 结果
- **播报格式**：多位数字逐个读（123 → "一二三"），结果读完整数值（123 → "一百二十三"），= 读"等于"，% 读"百分之"
- **语音开关**：不需要开关，始终开启
- **无语音场景**：汇率转换、历史记录、科学函数按键、C/± 不播报

## Tech Stack

- `expo-speech`（~v13.0，内置于 Expo SDK 生态，调用系统原生 TTS）
- 中文语音：`language: 'zh-CN'`
- 语速：`rate: 0.75`（略慢于默认，更清晰）

## Commands

```bash
npx expo install expo-speech    # 安装语音模块
npm test                         # 63 项测试应全部通过
npx tsc --noEmit                 # 类型检查通过
```

## Project Structure

新增 1 个文件，修改 2 个文件：

```
CalculatorApp/src/
├── utils/
│   ├── calculator.ts
│   ├── rates.ts
│   └── speech.ts          ← 新增：语音播报工具函数
├── hooks/
│   └── useCalculator.ts   ← 修改：暴露 lastResult
├── screens/
│   └── CalculatorScreen.tsx ← 修改：onButtonPress 中调用语音
```

## Code Style

### speech.ts 设计

```typescript
// 数字到中文单字映射（逐个数字朗读）
const DIGIT_TO_CHINESE: Record<string, string> = {
  '0': '零', '1': '一', '2': '二', '3': '三', '4': '四',
  '5': '五', '6': '六', '7': '七', '8': '八', '9': '九',
  '.': '点',
};

// 操作符映射
const OPERATOR_TO_SPEECH: Record<string, string> = {
  '+': '加', '-': '减', '×': '乘', '÷': '除', '=': '等于', '%': '百分之',
};

export function speakDigit(digit: string): void;
export function speakOperator(op: string): void;
export function speakResult(value: string): void;
```

### 结果播报

结果使用完整数值朗读，由系统 TTS 引擎自动处理数字到中文的转换：
```
Speech.speak("123", { language: 'zh-CN', rate: 0.75 })
→ 系统读出「一百二十三」
```

### 数字输入播报

每按一个数字读对应的中文单字，避免连续输入时读完整数字造成混淆：
```
用户按 1 → "一"
用户按 2 → "二"  
用户按 3 → "三"
```

### 操作符播报

```
用户按 + → "加"
用户按 ÷ → "除"
```

### 结果播报时机

`handleEquals` 返回后通过 `useEffect` 监听 `lastResult` 状态变化来触发播报，
避免在状态更新前读取过时的 `display` 值。

## 改动文件详情

### 新增：`src/utils/speech.ts`

- `speakDigit(digit: string)` — 查 DIGIT_TO_CHINESE 映射表后调用 `Speech.speak()`
- `speakOperator(op: string)` — 查 OPERATOR_TO_SPEECH 映射表后调用 `Speech.speak()`
- `speakResult(value: string)` — 直接传入数字字符串，zh-CN 引擎自动读完整数值
- `.`（小数点）映射为"点"

### 修改：`src/hooks/useCalculator.ts`

- 新增 `lastResult` 状态（`string | null`）
- `handleEquals` 计算成功后调用 `setLastResult(result.currentInput)`；失败设 `lastResult = '错误'`
- `handleDigit`/`handleOperation` 时清空 `lastResult`
- 暴露 `lastResult` 到返回值

### 修改：`src/utils/speech.ts`

- `OPERATOR_TO_SPEECH` 增加 `'=': '等于'` 和 `'%': '百分之'`

### 修改：`src/screens/CalculatorScreen.tsx`

- `equals` action 增加 `speakOperator('=')` 调用，在 `handleEquals()` 之前
- `percent` action 增加 `speakOperator('%')` 调用，在 `handlePercent()` 之前
- 语音顺序：= → "等于" → 结果语音（自动排队）

## Testing Strategy

- **speech.ts** 纯函数可测：验证 `speakDigit('3')` 能正确映射到中文
- 实际语音输出依赖原生 TTS 引擎，不在单元测试范围内（跳过模拟）
- 回归测试：63 项现有测试应全部通过

## Boundaries

- **Always do:** 语音播报在基础/科学模式下激活；数字逐个读，结果完整读；检查 `expo-speech` 是否已初始化
- **Ask first:** 增加其他语音事件（如科学函数、清空）；添加语音设置页面；更换 TTS 库
- **Never do:** 在汇率/历史模式下播报；阻塞 UI 等待语音完成；不处理 TTS 初始化失败

## Success Criteria

- [ ] 按数字键 1-9、0 时播放对应中文单字语音
- [ ] 按小数点时播放"点"
- [ ] 按 ÷×-+ 时播放"除/乘/减/加"
- [ ] 按 = 时先播"等于"，然后播报计算结果（如"一百二十三"）
- [ ] 按 % 时播报"百分之"
- [ ] 多位输入时逐个数字播报（123 → "一二三"）
- [ ] 除以零时播报"错误"
- [ ] 63 项现有测试全部通过
- [ ] TypeScript 编译无错误
