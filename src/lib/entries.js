import { supabase } from './supabase'

// Các loại có nút ghi nhanh
export const TYPES = {
  breast: { label: 'Bú mẹ', icon: '🤱' },
  formula: { label: 'Sữa CT', icon: '🍼' },
  pee: { label: 'Tiểu', icon: '💧' },
  poop: { label: 'Đại', icon: '💩' },
}

// Giấc ngủ: `at` là lúc ngủ, `end_at` là lúc dậy (null khi bé đang ngủ)
export const SLEEP = { label: 'Ngủ', icon: '😴' }

// Loại đang dùng. Dữ liệu cũ (sữa mẹ bình, vắt sữa) vẫn nằm trong bảng
// nhưng không hiện nữa.
const SHOWN_TYPES = [...Object.keys(TYPES), 'sleep']

export function typeInfo(type) {
  return type === 'sleep' ? SLEEP : TYPES[type]
}

export function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Ngày theo giờ địa phương, dạng YYYY-MM-DD
export function dayKey(date) {
  const d = new Date(date)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function parseDayKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function isToday(date) {
  return dayKey(date) === dayKey(new Date())
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

// 65 → "01:05" (giờ:phút)
export function formatHHMM(min) {
  const m = Math.floor(min)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export async function addEntry(entry) {
  const { error } = await supabase.from('entries').insert(entry)
  if (error) throw error
}

export async function deleteEntry(id) {
  // RLS chặn thì Supabase không báo lỗi mà chỉ xoá 0 dòng, nên phải kiểm tra
  const { data, error } = await supabase.from('entries').delete().eq('id', id).select('id')
  if (error) throw error
  if (data.length === 0) throw new Error('Không xoá được mục này (tài khoản chưa có quyền xoá).')
}

// Giấc ngủ chưa bấm Dậy (mới nhất), hoặc null
export async function fetchOpenSleep() {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('type', 'sleep')
    .is('end_at', null)
    .order('at', { ascending: false })
    .limit(1)
  if (error) throw error
  return data[0] ?? null
}

export async function startSleep() {
  // Máy kia có thể đã bấm Ngủ mà màn hình này chưa cập nhật
  if (await fetchOpenSleep()) throw new Error('Bé đang ngủ rồi (đã có người bấm Ngủ).')
  await addEntry({ type: 'sleep' })
}

export async function endSleep(id) {
  const { data, error } = await supabase
    .from('entries')
    .update({ end_at: new Date().toISOString() })
    .eq('id', id)
    .is('end_at', null)
    .select('id')
  if (error) throw error
  if (data.length === 0) throw new Error('Giấc ngủ này đã được bấm Dậy rồi.')
}

// Các lần ghi có `at` trong [from, to), cộng thêm giấc ngủ bắt đầu trước
// `from` nhưng còn kéo dài vào khoảng này (ví dụ ngủ từ 22h hôm trước)
export async function fetchEntriesSince(from, to) {
  let query = supabase
    .from('entries')
    .select('*')
    .in('type', SHOWN_TYPES)
    .gte('at', from.toISOString())
  if (to) query = query.lt('at', to.toISOString())

  const carried = supabase
    .from('entries')
    .select('*')
    .eq('type', 'sleep')
    .lt('at', from.toISOString())
    .or(`end_at.is.null,end_at.gt."${from.toISOString()}"`)

  const [main, prev] = await Promise.all([query.order('at', { ascending: false }), carried])
  if (main.error) throw main.error
  if (prev.error) throw prev.error
  return [...main.data, ...prev.data]
}

export function fetchEntriesOfDay(day) {
  const from = startOfDay(day)
  return fetchEntriesSince(from, addDays(from, 1))
}

// Số phút ngủ của giấc `e` rơi vào khoảng [start, end). Đang ngủ thì tính đến bây giờ.
export function sleepMinutesIn(e, start, end) {
  const from = Math.max(new Date(e.at).getTime(), start.getTime())
  const to = Math.min(e.end_at ? new Date(e.end_at).getTime() : Date.now(), end.getTime())
  return Math.max(0, (to - from) / 60000)
}

export function sleepDuration(e) {
  const end = e.end_at ? new Date(e.end_at) : new Date()
  return (end - new Date(e.at)) / 60000
}

function emptyTotals() {
  return { feeds: 0, breastMin: 0, formulaMl: 0, pee: 0, poop: 0, sleepMin: 0 }
}

// Cộng một lần ghi (không phải giấc ngủ) vào dòng tổng
function addToTotals(r, e) {
  if (e.type === 'breast') {
    r.feeds++
    r.breastMin += e.duration_min ?? 0
  } else if (e.type === 'formula') {
    r.feeds++
    r.formulaMl += e.amount_ml ?? 0
  } else if (e.type in r) {
    r[e.type]++
  }
}

// Chia thời gian ngủ vào từng khoảng; buckets: [{ row, start, end }]
function addSleep(buckets, entries) {
  for (const e of entries) {
    if (e.type !== 'sleep') continue
    for (const b of buckets) b.row.sleepMin += sleepMinutesIn(e, b.start, b.end)
  }
  for (const b of buckets) b.row.sleepMin = Math.round(b.row.sleepMin)
}

// Gom theo ngày (giờ địa phương), trả về `days` ngày kết thúc ở `lastDay`,
// từ cũ đến mới, có cả ngày trống
export function summarizeByDay(entries, days, lastDay = new Date()) {
  const result = []
  const buckets = []
  for (let i = days - 1; i >= 0; i--) {
    const start = addDays(startOfDay(lastDay), -i)
    const row = { day: dayKey(start), ...emptyTotals() }
    result.push(row)
    buckets.push({ row, start, end: addDays(start, 1) })
  }
  const byKey = Object.fromEntries(result.map((r) => [r.day, r]))
  for (const e of entries) {
    if (e.type === 'sleep') continue
    const r = byKey[dayKey(e.at)]
    if (r) addToTotals(r, e)
  }
  addSleep(buckets, entries)
  return result
}

// Gom các lần ghi của ngày `day` theo giờ (0–23, giờ địa phương)
export function summarizeByHour(entries, day) {
  const result = Array.from({ length: 24 }, (_, hour) => ({ hour, ...emptyTotals() }))
  const day0 = startOfDay(day)
  const buckets = result.map((row) => {
    const start = new Date(day0)
    start.setHours(row.hour)
    const end = new Date(day0)
    end.setHours(row.hour + 1)
    return { row, start, end }
  })
  for (const e of entries) {
    if (e.type === 'sleep') continue
    const at = new Date(e.at)
    if (dayKey(at) === dayKey(day0)) addToTotals(result[at.getHours()], e)
  }
  addSleep(buckets, entries)
  return result
}
