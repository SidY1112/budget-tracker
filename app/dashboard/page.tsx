import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getMonthlyIncome, getMonthlyExpenses, getRecentExpenses, getBudgets } from '@/lib/db/dashboard'

type Budget = {
  id: string
  monthly_limit: number
  expiration_date: string | null
  categories: { name: string; icon: string | null }
}
import LogoutButton from '@/components/LogoutButton'

// Entry point for the dashboard — server-rendered so data is ready before the page reaches the browser
export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()

  // getUser() re-validates the session on every request rather than trusting a potentially stale cookie
  const { data: { user } } = await supabase.auth.getUser()

  // Unauthenticated users have no data to show, so redirect rather than render an empty/broken state
  if (!user) {
    redirect('/signup')
  }

  // All four queries are independent, so running them in parallel cuts load time to the slowest one
  const [totalIncome, totalExpenses, recentExpenses, budgets] = await Promise.all([
    getMonthlyIncome(user.id),
    getMonthlyExpenses(user.id),
    getRecentExpenses(user.id),
    getBudgets(user.id) as unknown as Promise<Budget[]>,
  ])

  // 'default' locale keeps the label consistent regardless of the server's locale setting
  const now = new Date()
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <LogoutButton />
      </div>
      <h1>Dashboard — {monthLabel}</h1>

      <section>
        <h2>This Month</h2>
        <p>Total Income: ${totalIncome.toFixed(2)}</p>
        <p>Total Expenses: ${totalExpenses.toFixed(2)}</p>
        <p>Net: ${(totalIncome - totalExpenses).toFixed(2)}</p>
      </section>

      <section>
        <h2>Budgets</h2>
        {budgets.length === 0 ? (
          <p>No budgets set yet.</p>
        ) : (
          <ul>
            {budgets.map((budget) => (
              <li key={budget.id}>
                <span>
                  {budget.categories.icon ? `${budget.categories.icon} ` : ''}
                  {budget.categories.name}
                </span>
                <span>${Number(budget.monthly_limit).toFixed(2)}/month</span>
                <span>
                  {budget.expiration_date
                    ? `Expires ${budget.expiration_date}`
                    : 'No expiration'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Recent Expenses</h2>
        {recentExpenses.length === 0 ? (
          <p>No expenses recorded yet.</p>
        ) : (
          <ul>
            {recentExpenses.map((expense) => (
              <li key={expense.id}>
                <span>{expense.date}</span>
                <span>{expense.description ?? '—'}</span>
                <span>${Number(expense.amount).toFixed(2)}</span>
                {expense.is_recurring && <span>(recurring)</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
