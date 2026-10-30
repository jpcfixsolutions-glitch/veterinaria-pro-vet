import { AppError } from '../utils/http.js'

export function normalizePayments(input, total) {
  const rows = typeof input === 'string' ? [{ method: input, amount: total }] : input
  if (!Array.isArray(rows) || !rows.length || rows.length > 2) throw new AppError('Ingresá uno o dos medios de pago.')
  const methods = new Set()
  const totalCents = Math.round(total * 100)
  const payments = rows.map((row) => {
    if (!row || !['Efectivo', 'Virtual'].includes(row.method) || methods.has(row.method)) throw new AppError('Medio de pago inválido o repetido.')
    methods.add(row.method)
    const cents = Math.round(row.amount * 100)
    if (typeof row.amount !== 'number' || !Number.isFinite(row.amount) || !Number.isSafeInteger(cents) || cents < 0 || (cents === 0 && (totalCents !== 0 || rows.length > 1)) || Math.abs(row.amount * 100 - cents) > .000001) throw new AppError('Ingresá importes válidos con hasta dos decimales.')
    return { method: row.method, amount: cents / 100 }
  })
  const paidCents = payments.reduce((sum, payment) => sum + Math.round(payment.amount * 100), 0)
  if (payments.length === 1 && payments[0].method === 'Efectivo' && paidCents >= totalCents) return [{ method: 'Efectivo', amount: totalCents / 100 }]
  if (paidCents !== totalCents) throw new AppError('La suma de los pagos debe coincidir con el total de la venta.')
  return payments
}

export function summarizePayments(tickets) {
  let cashCents = 0
  let virtualCents = 0
  for (const ticket of tickets) {
    const payments = ticket.payments?.length ? ticket.payments : [{ method: ticket.paymentMethod, amount: ticket.total }]
    for (const payment of payments) {
      if (payment.method === 'Efectivo') cashCents += Math.round(payment.amount * 100)
      if (payment.method === 'Virtual') virtualCents += Math.round(payment.amount * 100)
    }
  }
  return { cashSales: cashCents / 100, virtualSales: virtualCents / 100, totalSales: (cashCents + virtualCents) / 100 }
}
