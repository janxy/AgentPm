/**
 * CSV 导出工具
 * 与 excel.ts 保持相同列定义风格，导出带 BOM 的 UTF-8 CSV，避免 Excel 打开中文乱码。
 */

export interface CsvColumn<T> {
  header: string
  field: keyof T
}

/**
 * 按列定义导出 CSV 文件
 * @param columns 列定义（决定表头与列顺序）
 * @param rows 数据记录数组
 * @param fileName 导出文件名（不含扩展名）
 */
export function exportToCsv<T extends Record<string, any>>(
  columns: CsvColumn<T>[],
  rows: T[],
  fileName: string
): void {
  const escape = (value: any) => {
    const text = String(value ?? '')
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const header = columns.map((column) => column.header).join(',')
  const body = rows.map((row) => columns.map((column) => escape(row[column.field])).join(','))
  const csv = `\uFEFF${[header, ...body].join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
