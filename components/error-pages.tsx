import Link from 'next/link'
import { AlertTriangle, XCircle, Clock, Home, ArrowRight } from 'lucide-react'

interface ErrorPageProps {
  code: number
  title: string
  description: string
  showHomeLink?: boolean
}

export function ErrorPage({ code, title, description, showHomeLink = true }: ErrorPageProps) {
  const getIcon = () => {
    switch (code) {
      case 409:
        return <Clock className="h-10 w-10 text-amber-500" />
      case 500:
        return <AlertTriangle className="h-10 w-10 text-destructive" />
      case 403:
        return <XCircle className="h-10 w-10 text-destructive" />
      default:
        return <AlertTriangle className="h-10 w-10 text-muted-foreground" />
    }
  }

  const getBgColor = () => {
    switch (code) {
      case 409:
        return 'bg-amber-500/10'
      case 500:
        return 'bg-destructive/10'
      case 403:
        return 'bg-destructive/10'
      default:
        return 'bg-muted'
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className={`mb-8 inline-flex h-24 w-24 items-center justify-center rounded-full border border-border ${getBgColor()}`}>
          {getIcon()}
        </div>
        <div className="mb-4 font-mono text-sm text-muted-foreground">Error {code}</div>
        <h1 className="mb-4 font-serif text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mb-8 text-muted-foreground">{description}</p>
        {showHomeLink && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            <Home className="h-4 w-4" />
            Back to Home
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  )
}

export function ConflictError() {
  return (
    <ErrorPage
      code={409}
      title="Conflict"
      description="The request could not be completed due to a conflict with the current state of the resource. Please refresh and try again."
    />
  )
}

export function ForbiddenError() {
  return (
    <ErrorPage
      code={403}
      title="Access Denied"
      description="You don't have permission to access this resource. Please contact your administrator if you believe this is an error."
    />
  )
}
