'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import DatePicker from '@/components/DatePicker'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

type Category = {
  id: string
  name: string
  type: string
  icon: string | null
}

type Props = {
  categories: Category[]
  userId: string
}

type Duration = 'none' | '1' | '3' | '6' | '12' | 'custom'

type SuccessInfo = {
  categoryName: string
  amount: string
  wasUpdate: boolean
}

// Returns the first day of the current month as YYYY-MM-01 — the convention used across month columns in this schema
function currentMonthISO() {
  return new Date().toISOString().slice(0, 7) + '-01'
}

// Returns tomorrow as YYYY-MM-DD — used as the DatePicker min and the submit-time fence for custom expiration
function tomorrowISO() {
  // UTC methods keep the arithmetic in UTC so .toISOString() doesn't shift the date for non-UTC timezones
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

// Centralises expiration arithmetic so both the insert and update paths use the same source of truth
function calcExpirationDate(duration: Duration, customDate: string): string | null {
  if (duration === 'none') return null
  if (duration === 'custom') return customDate || null
  // UTC methods keep the arithmetic in UTC so .toISOString() doesn't shift the date for non-UTC timezones
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() + parseInt(duration, 10))
  return d.toISOString().slice(0, 10)
}

// Handles all budget form state and submission on the client — kept separate from the server page
// so categories can be fetched server-side while form interactivity stays in the browser
export default function CreateBudgetForm({ categories, userId }: Props) {
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [duration, setDuration] = useState<Duration>('none')
  const [customDate, setCustomDate] = useState('')
  const [error, setError] = useState('')
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null)

  // Non-null when an existing budget was found during submit — drives the conflict prompt UI
  const [conflictBudgetId, setConflictBudgetId] = useState<string | null>(null)
  const [conflictCategoryName, setConflictCategoryName] = useState('')

  // Clears all fields and conflict state so the form is ready for the next entry
  function resetForm() {
    setCategoryId('')
    setAmount('')
    setDuration('none')
    setCustomDate('')
    setConflictBudgetId(null)
    setConflictCategoryName('')
  }

  // Strips the '-' character as it is typed so the field never accepts a negative value —
  // min="0" alone doesn't prevent keyboard entry of '-' in all browsers
  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value.replace('-', ''))
  }

  // Catches all business rule violations before hitting the database
  function validate(): string | null {
    if (!categoryId) return 'Please select a category.'
    if (!amount || parseFloat(amount) <= 0) return 'Amount must be greater than 0.'
    if (duration === 'custom' && (!customDate || customDate < tomorrowISO()))
      return 'Expiration date must be in the future.'
    return null
  }

  // Phase 1: validates, checks for a conflicting row, and either inserts or surfaces the conflict prompt
  async function handleSubmit() {
    setError('')
    setSuccessInfo(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const supabase = createClient()
    const expirationDate = calcExpirationDate(duration, customDate)

    // Check for an existing budget for this (user, category) pair before attempting insert —
    // the unique constraint would reject the insert anyway, but this gives a friendlier prompt
    const { data: existing } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .maybeSingle()

    if (existing) {
      const category = categories.find((c) => c.id === categoryId)
      setConflictBudgetId(existing.id)
      setConflictCategoryName(category?.name ?? '')
      return
    }

    const { error: insertError } = await supabase.from('budgets').insert({
      user_id: userId,
      category_id: categoryId,
      monthly_limit: parseFloat(amount),
      expiration_date: expirationDate,
      month: currentMonthISO(),
    })

    if (insertError) {
      setError(insertError.message)
      return
    }

    const category = categories.find((c) => c.id === categoryId)
    setSuccessInfo({ categoryName: category?.name ?? '', amount, wasUpdate: false })
    resetForm()
  }

  // Phase 2: executes the update after the user confirms the conflict prompt —
  // uses the id captured in phase 1 to target the exact row without re-querying
  async function handleUpdate() {
    if (!conflictBudgetId) return
    setError('')

    const supabase = createClient()
    const expirationDate = calcExpirationDate(duration, customDate)

    const { error: updateError } = await supabase
      .from('budgets')
      .update({
        monthly_limit: parseFloat(amount),
        expiration_date: expirationDate,
      })
      .eq('id', conflictBudgetId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccessInfo({ categoryName: conflictCategoryName, amount, wasUpdate: true })
    resetForm()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Create Budget</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successInfo && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Budget {successInfo.wasUpdate ? 'updated' : 'created'} for {successInfo.categoryName} with
          a monthly limit of ${parseFloat(successInfo.amount).toFixed(2)}.
        </div>
      )}

      {/* Conflict prompt replaces the form until the user confirms or cancels */}
      {conflictBudgetId ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            A budget for <span className="font-medium">{conflictCategoryName}</span> already exists.
            Do you want to update it with the new limit?
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleUpdate}>
              Yes, update it
            </Button>
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Monthly limit</label>
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
            <label className="block text-sm font-medium text-gray-700">Expiration</label>
            <Select value={duration} onChange={(e) => setDuration(e.target.value as Duration)}>
              <option value="none">No expiration</option>
              <option value="1">1 month</option>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
              <option value="custom">Custom date</option>
            </Select>
          </div>

          {/* Only shown when the user picks a custom end date */}
          {duration === 'custom' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Expiration date</label>
              <DatePicker
                value={customDate}
                onChange={setCustomDate}
                min={tomorrowISO()}
                max={null}
              />
            </div>
          )}

          <Button className="w-full" onClick={handleSubmit}>
            Create Budget
          </Button>
        </div>
      )}
    </div>
  )
}
