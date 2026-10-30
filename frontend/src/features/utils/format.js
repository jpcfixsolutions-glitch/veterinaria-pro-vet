export const money = (value = 0) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
}).format(Number(value) || 0)

export const dateTime = (value) => new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium', timeStyle: 'short', hour12: false, timeZone: 'America/Argentina/Cordoba',
}).format(new Date(value))

export const time = (value) => new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Cordoba',
}).format(new Date(value))

export const today = () => new Intl.DateTimeFormat('es-AR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
}).format(new Date())
