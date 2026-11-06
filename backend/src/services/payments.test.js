import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { normalizePayments, summarizePayments } from './payments.js'

test('pagos combinados y decimales suman una sola venta', () => {
  const payments = normalizePayments([{ method: 'Efectivo', amount: 30.1 }, { method: 'Virtual', amount: 69.9 }], 100)
  assert.deepEqual(summarizePayments([{ total: 100, payments }]), { cashSales: 30.1, virtualSales: 69.9, totalSales: 100, paymentTotals: { Efectivo: 30.1, Virtual: 69.9 } })
  assert.equal(normalizePayments([{ method: 'Efectivo', amount: .1 }, { method: 'Virtual', amount: .2 }], .3).length, 2)
  assert.deepEqual(normalizePayments('Tarjeta', 100, ['Tarjeta']), [{ method: 'Tarjeta', amount: 100 }])
})

test('el vuelto se excluye del ingreso y los clientes antiguos siguen funcionando', () => {
  assert.deepEqual(normalizePayments([{ method: 'Efectivo', amount: 200 }], 100), [{ method: 'Efectivo', amount: 100 }])
  assert.deepEqual(normalizePayments('Virtual', 100), [{ method: 'Virtual', amount: 100 }])
  assert.deepEqual(summarizePayments([{ paymentMethod: 'Efectivo', total: 10 }, { paymentMethod: 'Virtual', total: 20 }]), { cashSales: 10, virtualSales: 20, totalSales: 30, paymentTotals: { Efectivo: 10, Virtual: 20 } })
})

test('rechaza pagos incompletos, excedidos, duplicados e importes inválidos', () => {
  for (const input of [[], null, [{ method: 'Otro', amount: 100 }], [{ method: 'Efectivo', amount: -1 }], [{ method: 'Efectivo', amount: Infinity }], [{ method: 'Virtual', amount: '100' }], [{ method: 'Virtual', amount: 100.001 }], [{ method: 'Virtual', amount: 101 }], [{ method: 'Efectivo', amount: 10 }, { method: 'Virtual', amount: 10 }], [{ method: 'Efectivo', amount: 60 }, { method: 'Virtual', amount: 60 }], [{ method: 'Efectivo', amount: 50 }, { method: 'Efectivo', amount: 50 }], [{ method: 'Efectivo', amount: 0 }, { method: 'Virtual', amount: 100 }]]) {
    assert.throws(() => normalizePayments(input, 100))
  }
})

test('persistencia, stock, arqueo e historial con base temporal aislada', async () => {
  // Nunca conecta con Turso ni usa las credenciales de desarrollo.
  const directory = await mkdtemp(join(tmpdir(), 'provet-payments-test-'))
  process.env.TURSO_DATABASE_URL = pathToFileURL(join(directory, 'test.db')).href
  process.env.TURSO_AUTH_TOKEN = ''
  const { client } = await import('../config/db.js')
  const { store } = await import('./store.service.js')
  try {
    for (const migration of ['0000_initial', '0001_repair_initial_schema', '0002_sale_payments', '0003_myvete_catalog', '0004_statistics', '0005_configuration', '0006_sale_idempotency', '0007_multiple_cash_shifts', '0008_default_payment_methods', '0009_audit_events']) {
      await client.executeMultiple(await readFile(new URL(`../../drizzle/${migration}.sql`, import.meta.url), 'utf8'))
    }
    await client.execute("INSERT INTO users VALUES ('admin', 'Admin', 'Prueba', 'test', 'test', 'unused', 'ADMIN', 1, '2026-10-30', '2026-10-30')")
    await client.execute("INSERT INTO products (id, name, barcode, supplier, laboratory, cost, sale_price, stock, min_stock, active, created_at, updated_at) VALUES ('product', 'Producto prueba', '00123', 'Proveedor', 'Laboratorio', 10, 100, 10, 1, 1, '2026-10-30', '2026-10-30')")
    assert.equal((await store.findProductByBarcode(' 00123 ')).id, 'product')
    await assert.rejects(store.findProductByBarcode('99999'), { message: 'Producto no encontrado.' })
    await store.openCash(50, 'admin')
    const sale = await store.createSale([{ productId: 'product', quantity: 1 }], [{ method: 'Efectivo', amount: 30 }, { method: 'Virtual', amount: 70 }], 'admin', 'reintento-venta-1')
    assert.equal(sale.paymentMethod, 'Combinado')
    const retry = await store.createSale([{ productId: 'product', quantity: 1 }], [{ method: 'Efectivo', amount: 30 }, { method: 'Virtual', amount: 70 }], 'admin', 'reintento-venta-1')
    assert.equal(retry.id, sale.id)
    const combinedLine = await store.createSale([{ productId: 'product', quantity: 1 }, { productId: 'product', quantity: 2 }], 'Virtual', 'admin')
    assert.equal(combinedLine.items[0].quantity, 3)
    let summary = await store.currentCash()
    assert.equal(summary.cashSales, 30)
    assert.equal(summary.virtualSales, 370)
    assert.equal(summary.totalSales, 400)
    assert.equal(summary.expectedCash, 80)
    assert.equal(summary.tickets[0].payments.length, 2)
    assert.equal((await store.listProducts())[0].stock, 6)
    await assert.rejects(store.createSale([{ productId: 'product', quantity: 1 }], [{ method: 'Virtual', amount: 90 }], 'admin'))
    assert.equal((await store.listProducts())[0].stock, 6)
    assert.equal((await store.currentCash()).tickets.length, 2)
    await client.execute("CREATE TRIGGER reject_payment BEFORE INSERT ON sale_payments WHEN NEW.method = 'Virtual' BEGIN SELECT RAISE(ABORT, 'test payment failure'); END")
    await assert.rejects(store.createSale([{ productId: 'product', quantity: 1 }], 'Virtual', 'admin'))
    assert.equal((await store.currentCash()).tickets.length, 2)
    assert.equal((await store.listProducts())[0].stock, 6)
    await client.execute('DROP TRIGGER reject_payment')
    await assert.rejects(store.createSale([{ productId: 'product', quantity: .5 }], 'Virtual', 'admin'), /cantidades/)
    assert.equal((await store.currentCash()).tickets.length, 2)
    await store.createSale([{ productId: 'product', quantity: 1 }], [{ method: 'Efectivo', amount: 200 }], 'admin')
    await store.closeCash(180, 'admin')
    summary = (await store.history())[0]
    assert.equal(summary.cashSales, 130)
    assert.equal(summary.virtualSales, 370)
    assert.equal(summary.totalSales, 500)
    assert.equal(summary.expectedCash, 180)
    assert.equal(summary.tickets.length, 3)
    assert.equal(await store.currentCash(), null)
    await assert.rejects(store.closeCash(180, 'admin'), /No hay una caja abierta/)
    const nextShift = await store.openCash(10, 'admin')
    assert.equal(nextShift.initialAmount, 10)
    await client.execute("INSERT INTO settings_catalog (id, type, name, active, created_at, updated_at) VALUES ('card', 'payment', 'Tarjeta', 1, '2026-10-30', '2026-10-30'), ('disabled', 'payment', 'Cheque', 0, '2026-10-30', '2026-10-30')")
    await assert.rejects(store.createSale([{ productId: 'product', quantity: 1 }], 'Cheque', 'admin'), /inactivo/)
    const cardSale = await store.createSale([{ productId: 'product', quantity: 1 }], 'Tarjeta', 'admin')
    assert.equal(cardSale.payments[0].method, 'Tarjeta')
    assert.equal((await store.currentCash()).paymentTotals.Tarjeta, 100)
    const monthlyHistory = await store.statisticsHistory('month')
    const weeklyHistory = await store.statisticsHistory('week')
    assert.equal(monthlyHistory.length, 1)
    assert.equal(weeklyHistory.length, 1)
    assert.equal(monthlyHistory[0].cashCloseCount, 1)
    const auditEvents = await store.listAudit(100)
    assert.deepEqual(new Set(auditEvents.map((event) => event.type)), new Set(['CASH_OPEN', 'CASH_CLOSE', 'SALE']))
  } finally { client.close(); await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) }
})
