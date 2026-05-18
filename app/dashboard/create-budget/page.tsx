import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import CreateBudgetForm from '@/components/CreateBudgetForm'
import BackButton from '@/components/BackButton'

// Fetches categories server-side so the dropdown is populated before the page reaches the browser,
// avoiding a loading spinner on the client
export default async function CreateBudgetPage() {
  const supabase = createSupabaseServerClient()

  // Safety net in case this page is reached outside the middleware matcher
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
      <h1>Create Budget</h1>
      <CreateBudgetForm categories={categories ?? []} userId={user.id} />
    </div>
  )
}
