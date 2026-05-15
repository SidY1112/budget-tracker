'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import DatePicker from '@/components/DatePicker'

type Category = {
  id: string
  name: string
  type: string
  icon: string | null
}

type SuccessInfo = {
  amount: string
  description: string
  categoryName: string
  date: string
}

type Props = {
  categories: Category[]
  userId: string
}

// Returns today's date as YYYY-MM-DD for submit-time validation — the UI cap is handled by DatePicker
function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// Handles all expense form state and submission on the client — kept separate from the server page
// so categories can be fetched server-side while form interactivity stays in the browser
export default function AddExpenseForm({ categories, userId }: Props) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [error, setError] = useState('')
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null)

  // Clears all fields after a successful insert so the user can immediately log another expense
  function resetForm() {
    setAmount('')
    setDate('')
    setDescription('')
    setCategoryId('')
    setIsRecurring(false)
  }

  // Strips the '-' character as it is typed so the field never accepts a negative value —
  // min="0" alone doesn't prevent keyboard entry of '-' in all browsers
  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value.replace('-', ''))
  }

  // Validates all three business rules before hitting the database so the user gets
  // immediate feedback without a round-trip
  function validate(): string | null {
    if (!categoryId) return 'Please select a category.'
    if (!amount || parseFloat(amount) <= 0) return 'Amount must be greater than 0.'
    if (date > todayISO()) return 'Expense date cannot be in the future.'
    return null
  }

  // Inserts the expense row and shows a confirmation without navigating away,
  // so the user can keep adding expenses in the same session
  async function handleSubmit() {
    setError('')
    setSuccessInfo(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from('expenses').insert({
      user_id: userId,
      category_id: categoryId,
      amount: parseFloat(amount),
      description: description || null,
      date,
      is_recurring: isRecurring,
    })

    if (error) {
      setError(error.message)
      return
    }

    // Resolve the category name here so the confirmation message is human-readable
    const category = categories.find((c) => c.id === categoryId)
    setSuccessInfo({
      amount,
      description,
      categoryName: category?.name ?? '',
      date,
    })
    resetForm()
  }

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successInfo && (
        <p style={{ color: 'green' }}>
          Added ${parseFloat(successInfo.amount).toFixed(2)}
          {successInfo.description ? ` for "${successInfo.description}"` : ''}
          {successInfo.categoryName ? ` in ${successInfo.categoryName}` : ''}
          {' '}on {successInfo.date}.
        </p>
      )}
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        min="0"
        step="0.01"
        onChange={handleAmountChange}
      />
      <DatePicker value={date} onChange={setDate} />
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">Select a category</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.icon ? `${cat.icon} ` : ''}{cat.name}
          </option>
        ))}
      </select>
      <label>
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
        />
        {' '}Recurring
      </label>
      <button onClick={handleSubmit}>Add Expense</button>
    </div>
  )
}
