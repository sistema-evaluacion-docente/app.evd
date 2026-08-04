import { Link } from 'wouter'

/**
 * Logo component that displays the logo image and links to the home page.
 */
function Logo({ className }: { className?: string }) {
  return (
    <Link href="/">
      <img src="/logo.png" alt="Logo" className={`block h-10 w-10 ${className}`} />
    </Link>
  )
}

export default Logo
