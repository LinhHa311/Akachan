import { useEffect, useState } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import Login from './components/Login'
import QuickAdd from './components/QuickAdd'
import Today from './components/Today'
import Stats from './components/Stats'

const TABS = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'stats', label: 'Thống kê' },
]

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isConfigured)
  const [tab, setTab] = useState('today')
  // Tăng lên mỗi khi thêm/xoá để các màn hình tải lại dữ liệu
  const [version, setVersion] = useState(0)
  const refresh = () => setVersion((v) => v + 1)

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!isConfigured) {
    return (
      <main className="container">
        <h1>Akachan</h1>
        <p>Chưa cấu hình Supabase. Copy <code>.env.example</code> thành <code>.env</code> và điền URL + anon key.</p>
      </main>
    )
  }
  if (loading) return <main className="container">Đang tải…</main>
  if (!session) return <Login />

  return (
    <main className="container">
      <header className="header">
        <h1>Akachan</h1>
        <button className="link" onClick={() => supabase.auth.signOut()}>Đăng xuất</button>
      </header>

      <QuickAdd onAdded={refresh} />

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'today' ? <Today version={version} onChanged={refresh} /> : <Stats version={version} />}
    </main>
  )
}
