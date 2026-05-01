import Link from 'next/link'

const footerLinks = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
  { name: 'GDPR', href: '/gdpr' },
]

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-serif font-bold text-primary">மொழி</span>
            <span className="text-lg font-serif font-semibold text-foreground">Mozhi</span>
          </div>
          
          <nav className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Mozhi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
