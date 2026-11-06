import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, EmptyState, Field } from '../components/ui/index.jsx'
import Icon from '../components/ui/Icon.jsx'

const PAGE_SIZE = 8
const sections = [
  { id: 'payment', title: 'Métodos de pago', description: 'Opciones disponibles para cobrar ventas.', icon: 'cash', create: 'Nuevo método de pago' },
  { id: 'category', title: 'Categorías', description: 'Clasificá el catálogo para encontrar productos fácilmente.', icon: 'stock', create: 'Nueva categoría' },
  { id: 'supplier', title: 'Proveedores', description: 'Administrá los proveedores registrados en el catálogo.', icon: 'users', create: 'Nuevo proveedor' },
  { id: 'laboratory', title: 'Laboratorios', description: 'Mantené organizadas las marcas y laboratorios.', icon: 'settings', create: 'Nuevo laboratorio' },
  { id: 'fixed', title: 'Gastos fijos', description: 'Definí gastos recurrentes sin registrarlos en caja.', icon: 'receipt', create: 'Nuevo gasto fijo' },
]

const byName = (items) => [...items].sort((a, b) => a.name.localeCompare(b.name, 'es'))
const money = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(amount || 0))
const frequency = (value) => value === 'weekly' ? 'Semanal' : 'Mensual'

function Pagination({ page, total, onPageChange }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const start = total ? (page - 1) * PAGE_SIZE + 1 : 0
  const end = Math.min(page * PAGE_SIZE, total)
  if (!total) return null
  return <footer className="settings-pagination">
    <span>Mostrando {start}–{end} de {total}</span>
    <div>
      <button type="button" aria-label="Primera página" title="Primera página" disabled={page === 1} onClick={() => onPageChange(1)}>«</button>
      <button type="button" aria-label="Página anterior" title="Página anterior" disabled={page === 1} onClick={() => onPageChange(page - 1)}>‹</button>
      <span>Página {page} de {pages}</span>
      <button type="button" aria-label="Página siguiente" title="Página siguiente" disabled={page === pages} onClick={() => onPageChange(page + 1)}>›</button>
      <button type="button" aria-label="Última página" title="Última página" disabled={page === pages} onClick={() => onPageChange(pages)}>»</button>
    </div>
  </footer>
}

function SettingsCard({ section, items, onEdit, onDeactivate, onCreate }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => byName(items).filter((item) => `${item.name} ${item.description || ''}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages)
  const shown = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const isFixed = section.id === 'fixed'
  const updateQuery = (value) => { setQuery(value); setPage(1) }
  const secondary = (item) => isFixed ? `${money(item.amount)} · ${frequency(item.frequency)}` : item.description || (section.id === 'supplier' ? 'Sin información adicional' : 'Sin descripción')

  return <Card className="settings-card">
    <header className="settings-card-header">
      <span className="settings-card-icon"><Icon name={section.icon} size={20}/></span>
      <div><h2>{section.title}</h2><p>{section.description}</p></div>
      <button type="button" className="settings-add" aria-label={section.create} title={section.create} onClick={onCreate}><Icon name="plus" size={19}/></button>
    </header>
    <div className="settings-card-body">
      <label className="settings-search"><Icon name="search" size={17}/><input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder={`Buscar ${section.title.toLowerCase()}…`}/></label>
      {shown.length ? <div className="settings-list">{shown.map((item) => <article className="settings-record" key={item.id}>
        <div className="settings-record-copy"><strong>{item.name}</strong><span>{secondary(item)}</span>{isFixed && item.paymentMethod && <small>{item.paymentMethod}</small>}</div>
        <div className="settings-record-actions">
          <Badge tone={item.active ? 'success' : 'neutral'}>{item.active ? 'Activo' : 'Inactivo'}</Badge>
          <button type="button" className="settings-action" aria-label={`Editar ${item.name}`} title="Editar" onClick={() => onEdit(item)}><Icon name="edit" size={17}/></button>
          {item.active && <button type="button" className="settings-action danger" aria-label={`Desactivar ${item.name}`} title="Desactivar" onClick={() => onDeactivate(item)}><Icon name="trash" size={17}/></button>}
        </div>
      </article>)}</div> : <EmptyState
        icon={section.icon}
        title={items.length ? 'Sin coincidencias' : 'Sin registros'}
        detail={items.length ? 'Probá con otra búsqueda.' : 'Creá el primer registro para esta sección.'}
      />}
    </div>
    <Pagination page={currentPage} total={filtered.length} onPageChange={setPage}/>
  </Card>
}

export default function SettingsPage({ api, notify, onUpdated }) {
  const [data, setData] = useState({ payment: [], category: [], supplier: [], laboratory: [], fixed: [] })
  const [editing, setEditing] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [payment, category, supplier, laboratory, fixed] = await Promise.all([api.settings('payment'), api.settings('category'), api.settings('supplier'), api.settings('laboratory'), api.fixedExpenses()])
      setData({ payment, category, supplier, laboratory, fixed })
    } catch (err) { setError(err.message) }
  }
  useEffect(() => { load() }, [])
  const sectionFor = (id) => sections.find((section) => section.id === id)
  const openCreate = (section) => { setError(''); setEditing({ section: section.id, item: { active: true } }) }
  const openEdit = (section, item) => { setError(''); setEditing({ section: section.id, item }) }
  const save = async (event) => {
    event.preventDefault()
    if (saving) return
    const form = new FormData(event.currentTarget)
    const item = { ...editing.item, ...Object.fromEntries(form), active: form.has('active') }
    if (editing.section === 'fixed') item.amount = Number(item.amount)
    setSaving(true); setError('')
    try {
      await (editing.section === 'fixed' ? api.saveFixedExpense(item) : api.saveSetting(editing.section, item))
      setEditing(null); await load(); await onUpdated?.(); notify('Configuración guardada correctamente.')
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  const deactivate = async () => {
    if (!confirming || saving) return
    setSaving(true); setError('')
    try {
      const { section, item } = confirming
      await (section === 'fixed' ? api.saveFixedExpense({ ...item, active: false }) : api.saveSetting(section, { ...item, active: false }))
      setConfirming(null); await load(); await onUpdated?.(); notify(`${item.name} se desactivó correctamente.`)
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  const section = editing && sectionFor(editing.section)
  const item = editing?.item

  return <div className="page-stack settings-page">
    <div className="page-heading"><div><span className="eyebrow">ADMINISTRACIÓN</span><h1>Configuración</h1><p>Administrá los parámetros generales y comerciales de tu negocio.</p></div></div>
    {error && <div className="inline-message error"><Icon name="alert" size={18}/><span>{error}</span></div>}
    <div className="settings-grid">{sections.map((entry) => <SettingsCard key={entry.id} section={entry} items={data[entry.id]} onCreate={() => openCreate(entry)} onEdit={(record) => openEdit(entry, record)} onDeactivate={(record) => setConfirming({ section: entry.id, item: record })}/>)}</div>
    {editing && <div className="drawer-backdrop" role="presentation"><form className="editor-panel editor-form settings-editor" onSubmit={save}>
      <div className="editor-header"><div><span className="eyebrow">CONFIGURACIÓN</span><h2>{item.id ? `Editar ${section.title.toLowerCase().replace(/s$/, '')}` : section.create}</h2></div><button type="button" className="icon-button" aria-label="Cerrar" onClick={() => setEditing(null)}><Icon name="close"/></button></div>
      <Field label="NOMBRE"><input name="name" required defaultValue={item.name || ''} autoFocus/></Field>
      {editing.section === 'fixed' ? <><Field label="IMPORTE"><input name="amount" type="number" min="0.01" step="0.01" required defaultValue={item.amount ?? ''}/></Field><div className="form-grid"><Field label="FRECUENCIA"><select name="frequency" defaultValue={item.frequency || 'monthly'}><option value="weekly">Semanal</option><option value="monthly">Mensual</option></select></Field><Field label="MEDIO DE PAGO"><select name="paymentMethod" defaultValue={item.paymentMethod || 'Efectivo'}><option>Efectivo</option><option value="Virtual">Transferencia</option></select></Field></div><Field label="FECHA DE INICIO"><input name="startDate" type="date" required defaultValue={item.startDate || new Date().toISOString().slice(0, 10)}/></Field><Field label="DESCRIPCIÓN"><input name="description" defaultValue={item.description || ''}/></Field></> : <><Field label="DESCRIPCIÓN"><input name="description" defaultValue={item.description || ''}/></Field><Field label="DATOS ADICIONALES"><textarea name="details" defaultValue={item.details || ''}/></Field></>}
      <label className="switch-row"><input name="active" type="checkbox" defaultChecked={item.active !== false}/><span/><div><strong>Activo</strong><small>Disponible para operar.</small></div></label>
      <div className="editor-actions"><Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button><Button type="submit" loading={saving}>Guardar</Button></div>
    </form></div>}
    {confirming && <div className="settings-confirm-backdrop" role="presentation"><section className="settings-confirm" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><span className="settings-confirm-icon"><Icon name="alert" size={22}/></span><div><h2 id="confirm-title">Desactivar registro</h2><p>“{confirming.item.name}” dejará de estar disponible para operar. Podés reactivarlo desde Editar.</p></div><div className="settings-confirm-actions"><Button variant="secondary" onClick={() => setConfirming(null)}>Cancelar</Button><Button variant="danger" loading={saving} onClick={deactivate}>Desactivar</Button></div></section></div>}
  </div>
}
