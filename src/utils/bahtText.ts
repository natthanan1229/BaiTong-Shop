/**
 * Thai BahtText converter matching Excel =BAHTTEXT(number)
 */
const THAI_NUMBERS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const THAI_DIGITS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function convertGroup(numStr: string): string {
  let result = '';
  const len = numStr.length;
  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr[i], 10);
    const pos = len - i - 1;
    if (digit === 0) continue;

    if (pos === 1 && digit === 1) {
      result += 'สิบ';
    } else if (pos === 1 && digit === 2) {
      result += 'ยี่สิบ';
    } else if (pos === 0 && digit === 1 && len > 1 && numStr[len - 2] !== '0') {
      result += 'เอ็ด';
    } else {
      result += THAI_NUMBERS[digit] + THAI_DIGITS[pos];
    }
  }
  return result;
}

export function bahtText(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return 'ศูนย์บาทถ้วน';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const parts = absAmount.toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  let result = '';

  // Process integer part in chunks of 6 digits (ล้าน)
  let intStr = integerPart;
  const chunks: string[] = [];
  while (intStr.length > 0) {
    const start = Math.max(0, intStr.length - 6);
    chunks.unshift(intStr.substring(start));
    intStr = intStr.substring(0, start);
  }

  for (let i = 0; i < chunks.length; i++) {
    const groupText = convertGroup(chunks[i]);
    result += groupText;
    if (i < chunks.length - 1 && groupText !== '') {
      result += 'ล้าน';
    }
  }

  if (result === '') {
    result = 'ศูนย์';
  }

  result += 'บาท';

  const satang = parseInt(decimalPart, 10);
  if (satang === 0) {
    result += 'ถ้วน';
  } else {
    result += convertGroup(decimalPart) + 'สตางค์';
  }

  return (isNegative ? 'ลบ' : '') + result;
}
