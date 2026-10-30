import { Badge, Button, Card, EmptyState } from '../components/ui/index.jsx'
import { dateTime, money, time, today } from '../features/utils/format.js'
import TicketPayments from '../components/pos/TicketPayments.jsx'

function TicketHistory({ cash, history }) {
  const currentTickets = (cash?.tickets || []).map((ticket) => ({ ...ticket, register: 'Caja actual' }))
  const closedTickets = history.flatMap((register) => (register.tickets || []).map((ticket) => ({ ...ticket, register: new Intl.DateTimeFormat('es-AR', { dateStyle: 'short' }).format(new Date(register.date)) })))
  const tickets = [...currentTickets, ...closedTickets].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
  return <Card className="dashboard-tickets"><div className="section-heading"><div><span className="eyebrow">OPERACIONES</span><h2>Historial de tickets</h2></div><Badge>{tickets.length} registros</Badge></div>{tickets.length ? <div className="table-scroll"><table className="dashboard-ticket-table"><thead><tr><th>Ticket</th><th>Fecha y hora</th><th>Medio de pago</th><th>Caja</th><th>Total</th></tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket.id}><td><strong>{ticket.id}</strong></td><td>{dateTime(ticket.createdAt)}</td><td><TicketPayments ticket={ticket}/></td><td>{ticket.register}</td><td><strong>{money(ticket.total)}</strong></td></tr>)}</tbody></table></div> : <EmptyState icon="receipt" title="Todavía no hay tickets" detail="Las ventas registradas en la caja aparecerán acá." />}</Card>
}

export default function DashboardPage({ user, products, cash, history, onNavigate }) {
  const lowStock = products.filter((product) => product.stock <= product.minStock).length
  const sold = cash?.totalSales || 0
  const cashIncome = Number(cash?.cashSales || 0)
  const transferIncome = Number(cash?.virtualSales || 0)
  const totalIncome = cashIncome + transferIncome
  return <div className="page-stack">
    <div className="page-heading"><div><span className="eyebrow">INICIO</span><h1>¡Bienvenido, {user.firstName}!</h1><p>{today()} · Resumen de tu operación.</p></div><Button icon="pos" onClick={() => onNavigate('pos')}>Nueva venta</Button></div>
    <div className="metric-grid"><Card><span className="metric-label">ESTADO DE CAJA</span><strong className="metric-value">{cash ? 'Abierta' : 'Cerrada'}</strong><span className={cash ? 'metric-status good' : 'metric-status'}>{cash ? `Desde las ${time(cash.openedAt)}` : 'Abrila para vender'}</span></Card><Card><span className="metric-label">VENTAS DEL DÍA</span><strong className="metric-value">{money(sold)}</strong><span className="metric-status good">{cash?.tickets.length || 0} tickets en esta sesión</span></Card><Card><span className="metric-label">STOCK A REVISAR</span><strong className="metric-value">{lowStock}</strong><span className="metric-status warning">Productos en o bajo mínimo</span></Card><Card className="income-card"><span className="metric-label">TOTAL DE INGRESOS</span><strong className="metric-value">{money(totalIncome)}</strong><div className="income-breakdown"><span><small>Efectivo</small><strong>{money(cashIncome)}</strong></span><span><small>Transferencia</small><strong>{money(transferIncome)}</strong></span></div></Card></div>
    <TicketHistory cash={cash} history={history} />
  </div>
}
