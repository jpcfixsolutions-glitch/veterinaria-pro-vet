import { useMemo, useState } from 'react'
import { Badge, Button, Card, EmptyState, Field } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'
import { money } from '../utils/format.js'
import { profitability, salePriceFromProfitability } from '../utils/calculations.js'

const PAGE_SIZE = 5
const blank = { name: '', barcode: '', supplier: '', laboratory: '', cost: '', salePrice: '', stock: '', minStock: '' }

function ProductEditor({ product, onCancel, onSave }) {
  const [form, setForm] = useState(product ? { ...product } : blank)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const updateProfitability = (value) => set('salePrice', Math.round(salePriceFromProfitability(form.cost, value)))
  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    ;['name', 'barcode', 'supplier', 'laboratory'].forEach((field) => { if (!String(form[field]).trim()) nextErrors[field] = 'Campo obligatorio.' })
    ;['cost', 'salePrice', 'stock', 'minStock'].forEach((field) => { if (Number(form[field]) < 0 || form[field] === '') nextErrors[field] = 'Ingresá un valor igual o mayor a cero.' })
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)
    setSaving(true); await onSave({ ...form, cost: Number(form.cost), salePrice: Number(form.salePrice), stock: Number(form.stock), minStock: Number(form.minStock) }); setSaving(false)
  }
  const margin = profitability(form.cost, form.salePrice)
  return <aside className="editor-panel"><div className="editor-header"><div><span className="eyebrow">{product ? 'EDICIÓN DE PRODUCTO' : 'NUEVO PRODUCTO'}</span><h2>{product ? product.name : 'Alta de producto'}</h2></div><button className="icon-button" onClick={onCancel} aria-label="Cerrar"><Icon name="close"/></button></div><form onSubmit={submit} className="editor-form"><Field label="NOMBRE" error={errors.name}><input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field><div className="form-grid"><Field label="CÓDIGO DE BARRAS" error={errors.barcode}><input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} /></Field><Field label="STOCK ACTUAL" error={errors.stock}><input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} /></Field></div><div className="form-grid"><Field label="PROVEEDOR" error={errors.supplier}><input value={form.supplier} onChange={(e) => set('supplier', e.target.value)} /></Field><Field label="LABORATORIO" error={errors.laboratory}><input value={form.laboratory} onChange={(e) => set('laboratory', e.target.value)} /></Field></div><div className="form-grid"><Field label="PRECIO DE COSTO" error={errors.cost}><input type="number" min="0" value={form.cost} onChange={(e) => set('cost', e.target.value)} /></Field><Field label="PRECIO DE VENTA" error={errors.salePrice}><input type="number" min="0" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} /></Field></div><div className="form-grid"><Field label="STOCK MÍNIMO" error={errors.minStock}><input type="number" min="0" value={form.minStock} onChange={(e) => set('minStock', e.target.value)} /></Field><Field label="RENTABILIDAD SOBRE COSTO (%)"><input type="number" disabled={Number(form.cost) <= 0} value={Number.isFinite(margin) ? margin.toFixed(1) : 0} onChange={(e) => updateProfitability(e.target.value)} /></Field></div><p className="form-hint">La rentabilidad se calcula sobre costo: ((venta − costo) / costo) × 100. Con costo $0 no se calcula.</p><div className="editor-actions"><Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button><Button type="submit" loading={saving}>Guardar cambios</Button></div></form></aside>
}

export default function StockPage({ products, onSaveProduct, toast }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const filtered = useMemo(() => products.filter((product) => {
    const matches = `${product.name} ${product.barcode} ${product.supplier} ${product.laboratory}`.toLowerCase().includes(query.toLowerCase())
    return matches && (filter === 'all' || (filter === 'low' && product.stock <= product.minStock))
  }), [products, query, filter])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const save = async (item) => { await onSaveProduct(item); setEditing(null) }
  return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow">RELEVAMIENTO / STOCK</span><h1>Productos y existencias</h1><p>Fuente de datos compartida con el punto de venta.</p></div><Button icon="plus" onClick={() => setEditing({})}>Nuevo producto</Button></div><Card><div className="toolbar"><label className="search-input"><Icon name="search"/><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Buscar por nombre, código, proveedor o laboratorio…" /></label><select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1) }}><option value="all">Todos los productos</option><option value="low">Stock bajo o crítico</option></select></div>{visible.length ? <><div className="table-scroll"><table><thead><tr><th>Producto</th><th>Proveedor / Laboratorio</th><th>Costo</th><th>Venta</th><th>Rentab.</th><th>Stock</th><th /></tr></thead><tbody>{visible.map((product) => { const low = product.stock <= product.minStock; return <tr key={product.id} className={low ? 'low-stock-row' : ''}><td><strong>{product.name}</strong><small>{product.id} · {product.barcode}</small></td><td><span>{product.supplier}</span><small>{product.laboratory}</small></td><td>{money(product.cost)}</td><td>{money(product.salePrice)}</td><td><Badge tone={product.cost ? 'success' : 'neutral'}>{product.cost ? `${profitability(product.cost, product.salePrice).toFixed(1)}%` : '—'}</Badge></td><td><strong>{product.stock}</strong><small>mín. {product.minStock} {low && <Badge tone="warning">Revisar</Badge>}</small></td><td><button className="table-action" onClick={() => setEditing(product)}><Icon name="edit" size={17}/> Editar</button></td></tr> })}</tbody></table></div><div className="pagination"><span>{filtered.length} productos</span><div><Button variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button><strong>{page} / {pages}</strong><Button variant="secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>Siguiente</Button></div></div></> : <EmptyState icon="search" title="No encontramos productos" detail="Probá con otro término o quitá el filtro aplicado." />}</Card>{editing !== null && <div className="drawer-backdrop"><ProductEditor product={editing.id ? editing : null} onCancel={() => setEditing(null)} onSave={save}/></div>}</div>
}
