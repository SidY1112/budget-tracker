import { createSupabaseServerClient } from '@/lib/supabase-server'

function currentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { start, end }
}

export async function getMonthlyIncome(userId) {
  const supabase = createSupabaseServerClient()
  const { start, end } = currentMonthRange()

  const { data, error } = await supabase
    .from('income')
    .select('amount')
    .eq('user_id', userId)
    .gte('month', start)
    .lte('month', end)

  if (error) throw error
  return data.reduce((sum, row) => sum + Number(row.amount), 0)
}

export async function getMonthlyExpenses(userId) {
  const supabase = createSupabaseServerClient()
  const { start, end } = currentMonthRange()

  const { data, error } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)

  if (error) throw error
  return data.reduce((sum, row) => sum + Number(row.amount), 0)
}

export async function getRecentExpenses(userId) {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('expenses')
    .select('id, amount, description, date, is_recurring, category_id')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error
  return data
}
