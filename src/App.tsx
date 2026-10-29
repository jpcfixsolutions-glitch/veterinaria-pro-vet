import { useMemo, useState, type ReactNode } from 'react'
import DownloadCodeButton from './DownloadCodeButton'

type Page = 'dashboard' | 'catalog' | 'edit' | 'summary' | 'opening' | 'pos' | 'sales' | 'close' | 'history'
type IconName =
  | 'grid' | 'box' | 'register' | 'receipt' | 'history' | 'search' | 'scan' | 'arrow'
  | 'more' | 'bell' | 'chevron' | 'check' | 'download' | 'plus' | 'minus' | 'trash'
  | 'wallet' | 'card' | 'bank' | 'cash' | 'lock' | 'close' | 'print' | 'alert' | 'menu'

const products = [
  { id: 'PRD-1842', name: 'Alimento Royal Canin Adult Medium 15 kg', category: 'Alimentos', barcode: '7790187334012', stock: 12, counted: 12, cost: 46800, price: 68500, status: 'Revisado' },
  { id: 'PRD-0921', name: 'Pipeta Frontline Plus perros 10–20 kg', category: 'Farmacia', barcode: '7798044472082', stock: 8, counted: 6, cost: 12450, price: 18900, status: 'Modificado' },
  { id: 'PRD-2104', name: 'Collar isabelino transparente N° 4', category: 'Accesorios', barcode: '7799214504886', stock: 3, counted: 3, cost: 5200, price: 8500, status: 'Stock bajo' },
  { id: 'PRD-0377', name: 'Vacuna Quíntuple Canina', category: 'Vacunas', barcode: '7798359330213', stock: 0, counted: 0, cost: 9800, price: 16500, status: 'Sin stock' },
  { id: 'SRV-0018', name: 'Consulta clínica general', category: 'Servicios', barcode: '—', stock: 0, counted: 0, cost: 0, price: 14500, status: 'Revisado' },
  { id: 'PRD-1440', name: 'Arena sanitaria aglomerante 4 kg', category: 'Higiene', barcode: '7798036212511', stock: 18, counted: 0, cost: 6850, price: 10900, status: 'Pendiente' },
]

const formatMoney = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    box: <><path d="m21 8-9 5-9-5"/><path d="M3 8l9-5 9 5v8l-9 5-9-5Z"/><path d="M12 13v8"/></>,
    register: <><path d="M5 10V5h14v5"/><rect x="3" y="10" width="18" height="11" rx="2"/><path d="M7 14h3m4 0h3M7 18h10"/></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6m-6 4h6"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5m4-1v5l3 2"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    scan: <><path d="M4 8V4h4m8 0h4v4m0 8v4h-4M8 20H4v-4M7 12h10"/></>,
    arrow: <><path d="M5 12h14m-5-5 5 5-5 5"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5"/><path d="M5 21h14"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    minus: <path d="M5 12h14"/>,
    trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7"/><path d="M10 11v6m4-6v6"/></>,
    wallet: <><path d="M4 6h15a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14"/><path d="M16 11h5v4h-5a2 2 0 0 1 0-4Z"/></>,
    card: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></>,
    bank: <><path d="m3 10 9-6 9 6M5 10h14M7 10v7m5-7v7m5-7v7M4 20h16"/></>,
    cash: <><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9H5v1m13-1h1v1M6 15H5v-1m13 1h1v-1"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    print: <><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5h20v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6Z"/></>,
    alert: <><path d="M12 3 2 21h20Z"/><path d="M12 9v5m0 3v.01"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  }
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Button({ children, variant = 'primary', icon, onClick, className = '', disabled = false }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; icon?: IconName; onClick?: () => void; className?: string; disabled?: boolean }) {
  return <button className={`button button-${variant} ${className}`} onClick={onClick} disabled={disabled}>{icon && <Icon name={icon}/>}<span>{children}</span></button>
}

function Field({ label, value, placeholder, type = 'text', onChange, prefix, readOnly = false }: { label?: string; value?: string | number; placeholder?: string; type?: string; onChange?: (value: string) => void; prefix?: string; readOnly?: boolean }) {
  return <label className="field">{label && <span className="field-label">{label}</span>}<span className={`field-control ${readOnly ? 'readonly' : ''}`}>{prefix && <span className="field-prefix">{prefix}</span>}<input type={type} value={value} placeholder={placeholder} readOnly={readOnly} onChange={(e) => onChange?.(e.target.value)}/>{readOnly && <Icon name="lock" size={15}/>}</span></label>
}

function SelectField({ label, value, children }: { label?: string; value?: string; children: ReactNode }) {
  return <label className="field">{label && <span className="field-label">{label}</span>}<span className="field-control"><select value={value} onChange={() => undefined}>{children}</select><span className="select-caret">⌄</span></span></label>
}

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}><span className="badge-dot"/>{children}</span>
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

function Header({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{children && <div className="header-actions">{children}</div>}</div>
}

function Shell({ page, setPage, children, cashOpen, mobileMenu, setMobileMenu }: { page: Page; setPage: (p: Page) => void; children: ReactNode; cashOpen: boolean; mobileMenu: boolean; setMobileMenu: (v: boolean) => void }) {
  const nav = [
    ['dashboard', 'grid', 'Panel principal'],
    ['catalog', 'box', 'Relevamiento'],
    ['pos', 'register', 'Caja diaria'],
    ['sales', 'receipt', 'Ventas del día'],
    ['history', 'history', 'Historial'],
  ] as [Page, IconName, string][]
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark">PV</div><div><strong>PRO-VET</strong><span>Sanatorio Veterinario</span></div></div>
      <nav>{nav.map(([target, icon, label]) => <button key={target} className={`nav-item ${page === target || (target === 'catalog' && ['edit','summary'].includes(page)) || (target === 'pos' && ['opening','close'].includes(page)) ? 'active' : ''}`} onClick={() => {setPage(target);setMobileMenu(false)}}><Icon name={icon}/><span>{label}</span>{target === 'catalog' && <em>870</em>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="cash-status"><span className={cashOpen ? 'status-pulse' : 'status-pulse closed'}/><div><small>Caja de hoy</small><strong>{cashOpen ? 'Abierta · 08:42' : 'Cerrada'}</strong></div></div>
        <div className="user-block"><span>MG</span><div><strong>María González</strong><small>Empleada</small></div><Icon name="more"/></div>
      </div>
    </aside>
    <div className="main-shell">
      <div className="topbar">
        <button className="mobile-menu" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menú"><Icon name="menu"/></button>
        <div className="branch"><span>Sucursal</span><strong>Casa Central — San Martín 1842</strong><span className="select-caret">⌄</span></div>
        <div className="top-actions"><span className="date-label">Lunes, 26 de mayo</span><DownloadCodeButton/><button aria-label="Notificaciones" className="icon-button"><Icon name="bell"/><i/></button><div className="top-avatar">MG</div></div>
      </div>
      <main>{children}</main>
    </div>
    {mobileMenu && <button className="menu-overlay" onClick={() => setMobileMenu(false)} aria-label="Cerrar menú"/>}
  </div>
}

function Dashboard({ setPage, cashOpen }: { setPage: (p: Page) => void; cashOpen: boolean }) {
  return <div className="page">
    <Header eyebrow="LUNES, 26 DE MAYO" title="Buen día, María" description="Este es el estado del sanatorio al momento."/>
    <div className="alert-strip"><div className="alert-icon"><Icon name="alert"/></div><div><strong>Hay 3 productos con márgenes negativos</strong><span>Revisalos antes de continuar con el relevamiento.</span></div><Button variant="ghost" onClick={() => setPage('catalog')}>Ver productos <Icon name="arrow"/></Button></div>
    <div className="dashboard-grid">
      <Card className="survey-card">
        <div className="section-heading"><div><span className="section-kicker">RELEVAMIENTO DE PRODUCTOS</span><h2>Catálogo en progreso</h2></div><Badge tone="warning">En curso</Badge></div>
        <div className="progress-feature"><div className="progress-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42"/><circle className="progress-value" cx="50" cy="50" r="42"/></svg><div><strong>68%</strong><span>completado</span></div></div><div className="progress-copy"><strong>592 de 870 productos revisados</strong><span>Última actualización hoy, 10:24</span><div className="progress-bar"><i/></div></div></div>
        <div className="mini-stats"><div><span className="stat-icon pending"><Icon name="history"/></span><div><strong>278</strong><span>Pendientes</span></div></div><div><span className="stat-icon modified"><Icon name="box"/></span><div><strong>47</strong><span>Modificados</span></div></div><div><span className="stat-icon danger"><Icon name="alert"/></span><div><strong>16</strong><span>Sin stock</span></div></div></div>
        <Button onClick={() => setPage('catalog')}>Continuar relevamiento <Icon name="arrow"/></Button>
      </Card>
      <Card className="cash-card">
        <div className="section-heading"><div><span className="section-kicker">CAJA DEL DÍA</span><h2>{cashOpen ? 'Caja abierta' : 'Caja cerrada'}</h2></div><Badge tone={cashOpen ? 'success' : 'neutral'}>{cashOpen ? 'Operativa' : 'Sin abrir'}</Badge></div>
        {cashOpen ? <>
          <div className="cash-owner"><span className="cash-owner-icon"><Icon name="register"/></span><div><span>Abierta por María González</span><strong>Hoy a las 08:42 · Efectivo inicial $80.000</strong></div></div>
          <div className="sales-total"><span>Vendido hasta ahora</span><strong>{formatMoney(486900)}</strong><small>24 ventas realizadas</small></div>
          <div className="cash-metrics"><div><span>Efectivo esperado</span><strong>{formatMoney(198500)}</strong></div><div><span>Última venta</span><strong>12:36</strong></div></div>
          <div className="split-actions"><Button onClick={() => setPage('pos')} icon="plus">Nueva venta</Button><Button variant="secondary" onClick={() => setPage('close')}>Cerrar caja</Button></div>
        </> : <div className="empty-cash"><span><Icon name="lock" size={28}/></span><h3>La caja aún no fue abierta</h3><p>Para comenzar a registrar ventas, primero ingresá el efectivo inicial.</p><Button onClick={() => setPage('opening')}>Abrir caja</Button></div>}
      </Card>
    </div>
    <div className="lower-grid">
      <Card><div className="section-heading"><div><span className="section-kicker">ACCESOS RÁPIDOS</span><h2>¿Qué necesitás hacer?</h2></div></div><div className="quick-grid"><button onClick={() => setPage('pos')}><span><Icon name="register"/></span><div><strong>Nueva venta</strong><small>Registrar una operación</small></div><Icon name="chevron"/></button><button onClick={() => setPage('sales')}><span><Icon name="receipt"/></span><div><strong>Ventas del día</strong><small>Consultar movimientos</small></div><Icon name="chevron"/></button><button onClick={() => setPage('catalog')}><span><Icon name="scan"/></span><div><strong>Escanear producto</strong><small>Buscar por código</small></div><Icon name="chevron"/></button></div></Card>
      <Card className="activity-card"><div className="section-heading"><div><span className="section-kicker">ACTIVIDAD RECIENTE</span><h2>Últimos movimientos</h2></div><Button variant="ghost" onClick={() => setPage('history')}>Ver todo</Button></div><div className="activity-list"><div><span className="activity-icon success"><Icon name="receipt"/></span><div><strong>Venta #000184</strong><small>12:36 · María González</small></div><b>$24.800</b></div><div><span className="activity-icon purple"><Icon name="box"/></span><div><strong>Producto actualizado</strong><small>12:18 · Pipeta Frontline Plus</small></div><Badge tone="info">Stock</Badge></div><div><span className="activity-icon warning"><Icon name="cash"/></span><div><strong>Retiro de efectivo</strong><small>11:45 · Autorizado por Ana Ruiz</small></div><b>−$20.000</b></div></div></Card>
    </div>
  </div>
}

function Catalog({ setPage }: { setPage: (p: Page) => void }) {
  const [query, setQuery] = useState('')
  const visible = products.filter(p => `${p.name} ${p.id} ${p.barcode}`.toLowerCase().includes(query.toLowerCase()))
  const tone = (status: string) => status === 'Revisado' ? 'success' : status === 'Modificado' ? 'info' : status === 'Pendiente' ? 'warning' : 'danger'
  return <div className="page">
    <Header eyebrow="RELEVAMIENTO" title="Catálogo de productos" description="Actualizá stock, costos y precios de venta.">
      <Button variant="secondary" onClick={() => setPage('summary')}>Ver resumen</Button><Button icon="scan">Escanear código</Button>
    </Header>
    <div className="catalog-stats"><div><span>Avance general</span><strong>68%</strong><i><b/></i></div><div><span>Revisados</span><strong>592</strong></div><div><span>Pendientes</span><strong>278</strong></div><div><span>Modificados</span><strong>47</strong></div><div><span>Con alertas</span><strong className="danger-text">19</strong></div></div>
    <Card className="table-card">
      <div className="filters"><label className="search-box"><Icon name="search"/><input placeholder="Buscar por nombre, código o código de barras" value={query} onChange={e => setQuery(e.target.value)}/><kbd>⌘ K</kbd></label><SelectField value="Todos"><option>Todos los rubros</option></SelectField><SelectField value="Todos"><option>Todos los estados</option></SelectField><button className="filter-button"><Icon name="more"/> Más filtros</button></div>
      <div className="table-wrap"><table><thead><tr><th>Producto</th><th>Rubro</th><th>Stock reg.</th><th>Stock relev.</th><th>Precio venta</th><th>Margen</th><th>Estado</th><th/></tr></thead><tbody>{visible.map((p) => <tr key={p.id}><td><div className="product-cell"><span>{p.category === 'Servicios' ? 'S' : p.name.charAt(0)}</span><div><strong>{p.name}</strong><small>{p.id} · {p.barcode}</small></div></div></td><td>{p.category}</td><td>{p.stock}</td><td><strong>{p.counted || '—'}</strong></td><td><strong>{formatMoney(p.price)}</strong></td><td>{p.cost ? <span className="margin-value">+{Math.round((p.price-p.cost)/p.cost*100)}%</span> : '—'}</td><td><Badge tone={tone(p.status)}>{p.status}</Badge></td><td><Button variant="ghost" onClick={() => setPage('edit')}>Editar</Button></td></tr>)}</tbody></table></div>
      <div className="mobile-product-list">{visible.map(p => <button className="mobile-product-card" key={p.id} onClick={() => setPage('edit')}><div className="mobile-product-head"><span className="product-letter">{p.name.charAt(0)}</span><div><strong>{p.name}</strong><small>{p.id} · {p.category}</small></div><Icon name="chevron"/></div><div className="mobile-product-meta"><span>Stock <b>{p.stock}</b></span><span>Relevado <b>{p.counted || '—'}</b></span><span>Venta <b>{formatMoney(p.price)}</b></span></div><Badge tone={tone(p.status)}>{p.status}</Badge></button>)}</div>
      <div className="pagination"><span>Mostrando 1–{visible.length} de 870 productos</span><div><button disabled>‹</button><button className="current">1</button><button>2</button><button>3</button><span>…</span><button>73</button><button>›</button></div></div>
    </Card>
    <div className="mobile-bottom-actions"><Button icon="scan">Escanear</Button><Button variant="secondary" onClick={() => setPage('summary')}>Resumen</Button></div>
  </div>
}

function EditProduct({ setPage }: { setPage: (p: Page) => void }) {
  const [stock, setStock] = useState('6')
  const [cost, setCost] = useState('12450')
  const [price, setPrice] = useState('18900')
  const margin = Math.round(((Number(price) - Number(cost)) / Number(cost)) * 100)
  return <div className="page narrow-page">
    <button className="back-link" onClick={() => setPage('catalog')}>‹ Volver al catálogo</button>
    <Header eyebrow="PRODUCTO 386 DE 870" title="Editar producto" description="Compará los valores registrados y actualizá sólo lo necesario."/>
    <Card className="product-title-card"><span className="product-image">F</span><div><Badge tone="info">Farmacia</Badge><h2>Pipeta Frontline Plus perros 10–20 kg</h2><p>PRD-0921 · Código de barras 7798044472082</p></div><Badge tone="info">Modificado</Badge></Card>
    <Card className="edit-card">
      <div className="edit-section"><div className="edit-title"><span>01</span><div><h3>Stock</h3><p>Ingresá la cantidad física disponible.</p></div></div><div className="compare-grid"><div className="current-value"><span>STOCK REGISTRADO</span><strong>8 <small>unidades</small></strong></div><div className="compare-arrow">→</div><Field label="NUEVO STOCK RELEVADO" value={stock} type="number" onChange={setStock}/></div><div className="info-note"><Icon name="alert" size={17}/> Se registrará una diferencia de <strong>−2 unidades</strong>.</div></div>
      <div className="edit-section"><div className="edit-title"><span>02</span><div><h3>Precios y margen</h3><p>El margen se calcula automáticamente.</p></div></div><div className="price-grid"><div className="current-value"><span>COSTO ACTUAL</span><strong>{formatMoney(11800)}</strong></div><Field label="NUEVO PRECIO DE COSTO" prefix="$" value={cost} type="number" onChange={setCost}/><div className="current-value"><span>VENTA ACTUAL</span><strong>{formatMoney(17900)}</strong></div><Field label="NUEVO PRECIO DE VENTA" prefix="$" value={price} type="number" onChange={setPrice}/></div><div className="margin-panel"><div><span>Margen actual</span><strong>51,7%</strong></div><span className="compare-arrow">→</span><div><span>Nuevo margen calculado</span><strong className={margin < 0 ? 'danger-text' : ''}>{margin}%</strong></div><Badge tone={margin < 0 ? 'danger' : 'success'}>{margin < 0 ? 'Margen negativo' : `+${(margin-52).toFixed(1)} puntos`}</Badge></div></div>
      <div className="edit-section"><div className="edit-title"><span>03</span><div><h3>Información adicional</h3><p>Estos datos ayudan a auditar los cambios.</p></div></div><label className="field"><span className="field-label">OBSERVACIONES (OPCIONAL)</span><textarea placeholder="Ej.: Se verificó stock en depósito y mostrador..."/></label><div className="locked-fields"><Field label="PRODUCT ID" value="655fb98e-0124-42ac" readOnly/><Field label="UBICACIÓN ID" value="CC-DEP-04-F02" readOnly/></div></div>
    </Card>
    <div className="sticky-edit-actions"><div><Button variant="ghost" onClick={() => setPage('catalog')}>Sin cambios</Button><Button variant="secondary">Guardar borrador</Button></div><Button onClick={() => setPage('catalog')}>Guardar y siguiente <Icon name="arrow"/></Button></div>
  </div>
}

function Summary({ setPage }: { setPage: (p: Page) => void }) {
  const stats = [['870','Total de productos','box'],['592','Revisados','check'],['278','Pendientes','history'],['47','Modificados','box'],['16','Sin stock','alert'],['31','Precios modificados','receipt'],['3','Márgenes negativos','alert']] as [string,string,IconName][]
  return <div className="page">
    <Header eyebrow="RELEVAMIENTO" title="Resumen del relevamiento" description="Estado general del catálogo al 26 de mayo de 2025."><Button variant="secondary" onClick={() => setPage('catalog')}>Volver al catálogo</Button><Button icon="download">Exportar</Button></Header>
    <Card className="summary-hero"><div><span className="section-kicker">AVANCE GENERAL</span><strong>68%</strong><p>592 de 870 productos revisados</p><div className="progress-bar large"><i/></div></div><div className="summary-owner"><span>MG</span><div><small>Responsable</small><strong>María González</strong><p>Última actualización: hoy, 10:24</p></div></div></Card>
    <div className="summary-stats">{stats.map(([n,l,i], idx) => <Card key={l} className={idx === 6 ? 'danger-stat' : ''}><span><Icon name={i}/></span><strong>{n}</strong><small>{l}</small></Card>)}</div>
    <Card><div className="section-heading"><div><span className="section-kicker">EXPORTACIÓN</span><h2>Descargar información</h2></div></div><div className="export-grid">{['Catálogo completo','Sólo productos modificados','Respaldo completo','Resultados del relevamiento'].map((label, i) => <button key={label}><span><Icon name={i === 2 ? 'lock' : 'receipt'}/></span><div><strong>{label}</strong><small>Archivo Excel · Actualizado hoy</small></div><Icon name="download"/></button>)}</div></Card>
  </div>
}

function Opening({ setPage, onOpen }: { setPage: (p: Page) => void; onOpen: () => void }) {
  const [amount, setAmount] = useState('80000')
  return <div className="page form-page"><button className="back-link" onClick={() => setPage('dashboard')}>‹ Volver al panel</button><Header eyebrow="CAJA DIARIA" title="Abrir caja" description="Ingresá el efectivo disponible para comenzar a operar."/>
    <Card className="open-card"><div className="open-visual"><span><Icon name="register" size={32}/></span><div><h2>Caja · Casa Central</h2><p>Lunes, 26 de mayo de 2025</p></div></div><div className="detail-rows"><div><span>Sucursal</span><strong>Casa Central — San Martín 1842</strong></div><div><span>Responsable</span><strong>María González</strong></div><div><span>Hora de apertura</span><strong>Se registrará al confirmar</strong></div></div><Field label="EFECTIVO INICIAL" prefix="$" type="number" value={amount} onChange={setAmount}/><label className="field"><span className="field-label">OBSERVACIÓN (OPCIONAL)</span><textarea placeholder="Agregá una nota sobre la apertura..."/></label><div className="safe-note"><Icon name="lock"/><div><strong>Una sola caja por sucursal</strong><span>Al abrirla, quedará asociada a tu usuario y habilitará las ventas.</span></div></div><Button className="full-button" onClick={onOpen}>Abrir caja <Icon name="arrow"/></Button></Card>
  </div>
}

function POS({ setPage }: { setPage: (p: Page) => void }) {
  const [cart, setCart] = useState([{...products[1], qty: 1}, {...products[4], qty: 1}])
  const [checkout, setCheckout] = useState(false)
  const [success, setSuccess] = useState(false)
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const updateQty = (id: string, diff: number) => setCart(items => items.map(i => i.id === id ? {...i, qty: Math.max(1, i.qty + diff)} : i))
  if (success) return <div className="page success-page"><Card><span className="success-mark"><Icon name="check" size={38}/></span><span className="section-kicker">OPERACIÓN #000185</span><h1>Venta registrada correctamente</h1><p>El stock fue actualizado y el comprobante interno ya está disponible.</p><div className="success-total"><span>Total cobrado</span><strong>{formatMoney(total)}</strong><Badge tone="success">Efectivo</Badge></div><div className="success-actions"><Button variant="secondary" icon="print">Imprimir comprobante</Button><Button onClick={() => {setSuccess(false); setCart([])}}>Nueva venta</Button></div><Button variant="ghost" onClick={() => setPage('sales')}>Ver detalle de la operación</Button></Card></div>
  return <div className="pos-page">
    <div className="pos-main"><Header eyebrow="CAJA ABIERTA · DESDE 08:42" title="Nueva venta" description="Buscá productos o escaneá su código."><Button variant="secondary" onClick={() => setPage('dashboard')}>Salir de la venta</Button></Header>
      <div className="pos-search"><label className="search-box"><Icon name="search"/><input placeholder="Nombre, código o código de barras..."/></label><Button icon="scan">Escanear</Button></div>
      <div className="suggested-head"><div><span className="section-kicker">PRODUCTOS FRECUENTES</span><h2>Agregar a la venta</h2></div><SelectField value="Todos"><option>Todos los rubros</option></SelectField></div>
      <div className="product-grid">{products.slice(0,4).map(p => <button key={p.id} onClick={() => setCart(items => items.some(i => i.id === p.id) ? items : [...items, {...p, qty: 1}])}><span className="product-card-letter">{p.name.charAt(0)}</span><div><small>{p.category}</small><strong>{p.name}</strong><span>Stock: {p.stock}</span></div><b>{formatMoney(p.price)}</b><span className="add-circle"><Icon name="plus"/></span></button>)}</div>
    </div>
    <aside className="cart-panel"><div className="cart-heading"><div><span className="section-kicker">VENTA ACTUAL</span><h2>Detalle de la venta</h2></div><Badge tone="neutral">{cart.length} ítems</Badge></div>
      <div className="cart-items">{cart.length === 0 ? <div className="cart-empty"><Icon name="box" size={32}/><strong>El carrito está vacío</strong><span>Agregá productos para comenzar.</span></div> : cart.map(item => <div className="cart-item" key={item.id}><div className="cart-item-head"><div><strong>{item.name}</strong><small>{item.id} · Stock {item.stock || 'Servicio'}</small></div><button onClick={() => setCart(items => items.filter(i => i.id !== item.id))}><Icon name="trash" size={17}/></button></div><div className="cart-item-bottom"><div className="qty-control"><button onClick={() => updateQty(item.id,-1)}><Icon name="minus" size={15}/></button><strong>{item.qty}</strong><button onClick={() => updateQty(item.id,1)}><Icon name="plus" size={15}/></button></div><span>{formatMoney(item.price)} c/u</span><strong>{formatMoney(item.price*item.qty)}</strong></div></div>)}</div>
      <button className="discount-row"><span><Icon name="plus"/> Agregar descuento</span><span>Requiere autorización</span></button>
      <div className="totals"><div><span>Subtotal</span><strong>{formatMoney(total)}</strong></div><div><span>Descuento</span><strong>—</strong></div><div className="grand-total"><span>Total</span><strong>{formatMoney(total)}</strong></div></div>
      <Button className="full-button checkout-button" onClick={() => setCheckout(true)} disabled={!cart.length}>Cobrar <Icon name="arrow"/></Button>
    </aside>
    {checkout && <div className="modal-backdrop"><Card className="modal"><div className="modal-head"><div><span className="section-kicker">COBRO DE VENTA</span><h2>Seleccioná la forma de pago</h2></div><button onClick={() => setCheckout(false)}><Icon name="close"/></button></div><div className="payment-total"><span>Total a cobrar</span><strong>{formatMoney(total)}</strong></div><div className="payment-grid"><button className="selected"><Icon name="cash"/><strong>Efectivo</strong><span><Icon name="check"/></span></button><button><Icon name="bank"/><strong>Transferencia</strong></button><button><Icon name="card"/><strong>Débito</strong></button><button><Icon name="card"/><strong>Crédito</strong></button><button><Icon name="wallet"/><strong>Pago mixto</strong></button><button><Icon name="more"/><strong>Otro</strong></button></div><Field label="IMPORTE RECIBIDO" prefix="$" value={total} type="number"/><div className="change-row"><span>Vuelto</span><strong>{formatMoney(0)}</strong></div><div className="modal-actions"><Button variant="secondary" onClick={() => setCheckout(false)}>Volver</Button><Button onClick={() => {setCheckout(false); setSuccess(true)}}>Confirmar cobro</Button></div></Card></div>}
    <div className="mobile-cart-total"><div><span>Total · {cart.length} ítems</span><strong>{formatMoney(total)}</strong></div><Button onClick={() => setCheckout(true)}>Cobrar</Button></div>
  </div>
}

function Sales({ setPage }: { setPage: (p: Page) => void }) {
  const rows = [
    ['#000184','12:36','3 artículos','$24.800','Efectivo','María G.','Confirmada'],
    ['#000183','12:18','1 artículo','$68.500','Crédito','María G.','Confirmada'],
    ['#000182','11:57','2 artículos','$31.400','Transferencia','María G.','Confirmada'],
    ['#000181','11:31','1 artículo','$14.500','Débito','María G.','Confirmada'],
    ['#000180','10:54','4 artículos','$52.900','Mixto','Lucía P.','Anulada'],
  ]
  return <div className="page"><Header eyebrow="CAJA ABIERTA · CASA CENTRAL" title="Ventas del día" description="24 operaciones · Total vendido $486.900"><Button variant="secondary" onClick={() => setPage('close')}>Cerrar caja</Button><Button icon="plus" onClick={() => setPage('pos')}>Nueva venta</Button></Header>
    <Card className="table-card"><div className="filters"><label className="search-box"><Icon name="search"/><input placeholder="Buscar operación o producto..."/></label><SelectField><option>Todos los medios</option></SelectField><SelectField><option>Todos los estados</option></SelectField></div><div className="table-wrap"><table><thead><tr><th>Operación</th><th>Hora</th><th>Detalle</th><th>Total</th><th>Forma de pago</th><th>Empleada</th><th>Estado</th><th/></tr></thead><tbody>{rows.map(r => <tr key={r[0]}><td><strong>{r[0]}</strong></td>{r.slice(1,6).map((x,i) => <td key={i}>{i === 2 ? <strong>{x}</strong> : x}</td>)}<td><Badge tone={r[6] === 'Anulada' ? 'danger' : 'success'}>{r[6]}</Badge></td><td><Button variant="ghost" onClick={() => setPage('history')}>Ver detalle</Button></td></tr>)}</tbody></table></div><div className="mobile-sales-list">{rows.map(r => <button key={r[0]} onClick={() => setPage('history')}><div><strong>{r[0]} · {r[1]}</strong><Badge tone={r[6] === 'Anulada' ? 'danger' : 'success'}>{r[6]}</Badge></div><p>{r[2]} · {r[4]}</p><strong>{r[3]}</strong><Icon name="chevron"/></button>)}</div></Card>
  </div>
}

function CloseCash({ setPage, onClose }: { setPage: (p: Page) => void; onClose: () => void }) {
  const [counted, setCounted] = useState('198500')
  const expected = 198500
  const diff = Number(counted) - expected
  return <div className="page close-page"><button className="back-link" onClick={() => setPage('dashboard')}>‹ Volver al panel</button><Header eyebrow="CAJA DIARIA" title="Cierre de caja" description="Revisá los totales e ingresá el efectivo contado."/>
    <div className="close-grid"><Card><div className="section-heading"><div><span className="section-kicker">RESUMEN DEL DÍA</span><h2>Movimientos de caja</h2></div><Badge tone="success">24 ventas</Badge></div><div className="close-rows"><div><span>Efectivo inicial</span><strong>$80.000</strong></div><div><span>Ventas totales</span><strong>$486.900</strong></div><div className="sub"><span>En efectivo</span><strong>$143.500</strong></div><div className="sub"><span>Transferencias</span><strong>$118.000</strong></div><div className="sub"><span>Débito</span><strong>$97.400</strong></div><div className="sub"><span>Crédito</span><strong>$84.000</strong></div><div className="sub"><span>Pagos mixtos y otros</span><strong>$44.000</strong></div><div><span>Ingresos adicionales</span><strong>$5.000</strong></div><div><span>Retiros y gastos</span><strong>−$30.000</strong></div><div className="expected-row"><span>Efectivo esperado</span><strong>{formatMoney(expected)}</strong></div></div><div className="voided-note"><Icon name="alert"/><span>1 venta anulada por $52.900 · No incluida en los totales</span></div></Card>
      <Card className="count-card"><span className="section-kicker">ARQUEO</span><h2>Contá el efectivo en caja</h2><p>Ingresá el total físico, incluyendo el fondo inicial.</p><Field label="EFECTIVO CONTADO" prefix="$" value={counted} type="number" onChange={setCounted}/><div className={`difference ${diff === 0 ? 'balanced' : 'unbalanced'}`}><span>{diff === 0 ? <Icon name="check"/> : <Icon name="alert"/>}</span><div><small>DIFERENCIA DE CAJA</small><strong>{diff === 0 ? '$0 — Caja equilibrada' : formatMoney(diff)}</strong></div></div><label className="field"><span className="field-label">OBSERVACIONES DEL CIERRE</span><textarea placeholder="Agregá una observación si fuera necesario..."/></label><div className="closing-user"><span>MG</span><div><small>Cierra la caja</small><strong>María González · Hoy</strong></div></div><Button className="full-button" onClick={onClose}>Cerrar caja</Button><small className="confirm-copy">Se solicitará una confirmación antes de cerrar.</small></Card></div>
  </div>
}

function History() {
  const [voidModal, setVoidModal] = useState(false)
  const [voided, setVoided] = useState(false)
  return <div className="page"><Header eyebrow="AUDITORÍA" title="Historial y movimientos" description="Trazabilidad completa de productos, ventas y caja."><Button icon="download">Exportar historial</Button></Header>
    <div className="history-tabs"><button className="active">Todas</button><button>Ventas</button><button>Productos</button><button>Caja</button><button>Anulaciones</button></div>
    <div className="history-layout"><Card className="history-list"><div className="filters"><label className="search-box"><Icon name="search"/><input placeholder="Buscar actividad..."/></label><SelectField><option>Hoy</option></SelectField></div>{[['Venta #000184','Venta confirmada por María González','12:36','$24.800','receipt'],['Producto actualizado','Pipeta Frontline · stock 8 → 6','12:18','Stock','box'],['Retiro de efectivo','Autorizado por Ana Ruiz','11:45','−$20.000','cash'],['Venta #000180','Venta anulada por Ana Ruiz','10:58','$52.900','alert']].map((x,i) => <button className={`history-item ${i===0 ? 'selected' : ''}`} key={x[0]}><span className={`activity-icon ${i===3 ? 'danger' : i===1 ? 'purple' : 'success'}`}><Icon name={x[4] as IconName}/></span><div><strong>{x[0]}</strong><small>{x[1]}</small></div><div><strong>{x[3]}</strong><small>{x[2]}</small></div><Icon name="chevron"/></button>)}</Card>
      <Card className="sale-detail"><div className="detail-header"><div><span className="section-kicker">DETALLE DE VENTA</span><h2>Operación #000184</h2></div><Badge tone={voided ? 'danger' : 'success'}>{voided ? 'Anulada' : 'Confirmada'}</Badge></div><div className="audit-meta"><div><span>Fecha y hora</span><strong>26/05/2025 · 12:36</strong></div><div><span>Empleada</span><strong>María González</strong></div><div><span>Pago</span><strong>Efectivo</strong></div></div><div className="detail-products"><div><span>1× Pipeta Frontline Plus</span><strong>$18.900</strong></div><div><span>1× Consulta clínica general</span><strong>$14.500</strong></div><div><span>Descuento autorizado · Ana Ruiz</span><strong>−$8.600</strong></div></div><div className="detail-total"><span>Total</span><strong>$24.800</strong></div><div className="audit-trail"><span><Icon name="history"/></span><div><strong>Registrada por María González</strong><small>26/05/2025 · 12:36 · Stock descontado automáticamente</small></div></div><div className="detail-actions"><Button variant="secondary" icon="print">Comprobante</Button>{!voided && <Button variant="danger" onClick={() => setVoidModal(true)}>Anular venta</Button>}</div></Card>
    </div>
    {voidModal && <div className="modal-backdrop"><Card className="modal void-modal"><div className="modal-head"><div><span className="section-kicker danger-text">ACCIÓN DE ADMINISTRADORA</span><h2>Anular venta #000184</h2></div><button onClick={() => setVoidModal(false)}><Icon name="close"/></button></div><div className="danger-note"><Icon name="alert"/><div><strong>Esta acción no se puede deshacer</strong><span>El stock será restituido y la operación quedará en el historial.</span></div></div><label className="field"><span className="field-label">MOTIVO DE ANULACIÓN</span><textarea placeholder="Describí el motivo obligatorio..."/></label><Field label="AUTORIZADA POR" value="Ana Ruiz · Administradora" readOnly/><div className="modal-actions"><Button variant="secondary" onClick={() => setVoidModal(false)}>Cancelar</Button><Button variant="danger" onClick={() => {setVoided(true);setVoidModal(false)}}>Confirmar anulación</Button></div></Card></div>}
  </div>
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [cashOpen, setCashOpen] = useState(true)
  const [mobileMenu, setMobileMenu] = useState(false)
  const content = useMemo(() => {
    if (page === 'dashboard') return <Dashboard setPage={setPage} cashOpen={cashOpen}/>
    if (page === 'catalog') return <Catalog setPage={setPage}/>
    if (page === 'edit') return <EditProduct setPage={setPage}/>
    if (page === 'summary') return <Summary setPage={setPage}/>
    if (page === 'opening') return <Opening setPage={setPage} onOpen={() => {setCashOpen(true);setPage('pos')}}/>
    if (page === 'pos') return cashOpen ? <POS setPage={setPage}/> : <Opening setPage={setPage} onOpen={() => {setCashOpen(true);setPage('pos')}}/>
    if (page === 'sales') return <Sales setPage={setPage}/>
    if (page === 'close') return <CloseCash setPage={setPage} onClose={() => {setCashOpen(false);setPage('dashboard')}}/>
    return <History/>
  }, [page, cashOpen])
  return <Shell page={page} setPage={setPage} cashOpen={cashOpen} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu}>{content}</Shell>
}
