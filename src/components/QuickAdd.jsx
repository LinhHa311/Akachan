import { useEffect, useState } from 'react'
import { addEntry, endSleep, fetchOpenSleep, formatHHMM, formatTime, sleepDuration, startSleep, TYPES } from '../lib/entries'

// Loại cần nhập số: đơn vị lưu vào cột nào và các nút nhanh
const AMOUNT_TYPES = {
  breast: { field: 'duration_min', placeholder: 'Số phút', presets: [] },
  formula: { field: 'amount_ml', placeholder: 'Số ml', presets: [20, 40] },
}

export default function QuickAdd({ version, onAdded }) {
  const [open, setOpen] = useState(null) // một key trong AMOUNT_TYPES hoặc null
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  // undefined = đang tải, null = bé đang thức, object = giấc ngủ chưa bấm Dậy
  const [sleep, setSleep] = useState(undefined)
  const [, setTick] = useState(0)

  // Tải lại trạng thái ngủ khi có thay đổi hoặc khi mở lại app (máy kia có thể đã bấm)
  useEffect(() => {
    const load = () => fetchOpenSleep().then(setSleep).catch((err) => alert(err.message))
    load()
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [version])

  // Cập nhật số phút đang ngủ mỗi 30 giây
  useEffect(() => {
    if (!sleep) return
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [sleep])

  async function run(action) {
    setBusy(true)
    try {
      await action()
      setOpen(null)
      setValue('')
      onAdded()
    } catch (err) {
      alert(err.message)
      onAdded() // tải lại để hiện đúng trạng thái
    } finally {
      setBusy(false)
    }
  }

  const save = (entry) => run(() => addEntry(entry))

  function saveAmount(n) {
    save({ type: open, [AMOUNT_TYPES[open].field]: n })
  }

  function submitAmount(e) {
    e.preventDefault()
    const n = Number(value)
    if (!n) return
    saveAmount(n)
  }

  function toggle(type) {
    if (!AMOUNT_TYPES[type]) return save({ type })
    setOpen(open === type ? null : type)
    setValue('')
  }

  const sleeping = Boolean(sleep)

  return (
    <section className="card">
      <div className="quick-grid">
        {Object.entries(TYPES).map(([type, t]) => (
          <button
            key={type}
            className={`quick t-${type} ${open === type ? 'active' : ''}`}
            disabled={busy}
            onClick={() => toggle(type)}
          >
            <span className="icon-tile">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {open && (
        <form className="amount" onSubmit={submitAmount}>
          {AMOUNT_TYPES[open].presets.map((ml) => (
            <button type="button" key={ml} disabled={busy} onClick={() => saveAmount(ml)}>
              {ml} ml
            </button>
          ))}
          <input
            type="number"
            inputMode="numeric"
            min="1"
            placeholder={AMOUNT_TYPES[open].placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button type="submit" disabled={busy}>Lưu</button>
        </form>
      )}

      <div className="sleep-row t-sleep">
        <button
          className={`quick sleep-btn ${sleeping ? 'active' : ''}`}
          disabled={busy || sleep !== null}
          onClick={() => run(startSleep)}
        >
          <span className="icon-tile">😴</span>
          {sleeping ? 'Đang ngủ' : 'Ngủ'}
        </button>
        <button
          className="quick sleep-btn"
          disabled={busy || !sleeping}
          onClick={() => run(() => endSleep(sleep.id))}
        >
          <span className="icon-tile">🌤️</span>
          Dậy
        </button>
      </div>
      {sleeping && (
        <p className="sleep-status">
          Ngủ từ <b>{formatTime(sleep.at)}</b> · đã ngủ <b>{formatHHMM(sleepDuration(sleep))}</b>
        </p>
      )}
    </section>
  )
}
