import { useEffect, useState } from 'react'
import { deleteEntry, fetchEntriesSince, startOfDay, summarizeByDay, TYPES } from '../lib/entries'

function detail(e) {
  if (e.type === 'breast') return e.duration_min ? `${e.duration_min} phút` : ''
  if (e.type === 'formula') return e.amount_ml ? `${e.amount_ml} ml` : ''
  return ''
}

export default function Today({ version, onChanged }) {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    fetchEntriesSince(startOfDay()).then(setEntries).catch((err) => alert(err.message))
  }, [version])

  const [sum] = summarizeByDay(entries, 1)

  async function remove(id) {
    if (!confirm('Xoá mục này?')) return
    await deleteEntry(id)
    onChanged()
  }

  return (
    <section className="card">
      <div className="summary">
        <div><b>{sum.feeds}</b>cữ bú</div>
        <div><b>{sum.formulaMl}</b>ml sữa CT</div>
        <div><b>{sum.breastMin}</b>phút sữa mẹ</div>
        <div><b>{sum.pee}</b>lần tiểu</div>
        <div><b>{sum.poop}</b>lần đại</div>
      </div>

      <ul className="list">
        {entries.map((e) => (
          <li key={e.id}>
            <span className="time">{new Date(e.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>{TYPES[e.type].icon} {TYPES[e.type].label}</span>
            <span className="muted">{detail(e)}</span>
            <button className="link" onClick={() => remove(e.id)}>Xoá</button>
          </li>
        ))}
        {entries.length === 0 && <li className="muted">Chưa có ghi chép nào hôm nay.</li>}
      </ul>
    </section>
  )
}
