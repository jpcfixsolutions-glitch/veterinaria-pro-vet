import { useState } from 'react'
import { Button, Field } from '../components/ui/index.jsx'
import Icon from '../components/ui/Icon.jsx'
import ProVetBrand, { DogSilhouette } from '../components/brand/ProVetBrand.jsx'

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true)
    try { await onLogin(form.username.trim(), form.password) } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  return <main className="login-page"><section className="login-pitch"><DogSilhouette className="login-dog-decoration" variant="background" /><div className="login-branding"><ProVetBrand className="provet-brand-login" /></div><div className="login-content"><span className="eyebrow">GESTIÓN COMERCIAL VETERINARIA</span><h1>Tu operación más ágil y clara</h1><p>Sistema de relevamiento de stock, precio y proveedores con control de caja.</p></div><footer className="login-footer">Desarrollado por JpcFix</footer></section>
    <section className="login-panel"><form className="login-card" onSubmit={submit}><div><span className="eyebrow">ACCESO AL SISTEMA</span><h2>Ingresá a Pro Vet</h2><p>Usá tus credenciales de administrador.</p></div><Field label="USUARIO"><input autoComplete="username" autoFocus value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Ej. admin" required /></Field><Field label="CONTRASEÑA" error={error}><span className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Tu contraseña" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? 'Ocultar' : 'Mostrar'}</button></span></Field><Button type="submit" loading={loading} disabled={loading} className="full-width">Ingresar <Icon name="arrow" /></Button></form></section>
  </main>
}
