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
  isToday,
  parseDayKey,
  startOfDay,
  summarizeByDay,
  summarizeByHour,
} from '../lib/entries'

ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip)

const RANGES = [1, 7, 30]

const options = { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
const stacked = { ...options, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }
// Số lần luôn là số nguyên, không hiện vạch 0.5
const counts = { ...options, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }

// Các biểu đồ dùng chung cho cả xem theo giờ (1 ngày) và theo ngày (7/30 ngày)
function Charts({ labels, rows, unit }) {
  return (
    <>
      <h3>Bé uống bình (ml / {unit})</h3>
      <Bar
        data={{
          labels,
          datasets: [
            { label: 'Sữa mẹ bình', data: rows.map((r) => r.bottleMl), backgroundColor: '#e96a97' },
            { label: 'Sữa CT', data: rows.map((r) => r.formulaMl), backgroundColor: '#f6c5d6' },
          ],
        }}
        options={stacked}
      />

      <h3>Vắt sữa (ml / {unit})</h3>
      <Bar
        data={{ labels, datasets: [{ label: 'ml', data: rows.map((r) => r.pumpMl), backgroundColor: '#9d8df1' }] }}
        options={options}
      />

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

  useEffect(() => {
    if (days === 1) {
      fetchEntriesOfDay(day)
        .then((entries) => setHours(summarizeByHour(entries)))
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
          <Charts labels={hours.map((h) => `${h.hour}h`)} rows={hours} unit="giờ" />
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
                <tr><th>Ngày</th><th>Cữ bú</th><th>Bú mẹ (phút)</th><th>SM bình (ml)</th><th>Sữa CT (ml)</th><th>Vắt (ml)</th><th>Tiểu</th><th>Đại</th></tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => (
                  <tr key={r.day} className="clickable" onClick={() => onOpenDay(parseDayKey(r.day))}>
                    <td>{r.day.slice(8)}/{r.day.slice(5, 7)} ›</td>
                    <td>{r.feeds}</td><td>{r.breastMin}</td><td>{r.bottleMl}</td><td>{r.formulaMl}</td><td>{r.pumpMl}</td><td>{r.pee}</td><td>{r.poop}</td>
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
