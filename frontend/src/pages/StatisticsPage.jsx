import { useEffect, useState } from 'react'
import { Button, Card, EmptyState, Field } from '../components/ui/index.jsx'
import Icon from '../components/ui/Icon.jsx'
import { dateTime, money } from '../features/utils/format.js'
import { expectedCash } from '../features/utils/calculations.js'

const iso = (date) => date.toISOString().slice(0, 10)
const shortDate = (value) => new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`))
const periodLabel = (start, end) => {
  const from = new Date(`${start}T12:00:00`)
  const to = new Date(`${end.slice(0, 10)}T12:00:00`)
  const month = new Intl.DateTimeFormat('es-AR', { month: 'long' })
  if (from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()) return `${from.getDate()} – ${to.getDate()} de ${month.format(to)} de ${to.getFullYear()}`
  if (from.getFullYear() === to.getFullYear()) return `${from.getDate()} de ${month.format(from)} – ${to.getDate()} de ${month.format(to)} de ${to.getFullYear()}`
  return `${shortDate(start)} de ${from.getFullYear()} – ${shortDate(end.slice(0, 10))} de ${to.getFullYear()}`
}
const monthLabel = (key) => new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date(`${key}-01T12:00:00`))
const weekLabel = (key) => { const start = new Date(`${key}T12:00:00`); const end = new Date(start); end.setDate(start.getDate() + 6); return `${shortDate(key)} – ${shortDate(iso(end))}` }
const rangeFor = (mode, value) => {
  const current = new Date(`${value}T12:00:00`)
  if (mode === 'day') return [iso(current), `${iso(current)}T23:59:59.999Z`]
  if (mode === 'all') return ['1970-01-01', `${iso(new Date())}T23:59:59.999Z`]
  if (mode === 'month') {
    const start = new Date(current.getFullYear(), current.getMonth(), 1)
    const end = new Date(current.getFullYear(), current.getMonth() + 1, 0)
    return [iso(start), `${iso(end)}T23:59:59.999Z`]
  }
  const weekday = current.getDay() || 7
  const start = new Date(current); start.setDate(current.getDate() - weekday + 1)
  const end = new Date(start); end.setDate(start.getDate() + 6)
  return [iso(start), `${iso(end)}T23:59:59.999Z`]
}

function KpiCard({ icon, label, value, detail, tone = '' }) {
  return <Card className={`statistics-kpi ${tone}`}><div className="statistics-kpi-head"><span className="statistics-kpi-icon"><Icon name={icon} size={19}/></span><span>{label}</span></div><strong>{value}</strong><small>{detail}</small></Card>
}

function MovementHistory({ events, loading }) {
  return <Section title="Historial de movimientos" icon="receipt" className="statistics-movements">{loading ? <div className="statistics-history-loading"><i/><i/><i/></div> : events.length ? <div className="statistics-movement-list">{events.map((event) => <article key={event.id}><span className={`statistics-movement-mark ${event.type === 'SALE' ? 'sale' : event.type === 'CASH_CLOSE' ? 'close' : 'open'}`}><Icon name={event.type === 'SALE' ? 'pos' : event.type.startsWith('PRODUCT') ? 'stock' : 'cash'} size={16}/></span><div><strong>{event.description}</strong><small>{event.user} · {dateTime(event.createdAt)}</small></div><b>{event.amount === null ? '—' : money(event.amount)}</b></article>)}</div> : <EmptyState icon="receipt" title="Sin movimientos" detail="Las acciones registradas aparecerán aquí."/>}</Section>
}

function Section({ title, icon, children, action, className = '' }) {
  return <Card className={`statistics-section ${className}`}><header><div><span className="statistics-section-icon"><Icon name={icon} size={19}/></span><div><h2>{title}</h2></div></div>{action}</header>{children}</Card>
}

function HistoryList({ periods, loading, group, includeRestock }) {
  if (loading) return <div className="statistics-history-loading"><i/><i/><i/></div>
  if (!periods.length) return <Card className="statistics-history-card"><EmptyState icon="stats" title="Sin períodos registrados" detail="Los períodos con movimientos aparecerán en este historial."/></Card>
  return <Card className="statistics-history-card"><header><div><span className="statistics-section-icon"><Icon name="stats" size={19}/></span><div><h2>Períodos registrados</h2><p>Ampliá un período para consultar su balance financiero.</p></div></div></header><div className="statistics-history-list">{periods.map((period) => { const net = period.grossSales - period.operatingExpenses - (includeRestock ? period.costOfSales : 0); return <details key={period.key}><summary><div><strong>{group === 'week' ? weekLabel(period.key) : monthLabel(period.key)}</strong><small>{period.ticketCount} venta{period.ticketCount === 1 ? '' : 's'} · {period.cashCloseCount} cierre{period.cashCloseCount === 1 ? '' : 's'}</small></div><div><span>Resultado neto</span><b className={net < 0 ? 'negative' : 'positive'}>{money(net)}</b></div><Icon name="chevron" size={18}/></summary><div className="statistics-history-detail"><div><span>Ingresos por ventas</span><strong>{money(period.grossSales)}</strong></div><div><span>Gastos operativos</span><strong>− {money(period.operatingExpenses)}</strong></div><div><span>Restock estimado</span><strong>{includeRestock ? `− ${money(period.costOfSales)}` : 'No incluido'}</strong></div><div className={net < 0 ? 'negative' : 'positive'}><span>Balance neto</span><strong>{money(net)}</strong></div></div></details> })}</div></Card>
}

export default function StatisticsPage({ api, historyApi, auditApi, onExpense, cash }) {
  const [mode, setMode] = useState('week')
  const [showAmounts, setShowAmounts] = useState(true)
  const [includeRestock, setIncludeRestock] = useState(false)
  const [date, setDate] = useState(iso(new Date()))
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [historyGroup, setHistoryGroup] = useState('month')
  const [historyLoading, setHistoryLoading] = useState(false)
  const [auditEvents, setAuditEvents] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [expensesDetailOpen, setExpensesDetailOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ amount: '', description: '', category: 'otros', paymentMethod: 'Efectivo' })
  const [start, end] = rangeFor(mode, date)

  const load = async () => {
    setLoading(true); setError(''); setStats(null)
    try { setStats(await api(start, end)) } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [start, end])
  useEffect(() => { setHistoryLoading(true); historyApi(historyGroup).then(setHistory).catch((err) => setError(err.message)).finally(() => setHistoryLoading(false)) }, [historyApi, historyGroup])
  useEffect(() => { setAuditLoading(true); auditApi().then(setAuditEvents).catch((err) => setError(err.message)).finally(() => setAuditLoading(false)) }, [auditApi])
  const saveExpense = async (event) => {
    event.preventDefault(); if (saving) return
    setSaving(true)
    try { await onExpense({ ...form, amount: Number(form.amount), expenseAt: new Date().toISOString() }); setExpenseOpen(false); setForm({ amount: '', description: '', category: 'otros', paymentMethod: 'Efectivo' }); await load() } finally { setSaving(false) }
  }

  const rangeLabel = periodLabel(start, end)
  const today = iso(new Date())
  const expenses = stats?.expenses || []
  const payments = Object.entries(stats?.paymentTotals || { Efectivo: stats?.cashSales || 0, Virtual: stats?.virtualSales || 0 }).map(([label, value], index) => ({ label, value, tone: index === 0 ? 'cash' : 'virtual' }))
  const paymentTotal = payments.reduce((sum, item) => sum + item.value, 0)
  const cashPayment = payments.find((payment) => payment.label === 'Efectivo')?.value || 0
  const virtualPayment = paymentTotal - cashPayment
  const displayMoney = (value) => showAmounts ? money(value) : '••••'
  const currentCash = cash ? expectedCash(cash) : null
  const estimatedBalance = stats ? stats.grossSales - stats.operatingExpenses - (includeRestock ? stats.costOfSales : 0) : 0

  return <div className="page-stack statistics-page">
    <div className="page-heading statistics-heading"><div><span className="eyebrow">ANÁLISIS COMERCIAL</span><h1>Estadísticas</h1><p>Rendimiento y métricas de tu veterinaria.</p></div><div className="statistics-header-controls"><Button variant="secondary" onClick={() => setShowAmounts((visible) => !visible)}>{showAmounts ? 'Ocultar montos' : 'Mostrar montos'}</Button><div className="statistics-summary-mode" aria-label="Período del resumen"><button className={mode === 'all' ? 'selected' : ''} onClick={() => setMode('all')}>Todo</button><button className={mode === 'month' ? 'selected' : ''} onClick={() => setMode('month')}>Mensual</button><button className={mode === 'week' ? 'selected' : ''} onClick={() => setMode('week')}>Semanal</button></div></div></div>
    {loading && <div className="statistics-loading" aria-label="Cargando estadísticas"><i/><i/><i/><i/></div>}
    {error && <Card className="statistics-error"><Icon name="alert"/><div><strong>No se pudieron cargar las estadísticas</strong><span>{error}</span></div><Button variant="secondary" onClick={load}>Reintentar</Button></Card>}
    {stats && <>
      <section className="statistics-reference-block"><div className="statistics-reference-heading"><div><span className="eyebrow">RESUMEN COMERCIAL</span><h2>Indicadores del período</h2></div><small>{rangeLabel}</small></div><div className="statistics-kpis statistics-kpis-reference">
        <KpiCard icon="cash" label="Ingresos totales" value={displayMoney(stats.grossSales)} detail={`${stats.ticketCount} ticket${stats.ticketCount === 1 ? '' : 's'} emitido${stats.ticketCount === 1 ? '' : 's'}`}/>
        <KpiCard icon="cash" label="En efectivo" value={displayMoney(cashPayment)} detail={paymentTotal ? `${((cashPayment / paymentTotal) * 100).toFixed(1)}% del total` : 'Sin cobros'}/>
        <KpiCard icon="cash" label="Pagos virtuales" value={displayMoney(virtualPayment)} detail="Transferencias, tarjetas y otros medios"/>
        <KpiCard icon="receipt" label="Gasto de restock" value={displayMoney(stats.costOfSales)} detail="Costo estimado de unidades vendidas" tone={stats.costOfSales > 0 ? 'negative' : ''}/>
        <KpiCard icon="cash" label={cash ? 'Caja actual' : 'Última caja'} value={currentCash === null ? 'No disponible' : displayMoney(currentCash)} detail={cash ? 'Efectivo esperado de la caja abierta' : 'Abrí una caja para ver efectivo disponible'}/>
      </div></section>
      <section className="statistics-reference-block"><div className="statistics-reference-heading"><div><span className="eyebrow">BALANCE FINANCIERO</span><h2>Composición del resultado</h2></div></div><div className="statistics-content-grid statistics-balance-grid">
        <Section title="Valor actual del inventario" icon="stock"><div className="statistics-balance-list"><div><span>Inversión en stock</span><strong>{displayMoney(stats.inventory)}</strong></div><div><span>Productos vendidos</span><strong>{stats.itemsSold.toLocaleString('es-AR')} unidades</strong></div></div></Section>
        <Section title="Gastos operativos" icon="receipt" action={<div className="statistics-card-actions"><button type="button" title="Registrar gasto" aria-label="Registrar gasto" onClick={() => setExpenseOpen(true)}><Icon name="plus" size={18}/></button><button type="button" title="Ver todos los gastos" aria-label="Ver todos los gastos" onClick={() => setExpensesDetailOpen(true)}><Icon name="eye" size={18}/></button></div>}><div className="statistics-expenses compact">{expenses.length ? expenses.map((expense) => <article key={expense.id}><div><strong>{expense.description}</strong><small>{expense.category} · {expense.paymentMethod}</small></div><b>{displayMoney(expense.amount)}</b></article>) : <EmptyState icon="receipt" title="Sin gastos" detail="No hay gastos en este período."/>}</div></Section>
        <Section title="Balance neto" icon="stats" className="statistics-balance"><div className="statistics-balance-list"><label className="statistics-restock-switch"><input type="checkbox" checked={includeRestock} onChange={(event) => setIncludeRestock(event.target.checked)}/><span/><strong>Incluir costo de restock en el balance</strong></label><div><span>Ingresos brutos</span><strong>{displayMoney(stats.grossSales)}</strong></div><div><span>Gastos operativos</span><strong>− {displayMoney(stats.operatingExpenses)}</strong></div><div><span>Restock estimado</span><strong>{includeRestock ? `− ${displayMoney(stats.costOfSales)}` : 'No incluido'}</strong></div><div className={estimatedBalance < 0 ? 'negative' : 'positive'}><span>Resultado final estimado</span><strong>{displayMoney(estimatedBalance)}</strong></div></div></Section>
      </div></section>
      <section className="statistics-reference-block"><div className="statistics-reference-heading"><div><span className="eyebrow">HISTORIAL DE MOVIMIENTOS</span><h2>Historial de movimientos</h2></div></div><MovementHistory events={auditEvents} loading={auditLoading}/></section>
    </>}
    <section className="statistics-reference-block"><div className="statistics-reference-heading"><div><span className="eyebrow">HISTORIAL POR PERÍODOS</span><h2>Historial por período</h2></div><div className="statistics-summary-mode"><button className={historyGroup === 'month' ? 'selected' : ''} onClick={() => setHistoryGroup('month')}>Por mes</button><button className={historyGroup === 'week' ? 'selected' : ''} onClick={() => setHistoryGroup('week')}>Por semana</button></div></div><HistoryList periods={history} loading={historyLoading} group={historyGroup} includeRestock={includeRestock}/></section>
    {expenseOpen && <div className="drawer-backdrop"><form className="editor-panel editor-form" onSubmit={saveExpense}><div className="editor-header"><div><span className="eyebrow">NUEVO GASTO</span><h2>Registrar gasto operativo</h2></div><button type="button" className="icon-button" aria-label="Cerrar" onClick={() => setExpenseOpen(false)}><Icon name="close"/></button></div><Field label="MONTO"><input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })}/></Field><Field label="MOTIVO"><input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></Field><Field label="CATEGORÍA"><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{['alquiler', 'servicios', 'impuestos', 'sueldos', 'mantenimiento', 'proveedores', 'otros'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="MEDIO DE PAGO"><select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}><option>Efectivo</option><option value="Virtual">Transferencia</option></select></Field><div className="editor-actions"><Button type="button" variant="secondary" onClick={() => setExpenseOpen(false)}>Cancelar</Button><Button type="submit" loading={saving}>Guardar gasto</Button></div></form></div>}
    {expensesDetailOpen && <div className="drawer-backdrop"><section className="editor-panel editor-form statistics-expenses-modal" role="dialog" aria-modal="true" aria-labelledby="expenses-title"><div className="editor-header"><div><span className="eyebrow">GASTOS DEL PERÍODO</span><h2 id="expenses-title">Detalle de gastos</h2></div><button type="button" className="icon-button" aria-label="Cerrar" onClick={() => setExpensesDetailOpen(false)}><Icon name="close"/></button></div><div className="statistics-expenses detail">{expenses.length ? expenses.map((expense) => <article key={expense.id}><div><strong>{expense.description}</strong><small>{dateTime(expense.expenseAt)} · {expense.paymentMethod} · {expense.category}</small></div><b>{money(expense.amount)}</b></article>) : <EmptyState icon="receipt" title="Sin gastos" detail="No hay gastos registrados en este período."/>}</div><div className="editor-actions"><Button variant="secondary" onClick={() => setExpensesDetailOpen(false)}>Cerrar</Button></div></section></div>}
  </div>
}
