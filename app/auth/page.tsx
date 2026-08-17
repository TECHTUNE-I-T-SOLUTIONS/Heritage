import { redirect } from 'next/navigation'

// Canonical sign-in lives at /login.
export default function AuthRedirect() {
  redirect('/login')
}
