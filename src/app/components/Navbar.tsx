'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiMenu, FiX, FiSun, FiMoon, FiMap, FiAlertTriangle, FiUser, FiLogIn, FiLogOut } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';

// NavLink component for desktop navigation
const NavLink = ({ 
  href, 
  icon, 
  children, 
  active = false, 
  className = '' 
}: { 
  href: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  active?: boolean;
  className?: string;
}) => (
  <Link 
    href={href}
    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-blue-900/40 text-blue-300 border-l-2 border-blue-500 pl-2' 
        : 'text-gray-300 hover:bg-gray-800 hover:text-blue-300 hover:border-l-2 hover:border-blue-500 hover:pl-2'
    } ${className}`}
  >
    <span className="mr-2 text-blue-400">{icon}</span>
    {children}
  </Link>
);

// MobileNavLink component for mobile navigation
const MobileNavLink = ({ 
  href, 
  icon, 
  children, 
  active = false, 
  className = '' 
}: { 
  href: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  active?: boolean;
  className?: string;
}) => (
  <Link 
    href={href}
    className={`flex items-center px-3 py-3 rounded-md text-base font-medium transition-all duration-200 ${
      active 
        ? 'bg-blue-900/40 text-blue-300 border-l-2 border-blue-500 pl-2' 
        : 'text-gray-300 hover:bg-gray-800 hover:text-blue-300 hover:border-l-2 hover:border-blue-500 hover:pl-2'
    } ${className}`}
  >
    <span className="mr-3 text-blue-400">{icon}</span>
    {children}
  </Link>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  if (!mounted) return null;

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 transition-colors duration-300 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Crime Map
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-1">
              <NavLink href="/" icon={<FiMap />} active={pathname === '/'}>
                Mapa
              </NavLink>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-blue-400 hover:bg-blue-900/40 hover:text-blue-300 transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
              </button>

              {status === 'authenticated' ? (
                <>
                  <NavLink href="/profile" icon={<FiUser />}>
                    Perfil
                  </NavLink>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-blue-300 hover:border-l-2 hover:border-blue-500 hover:pl-2 transition-all duration-200"
                  >
                    <FiLogOut className="mr-2 text-blue-400" />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <NavLink 
                  href="/auth/signin" 
                  icon={<FiLogIn />}
                  className="bg-blue-600 text-white hover:bg-blue-700 border-none pl-3"
                >
                  Iniciar sesión
                </NavLink>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-blue-400 hover:bg-blue-900/40 hover:text-blue-300 transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-400 hover:bg-blue-900/40 hover:text-blue-300 focus:outline-none transition-all duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menú</span>
              {isOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden bg-gray-900 border-b border-gray-800 shadow-lg ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <MobileNavLink href="/" icon={<FiMap />} active={pathname === '/'}>
            Mapa
          </MobileNavLink>
          <MobileNavLink 
            href="/incidents" 
            icon={<FiAlertTriangle />}
            active={pathname === '/incidents'}
          >
            Incidentes
          </MobileNavLink>
          {status === 'authenticated' ? (
            <>
              <MobileNavLink href="/profile" icon={<FiUser />}>
                Perfil
              </MobileNavLink>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-blue-300 hover:border-l-2 hover:border-blue-500 hover:pl-2 transition-all duration-200"
              >
                <FiLogOut className="mr-3 text-blue-400" />
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/auth/signin"
                className="flex items-center text-gray-300 hover:bg-gray-800 hover:text-blue-300 hover:border-l-2 hover:border-blue-500 hover:pl-2 px-3 py-3 rounded-md text-base font-medium transition-all duration-200"
              >
                <FiLogIn className="mr-3 text-blue-400" />
                Iniciar sesión
              </Link>
              <Link 
                href="/auth/signup"
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 rounded-md text-base font-medium transition-all duration-200 mt-2"
              >
                <FiUser className="mr-3" />
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 
export default Navbar;