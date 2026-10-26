import { supabase } from './supabase'

export const TYPES = {
  breast: { label: 'Bú mẹ', icon: '🤱' },
  breast_bottle: { label: 'Sữa mẹ bình', icon: '🥛' },
  formula: { label: 'Sữa CT', icon: '🍼' },
  pump: { label: 'Vắt sữa', icon: '🫙' },
  pee: { label: 'Tiểu', icon: '💧' },
  poop: { label: 'Đại', icon: '💩' },
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

export async function fetchEntriesSince(from, to) {
  let query = supabase
    .from('entries')
    .select('*')
    .gte('at', from.toISOString())
  if (to) query = query.lt('at', to.toISOString())
  const { data, error } = await query.order('at', { ascending: false })
  if (error) throw error
  return data
}

export function fetchEntriesOfDay(day) {
  const from = startOfDay(day)
  return fetchEntriesSince(from, addDays(from, 1))
}

// Gom theo ngày (giờ địa phương), trả về `days` ngày kết thúc ở `lastDay`,
// từ cũ đến mới, có cả ngày trống
export function summarizeByDay(entries, days, lastDay = new Date()) {
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfDay(lastDay)
    d.setDate(d.getDate() - i)
    result.push({ day: dayKey(d), feeds: 0, breastMin: 0, bottleMl: 0, formulaMl: 0, pumpMl: 0, pee: 0, poop: 0 })
  }
  const byKey = Object.fromEntries(result.map((r) => [r.day, r]))
  for (const e of entries) {
    const r = byKey[dayKey(e.at)]
    if (!r) continue
    if (e.type === 'breast') {
      r.feeds++
      r.breastMin += e.duration_min ?? 0
    } else if (e.type === 'breast_bottle') {
      r.feeds++
      r.bottleMl += e.amount_ml ?? 0
    } else if (e.type === 'formula') {
      r.feeds++
      r.formulaMl += e.amount_ml ?? 0
    } else if (e.type === 'pump') {
      r.pumpMl += e.amount_ml ?? 0
    } else {
      r[e.type]++
    }
  }
  return result
}
