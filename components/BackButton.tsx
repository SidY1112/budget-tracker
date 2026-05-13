'use client'

import { useRouter } from 'next/navigation'

// Uses browser history rather than a hardcoded route so it works correctly regardless
// of how the user arrived at the current page
export default function BackButton() {
  const router = useRouter()

  return <button onClick={() => router.back()}>Back</button>
}
