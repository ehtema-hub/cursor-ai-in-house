interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    </header>
  )
}
