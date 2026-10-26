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
import { fetchEntriesSince, startOfDay, summarizeByDay } from '../lib/entries'

ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip)

const RANGES = [7, 30]

export default function Stats({ version }) {
  const [days, setDays] = useState(7)
  const [rows, setRows] = useState([])

  useEffect(() => {
    const from = startOfDay()
    from.setDate(from.getDate() - (days - 1))
    fetchEntriesSince(from)
      .then((entries) => setRows(summarizeByDay(entries, days)))
      .catch((err) => alert(err.message))
  }, [days, version])

  const labels = rows.map((r) => r.day.slice(5).replace('-', '/'))
  const options = { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }

  return (
    <section className="card">
      <div className="tabs small">
        {RANGES.map((n) => (
          <button key={n} className={days === n ? 'active' : ''} onClick={() => setDays(n)}>
            {n} ngày
          </button>
        ))}
      </div>

      <h3>Sữa công thức (ml / ngày)</h3>
      <Bar
        data={{ labels, datasets: [{ label: 'ml', data: rows.map((r) => r.formulaMl), backgroundColor: '#f6a5c0' }] }}
        options={options}
      />

      <h3>Số lần mỗi ngày</h3>
      <Bar
        data={{
          labels,
          datasets: [
            { label: 'Cữ bú', data: rows.map((r) => r.feeds), backgroundColor: '#8ec5ff' },
            { label: 'Tiểu', data: rows.map((r) => r.pee), backgroundColor: '#ffd36e' },
            { label: 'Đại', data: rows.map((r) => r.poop), backgroundColor: '#b08968' },
          ],
        }}
        options={options}
      />

      <h3>Bảng số</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Ngày</th><th>Cữ bú</th><th>Sữa mẹ (phút)</th><th>Sữa CT (ml)</th><th>Tiểu</th><th>Đại</th></tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((r) => (
              <tr key={r.day}>
                <td>{r.day.slice(5).replace('-', '/')}</td>
                <td>{r.feeds}</td><td>{r.breastMin}</td><td>{r.formulaMl}</td><td>{r.pee}</td><td>{r.poop}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
