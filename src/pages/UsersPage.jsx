import { useState } from 'react'
import { Badge, Button, Card, EmptyState, Field } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'

const emptyUser = { firstName: '', lastName: '', contact: '', username: '', password: '', role: 'ADMIN', active: true }

function UserForm({ user, onSave, onCancel }) {
  const [form, setForm] = useState(user ? { ...user } : emptyUser)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const set = (key, value) => setForm((item) => ({ ...item, [key]: value }))
  const submit = async (event) => {
    event.preventDefault()
    const required = ['firstName', 'lastName', 'contact', 'username', 'password']
    const next = Object.fromEntries(required.filter((key) => !String(form[key]).trim()).map((key) => [key, 'Campo obligatorio.']))
    if (Object.keys(next).length) return setErrors(next)
    setErrors({}); setLoading(true)
    try { await onSave(form) } catch (error) { setErrors({ username: error.message }) } finally { setLoading(false) }
  }
  return <aside className="editor-panel user-editor"><div className="editor-header"><div><span className="eyebrow">{user ? 'EDITAR ADMINISTRADOR' : 'NUEVO ADMINISTRADOR'}</span><h2>{user ? `${user.firstName} ${user.lastName}` : 'Crear cuenta'}</h2></div><button className="icon-button" onClick={onCancel}><Icon name="close"/></button></div><form className="editor-form" onSubmit={submit}><div className="form-grid"><Field label="NOMBRE" error={errors.firstName}><input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field><Field label="APELLIDO" error={errors.lastName}><input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field></div><Field label="CONTACTO" error={errors.contact}><input value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="Email, teléfono o WhatsApp" /></Field><Field label="NOMBRE DE USUARIO" error={errors.username}><input value={form.username} onChange={(e) => set('username', e.target.value)} autoCapitalize="none" /></Field><Field label="CONTRASEÑA" error={errors.password}><input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} /><small className="form-hint">En esta demo sólo se conserva en memoria de la sesión. El backend deberá recibirla de forma segura.</small></Field><Field label="ROL"><select value={form.role} onChange={(e) => set('role', e.target.value)}><option value="ADMIN">Administrador</option></select><small className="form-hint">La arquitectura queda preparada para incorporar otros roles desde la API.</small></Field>{user && <label className="switch-row"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /><span/><div><strong>Cuenta activa</strong><small>Una cuenta inactiva no puede iniciar sesión.</small></div></label>}<div className="editor-actions"><Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button><Button type="submit" loading={loading}>Guardar administrador</Button></div></form></aside>
}

export default function UsersPage({ users, currentUser, onSaveUser, onToggleUser }) {
  const [editing, setEditing] = useState(null)
  const [query, setQuery] = useState('')
  const visible = users.filter((user) => `${user.firstName} ${user.lastName} ${user.username} ${user.contact}`.toLowerCase().includes(query.toLowerCase()))
  const save = async (user) => { await onSaveUser(user); setEditing(null) }
  return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow">USUARIOS</span><h1>Administradores</h1><p>Gestioná las cuentas con acceso al sistema.</p></div><Button icon="plus" onClick={() => setEditing({})}>Nuevo administrador</Button></div><div className="demo-notice"><Icon name="alert"/><div><strong>Cuentas de demostración</strong><span>El alta, las contraseñas y los estados sólo viven en memoria hasta contar con endpoints de usuarios.</span></div></div><Card><div className="toolbar"><label className="search-input"><Icon name="search"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar administrador…"/></label><Badge tone="info">{users.filter((user) => user.active).length} activas</Badge></div>{visible.length ? <div className="table-scroll"><table><thead><tr><th>Administrador</th><th>Contacto</th><th>Usuario</th><th>Rol</th><th>Estado</th><th /></tr></thead><tbody>{visible.map((user) => <tr key={user.id}><td><div className="user-cell"><div className="avatar">{user.firstName[0]}{user.lastName[0]}</div><div><strong>{user.firstName} {user.lastName}</strong>{user.id === currentUser.id && <small>Sesión actual</small>}</div></div></td><td>{user.contact}</td><td><code>{user.username}</code></td><td><Badge tone="info">ADMIN</Badge></td><td><button className={`status-toggle ${user.active ? 'is-active' : ''}`} disabled={user.id === currentUser.id} onClick={() => onToggleUser(user.id)}><i/><span>{user.active ? 'Activa' : 'Inactiva'}</span></button></td><td><button className="table-action" onClick={() => setEditing(user)}><Icon name="edit" size={17}/> Editar</button></td></tr>)}</tbody></table></div> : <EmptyState icon="users" title="No encontramos administradores" detail="Probá con otro término de búsqueda." />}</Card>{editing !== null && <div className="drawer-backdrop"><UserForm user={editing.id ? editing : null} onCancel={() => setEditing(null)} onSave={save}/></div>}</div>
}
