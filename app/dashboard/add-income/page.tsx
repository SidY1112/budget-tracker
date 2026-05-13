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
    <div>
      <BackButton />
      <h1>Add Income</h1>
      <AddIncomeForm userId={user.id} />
    </div>
  )
}
