'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'

// Signs the user out and redirects to login — kept as a standalone component so it can be
// dropped into any page without duplicating the signOut logic
export default function LogoutButton() {
  const router = useRouter()

  // Clears the Supabase session from the browser before redirecting so the user
  // can't navigate back and land on a protected page with a stale session
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button variant="secondary" onClick={handleLogout}>
      Log out
    </Button>
  )
}
