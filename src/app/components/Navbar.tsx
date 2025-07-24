'use client'
import { motion } from 'framer-motion'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FiLogIn,
  FiLogOut,
  FiMap,
  FiMessageCircle,
  FiMoon,
  FiSettings,
  FiSun
} from 'react-icons/fi'
import ClaridadLogo from './ClaridadLogo'

// NavLink component for desktop navigation
const NavLink = ({
  href,
  icon,
  children,
  active = false,
  className = '',
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  active?: boolean
  className?: string
}) => (
  <Link
    href={href}
    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-white/10 text-white'
        : 'text-gray-300 hover:bg-white/5 hover:text-white'
    } ${className}`}
  >
    <span className="mr-2 text-white">{icon}</span>
    {children}
  </Link>
)

// MobileNavLink component for mobile navigation
const MobileNavLink = ({
  href,
  icon,
  children,
  active = false,
  className = '',
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  active?: boolean
  className?: string
}) => (
  <Link
    href={href}
    className={`flex items-center px-3 py-3 rounded-md text-base font-medium transition-all duration-200 ${
      active
        ? 'bg-white/10 text-white'
        : 'text-gray-300 hover:bg-white/5 hover:text-white'
    } ${className}`}
  >
    <span className="mr-3 text-white">{icon}</span>
    {children}
  </Link>
)

interface NavbarProps {
  activeTab?: string
  onFiltersClick?: () => void
  onSettingsClick?: () => void
}

const Navbar = ({
  activeTab,
  onFiltersClick,
  onSettingsClick,
}: NavbarProps = {}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const toggleMenu = () => setIsOpen(!isOpen)
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  // Función para abrir el chat del barrio
  const openNeighborhoodChat = () => {
    // Cambiar a la tab de comunidades y luego abrir el chat
    window.dispatchEvent(new CustomEvent('openNeighborhoodChat'))
  }

  if (!mounted) return null

  // Configuración de la navbar según el tab activo (para mobile)
  const getNavbarConfig = () => {
    switch (activeTab) {
      case 'incidents':
        return {
          title: 'Claridad',
          leftAction: null,
          showThemeToggle: true,
        }
      case 'stats':
        return {
          title: 'Claridad',
          leftAction: null,
          showThemeToggle: true,
        }
      case 'communities':
        return {
          title: 'Claridad',
          leftAction: null,
          showThemeToggle: true,
        }
      case 'report':
        return {
          title: 'Claridad',
          leftAction: null,
          showThemeToggle: false,
        }
      case 'queue':
        return {
          title: 'Claridad',
          leftAction: null,
          showThemeToggle: true,
        }
      default:
        return {
          title: 'Claridad',
          leftAction: null,
          showThemeToggle: true,
        }
    }
  }

  const config = getNavbarConfig()

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        style={{
          background:
            'linear-gradient(180deg, rgba(20, 20, 20, 1) 0%, rgba(15, 15, 15, 1) 100%)',
          boxShadow: '0 1px 20px rgba(0, 0, 0, 0.5)',
        }}
        className="hidden md:block top-0 z-50 transition-colors duration-300 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <ClaridadLogo size="md" showText={true} />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-1">
                <NavLink href="/" icon={<FiMap />} active={pathname === '/'}>
                  Mapa
                </NavLink>

                {/* Botón de chat del barrio - solo para usuarios autenticados */}
                {status === 'authenticated' && (
                  <button
                    onClick={openNeighborhoodChat}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-200"
                    title="Chat del barrio"
                  >
                    <FiMessageCircle className="mr-2 text-white" />
                    Chat del Barrio
                  </button>
                )}

                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-white hover:bg-white/10 hover:text-white transition-all duration-200"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <FiSun className="w-5 h-5" />
                  ) : (
                    <FiMoon className="w-5 h-5" />
                  )}
                </button>

                {status === 'authenticated' ? (
                  <>
                    <NavLink href="/profile" icon={<FiSettings />}>
                      Configuración
                    </NavLink>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-200"
                    >
                      <FiLogOut className="mr-2 text-white" />
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <NavLink
                    href="/auth/signin"
                    icon={<FiLogIn />}
                    className="bg-white text-gray-900 hover:bg-gray-100"
                  >
                    Iniciar sesión
                  </NavLink>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <motion.nav
        initial={{ y: -64 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-[130] md:hidden backdrop-blur-lg shadow-lg"
        style={{
          background:
            'linear-gradient(180deg, rgba(20, 20, 20, 1) 0%, rgba(15, 15, 15, 1) 100%)',
          boxShadow: '0 1px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="flex items-center justify-between h-16 px-4">
          {/* Lado izquierdo - Logo de Claridad */}
          <div className="flex items-center space-x-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center"
            >
              <ClaridadLogo size="md" showText={true} />
            </motion.div>
          </div>
        </div>
      </motion.nav>
    </>
  )
}

export default Navbar
