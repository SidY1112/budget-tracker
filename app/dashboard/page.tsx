import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import {
  getMonthlyIncome,
  getMonthlyExpenses,
  getRecentExpenses,
  getBudgetProgress,
  getChartExpenses,
  getCategories,
} from '@/lib/db/dashboard'
import LogoutButton from '@/components/LogoutButton'
import { SpendingOverTime, SpendingByCategory, BudgetVsActual } from '@/components/Charts'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import ProgressBar from '@/components/ui/ProgressBar'
import Badge from '@/components/ui/Badge'

type BudgetProgress = {
  id: string
  category_id: string
  monthly_limit: number
  expiration_date: string | null
  spent: number
  categories: { name: string; icon: string | null }
}

type ChartExpense = { date: string; amount: number; category_id: string }
type ChartCategory = { id: string; name: string; icon: string | null }

// Entry point for the dashboard — server-rendered so data is ready before the page reaches the browser
export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()

  // getUser() re-validates the session on every request rather than trusting a potentially stale cookie
  const { data: { user } } = await supabase.auth.getUser()

  // Unauthenticated users have no data to show, so redirect rather than render an empty/broken state
  if (!user) {
    redirect('/signup')
  }

  // All six queries are independent, so running them in parallel cuts load time to the slowest one
  const [totalIncome, totalExpenses, recentExpenses, budgets, chartExpenses, allCategories] =
    await Promise.all([
      getMonthlyIncome(user.id),
      getMonthlyExpenses(user.id),
      getRecentExpenses(user.id),
      getBudgetProgress(user.id) as unknown as Promise<BudgetProgress[]>,
      getChartExpenses(user.id) as unknown as Promise<ChartExpense[]>,
      getCategories() as unknown as Promise<ChartCategory[]>,
    ])

  const budgetsForCharts = budgets.map((b) => ({
    category_id: b.category_id,
    monthly_limit: Number(b.monthly_limit),
  }))

  const net = totalIncome - totalExpenses

  // 'default' locale keeps the label consistent regardless of the server's locale setting
  const now = new Date()
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">

      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard — {monthLabel}</h1>
        <LogoutButton />
      </div>

      {/* 2. Charts — spending over time and by category side by side */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SpendingOverTime expenses={chartExpenses} />
        <SpendingByCategory expenses={chartExpenses} categories={allCategories} />
      </div>

      {/* 3. Stats row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard label="Total Income" value={`$${totalIncome.toFixed(2)}`} />
        <StatCard label="Total Expenses" value={`$${totalExpenses.toFixed(2)}`} />
        <StatCard
          label="Remaining Balance"
          value={`$${net.toFixed(2)}`}
          valueColor={net >= 0 ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      {/* 4. Budget progress */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Budget Progress</h2>
        {budgets.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-gray-500">No budgets set yet.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {budgets.map((budget) => {
                const overBudget = budget.spent > budget.monthly_limit
                const remaining = budget.monthly_limit - budget.spent
                return (
                  <Card key={budget.id} className="space-y-3 p-6">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {budget.categories.icon ? `${budget.categories.icon} ` : ''}
                        {budget.categories.name}
                      </span>
                      <Badge variant={overBudget ? 'red' : 'green'}>
                        {overBudget ? 'Over budget' : 'On track'}
                      </Badge>
                    </div>
                    <ProgressBar
                      value={budget.spent}
                      max={budget.monthly_limit}
                      overBudget={overBudget}
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">${budget.spent.toFixed(2)} spent</span>
                      <span className="text-gray-400">
                        of ${Number(budget.monthly_limit).toFixed(2)}
                      </span>
                    </div>
                    <p className={`text-sm font-medium ${overBudget ? 'text-red-600' : 'text-green-600'}`}>
                      {overBudget
                        ? `Over by $${Math.abs(remaining).toFixed(2)}`
                        : `$${remaining.toFixed(2)} remaining`}
                    </p>
                  </Card>
                )
              })}
            </div>
            <BudgetVsActual
              expenses={chartExpenses}
              budgets={budgetsForCharts}
              categories={allCategories}
            />
          </div>
        )}
      </section>

      {/* 5. Recent expenses */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Expenses</h2>
        <Card>
          {recentExpenses.length === 0 ? (
            <div className="p-6">
              <p className="text-sm text-gray-500">No expenses recorded yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentExpenses.map((expense) => (
                <li
                  key={expense.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-24 shrink-0 text-sm text-gray-400">{expense.date}</span>
                    <span className="text-sm text-gray-900">{expense.description ?? '—'}</span>
                    {expense.is_recurring && <Badge variant="gray">Recurring</Badge>}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    ${Number(expense.amount).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

    </div>
  )
}
