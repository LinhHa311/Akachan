import { useState } from 'react'
import { addEntry, TYPES } from '../lib/entries'

// Loại cần nhập số: đơn vị lưu vào cột nào và các nút nhanh
const AMOUNT_TYPES = {
  breast: { field: 'duration_min', placeholder: 'Số phút', presets: [] },
  breast_bottle: { field: 'amount_ml', placeholder: 'Số ml', presets: [20, 40] },
  formula: { field: 'amount_ml', placeholder: 'Số ml', presets: [20, 40] },
  pump: { field: 'amount_ml', placeholder: 'Số ml vắt được', presets: [] },
}

export default function QuickAdd({ onAdded }) {
  const [open, setOpen] = useState(null) // một key trong AMOUNT_TYPES hoặc null
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

  return (
    <section className="card">
      <div className="quick-grid">
        {Object.entries(TYPES).map(([type, t]) => (
          <button
            key={type}
            className={`quick ${open === type ? 'active' : ''}`}
            disabled={busy}
            onClick={() => toggle(type)}
          >
            <span className="icon">{t.icon}</span>
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
    </section>
  )
}
