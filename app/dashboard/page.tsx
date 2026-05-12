import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getMonthlyIncome, getMonthlyExpenses, getRecentExpenses } from '@/lib/db/dashboard'

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signup')
  }

  const [totalIncome, totalExpenses, recentExpenses] = await Promise.all([
    getMonthlyIncome(user.id),
    getMonthlyExpenses(user.id),
    getRecentExpenses(user.id),
  ])

  const now = new Date()
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div>
      <h1>Dashboard — {monthLabel}</h1>

      <section>
        <h2>This Month</h2>
        <p>Total Income: ${totalIncome.toFixed(2)}</p>
        <p>Total Expenses: ${totalExpenses.toFixed(2)}</p>
        <p>Net: ${(totalIncome - totalExpenses).toFixed(2)}</p>
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
