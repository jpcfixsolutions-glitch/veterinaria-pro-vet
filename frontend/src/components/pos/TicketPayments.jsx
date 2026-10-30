import { Badge } from '../ui/index.jsx'

const format = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(amount)

export default function TicketPayments({ ticket }) {
  const payments = ticket.payments?.length ? ticket.payments : [{ method: ticket.paymentMethod, amount: ticket.total }]
  return <span className="ticket-payments">{payments.map((payment) => <span key={payment.method}><Badge tone={payment.method === 'Efectivo' ? 'success' : 'info'}>{payment.method === 'Virtual' ? 'Transferencia' : payment.method}</Badge>{payments.length > 1 && <small>{format(payment.amount)}</small>}</span>)}</span>
}
