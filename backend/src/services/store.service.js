import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { db } from '../config/db.js'
import { auditEvents, cashMovements, cashRegisters, expenses, fixedExpenses, products, saleItems, salePayments, sales, settingsCatalog, users } from '../models/index.js'
import { normalizePayments, summarizePayments } from './payments.js'
import { env } from '../config/env.js'
import { AppError, id } from '../utils/http.js'
const cleanUser = ({ passwordHash, ...user }) => user
const date = () => new Date().toISOString().slice(0, 10)
const ensure = (condition, message) => { if (!condition) throw new AppError(message) }
const money = (value) => Math.round(Number(value) * 100) / 100
const audit = (executor, userId, type, description, amount = null) => executor.insert(auditEvents).values({ id: id('aud'), userId, type, description, amount, createdAt: new Date().toISOString() })
const profitability = (cost, salePrice) => {
  const base = Number(cost)
  return Number.isFinite(base) && base > 0 ? money(((Number(salePrice) - base) / base) * 100) : null
}
const productValues = (input) => {
  ensure(input.name?.trim(), 'Completá el nombre del producto.')
  const cost = Number(input.cost); const salePrice = Number(input.salePrice); const stock = Number(input.stock); const minStock = Number(input.minStock)
  ensure(Number.isFinite(cost) && Number.isFinite(salePrice) && cost >= 0 && salePrice >= 0 && Number.isSafeInteger(stock) && Number.isSafeInteger(minStock) && stock >= 0 && minStock >= 0, 'Los importes deben ser válidos y el stock debe contener unidades enteras iguales o mayores a cero.')
  const externalProductId = input.externalProductId ? String(input.externalProductId) : null
  return { name: input.name.trim(), barcode: input.barcode?.trim() || (externalProductId ? `MYVETE-${externalProductId}` : ''), productCode: input.productCode?.trim() || null, externalProductId, externalLocationId: input.externalLocationId ? String(input.externalLocationId) : null, category: input.category?.trim() || null, supplier: input.supplier?.trim() || 'Sin asignar', supplierData: input.supplierData || null, laboratory: input.laboratory?.trim() || 'Sin asignar', productStatus: input.productStatus?.trim() || null, cost: money(cost), profitabilityPercentage: profitability(cost, salePrice), salePrice: money(salePrice), stock, sourceStock: stock, minStock, sourceMinStock: minStock, active: input.active !== false, updatedAt: new Date().toISOString() }
}
const cashSummary = async (cash) => {
  if (!cash) return null
  const rows = await db.select({ id: sales.id, createdAt: sales.createdAt, createdById: sales.createdById, paymentMethod: sales.paymentMethod, total: sales.total }).from(sales).where(eq(sales.cashRegisterId, cash.id))
  const saleIds = rows.map((row) => row.id)
  const itemRows = rows.length ? await db.select().from(saleItems).where(inArray(saleItems.saleId, saleIds)) : []
  const paymentRows = rows.length ? await db.select().from(salePayments).where(inArray(salePayments.saleId, saleIds)) : []
  const movementRows = await db.select().from(cashMovements).where(eq(cashMovements.cashRegisterId, cash.id))
  const ticketUserIds = [...new Set(rows.map((row) => row.createdById))]
  const ticketUsers = ticketUserIds.length ? await db.select().from(users).where(inArray(users.id, ticketUserIds)) : []
  const tickets = rows.map((row) => {
    const payments = paymentRows.filter((payment) => payment.saleId === row.id).map(({ method, amount }) => ({ method, amount }))
    const seller = ticketUsers.find((user) => user.id === row.createdById)
    return { ...row, createdBy: seller ? `${seller.firstName} ${seller.lastName}` : '—', payments: payments.length ? payments : [{ method: row.paymentMethod, amount: row.total }], items: itemRows.filter((item) => item.saleId === row.id).map(({ productName: name, quantity, unitPrice }) => ({ name, quantity, unitPrice })) }
  })
  const totals = summarizePayments(tickets)
  const opener = await db.select().from(users).where(eq(users.id, cash.openedById)).get()
  const closer = cash.closedById ? await db.select().from(users).where(eq(users.id, cash.closedById)).get() : null
  const cashMovementsTotal = movementRows.reduce((sum, movement) => sum + Number(movement.amount), 0)
  return { ...cash, openedBy: opener ? `${opener.firstName} ${opener.lastName}` : '—', closedBy: closer ? `${closer.firstName} ${closer.lastName}` : null, date: cash.businessDate, tickets, ...totals, cashMovements: cashMovementsTotal, expectedCash: Math.round((cash.initialAmount + totals.cashSales + cashMovementsTotal) * 100) / 100 }
}
export const store = {
  async login(username, password) { const user = await db.select().from(users).where(eq(users.username, username)).get(); if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError('Usuario, contraseña o estado de cuenta inválidos.', 401); await audit(db, user.id, 'LOGIN', 'Inicio de sesión'); return { token: jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: '8h' }), user: cleanUser(user) } },
  async listProducts() { return db.select().from(products).orderBy(products.name).all() },
  async findProductByBarcode(barcode) { const value = String(barcode ?? '').trim(); ensure(value, 'Ingresá un código de barras.'); const product = await db.select().from(products).where(eq(products.barcode, value)).get(); if (!product) throw new AppError('Producto no encontrado.', 404); return product },
  async saveProduct(input, productId, userId) { const values = productValues(input); try { if (productId) { await db.update(products).set(values).where(eq(products.id, productId)); const product = await db.select().from(products).where(eq(products.id, productId)).get(); if (!product) throw new AppError('Producto no encontrado.', 404); await audit(db, userId, 'PRODUCT_UPDATE', `Edición de producto: ${product.name}`); return product } const product = { id: id('PRD'), ...values }; await db.insert(products).values(product); await audit(db, userId, 'PRODUCT_CREATE', `Alta de producto: ${product.name}`); return product } catch (error) { if (String(error.message).includes('UNIQUE')) throw new AppError('El código de barras o el identificador externo ya existe.'); throw error } },
  async listUsers() { return (await db.select().from(users).orderBy(users.firstName).all()).map(cleanUser) },
  async saveUser(input, userId) { ensure(['firstName', 'lastName', 'contact', 'username'].every((key) => input[key]?.trim()), 'Completá los campos obligatorios.'); if (!userId) ensure(input.password?.length >= 6, 'La contraseña debe tener al menos 6 caracteres.'); const values = { firstName: input.firstName.trim(), lastName: input.lastName.trim(), contact: input.contact.trim(), username: input.username.trim().toLowerCase(), role: 'ADMIN', active: input.active !== false, updatedAt: new Date().toISOString() }; if (input.password) values.passwordHash = await bcrypt.hash(input.password, 12); try { if (userId) { await db.update(users).set(values).where(eq(users.id, userId)); return cleanUser(await db.select().from(users).where(eq(users.id, userId)).get()) } const user = { id: id('usr'), ...values, passwordHash: values.passwordHash }; await db.insert(users).values(user); return cleanUser(user) } catch (error) { if (String(error.message).includes('UNIQUE')) throw new AppError('Ese nombre de usuario ya existe.'); throw error } },
  async toggleUser(userId, actorId) { ensure(userId !== actorId, 'No podés desactivar tu propia cuenta.'); const user = await db.select().from(users).where(eq(users.id, userId)).get(); if (!user) throw new AppError('Usuario no encontrado.', 404); await db.update(users).set({ active: !user.active, updatedAt: new Date().toISOString() }).where(eq(users.id, userId)); return cleanUser({ ...user, active: !user.active }) },
  async currentCash() { return cashSummary(await db.select().from(cashRegisters).where(eq(cashRegisters.status, 'OPEN')).get()) },
  async history() { const registers = await db.select().from(cashRegisters).where(eq(cashRegisters.status, 'CLOSED')).orderBy(desc(cashRegisters.closedAt)).all(); return Promise.all(registers.map(cashSummary)) },
  async openCash(initialAmount, userId) { ensure(Number.isFinite(Number(initialAmount)) && Number(initialAmount) >= 0, 'Ingresá un monto inicial válido.'); if (await this.currentCash()) throw new AppError('Ya hay una caja abierta.'); const cash = { id: id('cash'), businessDate: date(), openedAt: new Date().toISOString(), openedById: userId, initialAmount: Number(initialAmount), status: 'OPEN', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; try { await db.transaction(async (tx) => { await tx.insert(cashRegisters).values(cash); await audit(tx, userId, 'CASH_OPEN', 'Apertura de caja', Number(initialAmount)) }) } catch (error) { if (String(error.message).includes('UNIQUE')) throw new AppError('Ya hay una caja abierta.'); throw error } return cashSummary(cash) },
  async closeCash(countedAmount, userId) { const cash = await db.select().from(cashRegisters).where(eq(cashRegisters.status, 'OPEN')).get(); if (!cash) throw new AppError('No hay una caja abierta.'); ensure(Number.isFinite(Number(countedAmount)) && Number(countedAmount) >= 0, 'Ingresá un monto contado válido.'); const closed = await db.update(cashRegisters).set({ status: 'CLOSED', countedAmount: Number(countedAmount), closedAt: new Date().toISOString(), closedById: userId, updatedAt: new Date().toISOString() }).where(and(eq(cashRegisters.id, cash.id), eq(cashRegisters.status, 'OPEN'))).returning(); if (!closed.length) throw new AppError('La caja ya fue cerrada por otra operación.', 409); await audit(db, userId, 'CASH_CLOSE', 'Cierre de caja', Number(countedAmount)); return cashSummary(closed[0]) },
  async createSale(items, paymentInput, userId, idempotencyKey) {
    ensure(Array.isArray(items) && items.length, 'Agregá al menos un producto.')
    ensure(!idempotencyKey || (typeof idempotencyKey === 'string' && idempotencyKey.length <= 128), 'Clave de idempotencia inválida.')
    const existingSale = async (executor) => {
      const sale = idempotencyKey ? await executor.select().from(sales).where(eq(sales.idempotencyKey, idempotencyKey)).get() : null
      if (!sale) return null
      const [payments, items] = await Promise.all([executor.select({ method: salePayments.method, amount: salePayments.amount }).from(salePayments).where(eq(salePayments.saleId, sale.id)), executor.select({ name: saleItems.productName, quantity: saleItems.quantity, unitPrice: saleItems.unitPrice }).from(saleItems).where(eq(saleItems.saleId, sale.id))])
      return { ...sale, payments, items }
    }
    const execute = async () => db.transaction(async (tx) => {
      const prior = await existingSale(tx)
      if (prior) return prior
      const cash = await tx.select().from(cashRegisters).where(eq(cashRegisters.status, 'OPEN')).get()
      if (!cash) throw new AppError('No hay una caja abierta.')
      const quantities = new Map()
      for (const item of items) {
        ensure(item && typeof item.productId === 'string' && Number.isSafeInteger(item.quantity) && item.quantity > 0, 'Las cantidades de los productos deben ser enteros positivos.')
        quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity)
      }
      const productRows = await tx.select().from(products).where(inArray(products.id, [...quantities.keys()])).all()
      ensure(productRows.length === quantities.size, 'Uno de los productos ya no está disponible.')
      const lines = productRows.map((product) => {
        const quantity = quantities.get(product.id)
        ensure(product.active && product.productStatus !== 'I', `${product.name} está inactivo y no puede venderse.`)
        ensure(product.stock >= quantity, `Stock insuficiente para ${product.name}.`)
        return { ...product, quantity }
      })
      const total = Math.round(lines.reduce((sum, line) => sum + line.salePrice * line.quantity, 0) * 100) / 100
      const configuredMethods = await tx.select({ name: settingsCatalog.name }).from(settingsCatalog).where(and(eq(settingsCatalog.type, 'payment'), eq(settingsCatalog.active, true))).all()
      const payments = normalizePayments(paymentInput, total, configuredMethods.length ? configuredMethods.map((method) => method.name) : ['Efectivo', 'Virtual'])
      const sale = { id: id('TK'), cashRegisterId: cash.id, createdById: userId, paymentMethod: payments.length > 1 ? 'Combinado' : payments[0].method, total, idempotencyKey: idempotencyKey || null, createdAt: new Date().toISOString() }
      await tx.insert(sales).values(sale)
      await tx.insert(salePayments).values(payments.map((payment) => ({ id: id('pay'), saleId: sale.id, ...payment })))
      await tx.insert(saleItems).values(lines.map((line) => ({ id: id('item'), saleId: sale.id, productId: line.id, productName: line.name, quantity: line.quantity, unitPrice: line.salePrice, unitCost: line.cost })))
      for (const line of lines) {
        const updated = await tx.update(products).set({ stock: sql`${products.stock} - ${line.quantity}`, updatedAt: new Date().toISOString() }).where(and(eq(products.id, line.id), eq(products.active, true), sql`${products.stock} >= ${line.quantity}`)).returning({ id: products.id })
        ensure(updated.length === 1, `Stock insuficiente para ${line.name}.`)
      }
      await audit(tx, userId, 'SALE', `Venta ${sale.id}`, total)
      return { ...sale, payments, items: lines.map(({ name, quantity, salePrice: unitPrice }) => ({ name, quantity, unitPrice })) }
    })
    try { return await execute() } catch (error) {
      if (idempotencyKey && String(error.message).includes('UNIQUE')) { const prior = await existingSale(db); if (prior) return prior }
      throw error
    }
  },
  async statistics(start, end) {
    const salesRows = await db.select().from(sales).where(and(gte(sales.createdAt, start), lte(sales.createdAt, end))).all()
    const saleIds = salesRows.map((sale) => sale.id)
    const items = saleIds.length ? await db.select().from(saleItems).where(inArray(saleItems.saleId, saleIds)) : []
    const payments = saleIds.length ? await db.select().from(salePayments).where(inArray(salePayments.saleId, saleIds)) : []
    const expenseRows = await db.select().from(expenses).where(and(gte(expenses.expenseAt, start), lte(expenses.expenseAt, end), eq(expenses.status, 'ACTIVE'))).all()
    const paymentTotals = payments.reduce((total, payment) => ({ ...total, [payment.method]: (total[payment.method] || 0) + Number(payment.amount) }), {})
    const grossSales = salesRows.reduce((sum, sale) => sum + Number(sale.total), 0)
    const costOfSales = items.reduce((sum, item) => sum + (item.unitCost === null ? 0 : Number(item.unitCost) * item.quantity), 0)
    const operatingExpenses = expenseRows.reduce((sum, expense) => sum + Number(expense.amount), 0)
    const inventory = (await db.select().from(products).all()).reduce((sum, product) => sum + Number(product.stock) * Number(product.cost), 0)
    const net = grossSales - costOfSales - operatingExpenses
    const dailySales = Object.values(salesRows.reduce((days, sale) => {
      const day = sale.createdAt.slice(0, 10)
      days[day] ||= { date: day, total: 0, tickets: 0 }
      days[day].total += Number(sale.total)
      days[day].tickets += 1
      return days
    }, {})).sort((a, b) => a.date.localeCompare(b.date))
    const topProducts = Object.values(items.reduce((rows, item) => {
      rows[item.productId] ||= { id: item.productId, name: item.productName, quantity: 0, revenue: 0 }
      rows[item.productId].quantity += Number(item.quantity)
      rows[item.productId].revenue += Number(item.unitPrice) * Number(item.quantity)
      return rows
    }, {})).sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue).slice(0, 8)
    const itemsSold = items.reduce((sum, item) => sum + Number(item.quantity), 0)
    return { start, end, grossSales, cashSales: paymentTotals.Efectivo || 0, virtualSales: paymentTotals.Virtual || 0, paymentTotals, costOfSales, operatingExpenses, inventory, net, profitability: grossSales ? (net / grossSales) * 100 : null, expenses: expenseRows, dailySales, topProducts, ticketCount: salesRows.length, itemsSold, averageTicket: salesRows.length ? grossSales / salesRows.length : 0 }
  },
  async statisticsHistory(group = 'month') {
    ensure(['month', 'week'].includes(group), 'Agrupación de historial inválida.')
    const salesRows = await db.select().from(sales).all()
    const items = await db.select().from(saleItems).all()
    const expenseRows = await db.select().from(expenses).where(eq(expenses.status, 'ACTIVE')).all()
    const closedRegisters = await db.select().from(cashRegisters).where(eq(cashRegisters.status, 'CLOSED')).all()
    const periodKey = (value) => {
      const day = String(value).slice(0, 10)
      if (group === 'month') return day.slice(0, 7)
      const local = new Date(`${day}T12:00:00`)
      const weekday = local.getDay() || 7
      local.setDate(local.getDate() - weekday + 1)
      return local.toISOString().slice(0, 10)
    }
    const salePeriods = new Map(salesRows.map((sale) => [sale.id, periodKey(sale.createdAt)]))
    const periods = {}
    for (const sale of salesRows) {
      const key = periodKey(sale.createdAt)
      periods[key] ||= { key, grossSales: 0, costOfSales: 0, operatingExpenses: 0, ticketCount: 0, cashCloseCount: 0 }
      periods[key].grossSales += Number(sale.total)
      periods[key].ticketCount += 1
    }
    for (const item of items) {
      const key = salePeriods.get(item.saleId)
      if (!key) continue
      periods[key] ||= { key, grossSales: 0, costOfSales: 0, operatingExpenses: 0, ticketCount: 0, cashCloseCount: 0 }
      periods[key].costOfSales += (Number(item.unitCost) || 0) * Number(item.quantity)
    }
    for (const expense of expenseRows) {
      const key = periodKey(expense.expenseAt)
      periods[key] ||= { key, grossSales: 0, costOfSales: 0, operatingExpenses: 0, ticketCount: 0, cashCloseCount: 0 }
      periods[key].operatingExpenses += Number(expense.amount)
    }
    for (const register of closedRegisters) {
      const key = periodKey(register.closedAt)
      periods[key] ||= { key, grossSales: 0, costOfSales: 0, operatingExpenses: 0, ticketCount: 0, cashCloseCount: 0 }
      periods[key].cashCloseCount += 1
    }
    return Object.values(periods).map((period) => ({ ...period, net: period.grossSales - period.costOfSales - period.operatingExpenses })).sort((a, b) => b.key.localeCompare(a.key))
  },
  async createExpense(input, userId) {
    ensure(input.description?.trim() && ['alquiler', 'servicios', 'impuestos', 'sueldos', 'mantenimiento', 'proveedores', 'otros'].includes(input.category), 'Completá motivo y categoría.'); ensure(Number.isFinite(Number(input.amount)) && Number(input.amount) > 0, 'Ingresá un monto válido.'); ensure(['Efectivo', 'Virtual'].includes(input.paymentMethod), 'Medio de pago inválido.')
    return db.transaction(async (tx) => { const current = input.paymentMethod === 'Efectivo' ? await tx.select().from(cashRegisters).where(eq(cashRegisters.status, 'OPEN')).get() : null; if (input.paymentMethod === 'Efectivo') ensure(current, 'Abrí una caja para registrar un gasto en efectivo.'); const expense = { id: id('exp'), amount: money(input.amount), description: input.description.trim(), category: input.category, paymentMethod: input.paymentMethod, expenseAt: input.expenseAt || new Date().toISOString(), recurring: Boolean(input.recurring), status: 'ACTIVE', cashRegisterId: current?.id || null, createdById: userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; await tx.insert(expenses).values(expense); if (current) await tx.insert(cashMovements).values({ id: id('mov'), cashRegisterId: current.id, expenseId: expense.id, amount: -expense.amount, createdAt: expense.createdAt }); await audit(tx, userId, 'EXPENSE', `Gasto: ${expense.description}`, -expense.amount); return expense })
  },
  async listSettings(type) { ensure(['payment', 'category', 'supplier', 'laboratory'].includes(type), 'Tipo de configuración inválido.'); return db.select().from(settingsCatalog).where(eq(settingsCatalog.type, type)).orderBy(settingsCatalog.name).all() },
  async saveSetting(type, input, settingId, userId) { ensure(['payment', 'category', 'supplier', 'laboratory'].includes(type) && input.name?.trim(), 'Completá el nombre.'); const values = { type, name: input.name.trim(), description: input.description?.trim() || null, details: input.details || null, active: input.active !== false, updatedAt: new Date().toISOString() }; if (settingId) { await db.update(settingsCatalog).set(values).where(eq(settingsCatalog.id, settingId)); const record = await db.select().from(settingsCatalog).where(eq(settingsCatalog.id, settingId)).get(); if (!record) throw new AppError('Configuración no encontrada.', 404); await audit(db, userId, 'SETTINGS_UPDATE', `Edición de ${type}: ${record.name}`); return record } const record = { id: id('cfg'), ...values, createdAt: new Date().toISOString() }; await db.insert(settingsCatalog).values(record); await audit(db, userId, 'SETTINGS_CREATE', `Alta de ${type}: ${record.name}`); return record },
  async listAudit(limit = 50) { const events = await db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(Math.min(Math.max(Number(limit) || 50, 1), 100)).all(); const userIds = [...new Set(events.map((event) => event.userId).filter(Boolean))]; const actors = userIds.length ? await db.select().from(users).where(inArray(users.id, userIds)).all() : []; return events.map((event) => { const actor = actors.find((user) => user.id === event.userId); return { ...event, user: actor ? `${actor.firstName} ${actor.lastName}` : 'Sistema' } }) },
  async listFixedExpenses() { return db.select().from(fixedExpenses).orderBy(fixedExpenses.name).all() },
  async saveFixedExpense(input, expenseId, userId) { ensure(input.name?.trim() && Number.isFinite(Number(input.amount)) && Number(input.amount) > 0 && ['weekly', 'monthly'].includes(input.frequency), 'Completá los datos del gasto fijo.'); const values = { name: input.name.trim(), description: input.description?.trim() || null, category: input.category || 'otros', amount: money(input.amount), frequency: input.frequency, dueDay: input.dueDay ? Number(input.dueDay) : null, startDate: input.startDate, paymentMethod: input.paymentMethod || 'Efectivo', active: input.active !== false, updatedAt: new Date().toISOString() }; if (expenseId) { await db.update(fixedExpenses).set(values).where(eq(fixedExpenses.id, expenseId)); const record = await db.select().from(fixedExpenses).where(eq(fixedExpenses.id, expenseId)).get(); if (!record) throw new AppError('Gasto fijo no encontrado.', 404); await audit(db, userId, 'FIXED_EXPENSE_UPDATE', `Edición de gasto fijo: ${record.name}`); return record } const record = { id: id('fix'), ...values, createdAt: new Date().toISOString() }; await db.insert(fixedExpenses).values(record); await audit(db, userId, 'FIXED_EXPENSE_CREATE', `Alta de gasto fijo: ${record.name}`); return record },
}
