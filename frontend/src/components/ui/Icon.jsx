const paths = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-7h6v7"/></>,
  pos: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 9h10M7 14h3m4 0h3m-7 4h4"/></>,
  stock: <><path d="m3 7 9-4 9 4-9 4Z"/><path d="M3 12l9 4 9-4M3 17l9 4 9-4"/></>,
  cash: <><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9h1m10 0h1M6 15h1m10 0h1"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c.7-3.2 2.7-5 6-5s5.3 1.8 6 5"/><path d="M17 11a3 3 0 1 0-1-5.8M18 15c1.7.6 2.7 2.1 3 4"/></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M21 3v18H10"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  edit: <><path d="m4 20 4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10Z"/><path d="m13.5 7.5 3 3"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  alert: <><path d="M12 3 2 21h20Z"/><path d="M12 9v5m0 3v.01"/></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7"/><path d="M10 11v6m4-6v6"/></>,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6m-6 4h6m-6 4h4"/></>,
  spinner: <path d="M12 3a9 9 0 1 0 9 9"/>,
}

export default function Icon({ name, size = 20 }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.alert}</svg>
}
