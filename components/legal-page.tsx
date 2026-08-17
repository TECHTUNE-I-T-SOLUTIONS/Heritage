import Link from 'next/link'
import { PublicChrome } from '@/components/public-chrome'
import { getLegalDoc, LEGAL_SLUGS } from '@/lib/legal'

const NAV: { slug: string; label: string }[] = [
  { slug: 'terms', label: 'Terms of Service' },
  { slug: 'privacy', label: 'Privacy Policy' },
  { slug: 'refund', label: 'Refund & Cancellation' },
  { slug: 'cookies', label: 'Cookie Policy' },
]

export function LegalPage({ slug }: { slug: string }) {
  const doc = getLegalDoc(slug)
  if (!doc) return null

  return (
    <PublicChrome>
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-16 lg:px-8 lg:pt-24">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[.24em] text-accent">{doc.eyebrow}</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-6xl">{doc.title}</h1>
          <p className="mt-4 text-sm text-muted-foreground">Last updated {doc.updated}</p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">{doc.intro}</p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[220px_1fr]">
          {/* Section nav */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">Documents</p>
              <nav className="mt-4 grid gap-2">
                {NAV.map((n) => (
                  <Link
                    key={n.slug}
                    href={`/${n.slug}`}
                    className={`text-sm transition hover:text-foreground ${n.slug === slug ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Body */}
          <article className="max-w-3xl">
            {doc.sections.map((section) => (
              <section key={section.heading} className="mb-10 scroll-mt-24">
                <h2 className="font-serif text-2xl">{section.heading}</h2>
                {section.paragraphs?.map((p, i) => (
                  <p key={i} className="mt-3 leading-7 text-muted-foreground">{p}</p>
                ))}
                {section.bullets && (
                  <ul className="mt-4 grid gap-2">
                    {section.bullets.map((b, i) => (
                      <li key={i} className="flex gap-3 leading-7 text-muted-foreground">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <div className="mt-12 rounded-2xl border border-border bg-secondary/40 p-6 text-sm leading-7 text-muted-foreground">
              This document is provided for transparency and should be reviewed alongside our other policies:{' '}
              {NAV.filter((n) => n.slug !== slug).map((n, i, arr) => (
                <span key={n.slug}>
                  <Link href={`/${n.slug}`} className="text-foreground underline underline-offset-4">{n.label}</Link>
                  {i < arr.length - 1 ? ', ' : '.'}
                </span>
              ))}
            </div>
          </article>
        </div>
      </main>
    </PublicChrome>
  )
}

export { LEGAL_SLUGS }
