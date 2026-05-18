'use client'

import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

// Uses browser history rather than a hardcoded route so it works correctly regardless
// of how the user arrived at the current page
export default function BackButton() {
  const router = useRouter()

  return (
    <Button variant="secondary" onClick={() => router.back()}>
      ← Back
    </Button>
  )
}
