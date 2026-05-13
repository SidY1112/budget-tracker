import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import AddExpenseForm from '@/components/AddExpenseForm'
import BackButton from '@/components/BackButton'

// Fetches categories server-side so the dropdown is populated before the page reaches the browser,
// avoiding a loading state on the client
export default async function ExpensesPage() {
  const supabase = createSupabaseServerClient()

  // Verify the session server-side — middleware handles the redirect in most cases, but this
  // acts as a safety net if the page is rendered outside the middleware matcher
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, type, icon')
    .order('name')

  if (error) {
    console.error(error)
    return <div>Error loading categories</div>
  }

  return (
    <div>
      <BackButton />
      <h1>Add Expense</h1>
      <AddExpenseForm categories={categories ?? []} userId={user.id} />
    </div>
  )
}
