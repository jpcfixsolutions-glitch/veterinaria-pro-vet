import { useEffect, useMemo, useState } from 'react'
import { Button, Card, EmptyState, Field } from '../components/ui/index.jsx'
import Icon from '../components/ui/Icon.jsx'
import { money } from '../features/utils/format.js'

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
const rangeFor = (mode, value) => {
  const current = new Date(`${value}T12:00:00`)
  if (mode === 'day') return [iso(current), `${iso(current)}T23:59:59.999Z`]
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
const daysFor = (start, end) => {
  const rows = []; const cursor = new Date(`${start}T12:00:00`); const last = new Date(`${end.slice(0, 10)}T12:00:00`)
  while (cursor <= last) { rows.push(iso(cursor)); cursor.setDate(cursor.getDate() + 1) }
  return rows
}

function KpiCard({ icon, label, value, detail, tone = '' }) {
  return <Card className={`statistics-kpi ${tone}`}><div className="statistics-kpi-head"><span className="statistics-kpi-icon"><Icon name={icon} size={19}/></span><span>{label}</span></div><strong>{value}</strong><small>{detail}</small></Card>
}

function Section({ title, icon, children, action, className = '' }) {
  return <Card className={`statistics-section ${className}`}><header><div><span className="statistics-section-icon"><Icon name={icon} size={19}/></span><div><h2>{title}</h2></div></div>{action}</header>{children}</Card>
}

function SalesChart({ sales, start, end }) {
  const daily = useMemo(() => {
    const totals = new Map(sales.map((row) => [row.date, Number(row.total)]))
    return daysFor(start, end).map((date) => ({ date, total: totals.get(date) || 0 }))
  }, [sales, start, end])
  const max = Math.max(...daily.map((row) => row.total), 0)
  if (!max) return <EmptyState icon="stats" title="Sin ventas en este período" detail="Cuando se registren ventas, vas a ver su evolución diaria acá."/>
  return <div className="statistics-chart"><div className="statistics-chart-scale"><span>{money(max)}</span><span>{money(max / 2)}</span><span>$ 0</span></div><div className="statistics-chart-bars">{daily.map((row) => <div className="statistics-bar-wrap" key={row.date}><div className="statistics-bar-hit" title={`${shortDate(row.date)} · ${money(row.total)}`}><i style={{ height: `${Math.max(5, (row.total / max) * 100)}%` }}/></div><small>{shortDate(row.date)}</small></div>)}</div></div>
}

function HistoryList({ periods, loading }) {
  if (loading) return <div className="statistics-history-loading"><i/><i/><i/></div>
  if (!periods.length) return <Card className="statistics-history-card"><EmptyState icon="stats" title="Sin períodos registrados" detail="Los meses con ventas o gastos aparecerán en este historial."/></Card>
  return <Card className="statistics-history-card"><header><div><span className="statistics-section-icon"><Icon name="stats" size={19}/></span><div><h2>Períodos registrados</h2><p>Ampliá un mes para consultar su balance financiero.</p></div></div></header><div className="statistics-history-list">{periods.map((period) => <details key={period.key}><summary><div><strong>{monthLabel(period.key)}</strong><small>{period.ticketCount} venta{period.ticketCount === 1 ? '' : 's'} registrada{period.ticketCount === 1 ? '' : 's'}</small></div><div><span>Resultado neto</span><b className={period.net < 0 ? 'negative' : 'positive'}>{money(period.net)}</b></div><Icon name="chevron" size={18}/></summary><div className="statistics-history-detail"><div><span>Ingresos por ventas</span><strong>{money(period.grossSales)}</strong></div><div><span>Costo de mercadería vendida</span><strong>− {money(period.costOfSales)}</strong></div><div><span>Gastos operativos</span><strong>− {money(period.operatingExpenses)}</strong></div><div className={period.net < 0 ? 'negative' : 'positive'}><span>Balance neto</span><strong>{money(period.net)}</strong></div></div></details>)}</div></Card>
}

export default function StatisticsPage({ api, historyApi, onExpense }) {
  const [mode, setMode] = useState('week')
  const [date, setDate] = useState(iso(new Date()))
  const [view, setView] = useState('summary')
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ amount: '', description: '', category: 'otros', paymentMethod: 'Efectivo' })
  const [start, end] = rangeFor(mode, date)

  const load = async () => {
    setLoading(true); setError(''); setStats(null)
    try { setStats(await api(start, end)) } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [start, end])
  useEffect(() => { if (view !== 'history') return; setHistoryLoading(true); historyApi().then(setHistory).catch((err) => setError(err.message)).finally(() => setHistoryLoading(false)) }, [view, historyApi])
  const saveExpense = async (event) => {
    event.preventDefault(); if (saving) return
    setSaving(true)
    try { await onExpense({ ...form, amount: Number(form.amount), expenseAt: new Date().toISOString() }); setExpenseOpen(false); setForm({ amount: '', description: '', category: 'otros', paymentMethod: 'Efectivo' }); await load() } finally { setSaving(false) }
  }

  const rangeLabel = periodLabel(start, end)
  const today = iso(new Date())
  const expenses = stats?.expenses || []
  const payments = [{ label: 'Efectivo', value: stats?.cashSales || 0, tone: 'cash' }, { label: 'Virtual', value: stats?.virtualSales || 0, tone: 'virtual' }]
  const paymentTotal = payments.reduce((sum, item) => sum + item.value, 0)

  const selectView = (nextView) => { setView(nextView); if (nextView === 'summary') setDate(today) }
  return <div className="page-stack statistics-page">
    <div className="page-heading statistics-heading"><div><span className="eyebrow">ANÁLISIS COMERCIAL</span><h1>Estadísticas</h1><p>{view === 'summary' ? 'Conocé el desempeño comercial y financiero actual de tu negocio.' : 'Consultá y compará períodos anteriores de tu negocio.'}</p></div><div className="statistics-header-controls"><div className="statistics-summary-mode" aria-label="Período del resumen"><button className={mode === 'day' ? 'selected' : ''} onClick={() => setMode('day')}>Día</button><button className={mode === 'week' ? 'selected' : ''} onClick={() => setMode('week')}>Semana</button><button className={mode === 'month' ? 'selected' : ''} onClick={() => setMode('month')}>Mes</button></div><div className="statistics-view-tabs" role="tablist" aria-label="Secciones de estadísticas"><button role="tab" aria-selected={view === 'summary'} className={view === 'summary' ? 'selected' : ''} onClick={() => selectView('summary')}>Resumen actual</button><button role="tab" aria-selected={view === 'history'} className={view === 'history' ? 'selected' : ''} onClick={() => selectView('history')}>Historial</button></div></div></div>
    {view === 'summary' && <Card className="statistics-current-period"><div><span>Período actual</span><strong>{rangeLabel}</strong></div><small>Usá Historial para consultar períodos anteriores.</small></Card>}
    {loading && <div className="statistics-loading" aria-label="Cargando estadísticas"><i/><i/><i/><i/></div>}
    {error && <Card className="statistics-error"><Icon name="alert"/><div><strong>No se pudieron cargar las estadísticas</strong><span>{error}</span></div><Button variant="secondary" onClick={load}>Reintentar</Button></Card>}
    {stats && view === 'summary' && <>
      <div className="statistics-kpis">
        <KpiCard icon="cash" label="Ventas totales" value={money(stats.grossSales)} detail={`${stats.ticketCount} venta${stats.ticketCount === 1 ? '' : 's'} registrada${stats.ticketCount === 1 ? '' : 's'}`}/>
        <KpiCard icon="receipt" label="Ticket promedio" value={money(stats.averageTicket)} detail="Promedio por venta del período"/>
        <KpiCard icon="stock" label="Productos vendidos" value={stats.itemsSold.toLocaleString('es-AR')} detail="Unidades entregadas"/>
        <KpiCard icon="stats" label="Resultado neto" value={money(stats.net)} detail={stats.profitability === null ? 'Sin ventas para calcular rentabilidad' : `${stats.profitability.toFixed(1)}% de rentabilidad`} tone={stats.net < 0 ? 'negative' : 'positive'}/>
      </div>
      <div className="statistics-content-grid">
        <Section title="Evolución de ventas" icon="stats" className="statistics-chart-section"><SalesChart sales={stats.dailySales} start={start} end={end}/></Section>
        <Section title="Cobros por método" icon="cash"><div className="statistics-payment-list">{payments.map((payment) => <div key={payment.label}><div><span className={`statistics-payment-dot ${payment.tone}`}/><strong>{payment.label}</strong><small>{paymentTotal ? `${((payment.value / paymentTotal) * 100).toFixed(1)}% del total` : 'Sin cobros'}</small></div><b>{money(payment.value)}</b></div>)}</div></Section>
        <Section title="Productos más vendidos" icon="stock" className="statistics-products"><div className="statistics-rank-list">{stats.topProducts.length ? stats.topProducts.map((product, index) => <div key={product.id}><span>{index + 1}</span><div><strong>{product.name}</strong><small>{product.quantity} unidades · {money(product.revenue)}</small></div><b>{product.quantity}</b></div>) : <EmptyState icon="stock" title="Sin productos vendidos" detail="El ranking se completará con las ventas del período."/>}</div></Section>
        <Section title="Balance financiero" icon="receipt" className="statistics-balance"><div className="statistics-balance-list"><div><span>Ingresos por ventas</span><strong>{money(stats.grossSales)}</strong></div><div><span>Costo de mercadería vendida</span><strong>− {money(stats.costOfSales)}</strong></div><div><span>Gastos operativos</span><strong>− {money(stats.operatingExpenses)}</strong></div><div className={stats.net < 0 ? 'negative' : 'positive'}><span>Resultado neto</span><strong>{money(stats.net)}</strong></div></div></Section>
      </div>
      <Section title="Gastos operativos del período" icon="receipt" action={<button className="statistics-add-expense" onClick={() => setExpenseOpen(true)}><Icon name="plus" size={17}/> Registrar gasto</button>}><div className="statistics-expenses">{expenses.length ? expenses.map((expense) => <article key={expense.id}><div><strong>{expense.description}</strong><small>{expense.category} · {expense.paymentMethod}</small></div><b>{money(expense.amount)}</b></article>) : <EmptyState icon="receipt" title="Sin gastos registrados" detail="Los gastos cargados durante este período aparecerán acá."/>}</div></Section>
      <div className="statistics-stock-note"><Icon name="stock" size={18}/><span>Valor actual del inventario</span><strong>{money(stats.inventory)}</strong></div>
    </>}
    {view === 'history' && <HistoryList periods={history} loading={historyLoading}/>} 
    {expenseOpen && <div className="drawer-backdrop"><form className="editor-panel editor-form" onSubmit={saveExpense}><div className="editor-header"><div><span className="eyebrow">NUEVO GASTO</span><h2>Registrar gasto operativo</h2></div><button type="button" className="icon-button" aria-label="Cerrar" onClick={() => setExpenseOpen(false)}><Icon name="close"/></button></div><Field label="MONTO"><input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })}/></Field><Field label="MOTIVO"><input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></Field><Field label="CATEGORÍA"><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{['alquiler', 'servicios', 'impuestos', 'sueldos', 'mantenimiento', 'proveedores', 'otros'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="MEDIO DE PAGO"><select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}><option>Efectivo</option><option value="Virtual">Transferencia</option></select></Field><div className="editor-actions"><Button type="button" variant="secondary" onClick={() => setExpenseOpen(false)}>Cancelar</Button><Button type="submit" loading={saving}>Guardar gasto</Button></div></form></div>}
  </div>
}
