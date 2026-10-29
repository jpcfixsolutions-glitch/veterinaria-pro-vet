import { useState } from 'react'
import AppLayout from './layouts/AppLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import PosPage from './pages/PosPage.jsx'
import StockPage from './pages/StockPage.jsx'
import CashPage from './pages/CashPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import { Toast } from './components/ui.jsx'
import { demoCashHistory, demoProducts, demoUsers } from './data/demoData.js'
import { mockLogin, mockOperation } from './services/mockApi.js'
import { expectedCash } from './utils/calculations.js'

const id = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`

export default function App() {
  const [users, setUsers] = useState(demoUsers)
  const [products, setProducts] = useState(demoProducts)
  const [cash, setCash] = useState(null)
  const [cashHistory, setCashHistory] = useState(demoCashHistory)
  const [currentUser, setCurrentUser] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [toast, setToast] = useState(null)
  const notify = (message, type = 'success') => setToast({ message, type })

  const login = async (username, password) => {
    const user = await mockLogin(users, username, password)
    setCurrentUser(user); setPage('dashboard')
  }

  const saveProduct = async (product) => {
    await mockOperation('product-save')
    setProducts((items) => product.id ? items.map((item) => item.id === product.id ? product : item) : [...items, { ...product, id: id('PRD') }])
    notify('Producto actualizado en la sesión de demostración. Requiere API para persistirlo.', 'info')
  }

  const openCash = async (initialAmount) => {
    await mockOperation('cash-open')
    setCash({ id: id('cash'), openedAt: new Date().toISOString(), openedBy: `${currentUser.firstName} ${currentUser.lastName}`, initialAmount, cashSales: 0, virtualSales: 0, totalSales: 0, cashMovements: 0, tickets: [] })
    notify('Caja abierta sólo en modo demostración.', 'info')
  }

  const sale = async (cart, paymentMethod) => {
    if (!cash) throw new Error('No hay una caja abierta.')
    if (cart.some((line) => line.quantity > line.stock)) throw new Error('El stock cambió. Revisá el carrito e intentá nuevamente.')
    await mockOperation('sale-create')
    const total = cart.reduce((sum, line) => sum + line.salePrice * line.quantity, 0)
    const ticket = { id: `TK-${String(cash.tickets.length + 1).padStart(4, '0')}`, createdAt: new Date().toISOString(), paymentMethod, total, items: cart.map(({ name, quantity, salePrice }) => ({ name, quantity, unitPrice: salePrice })) }
    setProducts((items) => items.map((product) => {
      const line = cart.find((item) => item.id === product.id)
      return line && product.stock !== 999 ? { ...product, stock: product.stock - line.quantity } : product
    }))
    setCash((current) => ({ ...current, tickets: [...current.tickets, ticket], totalSales: current.totalSales + total, cashSales: current.cashSales + (paymentMethod === 'Efectivo' ? total : 0), virtualSales: current.virtualSales + (paymentMethod === 'Virtual' ? total : 0) }))
    return ticket
  }

  const closeCash = async (countedAmount) => {
    if (!cash) return
    await mockOperation('cash-close')
    const snapshot = { ...cash, date: new Date().toISOString(), closedAt: new Date().toISOString(), closedBy: `${currentUser.firstName} ${currentUser.lastName}`, expectedCash: expectedCash(cash), countedAmount, status: 'Cerrada' }
    setCashHistory((history) => [snapshot, ...history])
    setCash(null)
    notify('Cierre incorporado al historial de demostración. No se persistió en un servidor.', 'info')
  }

  const saveUser = async (user) => {
    const duplicated = users.some((item) => item.username.toLowerCase() === user.username.toLowerCase() && item.id !== user.id)
    if (duplicated) throw new Error('Ese nombre de usuario ya existe.')
    await mockOperation('user-save')
    const next = user.id ? user : { ...user, id: id('usr') }
    setUsers((items) => user.id ? items.map((item) => item.id === user.id ? next : item) : [...items, next])
    if (currentUser.id === next.id) setCurrentUser({ ...next, password: undefined })
    notify('Administrador actualizado sólo en memoria. Requiere endpoints de usuarios.', 'info')
  }

  const toggleUser = async (userId) => {
    await mockOperation('user-toggle')
    setUsers((items) => items.map((user) => user.id === userId ? { ...user, active: !user.active } : user))
    notify('Estado de cuenta actualizado en la demostración.', 'info')
  }

  if (!currentUser) return <LoginPage onLogin={login} />
  const pages = {
    dashboard: <DashboardPage user={currentUser} products={products} cash={cash} onNavigate={setPage} />,
    pos: <PosPage products={products} cash={cash} onNavigate={setPage} onSale={sale} />,
    stock: <StockPage products={products} onSaveProduct={saveProduct} />,
    cash: <CashPage cash={cash} history={cashHistory} user={currentUser} onOpen={openCash} onClose={closeCash} />,
    users: <UsersPage users={users} currentUser={currentUser} onSaveUser={saveUser} onToggleUser={toggleUser} />,
  }
  return <><AppLayout activePage={page} onNavigate={setPage} user={currentUser} cashOpen={Boolean(cash)} onLogout={() => { setCurrentUser(null); setPage('dashboard') }}>{pages[page]}</AppLayout><Toast toast={toast} onClose={() => setToast(null)} /></>
}
