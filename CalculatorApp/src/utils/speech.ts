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

export function speakResult(value: string): void {
  Speech.speak(value, SPEECH_OPTIONS);
}

export function stopSpeech(): void {
  Speech.stop();
}
