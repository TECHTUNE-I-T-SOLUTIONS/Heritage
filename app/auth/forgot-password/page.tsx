import { redirect } from 'next/navigation'

export default function AuthForgotRedirect() {
  redirect('/forgot-password')
}
