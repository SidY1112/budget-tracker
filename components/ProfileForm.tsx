'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

type Profile = {
  full_name?: string | null
  age?: number | null
  location?: string | null
  marital_status?: string | null
  kids?: number | null
}

type Props = {
  profile: Profile
  email: string
  userId: string
}

// Handles all profile form state and submission on the client — kept separate from the server page
// so the profile row can be fetched server-side while form interactivity stays in the browser
export default function ProfileForm({ profile, email, userId }: Props) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [age, setAge] = useState(profile.age?.toString() ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [maritalStatus, setMaritalStatus] = useState(profile.marital_status ?? '')
  const [kids, setKids] = useState(profile.kids?.toString() ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Strips '-' on every keystroke so numeric fields never accept a negative value
  function handleNumericChange(
    setter: (v: string) => void
  ): (e: React.ChangeEvent<HTMLInputElement>) => void {
    return (e) => setter(e.target.value.replace('-', ''))
  }

  // Uses upsert instead of update so the save works even if the profile row was never created
  // during signup — id is required by the upsert to identify the target row
  async function handleSave() {
    setError('')
    setSuccess(false)

    const supabase = createClient()
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: fullName.trim() || null,
      age: age ? parseInt(age, 10) : null,
      location: location.trim() || null,
      marital_status: maritalStatus || null,
      kids: kids ? parseInt(kids, 10) : null,
    })

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Profile saved successfully.
        </div>
      )}

      <div className="space-y-4">
        {/* Email is read-only — it lives in Supabase auth, not the profiles table */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <Input
            type="email"
            value={email}
            disabled
            className="cursor-not-allowed bg-gray-50 text-gray-400"
          />
          <p className="text-xs text-gray-400">Email is managed through your account settings.</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <Input
            type="text"
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Age</label>
          <Input
            type="number"
            placeholder="Your age"
            value={age}
            min="0"
            max="150"
            onChange={handleNumericChange(setAge)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <Input
            type="text"
            placeholder="City, Country"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Marital Status</label>
          <Select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)}>
            <option value="">Select status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Number of Kids</label>
          <Input
            type="number"
            placeholder="0"
            value={kids}
            min="0"
            onChange={handleNumericChange(setKids)}
          />
        </div>
      </div>

      <Button className="w-full" onClick={handleSave}>
        Save Profile
      </Button>
    </div>
  )
}
