import { redirect } from 'next/navigation'

// Canonical enrollment lives at /enroll.
export default function AuthSignupRedirect() {
  redirect('/enroll')
}
