import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import {
  addDays,
  dayKey,
  fetchEntriesOfDay,
  fetchEntriesSince,
  formatHHMM,
  isToday,
  parseDayKey,
  startOfDay,
  summarizeByDay,
  summarizeByHour,
} from '../lib/entries'
import SleepTimeline from './SleepTimeline'

ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip)

const RANGES = [1, 7, 30]

const options = { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
const noLegend = { ...options, plugins: { legend: { display: false } } }
const sleepHours = { ...noLegend, plugins: { ...noLegend.plugins, tooltip: { callbacks: { label: (c) => `Ngủ: ${c.parsed.y} giờ` } } } }
// Số lần luôn là số nguyên, không hiện vạch 0.5
const counts = { ...options, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }

// Các biểu đồ dùng chung cho cả xem theo giờ (1 ngày) và theo ngày (7/30 ngày)
function Charts({ labels, rows, unit, sleep }) {
  return (
    <>
      <h3>Sữa CT (ml / {unit})</h3>
      <Bar
        data={{ labels, datasets: [{ label: 'Sữa CT', data: rows.map((r) => r.formulaMl), backgroundColor: '#3b7fd4' }] }}
        options={noLegend}
      />

      {/* Xem 1 ngày thì dùng dải thời gian (truyền qua `sleep`), 7/30 ngày thì biểu đồ cột */}
      {sleep ?? (
        <>
          <h3>Giấc ngủ (giờ / {unit})</h3>
          <Bar
            data={{
              labels,
              datasets: [{ label: 'Ngủ', data: rows.map((r) => Math.round(r.sleepMin / 6) / 10), backgroundColor: '#6f6bd8' }],
            }}
            options={sleepHours}
          />
        </>
      )}

      <h3>Số lần mỗi {unit}</h3>
      <Bar
        data={{
          labels,
          datasets: [
            { label: 'Cữ bú', data: rows.map((r) => r.feeds), backgroundColor: '#8ec5ff' },
            { label: 'Tiểu', data: rows.map((r) => r.pee), backgroundColor: '#ffd36e' },
            { label: 'Đại', data: rows.map((r) => r.poop), backgroundColor: '#b08968' },
          ],
        }}
        options={counts}
      />
    </>
  )
}

export default function Stats({ version, onOpenDay }) {
  const [days, setDays] = useState(7)
  const [day, setDay] = useState(() => new Date()) // ngày đang xem khi chọn "1 ngày"
  const [rows, setRows] = useState([])
  const [hours, setHours] = useState([])
  const [dayEntries, setDayEntries] = useState([])

  useEffect(() => {
    if (days === 1) {
      fetchEntriesOfDay(day)
        .then((entries) => {
          setDayEntries(entries)
          setHours(summarizeByHour(entries, day))
        })
        .catch((err) => alert(err.message))
      return
    }
    const from = startOfDay()
    from.setDate(from.getDate() - (days - 1))
    fetchEntriesSince(from)
      .then((entries) => setRows(summarizeByDay(entries, days)))
      .catch((err) => alert(err.message))
  }, [days, day, version])

  const labels = rows.map((r) => `${r.day.slice(8)}/${r.day.slice(5, 7)}`)

  return (
    <section className="card">
      <div className="tabs small">
        {RANGES.map((n) => (
          <button key={n} className={days === n ? 'active' : ''} onClick={() => setDays(n)}>
            {n} ngày
          </button>
        ))}
      </div>

      {days === 1 ? (
        <>
          <div className="day-nav">
            <button aria-label="Ngày trước" onClick={() => setDay(addDays(day, -1))}>‹</button>
            <input
              type="date"
              value={dayKey(day)}
              max={dayKey(new Date())}
              onChange={(e) => e.target.value && setDay(parseDayKey(e.target.value))}
            />
            <button aria-label="Ngày sau" disabled={isToday(day)} onClick={() => setDay(addDays(day, 1))}>›</button>
          </div>
          <Charts
            labels={hours.map((h) => `${h.hour}h`)}
            rows={hours}
            unit="giờ"
            sleep={<SleepTimeline entries={dayEntries} day={day} />}
          />
          <button className="link see-day" onClick={() => onOpenDay(day)}>Xem từng lần ghi trong ngày ›</button>
        </>
      ) : (
        <>
          <Charts labels={labels} rows={rows} unit="ngày" />

          <h3>Bảng số</h3>
          <p className="muted hint">Bấm vào một ngày để xem chi tiết.</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Ngày</th><th>Cữ bú</th><th>Bú mẹ (phút)</th><th>Sữa CT (ml)</th><th>Ngủ</th><th>Tiểu</th><th>Đại</th></tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => (
                  <tr key={r.day} className="clickable" onClick={() => onOpenDay(parseDayKey(r.day))}>
                    <td>{r.day.slice(8)}/{r.day.slice(5, 7)} ›</td>
                    <td>{r.feeds}</td><td>{r.breastMin}</td><td>{r.formulaMl}</td><td>{formatHHMM(r.sleepMin)}</td><td>{r.pee}</td><td>{r.poop}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
