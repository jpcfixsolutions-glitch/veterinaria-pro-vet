import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Card, EmptyState, Field } from '../components/ui/index.jsx'
import Icon from '../components/ui/Icon.jsx'
import PaymentModal from '../components/pos/PaymentModal.jsx'
import { money, time } from '../features/utils/format.js'

const PAGE_SIZE = 12
const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

function PosDialog({ children, title, onClose, busy = false, className = '' }) {
  const ref = useRef(null)
  useEffect(() => { ref.current.showModal() }, [])
  return <dialog ref={ref} className={`pv-pos-dialog ${className}`} aria-label={title} onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
    <div className="pv-pos-dialog-header"><h2>{title}</h2><button type="button" className="icon-button" onClick={onClose} disabled={busy} aria-label={`Cerrar ${title}`}><Icon name="close" /></button></div>
    {children}
  </dialog>
}

function CartContents({ cart, total, loading, onQuantity, onRemove, onCheckout }) {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  return <>
    <div className="pv-pos-cart-heading"><h2>Carrito</h2><p>{count} {count === 1 ? 'producto' : 'productos'}</p></div>
    <div className="pv-pos-cart-items">{cart.length ? cart.map((item) => <article className="pv-pos-cart-item" key={item.id}>
      <div className="pv-pos-item-heading"><div><h3>{item.name}</h3><small>Por unidad</small><p>{money(item.salePrice)}</p></div><button type="button" className="icon-button" onClick={() => onRemove(item.id)} aria-label={`Quitar ${item.name}`} disabled={loading}><Icon name="trash" size={18} /></button></div>
      <div className="pv-pos-item-bottom"><div className="pv-pos-quantity"><button type="button" onClick={() => onQuantity(item.id, item.quantity - 1)} disabled={loading || item.quantity <= 1} aria-label={`Restar ${item.name}`}>−</button><input type="number" min="1" max={item.stock} step="1" value={item.quantity} disabled={loading} onFocus={(event) => event.target.select()} onChange={(event) => { const quantity = Number(event.target.value); if (Number.isInteger(quantity) && quantity > 0) onQuantity(item.id, quantity) }} aria-label={`Cantidad de ${item.name}`} /><button type="button" onClick={() => onQuantity(item.id, item.quantity + 1)} disabled={loading || item.quantity >= item.stock} aria-label={`Sumar ${item.name}`}>+</button></div><strong>{money(item.salePrice * item.quantity)}</strong></div>
    </article>) : <EmptyState icon="pos" title="Carrito vacío" detail="Agregá productos para comenzar." />}</div>
    <div className="pv-pos-cart-footer"><div className="pv-pos-total"><span>Total</span><strong>{money(total)}</strong></div><Button className="full-width" icon="cash" disabled={!cart.length || loading} onClick={onCheckout}>Finalizar venta</Button></div>
  </>
}

export default function PosPage({ products, cash, onNavigate, onSale }) {
  const [query, setQuery] = useState('')
  const [supplier, setSupplier] = useState('')
  const [page, setPage] = useState(1)
  const [cart, setCart] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mobileCart, setMobileCart] = useState(false)
  const [checkout, setCheckout] = useState(false)
  const inputRef = useRef(null)
  const submitting = useRef(false)
  const suppliers = useMemo(() => [...new Set(products.map((item) => item.supplier).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')), [products])
  const results = useMemo(() => products.filter((item) => (!supplier || item.supplier === supplier) && normalize(`${item.name} ${item.barcode}`).includes(normalize(query))).sort((a, b) => a.name.localeCompare(b.name, 'es')), [products, query, supplier])
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * PAGE_SIZE
  const total = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0)
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)

  const add = (product) => {
    if (loading) return
    const exists = cart.find((item) => item.id === product.id)
    if (product.stock <= 0 || (exists && exists.quantity >= product.stock)) return setStatus({ type: 'error', message: `No hay más unidades disponibles de ${product.name}.` })
    setCart((items) => exists ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { ...product, quantity: 1 }])
    setQuery(''); setPage(1); inputRef.current?.focus()
  }
  const changeQuantity = (id, quantity) => {
    const item = cart.find((line) => line.id === id)
    if (!item || !Number.isInteger(quantity) || quantity < 1 || loading) return
    if (quantity > item.stock) return setStatus({ type: 'error', message: `Stock máximo disponible: ${item.stock}.` })
    setCart((items) => items.map((line) => line.id === id ? { ...line, quantity } : line))
  }
  const openCheckout = () => { setMobileCart(false); setStatus(null); setCheckout(true) }
  const pay = async (payments) => {
    if (!cart.length || submitting.current) return
    submitting.current = true; setLoading(true); setStatus(null)
    try {
      const ticket = await onSale(cart, payments)
      setCart([]); setCheckout(false); setStatus({ type: 'success', message: `Ticket ${ticket.id} generado correctamente.` })
      inputRef.current?.focus()
    } catch (error) { setStatus({ type: 'error', message: error.message }) }
    finally { submitting.current = false; setLoading(false) }
  }
  const cartProps = { cart, total, loading, onQuantity: changeQuantity, onRemove: (id) => setCart((items) => items.filter((item) => item.id !== id)), onCheckout: openCheckout }

  if (!cash) return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow">PUNTO DE VENTA</span><h1>Punto de venta</h1></div></div><Card><EmptyState icon="lock" title="Necesitás abrir la caja para vender" detail="El punto de venta está bloqueado hasta registrar un monto inicial en Cajas." action={<Button icon="cash" onClick={() => onNavigate('cash')}>Abrir caja</Button>} /></Card></div>

  return <div className="pv-pos">
    <section className="pv-pos-catalog" aria-label="Catálogo de productos">
      <div className="page-heading"><div><span className="eyebrow">VENTAS · DESDE LAS {time(cash.openedAt)}</span><h1>Punto de venta</h1></div><Badge tone="success">Caja abierta</Badge></div>
      {status && !checkout && <div role="status" className={`inline-message ${status.type}`}><Icon name={status.type === 'error' ? 'alert' : 'check'} /><span>{status.message}</span><button onClick={() => setStatus(null)} aria-label="Cerrar aviso"><Icon name="close" size={16}/></button></div>}
      <div className="pv-pos-filters"><label className="pos-search"><Icon name="search"/><input ref={inputRef} aria-label="Buscar producto o código de barras" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} onKeyDown={(event) => { if (event.key !== 'Enter' || !query.trim()) return; const exact = products.find((product) => String(product.barcode) === query.trim()); if (exact || results.length === 1) { event.preventDefault(); add(exact || results[0]) } }} placeholder="Buscar o escanear código de barras..." />{query && <button type="button" className="icon-button" onClick={() => { setQuery(''); setPage(1); inputRef.current?.focus() }} aria-label="Limpiar búsqueda"><Icon name="close" size={16}/></button>}<kbd>Enter</kbd></label><p className="pv-pos-search-hint">Escaneá un código o ingresalo y presioná Enter para agregarlo al carrito.</p><Field label="PROVEEDOR"><select value={supplier} onChange={(event) => { setSupplier(event.target.value); setPage(1) }}><option value="">Todos los proveedores</option>{suppliers.map((name) => <option key={name} value={name}>{name}</option>)}</select></Field></div>
      <div className="pv-pos-products">{results.length ? results.slice(start, start + PAGE_SIZE).map((product) => {
        const remaining = product.stock - (cart.find((item) => item.id === product.id)?.quantity || 0)
        return <article key={product.id} className={`pv-pos-product ${product.stock <= 0 ? 'pv-pos-out-of-stock' : ''}`}><div className="pv-pos-product-details"><span className="pv-pos-product-icon"><Icon name="stock" size={22}/></span><div><h3>{product.name}</h3><p>{product.barcode} · Stock: {product.stock} u.</p>{product.supplier && <small>{product.supplier}</small>}{product.stock <= product.minStock && <Badge tone={product.stock <= 0 ? 'neutral' : 'warning'}>{product.stock <= 0 ? 'Sin stock' : 'Stock bajo'}</Badge>}</div></div><div className="pv-pos-product-actions"><strong>{money(product.salePrice)}</strong><Button icon="plus" disabled={remaining <= 0 || loading} onClick={() => add(product)} aria-label={`Agregar ${product.name}`} /></div></article>
      }) : <EmptyState icon="search" title="Sin coincidencias" detail="No hay productos con ese nombre, código o proveedor." />}</div>
      <div className="pagination pv-pos-pagination"><span>{results.length ? `${start + 1}–${Math.min(start + PAGE_SIZE, results.length)}` : '0'} de {results.length} productos</span><div><Button variant="secondary" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} aria-label="Página anterior">Anterior</Button><span>{currentPage} / {pageCount}</span><Button variant="secondary" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Página siguiente">Siguiente</Button></div></div>
    </section>
    <aside className="pv-pos-cart" aria-label="Carrito de venta"><CartContents {...cartProps} /></aside>
    <button className="pv-pos-mobile-cart" onClick={() => setMobileCart(true)} aria-label={`Abrir carrito, ${count} productos, ${money(total)}`}><Icon name="pos"/><span>{count} productos</span><strong>{money(total)}</strong></button>
    {mobileCart && <PosDialog title="Venta actual" className="pv-pos-cart-sheet" onClose={() => setMobileCart(false)}><CartContents {...cartProps} /></PosDialog>}
    {checkout && <PosDialog title="Procesar Pago" className="pv-payment-dialog" onClose={() => setCheckout(false)} busy={loading}><PaymentModal total={total} loading={loading} error={status?.type === 'error' ? status.message : null} onClose={() => setCheckout(false)} onConfirm={pay} /></PosDialog>}
  </div>
}
