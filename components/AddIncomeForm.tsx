'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

type Props = {
  userId: string
}

type SuccessInfo = {
  source: string
  amount: string
  month: string
}

// Returns the current month as YYYY-MM, used to cap the month picker and validate submissions
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
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successInfo && (
        <p style={{ color: 'green' }}>
          Added ${parseFloat(successInfo.amount).toFixed(2)} from &quot;{successInfo.source}&quot; for {successInfo.month}.
        </p>
      )}
      <input
        type="text"
        placeholder="Source (e.g. Salary, Freelance)"
        value={source}
        onChange={(e) => setSource(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        min="0"
        step="0.01"
        onChange={handleAmountChange}
      />
      <input
        type="month"
        value={month}
        max={currentMonthISO()}
        onChange={(e) => setMonth(e.target.value)}
      />
      <button onClick={handleSubmit}>Add Income</button>
    </div>
  )
}
