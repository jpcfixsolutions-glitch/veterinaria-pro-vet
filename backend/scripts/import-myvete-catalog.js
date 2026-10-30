import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { eq } from 'drizzle-orm'
import { db } from '../src/config/db.js'
import { products } from '../src/models/index.js'
import { id } from '../src/utils/http.js'

const source = process.argv.slice(2).find((value) => !value.startsWith('--'))
const dryRun = !process.argv.includes('--apply')
if (!source) throw new Error('Uso: pnpm import:myvete <archivo.xlsx> [--apply]')
const xml = (value = '') => value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
const unzip = (buffer) => {
  const files = new Map(); let offset = 0
  while (offset < buffer.length - 30) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) { offset++; continue }
    const method = buffer.readUInt16LE(offset + 8); const compressed = buffer.readUInt32LE(offset + 18); const nameSize = buffer.readUInt16LE(offset + 26); const extraSize = buffer.readUInt16LE(offset + 28); const name = buffer.subarray(offset + 30, offset + 30 + nameSize).toString(); const start = offset + 30 + nameSize + extraSize
    files.set(name, (method === 8 ? zlib.inflateRawSync(buffer.subarray(start, start + compressed)) : buffer.subarray(start, start + compressed)).toString()); offset = start + compressed
  }
  return files
}
const column = (ref) => ref.replace(/\d/g, '').split('').reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1
const parseSheet = (sheet, shared) => [...sheet.matchAll(/<(?:\w+:)?row[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g)].map(([, body]) => {
  const values = []; for (const [, attributes, cell] of body.matchAll(/<(?:\w+:)?c\b(?![^>]*\/>)\s*([^>]*)>([\s\S]*?)<\/(?:\w+:)?c>/g)) { const ref = /\br="([A-Z]+\d+)"/.exec(attributes)?.[1]; const type = /\bt="([^"]+)"/.exec(attributes)?.[1]; if (!ref) continue; const raw = /<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/.exec(cell)?.[1] ?? /<(?:\w+:)?t[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/.exec(cell)?.[1] ?? ''; values[column(ref)] = type === 's' ? shared[Number(raw)] : xml(raw) } return values })
const files = unzip(fs.readFileSync(path.resolve(source)))
const shared = [...(files.get('xl/sharedStrings.xml') || '').matchAll(/<(?:\w+:)?si>([\s\S]*?)<\/(?:\w+:)?si>/g)].map(([, item]) => xml([...item.matchAll(/<(?:\w+:)?t[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)].map((match) => match[1]).join('')))
const workbook = files.get('xl/workbook.xml') || ''
const sheet = [...workbook.matchAll(/<(?:\w+:)?sheet[^>]*name="([^"]+)"[^>]*sheetId="(\d+)"/g)].find((match) => match[1] === 'Respaldo completo')
if (!sheet) throw new Error('No se encontró la hoja “Respaldo completo”.')
const [headers, ...rows] = parseSheet(files.get(`xl/worksheets/sheet${sheet[2]}.xml`) || '', shared); const fields = Object.fromEntries(headers.map((header, index) => [header, index]))
const read = (row, key) => row[fields[key]] === '' || row[fields[key]] === undefined ? null : row[fields[key]]
const clean = (value) => value === null ? null : String(value).trim() || null
const num = (value) => value === null || /^#N\/A$/i.test(String(value).trim()) ? null : Number(value)
const round = (value) => Math.round(Number(value) * 100) / 100
const result = { mode: dryRun ? 'dry-run' : 'apply', sourceRows: rows.length, inserted: 0, updated: 0, skipped: 0, errors: 0, sourceStockUnavailable: 0, invalidFields: {} }
const existingByExternalId = dryRun ? new Map() : new Map((await db.select({ id: products.id, externalProductId: products.externalProductId }).from(products).all()).filter((row) => row.externalProductId).map((row) => [row.externalProductId, row.id]))
const pending = []
const flush = async () => { if (pending.length) await db.batch(pending.splice(0, pending.length)) }
for (const row of rows) {
  const externalProductId = clean(read(row, 'ProductId')); const name = clean(read(row, 'ProductName')); const cost = num(read(row, 'CostPrice')); const salePrice = num(read(row, 'SellingPrice')); const stock = num(read(row, 'Stock')); const minStock = num(read(row, 'MinStock'))
  if (!externalProductId || !name) { result.skipped++; continue }
  if (![cost, salePrice, minStock].every((value) => Number.isFinite(value) && value >= 0)) { result.errors++; for (const [key, value] of Object.entries({ cost, salePrice, minStock })) if (!Number.isFinite(value) || value < 0) result.invalidFields[key] = (result.invalidFields[key] || 0) + 1; continue }
  if (!Number.isFinite(stock) || stock < 0) result.sourceStockUnavailable++
  const status = clean(read(row, 'ProductStatus'))
  const sourceStock = Number.isFinite(stock) && stock >= 0 ? Math.trunc(stock) : null
  const record = { name, barcode: clean(read(row, 'ProductBarCode')) || `MYVETE-${externalProductId}`, productCode: clean(read(row, 'ProductCode')), externalProductId, externalLocationId: clean(read(row, 'ProductLocationId')), category: clean(read(row, 'ProductCategoryName')), supplier: clean(read(row, 'SupplierIds')) || 'Sin asignar', supplierData: clean(read(row, 'ProductSuppliersJSON')), laboratory: clean(read(row, 'ManufacturerName')) || 'Sin asignar', productStatus: status, cost: round(cost), profitabilityPercentage: cost > 0 ? round(((salePrice - cost) / cost) * 100) : null, salePrice: round(salePrice), stock: sourceStock ?? 0, sourceStock, minStock: Math.trunc(minStock), sourceMinStock: Math.trunc(minStock), active: status !== 'I', updatedAt: new Date().toISOString() }
  if (dryRun) { result.inserted++; continue }
  const existing = existingByExternalId.get(externalProductId)
  if (existing) { pending.push(db.update(products).set(record).where(eq(products.id, existing))); result.updated++ } else { pending.push(db.insert(products).values({ id: id('PRD'), ...record, createdAt: new Date().toISOString() })); result.inserted++ }
  if (pending.length === 75) await flush()
}
await flush()
console.log(JSON.stringify(result, null, 2))
