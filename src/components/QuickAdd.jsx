import { useState } from 'react'
import { addEntry, TYPES } from '../lib/entries'

const ML_PRESETS = [20, 40, 60]

export default function QuickAdd({ onAdded }) {
  const [open, setOpen] = useState(null) // 'breast' | 'formula' | null
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  async function save(entry) {
    setBusy(true)
    try {
      await addEntry(entry)
      setOpen(null)
      setValue('')
      onAdded()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  function submitAmount(e) {
    e.preventDefault()
    const n = Number(value)
    if (!n) return
    save(open === 'breast' ? { type: 'breast', duration_min: n } : { type: 'formula', amount_ml: n })
  }

  return (
    <section className="card">
      <div className="quick-grid">
        {Object.entries(TYPES).map(([type, t]) => (
          <button
            key={type}
            className={`quick ${open === type ? 'active' : ''}`}
            disabled={busy}
            onClick={() => (type === 'pee' || type === 'poop' ? save({ type }) : setOpen(open === type ? null : type))}
          >
            <span className="icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {open && (
        <form className="amount" onSubmit={submitAmount}>
          {open === 'formula' &&
            ML_PRESETS.map((ml) => (
              <button type="button" key={ml} disabled={busy} onClick={() => save({ type: 'formula', amount_ml: ml })}>
                {ml} ml
              </button>
            ))}
          <input
            type="number"
            inputMode="numeric"
            min="1"
            placeholder={open === 'breast' ? 'Số phút' : 'Số ml'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button type="submit" disabled={busy}>Lưu</button>
        </form>
      )}
    </section>
  )
}
