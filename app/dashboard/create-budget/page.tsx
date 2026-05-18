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
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-4">
          <BackButton />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <CreateBudgetForm categories={categories ?? []} userId={user.id} />
        </div>
      </div>
    </div>
  )
}
