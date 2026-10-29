import { useEffect, useState } from 'react'
import AppLayout from './components/layout/AppLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import PosPage from './pages/PosPage.jsx'
import StockPage from './pages/StockPage.jsx'
import CashPage from './pages/CashPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import { Toast } from './components/ui/index.jsx'
import { api } from './services/api/client.js'

export default function App() {
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [cash, setCash] = useState(null)
  const [cashHistory, setCashHistory] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [toast, setToast] = useState(null)
  const notify = (message, type = 'success') => setToast({ message, type })

  const refresh = async () => {
    const [nextProducts, nextUsers, nextCash, nextHistory] = await Promise.all([api.products(), api.users(), api.currentCash(), api.cashHistory()])
    setProducts(nextProducts); setUsers(nextUsers); setCash(nextCash); setCashHistory(nextHistory)
  }
  useEffect(() => { if (currentUser) refresh().catch((error) => notify(error.message, 'error')) }, [currentUser])

  const login = async (username, password) => {
    const session = await api.login(username, password)
    localStorage.setItem('provet_token', session.token)
    setCurrentUser(session.user); setPage('dashboard')
  }
  const saveProduct = async (product) => {
    const saved = await api.saveProduct(product)
    setProducts((items) => product.id ? items.map((item) => item.id === saved.id ? saved : item) : [...items, saved])
    notify('Producto guardado correctamente.')
  }
  const openCash = async (initialAmount) => setCash(await api.openCash(initialAmount))
  const sale = async (cart, paymentMethod) => { if (!cash) throw new Error('No hay una caja abierta.'); const ticket = await api.sale(cart, paymentMethod); await refresh(); return ticket }
  const closeCash = async (countedAmount) => { await api.closeCash(countedAmount); setCash(null); setCashHistory(await api.cashHistory()) }
  const saveUser = async (user) => {
    const next = await api.saveUser(user)
    setUsers((items) => user.id ? items.map((item) => item.id === user.id ? next : item) : [...items, next])
    if (currentUser.id === next.id) setCurrentUser(next)
    notify('Administrador guardado correctamente.')
  }
  const toggleUser = async (userId) => { const updated = await api.toggleUser(userId); setUsers((items) => items.map((user) => user.id === userId ? updated : user)); notify('Estado de cuenta actualizado.') }

  if (!currentUser) return <LoginPage onLogin={login} />
  const pages = {
    dashboard: <DashboardPage user={currentUser} products={products} cash={cash} onNavigate={setPage} />,
    pos: <PosPage products={products} cash={cash} onNavigate={setPage} onSale={sale} />,
    stock: <StockPage products={products} onSaveProduct={saveProduct} />,
    cash: <CashPage cash={cash} history={cashHistory} user={currentUser} onOpen={openCash} onClose={closeCash} />,
    users: <UsersPage users={users} currentUser={currentUser} onSaveUser={saveUser} onToggleUser={toggleUser} />,
  }
  return <><AppLayout activePage={page} onNavigate={setPage} user={currentUser} cashOpen={Boolean(cash)} onLogout={() => { localStorage.removeItem('provet_token'); setCurrentUser(null); setPage('dashboard') }}>{pages[page]}</AppLayout><Toast toast={toast} onClose={() => setToast(null)} /></>
}
