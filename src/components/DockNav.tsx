import { NavLink } from 'react-router-dom'
import { PanelsTopLeft, Disc3, ListMusic } from 'lucide-react'

const links = [
  { to: '/', label: 'Bibliothèque', icon: PanelsTopLeft },
  { to: '/player', label: 'Lecteur', icon: Disc3 },
  { to: '/queue', label: 'File', icon: ListMusic },
]

export const DockNav = () => {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-3xl items-center justify-around rounded-3xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-2xl shadow-soft"
    >
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-xs font-medium transition-colors ${isActive ? 'text-white shadow-glow' : 'text-slate-300 hover:text-white'}`
          }
        >
          <Icon className="h-6 w-6" aria-hidden />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
