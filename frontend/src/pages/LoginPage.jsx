import { useState } from 'react'
import { Button, Field } from '../components/ui/index.jsx'
import Icon from '../components/ui/Icon.jsx'

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true)
    try { await onLogin(form.username.trim(), form.password) } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  return <main className="login-page"><section className="login-pitch"><div className="brand brand-large"><span className="brand-mark">+</span><span>pro<span>vet</span></span></div><div><span className="eyebrow">GESTIÓN COMERCIAL VETERINARIA</span><h1>Tu operación, más clara y más ágil.</h1><p>Controlá stock, ventas y cajas desde un solo lugar.</p></div><div className="login-benefits"><span><Icon name="check"/> Stock conectado con ventas</span><span><Icon name="check"/> Caja diaria y trazabilidad</span><span><Icon name="check"/> Gestión de administradores</span></div></section>
    <section className="login-panel"><form className="login-card" onSubmit={submit}><div><span className="eyebrow">ACCESO AL SISTEMA</span><h2>Ingresá a Pro Vet</h2><p>Usá tus credenciales de administrador.</p></div><Field label="USUARIO"><input autoComplete="username" autoFocus value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Ej. admin" required /></Field><Field label="CONTRASEÑA" error={error}><input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Tu contraseña" required /></Field><Button type="submit" loading={loading} className="full-width">Ingresar <Icon name="arrow" /></Button></form></section>
  </main>
}
