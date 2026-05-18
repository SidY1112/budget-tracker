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

type Props = {
  expenses: Expense[]
  categories: Category[]
  budgets: Budget[]
}

const PIE_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

// Converts YYYY-MM to "Jan 2026" — used for axis labels and the month navigation heading
function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('default', {
    month: 'short',
    year: 'numeric',
  })
}

// Shifts a YYYY-MM string by delta months in UTC so navigation doesn't drift across DST boundaries
function shiftMonth(monthStr: string, delta: number): string {
  const [year, month] = monthStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1 + delta, 1)).toISOString().slice(0, 7)
}

// Returns the current month as YYYY-MM in UTC to match how Supabase stores dates
function currentMonthUTC(): string {
  return new Date().toISOString().slice(0, 7)
}

// Resolves a category display label — prefers icon + name, falls back to raw id if not found
function categoryLabel(categoryId: string, categories: Category[]): string {
  const cat = categories.find((c) => c.id === categoryId)
  if (!cat) return categoryId
  return cat.icon ? `${cat.icon} ${cat.name}` : cat.name
}

// Bar chart of total spending per month — expenses for 12 months are pre-loaded so filter changes
// need no additional round-trips
function SpendingOverTime({ expenses }: { expenses: Expense[] }) {
  const [period, setPeriod] = useState(6)

  // Re-bucket expenses into monthly totals whenever the period or source data changes
  const data = useMemo(() => {
    const cutoff = new Date()
    cutoff.setUTCMonth(cutoff.getUTCMonth() - period + 1)
    cutoff.setUTCDate(1)
    const cutoffStr = cutoff.toISOString().slice(0, 7)

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
    <section>
      <h2>Spending Over Time</h2>
      <div>
        {([1, 3, 6, 12] as const).map((n) => (
          <button
            key={n}
            onClick={() => setPeriod(n)}
            style={{ fontWeight: period === n ? 'bold' : 'normal', marginRight: 8 }}
          >
            {n === 1 ? '1 month' : n === 12 ? '1 year' : `${n} months`}
          </button>
        ))}
      </div>
      {data.length === 0 ? (
        <p>No expense data for this period.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(v: number) => `$${v}`} />
            <Tooltip formatter={(v) => typeof v === 'number' ? [`$${v.toFixed(2)}`, 'Total'] : ['', 'Total']} />
            <Bar dataKey="total" name="Total Expenses" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}

// Donut chart of spending by category for a selected month — month navigation is handled client-side
// using the full 12-month expense dataset so no additional fetches are needed
function SpendingByCategory({
  expenses,
  categories,
}: {
  expenses: Expense[]
  categories: Category[]
}) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthUTC)

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

  const canGoNext = selectedMonth < currentMonthUTC()

  return (
    <section>
      <h2>Spending by Category</h2>
      <div>
        <button onClick={() => setSelectedMonth((m) => shiftMonth(m, -1))}>← Prev</button>
        <span style={{ margin: '0 12px' }}>{formatMonth(selectedMonth)}</span>
        <button
          onClick={() => setSelectedMonth((m) => shiftMonth(m, 1))}
          disabled={!canGoNext}
        >
          Next →
        </button>
      </div>
      {data.length === 0 ? (
        <p>No expenses recorded for {formatMonth(selectedMonth)}.</p>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={140}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => typeof v === 'number' ? `$${v.toFixed(2)}` : ''} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}

// Grouped bar chart comparing each category's monthly limit against actual spending this month —
// actual spending is split into two dataKeys (under/over) so each can carry its own colour in
// the legend without needing a custom renderer
function BudgetVsActual({
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
    const currentMonth = currentMonthUTC()
    const spent: Record<string, number> = {}
    for (const expense of expenses) {
      if (expense.date.slice(0, 7) === currentMonth) {
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
    <section>
      <h2>Budget vs Actual — {formatMonth(currentMonthUTC())}</h2>
      {data.length === 0 ? (
        <p>No budgets set yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="category" />
            <YAxis tickFormatter={(v: number) => `$${v}`} />
            <Tooltip formatter={(v) => typeof v === 'number' ? `$${v.toFixed(2)}` : ''} />
            <Legend />
            <Bar dataKey="budget" name="Budget" fill="#94a3b8" />
            <Bar dataKey="actualUnder" name="Actual (under budget)" fill="#22c55e" />
            <Bar dataKey="actualOver" name="Actual (over budget)" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}

// Receives all pre-fetched data from the server page and renders all three charts —
// filtering and month navigation are handled client-side to avoid extra round-trips
export default function Charts({ expenses, categories, budgets }: Props) {
  return (
    <div>
      <SpendingOverTime expenses={expenses} />
      <SpendingByCategory expenses={expenses} categories={categories} />
      <BudgetVsActual expenses={expenses} budgets={budgets} categories={categories} />
    </div>
  )
}
