import * as Speech from 'expo-speech';

const DIGIT_TO_CHINESE: Record<string, string> = {
  '0': '零',
  '1': '一',
  '2': '二',
  '3': '三',
  '4': '四',
  '5': '五',
  '6': '六',
  '7': '七',
  '8': '八',
  '9': '九',
  '.': '点',
};

const OPERATOR_TO_SPEECH: Record<string, string> = {
  '+': '加',
  '-': '减',
  '×': '乘',
  '÷': '除',
  '=': '等于',
  '%': '百分之',
};

const SCIENTIFIC_TO_SPEECH: Record<string, string> = {
  '⌫': '退格',
  '(': '左括号',
  ')': '右括号',
  DEG: '角度制',
  RAD: '弧度制',
  'n!': '阶乘',
  'π': '派',
  'e': '自然常数',
  '|x|': '绝对值',
  '1/x': '倒数',
  'x²': '平方',
  'x³': '立方',
  'xʸ': '幂',
  '√': '平方根',
  '∛': '立方根',
  'log': '常用对数',
  'ln': '自然对数',
  'eˣ': 'e 的指数',
  'sin': '正弦',
  'cos': '余弦',
  'tan': '正切',
  '10ˣ': '10 的指数',
};

const SPEECH_OPTIONS: Speech.SpeechOptions = {
  language: 'zh-CN',
  rate: 0.75,
};

export function speakDigit(digit: string): void {
  const text = DIGIT_TO_CHINESE[digit];
  if (!text) return;
  Speech.speak(text, SPEECH_OPTIONS);
}

export function speakOperator(op: string): void {
  const text = OPERATOR_TO_SPEECH[op];
  if (!text) return;
  Speech.speak(text, SPEECH_OPTIONS);
}

export function speakScientific(func: string): void {
  const text = SCIENTIFIC_TO_SPEECH[func];
  if (!text) return;
  Speech.speak(text, SPEECH_OPTIONS);
}

export function speakText(text: string): void {
  if (!text) return;
  Speech.speak(text, SPEECH_OPTIONS);
}

export function speakResult(value: string): void {
  const text = value
    .split('')
    .map((ch) => (ch === '-' ? '负' : DIGIT_TO_CHINESE[ch] ?? ch))
    .join('');
  Speech.speak(text, SPEECH_OPTIONS);
}

export function stopSpeech(): void {
  Speech.stop();
}
