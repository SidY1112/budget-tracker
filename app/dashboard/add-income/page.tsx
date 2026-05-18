import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import AddIncomeForm from '@/components/AddIncomeForm'
import BackButton from '@/components/BackButton'

// Verifies the session server-side and passes userId to the client form so the insert
// is always scoped to the correct user without trusting client-supplied IDs
export default async function AddIncomePage() {
  const supabase = createSupabaseServerClient()

  // Safety net in case the page is reached outside the middleware matcher
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-4">
          <BackButton />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <AddIncomeForm userId={user.id} />
        </div>
      </div>
    </div>
  )
}
