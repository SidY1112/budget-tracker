'use client'

import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import Card from '@/components/ui/Card'

type Expense = {
  date: string
  amount: number
  category_id: string
}

type Category = {
  id: string
  name: string
  icon: string | null
}

type Budget = {
  category_id: string
  monthly_limit: number
}

const PIE_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

// Converts YYYY-MM to "Jan 2026" — specifying timeZone: 'UTC' prevents toLocaleString from
// shifting the UTC midnight date into the previous month for users behind UTC
function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('default', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// Shifts a YYYY-MM string by delta months in UTC so navigation doesn't drift across DST boundaries
function shiftMonth(monthStr: string, delta: number): string {
  const [year, month] = monthStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1 + delta, 1)).toISOString().slice(0, 7)
}

// Returns the current month as YYYY-MM in local time — expense dates are stored from the date picker
// which uses local time, so filtering against UTC would show the wrong month for non-UTC timezones
function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Resolves a category display label — prefers icon + name, falls back to raw id if not found
function categoryLabel(categoryId: string, categories: Category[]): string {
  const cat = categories.find((c) => c.id === categoryId)
  if (!cat) return categoryId
  return cat.icon ? `${cat.icon} ${cat.name}` : cat.name
}

// Bar chart of total spending per month — expenses for 12 months are pre-loaded so filter changes
// need no additional round-trips
export function SpendingOverTime({ expenses }: { expenses: Expense[] }) {
  const [period, setPeriod] = useState(6)

  // Re-bucket expenses into monthly totals whenever the period or source data changes
  const data = useMemo(() => {
    const now = new Date()
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - period + 1, 1)
    const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}`

    const totals: Record<string, number> = {}
    for (const expense of expenses) {
      const month = expense.date.slice(0, 7)
      if (month >= cutoffStr) {
        totals[month] = (totals[month] ?? 0) + expense.amount
      }
    }

    return Object.entries(totals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month: formatMonth(month), total }))
  }, [expenses, period])

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Spending Over Time</h2>
        <div className="flex gap-1">
          {([1, 3, 6, 12] as const).map((n) => (
            <button
              key={n}
              onClick={() => setPeriod(n)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                period === n
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              {n === 1 ? '1m' : n === 12 ? '1y' : `${n}m`}
            </button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500">No expense data for this period.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v: number) => `$${v}`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => typeof v === 'number' ? [`$${v.toFixed(2)}`, 'Total'] : ['', 'Total']} />
            <Bar dataKey="total" name="Total Expenses" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

// Donut chart of spending by category for a selected month — month navigation is handled client-side
// using the full 12-month expense dataset so no additional fetches are needed
export function SpendingByCategory({
  expenses,
  categories,
}: {
  expenses: Expense[]
  categories: Category[]
}) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  // Aggregate expenses for the selected month and attach resolved category names
  const data = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const expense of expenses) {
      if (expense.date.slice(0, 7) === selectedMonth) {
        totals[expense.category_id] = (totals[expense.category_id] ?? 0) + expense.amount
      }
    }
    return Object.entries(totals)
      .map(([categoryId, value]) => ({
        name: categoryLabel(categoryId, categories),
        value,
      }))
      .sort((a, b) => b.value - a.value)
  }, [expenses, categories, selectedMonth])

  const canGoNext = selectedMonth < currentMonth()

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Spending by Category</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedMonth((m: string) => shiftMonth(m, -1))}
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            ←
          </button>
          <span className="text-sm font-medium text-gray-900 w-20 text-center">
            {formatMonth(selectedMonth)}
          </span>
          <button
            onClick={() => setSelectedMonth((m: string) => shiftMonth(m, 1))}
            disabled={!canGoNext}
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500">No expenses recorded for {formatMonth(selectedMonth)}.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => typeof v === 'number' ? `$${v.toFixed(2)}` : ''} />
            <Legend iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

// Grouped bar chart comparing each category's monthly limit against actual spending this month —
// actual spending is split into two dataKeys (under/over) so each can carry its own colour in
// the legend without needing a custom renderer
export function BudgetVsActual({
  expenses,
  budgets,
  categories,
}: {
  expenses: Expense[]
  budgets: Budget[]
  categories: Category[]
}) {
  // Compute current-month spending per category and merge with budget limits
  const data = useMemo(() => {
    const thisMonth = currentMonth()
    const spent: Record<string, number> = {}
    for (const expense of expenses) {
      if (expense.date.slice(0, 7) === thisMonth) {
        spent[expense.category_id] = (spent[expense.category_id] ?? 0) + expense.amount
      }
    }
    return budgets.map((budget) => {
      const actual = spent[budget.category_id] ?? 0
      const overBudget = actual > budget.monthly_limit
      return {
        category: categoryLabel(budget.category_id, categories),
        budget: budget.monthly_limit,
        // Split into two keys so Recharts renders each with its own legend colour
        actualUnder: overBudget ? null : actual,
        actualOver: overBudget ? actual : null,
      }
    })
  }, [expenses, budgets, categories])

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Budget vs Actual — {formatMonth(currentMonth())}
      </h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500">No budgets set yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <XAxis dataKey="category" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v: number) => `$${v}`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => typeof v === 'number' ? `$${v.toFixed(2)}` : ''} />
            <Legend iconType="circle" iconSize={8} />
            <Bar dataKey="budget" name="Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actualUnder" name="Actual (under budget)" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actualOver" name="Actual (over budget)" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
