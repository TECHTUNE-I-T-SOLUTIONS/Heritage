import { notFound } from 'next/navigation'
import { PublicPage as PublicPageView } from '@/components/public-page'
import { LegalPage } from '@/components/legal-page'
import { LEGAL_SLUGS } from '@/lib/legal'

const pages = ['about', 'curriculum', 'pricing', 'contact', 'faq', 'membership', 'explore']
const legal = LEGAL_SLUGS as readonly string[]

export function generateStaticParams() {
  return [...pages, ...legal].map((slug) => ({ slug }))
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (legal.includes(slug)) return <LegalPage slug={slug} />
  if (!pages.includes(slug)) notFound()
  return <PublicPageView slug={slug} />
}
