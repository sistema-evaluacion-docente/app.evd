type HeaderPageProps = {
  title: string
  children?: React.ReactNode
  icon?: React.ReactNode
}

/**
 * HeaderPage component is used to display a header with a title, an optional icon, and optional children elements.
 *
 * @param {HeaderPageProps} props - The properties for the HeaderPage component.
 * @param {string} props.title - The title to be displayed in the header.
 * @param {React.ReactNode} [props.children] - Optional children elements to be displayed in the header.
 * @param {React.ReactNode} [props.icon] - Optional icon to be displayed next to the title.
 * @returns {JSX.Element} The rendered HeaderPage component.
 */
function HeaderPage({ title, children, icon }: HeaderPageProps) {
  return (
    <header>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-bold">{title}</h2>
        </div>

        {children}
      </div>
    </header>
  )
}

export default HeaderPage
