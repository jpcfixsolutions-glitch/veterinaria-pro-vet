const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('provet_token')
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'No se pudo completar la operación.')
  return body.data
}

export const api = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  products: () => request('/products'), saveProduct: (product) => request(product.id ? `/products/${product.id}` : '/products', { method: product.id ? 'PUT' : 'POST', body: JSON.stringify(product) }),
  users: () => request('/users'), saveUser: (user) => request(user.id ? `/users/${user.id}` : '/users', { method: user.id ? 'PUT' : 'POST', body: JSON.stringify(user) }), toggleUser: (id) => request(`/users/${id}/status`, { method: 'PATCH' }),
  currentCash: () => request('/cash/current'), cashHistory: () => request('/cash/history'), openCash: (initialAmount) => request('/cash/open', { method: 'POST', body: JSON.stringify({ initialAmount }) }), closeCash: (countedAmount) => request('/cash/close', { method: 'POST', body: JSON.stringify({ countedAmount }) }),
  sale: (items, payments) => request('/sales', { method: 'POST', body: JSON.stringify({ items: items.map(({ id, quantity }) => ({ productId: id, quantity })), ...(Array.isArray(payments) ? { payments } : { paymentMethod: payments }) }) }),
  statistics: (start, end) => request(`/statistics?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`), expense: (expense) => request('/expenses', { method: 'POST', body: JSON.stringify(expense) }),
  settings: (type) => request(`/settings/${type}`), saveSetting: (type, item) => request(item.id ? `/settings/${type}/${item.id}` : `/settings/${type}`, { method: item.id ? 'PUT' : 'POST', body: JSON.stringify(item) }), fixedExpenses: () => request('/fixed-expenses'), saveFixedExpense: (item) => request(item.id ? `/fixed-expenses/${item.id}` : '/fixed-expenses', { method: item.id ? 'PUT' : 'POST', body: JSON.stringify(item) }),
}
