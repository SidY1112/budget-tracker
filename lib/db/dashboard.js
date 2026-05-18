import { createSupabaseServerClient } from '@/lib/supabase-server'

// Returns ISO date strings for the first and last day of the current month, used to scope all dashboard queries
function currentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { start, end }
}

// Sums all income entries for the current month so the dashboard shows a single total rather than a list
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

// Sums all expense entries for the current month so the dashboard can show spend vs income at a glance
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

// Fetches each budget alongside how much was spent in the current month for that category,
// running both queries in parallel so the dashboard doesn't pay two sequential round-trips
export async function getBudgetProgress(userId) {
  const supabase = createSupabaseServerClient()
  const { start, end } = currentMonthRange()

  const [budgetsResult, expensesResult] = await Promise.all([
    supabase
      .from('budgets')
      .select('id, monthly_limit, expiration_date, category_id, categories(name, icon)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('expenses')
      .select('category_id, amount')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end),
  ])

  if (budgetsResult.error) throw budgetsResult.error
  if (expensesResult.error) throw expensesResult.error

  // Sum expenses by category_id so each budget row gets its monthly spend total in one pass
  const spentByCategory = {}
  for (const expense of expensesResult.data) {
    spentByCategory[expense.category_id] =
      (spentByCategory[expense.category_id] ?? 0) + Number(expense.amount)
  }

  return budgetsResult.data.map((budget) => ({
    ...budget,
    spent: spentByCategory[budget.category_id] ?? 0,
  }))
}

// Fetches the 5 most recent expenses ordered by date so users can quickly review their latest spending
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
