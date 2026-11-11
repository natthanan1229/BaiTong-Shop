import { Product, FormulaConfig } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', barcode: 'ST001', name: 'ปากกาสีน้ำเงิน', unit: 'ด้าม', costPrice: 5, sellPrice: 10, stockQty: 5, status: 'สั่งซื้อ', category: 'ปากกาและดินสอ' },
  { id: '2', barcode: 'ST002', name: 'ปากกาสีแดง', unit: 'ด้าม', costPrice: 5, sellPrice: 10, stockQty: 5, status: 'สั่งซื้อ', category: 'ปากกาและดินสอ' },
  { id: '3', barcode: 'ST003', name: 'ปากกาสีดำ', unit: 'ด้าม', costPrice: 5, sellPrice: 10, stockQty: 5, status: 'สั่งซื้อ', category: 'ปากกาและดินสอ' },
  { id: '4', barcode: 'ST004', name: 'ดินสอ HB', unit: 'แท่ง', costPrice: 4, sellPrice: 8, stockQty: 4, status: 'สั่งซื้อ', category: 'ปากกาและดินสอ' },
  { id: '5', barcode: 'ST005', name: 'ดินสอ 2B', unit: 'แท่ง', costPrice: 5, sellPrice: 10, stockQty: 5, status: 'สั่งซื้อ', category: 'ปากกาและดินสอ' },
  { id: '6', barcode: 'ST006', name: 'ยางลบ', unit: 'อัน', costPrice: 3, sellPrice: 5, stockQty: 3, status: 'สั่งซื้อ', category: 'อุปกรณ์ลบและแก้ไข' },
  { id: '7', barcode: 'ST007', name: 'ไม้บรรทัด 15 ซม.', unit: 'อัน', costPrice: 5, sellPrice: 10, stockQty: 5, status: 'สั่งซื้อ', category: 'อุปกรณ์วัด' },
  { id: '8', barcode: 'ST008', name: 'ไม้บรรทัด 30 ซม.', unit: 'อัน', costPrice: 8, sellPrice: 15, stockQty: 8, status: 'สั่งซื้อ', category: 'อุปกรณ์วัด' },
  { id: '9', barcode: 'ST009', name: 'สมุดปกอ่อน', unit: 'เล่ม', costPrice: 12, sellPrice: 20, stockQty: 12, status: 'ปกติ', category: 'สมุดและกระดาษ' },
  { id: '10', barcode: 'ST010', name: 'สมุดปกแข็ง', unit: 'เล่ม', costPrice: 25, sellPrice: 35, stockQty: 25, status: 'ปกติ', category: 'สมุดและกระดาษ' },
  { id: '11', barcode: 'ST011', name: 'สมุดรายงาน', unit: 'เล่ม', costPrice: 15, sellPrice: 25, stockQty: 15, status: 'ปกติ', category: 'สมุดและกระดาษ' },
  { id: '12', barcode: 'ST012', name: 'กระดาษ A4', unit: 'รีม', costPrice: 90, sellPrice: 110, stockQty: 90, status: 'ปกติ', category: 'สมุดและกระดาษ' },
  { id: '13', barcode: 'ST013', name: 'กระดาษสี', unit: 'ห่อ', costPrice: 25, sellPrice: 35, stockQty: 25, status: 'ปกติ', category: 'สมุดและกระดาษ' },
  { id: '14', barcode: 'ST014', name: 'แฟ้มใส', unit: 'เล่ม', costPrice: 5, sellPrice: 10, stockQty: 5, status: 'สั่งซื้อ', category: 'แฟ้มและจัดเก็บ' },
  { id: '15', barcode: 'ST015', name: 'แฟ้มสันกว้าง', unit: 'เล่ม', costPrice: 25, sellPrice: 35, stockQty: 25, status: 'ปกติ', category: 'แฟ้มและจัดเก็บ' },
  { id: '16', barcode: 'ST016', name: 'กาวแท่ง', unit: 'อัน', costPrice: 10, sellPrice: 15, stockQty: 10, status: 'สั่งซื้อ', category: 'กาวและเทป' },
  { id: '17', barcode: 'ST017', name: 'กาวน้ำ', unit: 'อัน', costPrice: 8, sellPrice: 12, stockQty: 8, status: 'สั่งซื้อ', category: 'กาวและเทป' },
  { id: '18', barcode: 'ST018', name: 'กรรไกร', unit: 'อัน', costPrice: 15, sellPrice: 25, stockQty: 15, status: 'ปกติ', category: 'อุปกรณ์ตัด' },
  { id: '19', barcode: 'ST019', name: 'คัตเตอร์', unit: 'อัน', costPrice: 10, sellPrice: 18, stockQty: 10, status: 'สั่งซื้อ', category: 'อุปกรณ์ตัด' },
  { id: '20', barcode: 'ST020', name: 'เทปลบคำผิด', unit: 'อัน', costPrice: 12, sellPrice: 20, stockQty: 12, status: 'ปกติ', category: 'อุปกรณ์ลบและแก้ไข' },
  { id: '21', barcode: 'ST021', name: 'เทปใส', unit: 'อัน', costPrice: 8, sellPrice: 15, stockQty: 8, status: 'สั่งซื้อ', category: 'กาวและเทป' },
  { id: '22', barcode: 'ST022', name: 'ปากกาเน้นข้อความ', unit: 'ด้าม', costPrice: 10, sellPrice: 18, stockQty: 10, status: 'สั่งซื้อ', category: 'ปากกาและดินสอ' },
  { id: '23', barcode: 'ST023', name: 'ปากกาเมจิก', unit: 'ด้าม', costPrice: 12, sellPrice: 20, stockQty: 12, status: 'ปกติ', category: 'ปากกาและดินสอ' },
  { id: '24', barcode: 'ST024', name: 'สีไม้ 12 สี', unit: 'กล่อง', costPrice: 25, sellPrice: 35, stockQty: 25, status: 'ปกติ', category: 'อุปกรณ์ศิลปะ' },
  { id: '25', barcode: 'ST025', name: 'สีเทียน 12 สี', unit: 'กล่อง', costPrice: 20, sellPrice: 30, stockQty: 20, status: 'ปกติ', category: 'อุปกรณ์ศิลปะ' },
  { id: '26', barcode: 'ST026', name: 'ดินสอกด', unit: 'แท่ง', costPrice: 15, sellPrice: 25, stockQty: 15, status: 'ปกติ', category: 'ปากกาและดินสอ' },
  { id: '27', barcode: 'ST027', name: 'ไส้ดินสอกด', unit: 'อัน', costPrice: 10, sellPrice: 18, stockQty: 10, status: 'สั่งซื้อ', category: 'ปากกาและดินสอ' },
  { id: '28', barcode: 'ST028', name: 'เครื่องเย็บกระดาษ', unit: 'อัน', costPrice: 30, sellPrice: 45, stockQty: 30, status: 'ปกติ', category: 'อุปกรณ์สำนักงาน' },
  { id: '29', barcode: 'ST029', name: 'ลวดเย็บกระดาษ', unit: 'กล่อง', costPrice: 8, sellPrice: 15, stockQty: 8, status: 'สั่งซื้อ', category: 'อุปกรณ์สำนักงาน' },
  { id: '30', barcode: 'ST030', name: 'คลิปหนีบกระดาษ', unit: 'กล่อง', costPrice: 10, sellPrice: 18, stockQty: 10, status: 'สั่งซื้อ', category: 'อุปกรณ์สำนักงาน' }
];

export const INITIAL_FORMULA_CONFIG: FormulaConfig = {
  reorderThreshold: 12, // Excel IF(Stock < 12, "สั่งซื้อ", "")
  autoCalculation: true,
  vatRate: 0
};
