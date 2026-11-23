import { useState } from 'react'
import { addDays, dayKey, formatHHMM, formatTime, isToday, sleepDuration, sleepMinutesIn, startOfDay, TYPES } from '../lib/entries'

const DAY_MS = 24 * 60 * 60 * 1000
const COLORS = 5 // số màu xoay vòng, khai báo --sleep-1 … --sleep-5 trong index.css

// Dải 0h → 24h: mỗi giấc ngủ là một khối liền, mỗi giấc một màu.
// Bên dưới là các hàng chấm cho từng loại ghi khác (bú mẹ, sữa CT, tiểu, đại).
export default function SleepTimeline({ entries, day }) {
  const [selected, setSelected] = useState(null)
  const day0 = startOfDay(day)
  const day1 = addDays(day0, 1)

  const sleeps = entries
    .filter((e) => e.type === 'sleep' && sleepMinutesIn(e, day0, day1) > 0)
    .sort((a, b) => new Date(a.at) - new Date(b.at))
    .map((e, i) => {
      const at = new Date(e.at)
      const end = e.end_at ? new Date(e.end_at) : new Date()
      const from = Math.max(at, day0)
      const to = Math.min(end, day1)
      return {
        e,
        color: `var(--sleep-${(i % COLORS) + 1})`,
        left: ((from - day0) / DAY_MS) * 100,
        width: ((to - from) / DAY_MS) * 100,
        fromPrevDay: at < day0,
        toNextDay: end > day1,
      }
    })

  // Mỗi loại một hàng để các chấm cùng giờ không đè lên nhau
  const lanes = Object.entries(TYPES).map(([type, t]) => ({
    type,
    ...t,
    events: entries.filter((e) => e.type === type && dayKey(e.at) === dayKey(day0)),
  }))

  const total = sleeps.reduce((sum, s) => sum + sleepMinutesIn(s.e, day0, day1), 0)
  const nowLeft = isToday(day) ? ((Date.now() - day0) / DAY_MS) * 100 : null
  const toggle = (i) => setSelected(selected === i ? null : i)

  return (
    <div className="sleep-timeline">
      <div className="st-head">
        <h3>Ngủ và sinh hoạt trong ngày</h3>
        <span>Tổng <b>{formatHHMM(total)}</b></span>
      </div>

      <div className="st-bar">
        {[25, 50, 75].map((p) => <span key={p} className="st-grid" style={{ left: `${p}%` }} />)}
        {sleeps.map((s, i) => (
          <button
            key={s.e.id}
            className={`st-block ${selected === i ? 'selected' : ''} ${selected !== null && selected !== i ? 'dim' : ''}`}
            style={{ left: `${s.left}%`, width: `${s.width}%`, background: s.color }}
            aria-label={`Giấc ${i + 1}`}
            onClick={() => toggle(i)}
          />
        ))}
        {nowLeft !== null && <span className="st-now" style={{ left: `${nowLeft}%` }} />}
      </div>
      <div className="st-lanes">
        {[25, 50, 75].map((p) => <span key={p} className="st-grid" style={{ left: `${p}%` }} />)}
        {lanes.map((lane) => (
          <div key={lane.type} className={`st-lane t-${lane.type}`}>
            {lane.events.map((e) => (
              <span
                key={e.id}
                className="st-dot"
                style={{ left: `${((new Date(e.at) - day0) / DAY_MS) * 100}%` }}
                title={`${lane.label} ${formatTime(e.at)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="st-axis"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span></div>

      <div className="st-legend">
        {lanes.map((lane) => (
          <span key={lane.type} className={`t-${lane.type}`}>
            <span className="st-dot static" /> {lane.label} <b>{lane.events.length}</b>
          </span>
        ))}
      </div>

      <ul className="st-list">
        {sleeps.map((s, i) => (
          <li key={s.e.id} className={selected === i ? 'selected' : ''} onClick={() => toggle(i)}>
            <span className="st-swatch" style={{ background: s.color }} />
            <span className="st-range">
              Giấc {i + 1} · {formatTime(s.e.at)}{s.fromPrevDay && <small> (hôm trước)</small>}
              {' → '}
              {s.e.end_at ? formatTime(s.e.end_at) : 'đang ngủ'}
              {s.toNextDay && s.e.end_at && <small> (hôm sau)</small>}
            </span>
            <b>{formatHHMM(sleepDuration(s.e))}</b>
          </li>
        ))}
        {sleeps.length === 0 && <li className="muted empty">Không có giấc ngủ nào trong ngày.</li>}
      </ul>
    </div>
  )
}
