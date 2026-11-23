import { useEffect, useState } from 'react'
import {
  addDays,
  dayKey,
  deleteEntry,
  fetchEntriesOfDay,
  isToday,
  parseDayKey,
  formatHHMM,
  formatTime,
  sleepDuration,
  summarizeByDay,
  typeInfo,
} from '../lib/entries'

// Ô tổng trong ngày: [loại (để lấy màu), giá trị, đơn vị, nhãn]
function summaryItems(sum) {
  return [
    ['feeds', sum.feeds, 'cữ', 'Cữ bú'],
    ['breast', sum.breastMin, 'phút', 'Bú mẹ'],
    ['formula', sum.formulaMl, 'ml', 'Sữa CT'],
    ['sleep', sleepTotal(sum.sleepMin), '', 'Ngủ'],
    ['pee', sum.pee, 'lần', 'Tiểu'],
    ['poop', sum.poop, 'lần', 'Đại'],
  ]
}

// Tổng ngủ dạng "1 giờ 5 phút", đơn vị viết nhỏ như các ô khác
function sleepTotal(min) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return <>{m}<small>phút</small></>
  if (m === 0) return <>{h}<small>giờ</small></>
  return <>{h}<small>giờ</small> {m}<small>phút</small></>
}

function detail(e) {
  if (e.type === 'sleep') {
    const duration = `(${formatHHMM(sleepDuration(e))})`
    if (!e.end_at) return <span className="sleep-detail">đang ngủ <b>{duration}</b></span>
    return <span className="sleep-detail">🌤️ Dậy {formatTime(e.end_at)} <b>{duration}</b></span>
  }
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
  // Giấc ngủ bắt đầu từ hôm trước chỉ được tính vào tổng, danh sách hiện theo giờ bắt đầu.
  // Ngoại lệ: giấc đang ngủ dở từ hôm trước vẫn hiện để biết bé đang ngủ.
  const shown = entries.filter((e) => dayKey(e.at) === dayKey(day) || (e.type === 'sleep' && today && !e.end_at))

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
        {summaryItems(sum).map(([type, value, unit, label]) => (
          <div key={type} className={`stat t-${type}`}>
            <b>{value}<small>{unit}</small></b>
            {label}
          </div>
        ))}
      </div>

      <ul className="list">
        {shown.map((e) => (
          <li key={e.id}>
            <span className="time">{formatTime(e.at)}</span>
            <span>{typeInfo(e.type).icon} {typeInfo(e.type).label}</span>
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
        {shown.length === 0 && (
          <li className="muted empty">{today ? 'Chưa có ghi chép nào hôm nay.' : 'Không có ghi chép nào trong ngày này.'}</li>
        )}
      </ul>
    </section>
  )
}
