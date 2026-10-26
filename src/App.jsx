import { useEffect, useState } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import Login from './components/Login'
import Clock from './components/Clock'
import QuickAdd from './components/QuickAdd'
import DayView from './components/DayView'
import Stats from './components/Stats'
import { dayKey, isToday } from './lib/entries'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isConfigured)
  const [tab, setTab] = useState('day')
  const [day, setDay] = useState(() => new Date())
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
        <h1>Sam's Daily</h1>
        <p>Chưa cấu hình Supabase. Copy <code>.env.example</code> thành <code>.env</code> và điền URL + anon key.</p>
      </main>
    )
  }
  if (loading) return <main className="container">Đang tải…</main>
  if (!session) return <Login />

  const tabs = [
    { id: 'day', label: isToday(day) ? 'Hôm nay' : `${dayKey(day).slice(8)}/${dayKey(day).slice(5, 7)}` },
    { id: 'stats', label: 'Thống kê' },
  ]

  function openDay(d) {
    setDay(d)
    setTab('day')
  }

  return (
    <main className="container">
      <header className="header">
        <h1>Sam's Daily</h1>
        <button className="link" onClick={() => supabase.auth.signOut()}>Đăng xuất</button>
      </header>
      <Clock />

      <QuickAdd onAdded={refresh} />

      <nav className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'day' ? (
        <DayView day={day} onDayChange={setDay} version={version} onChanged={refresh} />
      ) : (
        <Stats version={version} onOpenDay={openDay} />
      )}
    </main>
  )
}
