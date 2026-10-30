import { useState } from 'react'
import { Button, Field } from '../ui/index.jsx'
import { money } from '../../features/utils/format.js'
import Icon from '../ui/Icon.jsx'

const formatAmount = (value) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(value)

// Mantiene los códigos de pago que acepta la API de PRO-VET.
export default function PaymentModal({ total, loading, error, onClose, onConfirm }) {
  const [payments, setPayments] = useState([{ method: 'Efectivo', amount: '' }])
  const totalCents = Math.round(total * 100)
  const amountCents = payments.reduce((sum, payment) => sum + Math.round(Number(payment.amount || 0) * 100), 0)
  const validAmount = payments.every(({ amount }) => amount !== '' && Number.isFinite(Number(amount)) && Number(amount) >= 0 && (Number(amount) > 0 || (totalCents === 0 && payments.length === 1)) && Math.abs(Number(amount) * 100 - Math.round(Number(amount) * 100)) < .000001)
  const remaining = totalCents - amountCents
  const isCash = payments.length === 1 && payments[0].method === 'Efectivo'
  const canConfirm = validAmount && (isCash ? remaining <= 0 : remaining === 0)
  const change = validAmount && isCash ? Math.max(0, -remaining) / 100 : 0

  const submit = (event) => {
    event.preventDefault()
    if (canConfirm && !loading) onConfirm(payments.map(({ method, amount }) => ({ method, amount: Number(amount) })))
  }
  const updatePayment = (index, field, value) => setPayments((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row))
  const addMethod = () => setPayments((rows) => [...rows, { method: rows[0].method === 'Efectivo' ? 'Virtual' : 'Efectivo', amount: '' }])
  const completePayment = (index) => {
    const otherCents = payments.reduce((sum, row, rowIndex) => sum + (rowIndex === index ? 0 : Math.round(Number(row.amount || 0) * 100)), 0)
    updatePayment(index, 'amount', (Math.max(0, totalCents - otherCents) / 100).toFixed(2))
  }

  return <form className="pv-payment-form" onSubmit={submit}>
    <div className="pv-payment-body">
      <section className="pv-payment-summary" aria-label="Resumen del pago">
        <div className="pv-payment-summary-total"><span>Total a cobrar:</span><strong>{formatAmount(total)}</strong></div>
        {amountCents > 0 && <div className={`pv-payment-status ${remaining > 0 ? 'pending' : remaining < 0 && !isCash ? 'exceeded' : 'complete'}`} aria-live="polite">
          <span>{remaining > 0 ? 'Falta cubrir:' : remaining < 0 ? isCash ? 'Vuelto a entregar:' : 'Monto excedido en:' : 'Monto exacto'}</span>
          <strong>{remaining === 0 ? formatAmount(total) : formatAmount(Math.abs(remaining) / 100)}</strong>
        </div>}
      </section>

      <section className="pv-payment-methods" aria-labelledby="pv-payment-method-title">
        <div className="pv-payment-method-header"><h3 id="pv-payment-method-title">Métodos de Pago</h3>{payments.length < 2 && <button type="button" className="pv-payment-add-method" onClick={addMethod} disabled={loading}>+ Agregar método</button>}</div>
        {payments.map((payment, index) => <div className="pv-payment-entry" key={payment.method}>
          <div className={`pv-payment-row ${payments.length > 1 ? 'pv-payment-row-combined' : ''}`}>
            <Field label="MEDIO DE PAGO"><select aria-label={`Medio de pago ${index + 1}`} value={payment.method} onChange={(event) => updatePayment(index, 'method', event.target.value)} disabled={loading}>{['Efectivo', 'Virtual'].filter((method) => method === payment.method || !payments.some((row) => row.method === method)).map((method) => <option key={method} value={method}>{method === 'Virtual' ? 'Transferencia' : method}</option>)}</select></Field>
            <Field label="IMPORTE"><span className="pv-payment-amount"><span aria-hidden="true">$</span><input type="number" inputMode="decimal" min="0" step="0.01" required value={payment.amount} onChange={(event) => updatePayment(index, 'amount', event.target.value === '' ? '' : event.target.value.replace(/^0+(?=\d)/, ''))} onFocus={(event) => event.target.select()} placeholder="0,00" disabled={loading} aria-label={`Importe ${payment.method === 'Virtual' ? 'transferencia' : 'efectivo'}`} /></span></Field>
            {payments.length > 1 && <button type="button" className="icon-button pv-payment-remove" aria-label={`Quitar ${payment.method === 'Virtual' ? 'transferencia' : 'efectivo'}`} disabled={loading} onClick={() => setPayments((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}><Icon name="close" size={18}/></button>}
          </div>
          <div className="pv-payment-hint"><span>{isCash ? 'Ingresá el efectivo recibido para calcular el vuelto.' : 'Monto exacto requerido.'}</span><button type="button" onClick={() => completePayment(index)} disabled={loading}>{payments.length === 1 ? 'Completar total' : 'Completar restante'}</button></div>
        </div>)}
      </section>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>

    <div className="pv-payment-footer">
      <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
      <Button type="submit" icon="check" loading={loading} disabled={!canConfirm}>{loading ? 'Registrando...' : change > 0 ? `Confirmar venta · Vuelto ${money(change)}` : 'Confirmar venta'}</Button>
    </div>
  </form>
}
