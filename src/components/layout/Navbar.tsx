import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react'
import {
  Menu,
  Search,
  X,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react'

export interface NavLink {
  label: string
  href: string
  isActive?: boolean
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

export interface UserMenuItem {
  label: string
  href?: string
  icon?: 'profile' | 'settings' | 'logout'
  onClick?: () => void
}

export interface NavbarProps {
  brandName: string
  brandLogo?: string
  links: NavLink[]
  userAvatarUrl: string
  userName: string
  userMenuItems?: UserMenuItem[]
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  className?: string
}

const MENU_ICONS = {
  profile: User,
  settings: Settings,
  logout: LogOut,
} as const

const DEFAULT_USER_MENU: UserMenuItem[] = [
  { label: 'Profile', href: '#profile', icon: 'profile' },
  { label: 'Settings', href: '#settings', icon: 'settings' },
  { label: 'Sign out', href: '#signout', icon: 'logout' },
]

interface NavLinksProps {
  links: NavLink[]
  layout: 'desktop' | 'mobile'
  onNavigate?: () => void
}

function NavLinks({ links, layout, onNavigate }: NavLinksProps) {
  const isMobile = layout === 'mobile'

  return (
    <ul
      className={
        isMobile
          ? 'flex flex-col gap-1'
          : 'hidden items-center gap-1 lg:flex'
      }
      role="list"
    >
      {links.map((link) => (
        <li key={link.href + link.label}>
          <a
            href={link.href}
            onClick={(event) => {
              link.onClick?.(event)
              onNavigate?.()
            }}
            data-testid={link.label === 'Products' ? 'nav-link-products' : undefined} // Add data-testid directly
            aria-current={link.isActive ? 'page' : undefined}
            className={`group relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              link.isActive
                ? 'font-semibold text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            } ${isMobile ? 'block w-full px-4 py-3 text-base' : ''}`}
          >
            {link.label}
            {/* Sliding underline — visible on active desktop links */}
            {!isMobile && (
              <span
                aria-hidden="true"
                className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-indigo-600 transition-all duration-300 ease-in-out ${
                  link.isActive
                    ? 'scale-x-100 opacity-100'
                    : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-60'
                }`}
              />
            )}
            {isMobile && link.isActive && (
              <span
                aria-hidden="true"
                className="absolute inset-y-1 left-0 w-1 rounded-full bg-indigo-600"
              />
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}

interface SearchBarProps {
  placeholder: string
  onSearch?: (query: string) => void
  id: string
  className?: string
}

function SearchBar({ placeholder, onSearch, id, className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch?.(query.trim())
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={`relative ${className}`}
    >
      <label htmlFor={id} className="sr-only">
        Search
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      />
      <input
        id={id}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-300 ease-in-out focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </form>
  )
}

interface UserDropdownProps {
  avatarUrl: string
  userName: string
  menuItems: UserMenuItem[]
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  menuId: string
  buttonId: string
}

function UserDropdown({
  avatarUrl,
  userName,
  menuItems,
  isOpen,
  onToggle,
  onClose,
  menuId,
  buttonId,
}: UserDropdownProps) {
  return (
    <div className="relative">
      <button
        id={buttonId}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={`${userName} account menu`}
        className="flex items-center gap-2 rounded-full p-1 transition-all duration-300 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <img
          src={avatarUrl}
          alt=""
          aria-hidden="true"
          className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
          width={36}
          height={36}
        />
        <span className="hidden text-sm font-medium text-gray-700 md:inline">
          {userName}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`hidden h-4 w-4 text-gray-500 transition-transform duration-300 ease-in-out md:block ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        id={menuId}
        role="menu"
        aria-labelledby={buttonId}
        className={`absolute right-0 z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition-all duration-300 ease-in-out ${
          isOpen
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">{userName}</p>
          <p className="text-xs text-gray-500">Account settings</p>
        </div>
        <ul className="py-1" role="none">
          {menuItems.map((item) => {
            const Icon = item.icon ? MENU_ICONS[item.icon] : null
            return (
              <li key={item.label} role="none">
                <a
                  href={item.href ?? '#'}
                  role="menuitem"
                  onClick={(event) => {
                    if (item.onClick) {
                      event.preventDefault()
                      item.onClick()
                    }
                    onClose()
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors duration-300 ease-in-out hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  {Icon && <Icon aria-hidden="true" className="h-4 w-4" />}
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  links: NavLink[]
  searchId: string
  searchPlaceholder: string
  onSearch?: (query: string) => void
  drawerId: string
}

function MobileDrawer({
  isOpen,
  onClose,
  links,
  searchId,
  searchPlaceholder,
  onSearch,
  drawerId,
}: MobileDrawerProps) {
  return (
    <>
      {/* Backdrop — fades in behind the drawer */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-gray-900/40 transition-opacity duration-300 ease-in-out lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Side drawer — slides in from the right on mobile/tablet */}
      <div
        id={drawerId}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
          <span className="text-lg font-semibold text-gray-900">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-2 text-gray-600 transition-colors duration-300 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <SearchBar
            id={searchId}
            placeholder={searchPlaceholder}
            onSearch={(query) => {
              onSearch?.(query)
              onClose()
            }}
            className="mb-6"
          />
          <NavLinks links={links} layout="mobile" onNavigate={onClose} />
        </div>
      </div>
    </>
  )
}

export function Navbar({
  brandName,
  brandLogo,
  links,
  userAvatarUrl,
  userName,
  userMenuItems = DEFAULT_USER_MENU,
  searchPlaceholder = 'Search products, brands…',
  onSearch,
  className = '',
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const navRef = useRef<HTMLElement>(null)
  const baseId = useId()
  const searchId = `${baseId}-search`
  const mobileSearchId = `${baseId}-mobile-search`
  const dropdownId = `${baseId}-dropdown`
  const dropdownButtonId = `${baseId}-dropdown-button`
  const drawerId = `${baseId}-drawer`

  // Scroll listener — toggles shadow/border when page scrolls past threshold
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  return (
    <header className={`sticky top-0 z-50 ${className}`}>
      <nav
        ref={navRef}
        aria-label="Main navigation"
        data-testid="main-navbar"
        className={`border-b backdrop-blur-md transition-all duration-300 ease-in-out ${
          isScrolled
            ? 'border-gray-200/80 bg-white/90 shadow-md'
            : 'border-transparent bg-white/80 shadow-none'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:gap-8">
          {/* Left — brand identity */}
          <a
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-lg transition-opacity duration-300 ease-in-out hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {brandLogo ? (
              <img
                src={brandLogo}
                alt=""
                aria-hidden="true"
                className="h-8 w-8 rounded-lg object-cover"
                width={32}
                height={32}
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white"
              >
                {brandName.charAt(0)}
              </span>
            )}
            <span className="text-lg font-bold tracking-tight text-gray-900">
              {brandName}
            </span>
          </a>

          {/* Center — desktop links + search (hidden below lg) */}
          <div className="hidden flex-1 items-center justify-center gap-6 lg:flex">
            <NavLinks links={links} layout="desktop" />
            <SearchBar
              id={searchId}
              placeholder={searchPlaceholder}
              onSearch={onSearch}
              className="w-64 xl:w-80"
            />
          </div>

          {/* Right — user menu + hamburger toggle */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <UserDropdown
              avatarUrl={userAvatarUrl}
              userName={userName}
              menuItems={userMenuItems}
              isOpen={isDropdownOpen}
              onToggle={() => {
                setIsDropdownOpen((prev) => !prev)
                setIsMobileMenuOpen(false)
              }}
              onClose={() => setIsDropdownOpen(false)}
              menuId={dropdownId}
              buttonId={dropdownButtonId}
            />

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen((prev) => !prev)
                setIsDropdownOpen(false)
              }}
              aria-expanded={isMobileMenuOpen}
              aria-controls={drawerId}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="rounded-lg p-2 text-gray-600 transition-all duration-300 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 lg:hidden"
            >
              {isMobileMenuOpen ? (
                <X aria-hidden="true" className="h-6 w-6" />
              ) : (
                <Menu aria-hidden="true" className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={links}
        searchId={mobileSearchId}
        searchPlaceholder={searchPlaceholder}
        onSearch={onSearch}
        drawerId={drawerId}
      />
    </header>
  )
}
