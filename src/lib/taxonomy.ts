export interface FieldEntry {
  code: string;
  name: string;
  aliases: string[];
}

export const FIELD_TAXONOMY: FieldEntry[] = [
  { code: 'IT', name: 'Công nghệ thông tin', aliases: ['cntt', 'computer science', 'khoa học máy tính'] },
  { code: 'BIZ', name: 'Kinh doanh', aliases: ['business', 'kinh tế', 'quản trị kinh doanh', 'mba'] },
  { code: 'ENG', name: 'Kỹ thuật', aliases: ['engineering', 'cơ khí', 'điện', 'kỹ sư'] },
  { code: 'MED', name: 'Y dược', aliases: ['medicine', 'y khoa', 'dược', 'bác sĩ'] },
  { code: 'EDU', name: 'Giáo dục', aliases: ['education', 'sư phạm', 'giảng dạy'] },
  { code: 'ART', name: 'Nghệ thuật', aliases: ['arts', 'thiết kế', 'kiến trúc'] },
  { code: 'SCI', name: 'Khoa học cơ bản', aliases: ['science', 'toán', 'lý', 'hóa', 'sinh'] }
];

export function findFieldByCode(code: string): FieldEntry | undefined {
  return FIELD_TAXONOMY.find(f => f.code === code);
}

export function findFieldByName(name: string): FieldEntry | undefined {
  const searchName = name.toLowerCase();
  return FIELD_TAXONOMY.find(f => 
    f.name.toLowerCase() === searchName || 
    f.aliases.some(alias => searchName.includes(alias) || alias.includes(searchName))
  );
}

export function matchFieldCodes(text: string): string[] {
  const lowerText = text.toLowerCase();
  const matched = new Set<string>();
  
  for (const field of FIELD_TAXONOMY) {
    if (lowerText.includes(field.name.toLowerCase())) {
      matched.add(field.code);
    } else {
      for (const alias of field.aliases) {
        if (lowerText.includes(alias)) {
          matched.add(field.code);
          break;
        }
      }
    }
  }
  
  return Array.from(matched);
}

export function getFieldName(code: string): string {
  const field = findFieldByCode(code);
  return field ? field.name : code;
}

export function getAllFieldOptions(): {value: string, label: string}[] {
  return FIELD_TAXONOMY.map(f => ({
    value: f.code,
    label: f.name
  }));
}
