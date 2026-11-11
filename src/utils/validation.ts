/**
 * Registration validation according to user requirements
 */

// Thai vowels and tone marks to detect real Thai words vs consonant spam
const THAI_VOWELS_TONES_REGEX = /[ะ-ูเ-ไ็-๎]/;
const REPETITIVE_CHARS_REGEX = /(.)\1{3,}/; // 4 or more identical characters
const KEYBOARD_MASH_REGEX = /(qwer|asdf|zxcv|1234|5678|ฟหกด|่าสว|ผปแอ|ๅภถุ)/i;

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export function validateFullName(name: string): ValidationResult {
  if (!name || name.trim() === '') {
    return { isValid: false, message: 'กรุณากรอกชื่อ-นามสกุล' };
  }

  const trimmed = name.trim();

  // Check for invalid characters (only Thai or English alphabets and space)
  const validCharsRegex = /^[a-zA-Z\u0E01-\u0E5B\s]+$/;
  if (!validCharsRegex.test(trimmed)) {
    return { isValid: false, message: 'ชื่อ-นามสกุลต้องเป็นตัวอักษรภาษาไทยหรือภาษาอังกฤษเท่านั้น ห้ามมีตัวเลขหรือสัญลักษณ์พิเศษ' };
  }

  // Split into first name and last name
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return { isValid: false, message: 'กรุณากรอกทั้งชื่อและนามสกุลโดยเว้นวรรค 1 ช่อง (เช่น สมชาย ใจดี)' };
  }

  // Check for keyboard mash / fake input
  for (const part of parts) {
    if (part.length < 2) {
      return { isValid: false, message: `ส่วนของชื่อหรือนามสกุล "${part}" สั้นเกินไป` };
    }

    if (REPETITIVE_CHARS_REGEX.test(part)) {
      return { isValid: false, message: 'ชื่อ-นามสกุลมีตัวอักษรซ้ำกันผิดปกติ กรุณากรอกชื่อจริงตามพจนานุกรม' };
    }

    if (KEYBOARD_MASH_REGEX.test(part.toLowerCase())) {
      return { isValid: false, message: 'ตรวจพบการพิมพ์มั่วแบบต่อเนื่องบนแป้นพิมพ์ กรุณากรอกชื่อ-นามสกุลที่ถูกต้อง' };
    }

    // If Thai language, check if it contains vowels or valid Thai tone patterns (not just consonant spam like "กขคงจฉ")
    const isThai = /[\u0E01-\u0E5B]/.test(part);
    if (isThai && part.length > 3) {
      if (!THAI_VOWELS_TONES_REGEX.test(part)) {
        // Words without vowels in Thai are very rare and short (e.g. นคร, พร, มน, นภ)
        const allowedVowellessThai = ['นคร', 'พร', 'มน', 'นภ', 'ศร', 'กล', 'พล', 'ดร', 'ภร', 'วร', 'กร', 'สถ'];
        if (!allowedVowellessThai.includes(part)) {
          return { isValid: false, message: `คำว่า "${part}" ไม่มีสระประกอบตามหลักภาษาไทย กรุณากรอกชื่อจริง` };
        }
      }
    }
  }

  return { isValid: true };
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: false, message: 'กรุณากรอกเบอร์โทรศัพท์' };
  }

  // Requirement: "ฟิกไส้ที่10ตัวอักษรเท่านั้น ห้าม!! มีขีดหรืออักขระพิเศษใดๆทั้งสิ้น"
  if (phone.includes('-') || phone.includes(' ') || phone.includes('+') || /[^\d]/.test(phone)) {
    return { isValid: false, message: 'เบอร์โทรต้องเป็นตัวเลข 10 หลักเท่านั้น ห้ามมีขีด (-) ช่องว่าง หรืออักขระพิเศษใดๆ ทั้งสิ้น' };
  }

  if (phone.length !== 10) {
    return { isValid: false, message: `เบอร์โทรต้องมี 10 หลักพอดี (ปัจจุบันมี ${phone.length} หลัก)` };
  }

  if (!phone.startsWith('0')) {
    return { isValid: false, message: 'เบอร์โทรศัพท์ในประเทศไทยต้องขึ้นต้นด้วยเลข 0 เสมอ' };
  }

  return { isValid: true };
}

export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, message: 'กรุณากรอกอีเมล' };
  }

  const trimmed = email.trim();

  // Requirement: "กำหนดให้อีเมลใส่ให้ครบและให้ตรวจสอบองค์ประกอบอีเมลให้ครบ"
  if (trimmed.includes(' ')) {
    return { isValid: false, message: 'อีเมลต้องไม่มีช่องว่าง' };
  }

  if (!trimmed.includes('@')) {
    return { isValid: false, message: 'อีเมลต้องมีเครื่องหมาย @' };
  }

  const atParts = trimmed.split('@');
  if (atParts.length !== 2) {
    return { isValid: false, message: 'อีเมลต้องมีเครื่องหมาย @ เพียงตัวเดียว' };
  }

  const [localPart, domainPart] = atParts;
  if (!localPart || localPart.length < 1) {
    return { isValid: false, message: 'กรุณาระบุชื่อผู้ใช้อีเมลก่อนเครื่องหมาย @' };
  }

  if (!domainPart || !domainPart.includes('.')) {
    return { isValid: false, message: 'ส่วนของโดเมนหลัง @ ต้องมีเครื่องหมายจุดและนามสกุลโดเมน (เช่น gmail.com)' };
  }

  const domainSubparts = domainPart.split('.');
  const tld = domainSubparts[domainSubparts.length - 1];
  if (!tld || tld.length < 2) {
    return { isValid: false, message: 'นามสกุลโดเมนไม่ถูกต้อง (เช่น .com, .co.th)' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบองค์ประกอบของอีเมล' };
  }

  return { isValid: true };
}

export function generateUserId(): string {
  // รหัสประจำตัวผู้ใช้งานประมวลให้อัตโนมัติ เช่น BT-12845
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `BT-${randomNum}`;
}
