import { useState } from 'react'
import Icon from '../ui/Icon.jsx'
import { Badge } from '../ui/index.jsx'

const navigation = [
  ['dashboard', 'home', 'Inicio'], ['pos', 'pos', 'Punto de venta'], ['stock', 'stock', 'Relevamiento / Stock'], ['cash', 'cash', 'Cajas'], ['users', 'users', 'Usuarios'],
]

export default function AppLayout({ activePage, onNavigate, user, cashOpen, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const go = (page) => { onNavigate(page); setMobileOpen(false) }
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark">+</span><span>pro<span>vet</span></span></div>
      <div className="sidebar-caption">GESTIÓN COMERCIAL</div>
      <nav>{navigation.map(([page, icon, label]) => <button key={page} className={activePage === page ? 'nav-active' : ''} onClick={() => go(page)}><Icon name={icon} /><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="cash-chip"><i className={cashOpen ? 'dot dot-open' : 'dot'} /><div><small>Caja del día</small><strong>{cashOpen ? 'Abierta' : 'Sin abrir'}</strong></div></div></div>
    </aside>
    {mobileOpen && <button className="mobile-overlay" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} />}
    <main className="content-shell">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Abrir menú"><Icon name="menu" /></button><div className="breadcrumb"><span>Pro Vet</span><Icon name="chevron" size={15}/><strong>{navigation.find(([page]) => page === activePage)?.[2]}</strong></div><div className="profile-menu"><div className="avatar">{user.firstName[0]}{user.lastName[0]}</div><div><strong>{user.firstName} {user.lastName}</strong><small><Badge tone="info">ADMIN</Badge></small></div><button className="logout-button" title="Cerrar sesión" onClick={onLogout}><Icon name="logout" size={19}/></button></div></header>
      <div className="page-content">{children}</div>
    </main>
  </div>
}
