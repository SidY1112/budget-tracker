'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import DatePicker from '@/components/DatePicker'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

type Props = {
  userId: string
}

type SuccessInfo = {
  source: string
  amount: string
  month: string
}

// Returns the current month as YYYY-MM for submit-time validation — the UI cap is handled by DatePicker
function currentMonthISO() {
  return new Date().toISOString().slice(0, 7)
}

// Handles all income form state and submission on the client — kept separate from the server page
// so the session check runs server-side while interactivity stays in the browser
export default function AddIncomeForm({ userId }: Props) {
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState('')
  const [error, setError] = useState('')
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null)

  // Clears all fields after a successful insert so the user can immediately log another income entry
  function resetForm() {
    setSource('')
    setAmount('')
    setMonth('')
  }

  // Strips the '-' character as it is typed so the field never accepts a negative value —
  // min="0" alone doesn't prevent keyboard entry of '-' in all browsers
  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value.replace('-', ''))
  }

  // Catches invalid input before hitting the database so the user gets immediate feedback
  function validate(): string | null {
    if (!source.trim()) return 'Please enter an income source.'
    if (!amount || parseFloat(amount) <= 0) return 'Amount must be greater than 0.'
    if (!month) return 'Please select a month.'
    if (month > currentMonthISO()) return 'Income month cannot be in the future.'
    return null
  }

  // Inserts the income row and shows a confirmation without navigating away,
  // so the user can keep logging multiple income entries in the same session
  async function handleSubmit() {
    setError('')
    setSuccessInfo(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const supabase = createClient()

    // The income.month column is type date — appending '-01' stores it as the first of
    // the selected month, which is the convention used across all month-range queries
    const { error } = await supabase.from('income').insert({
      user_id: userId,
      source: source.trim(),
      amount: parseFloat(amount),
      month: `${month}-01`,
    })

    if (error) {
      setError(error.message)
      return
    }

    setSuccessInfo({ source, amount, month })
    resetForm()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Add Income</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successInfo && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Added ${parseFloat(successInfo.amount).toFixed(2)} from &quot;{successInfo.source}&quot; for {successInfo.month}.
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Source</label>
          <Input
            type="text"
            placeholder="e.g. Salary, Freelance"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            min="0"
            step="0.01"
            onChange={handleAmountChange}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Month</label>
          <DatePicker value={month} onChange={setMonth} mode="month" />
        </div>
      </div>

      <Button className="w-full" onClick={handleSubmit}>
        Add Income
      </Button>
    </div>
  )
}
