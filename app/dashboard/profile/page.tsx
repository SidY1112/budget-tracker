import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import ProfileForm from '@/components/ProfileForm'
import BackButton from '@/components/BackButton'

// Fetches the profile row server-side so the form is pre-populated before it reaches the browser,
// avoiding a visible flash of empty fields on load
export default async function ProfilePage() {
  const supabase = createSupabaseServerClient()

  // Safety net in case this page is reached outside the middleware matcher
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // maybeSingle() returns null rather than an error when no profile row exists yet,
  // which can happen if the row was not created during signup
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, age, location, marital_status, kids')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error(error)
    return <div>Error loading profile</div>
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-4">
          <BackButton />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <ProfileForm
            profile={profile ?? {}}
            email={user.email ?? ''}
            userId={user.id}
          />
        </div>
      </div>
    </div>
  )
}
