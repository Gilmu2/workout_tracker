import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Session from './pages/Session'
import History from './pages/History'
import SessionDetail from './pages/SessionDetail'
import Progress from './pages/Progress'
import Library from './pages/Library'
import Settings from './pages/Settings'

const tabs = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/history', label: 'History', icon: '📋' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/library', label: 'Library', icon: '📚' },
  { to: '/settings', label: 'Settings', icon: '⚙️' }
]

export default function App() {
  return (
    <div className="min-h-full flex flex-col pb-20 min-w-0 overflow-x-hidden">
      <main className="flex-1 max-w-2xl w-full min-w-0 mx-auto px-3 sm:px-4 pt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/session/:id" element={<Session />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<SessionDetail />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <nav
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="max-w-2xl mx-auto flex justify-around">
          {tabs.map((t) => (
            <li key={t.to} className="flex-1">
              <NavLink
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-2 text-xs ${
                    isActive ? 'text-accent' : 'text-slate-400'
                  }`
                }
              >
                <span className="text-xl leading-none">{t.icon}</span>
                <span className="mt-1">{t.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
