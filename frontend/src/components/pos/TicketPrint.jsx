import { dateTime, money } from '../../features/utils/format.js'

export default function TicketPrint({ ticket }) {
  const payments = ticket.payments?.length ? ticket.payments : [{ method: ticket.paymentMethod, amount: ticket.total }]
  return <section className="pv-print-ticket" aria-hidden="true">
    <header><strong>PRO VET</strong><span>Veterinaria · Punto de venta</span><small>Ticket {ticket.id}</small><small>{dateTime(ticket.createdAt)}</small></header>
    <div className="pv-print-ticket-lines">{ticket.items.map((item, index) => <div key={index}><span>{item.quantity} × {item.name}</span><b>{money(item.quantity * item.unitPrice)}</b></div>)}</div>
    <div className="pv-print-ticket-payments">{payments.map((payment) => <div key={payment.method}><span>{payment.method === 'Virtual' ? 'Transferencia' : payment.method}</span><b>{money(payment.amount)}</b></div>)}</div>
    <footer><strong>TOTAL {money(ticket.total)}</strong><small>Gracias por confiar en Pro Vet</small></footer>
  </section>
}
