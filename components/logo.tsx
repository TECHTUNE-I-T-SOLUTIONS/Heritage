import Link from 'next/link'
import Image from 'next/image'

export function Logo({ href = '/', className = '', showText = true }: { href?: string; className?: string; showText?: boolean }) {
  const mark = (
    <Image
      src="/heritage.png"
      alt="Heritage Club"
      width={36}
      height={36}
      priority
      className="h-9 w-9 rounded-xl object-contain"
    />
  )
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {mark}
      {showText && (
        <span className="font-serif text-xl leading-none tracking-tight">
          Heritage<span className="text-accent">.</span>
        </span>
      )}
    </span>
  )
  return href ? (
    <Link href={href} aria-label="Heritage Club home" className="inline-flex">
      {content}
    </Link>
  ) : (
    content
  )
}

export default Logo
