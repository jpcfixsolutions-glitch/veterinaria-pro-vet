import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { db } from '../config/db.js'
import { cashMovements, cashRegisters, expenses, fixedExpenses, products, saleItems, salePayments, sales, settingsCatalog, users } from '../models/index.js'
import { normalizePayments, summarizePayments } from './payments.js'
import { env } from '../config/env.js'
import { AppError, id } from '../utils/http.js'
const cleanUser = ({ passwordHash, ...user }) => user
const date = () => new Date().toISOString().slice(0, 10)
const ensure = (condition, message) => { if (!condition) throw new AppError(message) }
const money = (value) => Math.round(Number(value) * 100) / 100
const profitability = (cost, salePrice) => {
  const base = Number(cost)
  return Number.isFinite(base) && base > 0 ? money(((Number(salePrice) - base) / base) * 100) : null
}
const productValues = (input) => {
  ensure(input.name?.trim(), 'Completá el nombre del producto.')
  const cost = Number(input.cost); const salePrice = Number(input.salePrice); const stock = Number(input.stock); const minStock = Number(input.minStock)
  ensure([cost, salePrice, stock, minStock].every((value) => Number.isFinite(value) && value >= 0), 'Los importes y el stock deben ser iguales o mayores a cero.')
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
  async login(username, password) { const user = await db.select().from(users).where(eq(users.username, username)).get(); if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError('Usuario, contraseña o estado de cuenta inválidos.', 401); return { token: jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: '8h' }), user: cleanUser(user) } },
  async listProducts() { return db.select().from(products).orderBy(products.name).all() },
  async saveProduct(input, productId) { const values = productValues(input); try { if (productId) { await db.update(products).set(values).where(eq(products.id, productId)); return db.select().from(products).where(eq(products.id, productId)).get() } const product = { id: id('PRD'), ...values }; await db.insert(products).values(product); return product } catch (error) { if (String(error.message).includes('UNIQUE')) throw new AppError('El código de barras o el identificador externo ya existe.'); throw error } },
  async listUsers() { return (await db.select().from(users).orderBy(users.firstName).all()).map(cleanUser) },
  async saveUser(input, userId) { ensure(['firstName', 'lastName', 'contact', 'username'].every((key) => input[key]?.trim()), 'Completá los campos obligatorios.'); if (!userId) ensure(input.password?.length >= 6, 'La contraseña debe tener al menos 6 caracteres.'); const values = { firstName: input.firstName.trim(), lastName: input.lastName.trim(), contact: input.contact.trim(), username: input.username.trim().toLowerCase(), role: 'ADMIN', active: input.active !== false, updatedAt: new Date().toISOString() }; if (input.password) values.passwordHash = await bcrypt.hash(input.password, 12); try { if (userId) { await db.update(users).set(values).where(eq(users.id, userId)); return cleanUser(await db.select().from(users).where(eq(users.id, userId)).get()) } const user = { id: id('usr'), ...values, passwordHash: values.passwordHash }; await db.insert(users).values(user); return cleanUser(user) } catch (error) { if (String(error.message).includes('UNIQUE')) throw new AppError('Ese nombre de usuario ya existe.'); throw error } },
  async toggleUser(userId, actorId) { ensure(userId !== actorId, 'No podés desactivar tu propia cuenta.'); const user = await db.select().from(users).where(eq(users.id, userId)).get(); if (!user) throw new AppError('Usuario no encontrado.', 404); await db.update(users).set({ active: !user.active, updatedAt: new Date().toISOString() }).where(eq(users.id, userId)); return cleanUser({ ...user, active: !user.active }) },
  async currentCash() { return cashSummary(await db.select().from(cashRegisters).where(eq(cashRegisters.status, 'OPEN')).get()) },
  async history() { const registers = await db.select().from(cashRegisters).where(eq(cashRegisters.status, 'CLOSED')).orderBy(desc(cashRegisters.closedAt)).all(); return Promise.all(registers.map(cashSummary)) },
  async openCash(initialAmount, userId) { ensure(Number.isFinite(Number(initialAmount)) && Number(initialAmount) >= 0, 'Ingresá un monto inicial válido.'); if (await this.currentCash()) throw new AppError('Ya hay una caja abierta.'); const cash = { id: id('cash'), businessDate: date(), openedAt: new Date().toISOString(), openedById: userId, initialAmount: Number(initialAmount), status: 'OPEN', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; try { await db.insert(cashRegisters).values(cash) } catch { throw new AppError('Ya existe una caja para la fecha de hoy.') } return cashSummary(cash) },
  async closeCash(countedAmount, userId) { const cash = await db.select().from(cashRegisters).where(eq(cashRegisters.status, 'OPEN')).get(); if (!cash) throw new AppError('No hay una caja abierta.'); ensure(Number.isFinite(Number(countedAmount)) && Number(countedAmount) >= 0, 'Ingresá un monto contado válido.'); await db.update(cashRegisters).set({ status: 'CLOSED', countedAmount: Number(countedAmount), closedAt: new Date().toISOString(), closedById: userId, updatedAt: new Date().toISOString() }).where(eq(cashRegisters.id, cash.id)); return cashSummary({ ...cash, status: 'CLOSED' }) },
  async createSale(items, paymentInput, userId) {
    ensure(Array.isArray(items) && items.length, 'Agregá al menos un producto.')
    return db.transaction(async (tx) => {
      const cash = await tx.select().from(cashRegisters).where(eq(cashRegisters.status, 'OPEN')).get()
      if (!cash) throw new AppError('No hay una caja abierta.')
      const productRows = await tx.select().from(products).where(inArray(products.id, items.map((item) => item.productId))).all()
      ensure(productRows.length === items.length, 'Uno de los productos ya no está disponible.')
      const lines = items.map((item) => {
        const product = productRows.find((row) => row.id === item.productId)
        ensure(Number.isInteger(item.quantity) && item.quantity > 0 && product.stock >= item.quantity, `Stock insuficiente para ${product.name}.`)
        return { ...product, quantity: item.quantity }
      })
      const total = Math.round(lines.reduce((sum, line) => sum + line.salePrice * line.quantity, 0) * 100) / 100
      const payments = normalizePayments(paymentInput, total)
      const sale = { id: id('TK'), cashRegisterId: cash.id, createdById: userId, paymentMethod: payments.length > 1 ? 'Combinado' : payments[0].method, total, createdAt: new Date().toISOString() }
      await tx.insert(sales).values(sale)
      await tx.insert(salePayments).values(payments.map((payment) => ({ id: id('pay'), saleId: sale.id, ...payment })))
      await tx.insert(saleItems).values(lines.map((line) => ({ id: id('item'), saleId: sale.id, productId: line.id, productName: line.name, quantity: line.quantity, unitPrice: line.salePrice, unitCost: line.cost })))
      for (const line of lines) await tx.update(products).set({ stock: sql`${products.stock} - ${line.quantity}`, updatedAt: new Date().toISOString() }).where(eq(products.id, line.id))
      return { ...sale, payments, items: lines.map(({ name, quantity, salePrice: unitPrice }) => ({ name, quantity, unitPrice })) }
    })
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
    return { start, end, grossSales, cashSales: paymentTotals.Efectivo || 0, virtualSales: paymentTotals.Virtual || 0, costOfSales, operatingExpenses, inventory, net, profitability: grossSales ? (net / grossSales) * 100 : null, expenses: expenseRows }
  },
  async createExpense(input, userId) {
    ensure(input.description?.trim() && ['alquiler', 'servicios', 'impuestos', 'sueldos', 'mantenimiento', 'proveedores', 'otros'].includes(input.category), 'Completá motivo y categoría.'); ensure(Number.isFinite(Number(input.amount)) && Number(input.amount) > 0, 'Ingresá un monto válido.'); ensure(['Efectivo', 'Virtual'].includes(input.paymentMethod), 'Medio de pago inválido.')
    return db.transaction(async (tx) => { const current = input.paymentMethod === 'Efectivo' ? await tx.select().from(cashRegisters).where(eq(cashRegisters.status, 'OPEN')).get() : null; if (input.paymentMethod === 'Efectivo') ensure(current, 'Abrí una caja para registrar un gasto en efectivo.'); const expense = { id: id('exp'), amount: money(input.amount), description: input.description.trim(), category: input.category, paymentMethod: input.paymentMethod, expenseAt: input.expenseAt || new Date().toISOString(), recurring: Boolean(input.recurring), status: 'ACTIVE', cashRegisterId: current?.id || null, createdById: userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; await tx.insert(expenses).values(expense); if (current) await tx.insert(cashMovements).values({ id: id('mov'), cashRegisterId: current.id, expenseId: expense.id, amount: -expense.amount, createdAt: expense.createdAt }); return expense })
  },
  async listSettings(type) { ensure(['payment', 'category', 'supplier', 'laboratory'].includes(type), 'Tipo de configuración inválido.'); return db.select().from(settingsCatalog).where(eq(settingsCatalog.type, type)).orderBy(settingsCatalog.name).all() },
  async saveSetting(type, input, settingId) { ensure(['payment', 'category', 'supplier', 'laboratory'].includes(type) && input.name?.trim(), 'Completá el nombre.'); const values = { type, name: input.name.trim(), description: input.description?.trim() || null, details: input.details || null, active: input.active !== false, updatedAt: new Date().toISOString() }; if (settingId) { await db.update(settingsCatalog).set(values).where(eq(settingsCatalog.id, settingId)); return db.select().from(settingsCatalog).where(eq(settingsCatalog.id, settingId)).get() } const record = { id: id('cfg'), ...values, createdAt: new Date().toISOString() }; await db.insert(settingsCatalog).values(record); return record },
  async listFixedExpenses() { return db.select().from(fixedExpenses).orderBy(fixedExpenses.name).all() },
  async saveFixedExpense(input, expenseId) { ensure(input.name?.trim() && Number.isFinite(Number(input.amount)) && Number(input.amount) > 0 && ['weekly', 'monthly'].includes(input.frequency), 'Completá los datos del gasto fijo.'); const values = { name: input.name.trim(), description: input.description?.trim() || null, category: input.category || 'otros', amount: money(input.amount), frequency: input.frequency, dueDay: input.dueDay ? Number(input.dueDay) : null, startDate: input.startDate, paymentMethod: input.paymentMethod || 'Efectivo', active: input.active !== false, updatedAt: new Date().toISOString() }; if (expenseId) { await db.update(fixedExpenses).set(values).where(eq(fixedExpenses.id, expenseId)); return db.select().from(fixedExpenses).where(eq(fixedExpenses.id, expenseId)).get() } const record = { id: id('fix'), ...values, createdAt: new Date().toISOString() }; await db.insert(fixedExpenses).values(record); return record },
}
