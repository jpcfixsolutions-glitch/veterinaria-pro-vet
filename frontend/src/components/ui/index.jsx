import { forwardRef } from 'react'
import Icon from './Icon.jsx'

export const Button = forwardRef(function Button({ children, variant = 'primary', icon, loading, success, className = '', ...props }, ref) {
  return <button ref={ref} className={`button button-${success ? 'success' : variant} ${loading ? 'is-loading' : ''} ${success ? 'is-success' : ''} ${className}`} disabled={loading || props.disabled} aria-busy={loading || undefined} {...props}>{loading ? <Icon name="spinner" /> : success ? <Icon name="check" /> : icon && <Icon name={icon} />}<span>{children}</span></button>
})

export function Card({ children, className = '' }) { return <section className={`card ${className}`}>{children}</section> }

export function Badge({ children, tone = 'neutral' }) { return <span className={`badge badge-${tone}`}>{children}</span> }

export function EmptyState({ icon = 'alert', title, detail, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={28} /></span><h3>{title}</h3><p>{detail}</p>{action}</div>
}

export function Toast({ toast, onClose }) {
  if (!toast) return null
  return <div className={`toast toast-${toast.type || 'success'}`} role="status"><Icon name={toast.type === 'error' ? 'alert' : 'check'} /><span>{toast.message}</span><button aria-label="Cerrar aviso" onClick={onClose}><Icon name="close" size={16} /></button></div>
}

export function Field({ label, error, children }) {
  return <label className="field"><span>{label}</span>{children}{error && <small className="field-error">{error}</small>}</label>
}
