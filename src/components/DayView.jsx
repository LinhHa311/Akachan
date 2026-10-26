import { useEffect, useState } from 'react'
import {
  addDays,
  dayKey,
  deleteEntry,
  fetchEntriesOfDay,
  isToday,
  parseDayKey,
  summarizeByDay,
  TYPES,
} from '../lib/entries'

function detail(e) {
  if (e.type === 'breast') return e.duration_min ? `${e.duration_min} phút` : ''
  return e.amount_ml ? `${e.amount_ml} ml` : ''
}

export default function DayView({ day, onDayChange, version, onChanged }) {
  const [entries, setEntries] = useState([])
  // Mục đang chờ bấm lần 2 để xoá. Không dùng confirm() vì app mở từ
  // màn hình chính trên iPhone có thể không hiện hộp xác nhận.
  const [confirmId, setConfirmId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchEntriesOfDay(day).then(setEntries).catch((err) => alert(err.message))
  }, [day, version])

  useEffect(() => {
    if (confirmId === null) return
    const id = setTimeout(() => setConfirmId(null), 4000)
    return () => clearTimeout(id)
  }, [confirmId])

  const [sum] = summarizeByDay(entries, 1, day)
  const today = isToday(day)

  async function remove(id) {
    if (confirmId !== id) {
      setConfirmId(id)
      return
    }
    setConfirmId(null)
    setDeletingId(id)
    try {
      await deleteEntry(id)
      setEntries((list) => list.filter((e) => e.id !== id))
      onChanged()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="card">
      <div className="day-nav">
        <button aria-label="Ngày trước" onClick={() => onDayChange(addDays(day, -1))}>‹</button>
        <input
          type="date"
          value={dayKey(day)}
          max={dayKey(new Date())}
          onChange={(e) => e.target.value && onDayChange(parseDayKey(e.target.value))}
        />
        <button aria-label="Ngày sau" disabled={today} onClick={() => onDayChange(addDays(day, 1))}>›</button>
      </div>
      {!today && (
        <button className="link back-today" onClick={() => onDayChange(new Date())}>← Về hôm nay</button>
      )}

      <div className="summary">
        <div><b>{sum.feeds}<small>cữ</small></b>Cữ bú</div>
        <div><b>{sum.breastMin}<small>phút</small></b>Bú mẹ</div>
        <div><b>{sum.bottleMl}<small>ml</small></b>Sữa mẹ bình</div>
        <div><b>{sum.formulaMl}<small>ml</small></b>Sữa CT</div>
        <div><b>{sum.pumpMl}<small>ml</small></b>Vắt sữa</div>
        <div><b>{sum.pee}<small>lần</small></b>Tiểu</div>
        <div><b>{sum.poop}<small>lần</small></b>Đại</div>
      </div>

      <ul className="list">
        {entries.map((e) => (
          <li key={e.id}>
            <span className="time">{new Date(e.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>{TYPES[e.type].icon} {TYPES[e.type].label}</span>
            <span className="muted">{detail(e)}</span>
            <button
              className={`link delete ${confirmId === e.id ? 'confirm' : ''}`}
              disabled={deletingId === e.id}
              onClick={() => remove(e.id)}
            >
              {deletingId === e.id ? '…' : confirmId === e.id ? 'Xoá?' : 'Xoá'}
            </button>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="muted">{today ? 'Chưa có ghi chép nào hôm nay.' : 'Không có ghi chép nào trong ngày này.'}</li>
        )}
      </ul>
    </section>
  )
}
