import { Link } from 'wouter'

/**
 * Logo component that displays the logo image and links to the home page.
 */
function Logo() {
  return (
    <Link href="/">
      <img src="/logo.png" alt="Logo" className="block w-10 h-10" />
    </Link>
  )
}

export default Logo
