import { useMemo, useRef, useState } from 'react'
import { Badge, Button, Card, EmptyState } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'
import { money, time } from '../utils/format.js'

export default function PosPage({ products, cash, onNavigate, onSale }) {
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState([])
  const [payment, setPayment] = useState('Efectivo')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const results = useMemo(() => products.filter((item) => `${item.name} ${item.barcode}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8), [products, query])
  const total = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0)
  const add = (product) => {
    const exists = cart.find((item) => item.id === product.id)
    if (product.stock <= 0) return setStatus({ type: 'error', message: 'Este producto no tiene stock disponible.' })
    if (exists && exists.quantity >= product.stock) return setStatus({ type: 'error', message: 'No hay más unidades disponibles para agregar.' })
    setCart((items) => exists ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { ...product, quantity: 1 }])
    setQuery(''); inputRef.current?.focus()
  }
  const changeQuantity = (id, delta) => setCart((items) => items.flatMap((item) => {
    if (item.id !== id) return [item]
    const next = item.quantity + delta
    if (next <= 0) return []
    if (next > item.stock) { setStatus({ type: 'error', message: `Stock máximo disponible: ${item.stock}.` }); return [item] }
    return [{ ...item, quantity: next }]
  }))
  const pay = async () => {
    if (!cart.length) return
    setLoading(true); setStatus(null)
    try { const ticket = await onSale(cart, payment); setCart([]); setStatus({ type: 'success', message: `Ticket ${ticket.id} generado en la demostración. No fue persistido en un backend.` }) } catch (error) { setStatus({ type: 'error', message: error.message }) } finally { setLoading(false) }
  }
  if (!cash) return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow">PUNTO DE VENTA</span><h1>Nueva venta</h1></div></div><Card><EmptyState icon="lock" title="Necesitás abrir la caja para vender" detail="El punto de venta está bloqueado hasta registrar un monto inicial en Cajas." action={<Button icon="cash" onClick={() => onNavigate('cash')}>Abrir caja</Button>} /></Card></div>
  return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow">PUNTO DE VENTA · CAJA ABIERTA DESDE {time(cash.openedAt)}</span><h1>Nueva venta</h1><p>Buscá por nombre o código de barras. Los lectores que escriben como teclado funcionan en el buscador.</p></div><Badge tone="success">Caja abierta</Badge></div>{status && <div className={`inline-message ${status.type}`}><Icon name={status.type === 'error' ? 'alert' : 'check'} /><span>{status.message}</span><button onClick={() => setStatus(null)}><Icon name="close" size={16}/></button></div>}<div className="pos-grid"><section className="pos-catalog"><label className="pos-search"><Icon name="search"/><input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && results.length === 1) { e.preventDefault(); add(results[0]) } }} placeholder="Buscar producto o escanear código" /><kbd>Enter</kbd></label><div className="product-results">{results.length ? results.map((product) => <button key={product.id} onClick={() => add(product)} disabled={product.stock <= 0}><span className="product-initial">{product.name[0]}</span><span className="product-description"><small>{product.barcode}</small><strong>{product.name}</strong><em>Stock: {product.stock}</em></span><b>{money(product.salePrice)}</b><span className="add-product"><Icon name="plus" size={16}/></span></button>) : <EmptyState icon="search" title="Sin coincidencias" detail="No hay productos con ese nombre o código." />}</div></section><Card className="cart-card"><div className="cart-title"><div><span className="eyebrow">VENTA ACTUAL</span><h2>Carrito</h2></div><Badge>{cart.length} ítems</Badge></div>{cart.length ? <div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item.id}><div><strong>{item.name}</strong><small>{money(item.salePrice)} por unidad</small></div><div className="qty"><button onClick={() => changeQuantity(item.id, -1)} aria-label="Restar"><span>−</span></button><strong>{item.quantity}</strong><button onClick={() => changeQuantity(item.id, 1)} aria-label="Sumar"><span>+</span></button></div><strong>{money(item.salePrice * item.quantity)}</strong><button className="remove-line" onClick={() => setCart((items) => items.filter((line) => line.id !== item.id))} aria-label="Quitar"><Icon name="trash" size={16}/></button></div>)}</div> : <EmptyState icon="pos" title="El carrito está vacío" detail="Agregá productos para comenzar la venta." />}<div className="checkout"><div className="payment-picker"><span>MEDIO DE PAGO</span><div><button className={payment === 'Efectivo' ? 'selected' : ''} onClick={() => setPayment('Efectivo')}>Efectivo</button><button className={payment === 'Virtual' ? 'selected' : ''} onClick={() => setPayment('Virtual')}>Virtual</button></div></div><div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div><Button className="full-width" icon="check" disabled={!cart.length} loading={loading} onClick={pay}>Confirmar venta de demostración</Button><small>La confirmación modifica esta sesión de prueba, no una base de datos.</small></div></Card></div></div>
}
