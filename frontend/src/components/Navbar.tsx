'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import {
    FiHome,
    FiTrendingUp,
    FiSearch,
    FiPieChart,
    FiStar,
    FiLogOut,
    FiUser,
    FiMenu,
    FiX,
} from 'react-icons/fi';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path: string) => pathname === path;

    const NavLink = ({
        href,
        icon: Icon,
        label,
    }: {
        href: string;
        icon: any;
        label: string;
    }) => (
        <Link
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition ${isActive(href)
                    ? 'bg-primary-600 text-white'
                    : 'text-dark-text/80 hover:bg-white/10'
                }`}
        >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
        </Link>
    );

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-lg">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="flex h-14 items-center justify-between">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent"
                    >
                        StockScope
                    </Link>

                    {/* Desktop navigation */}
                    {isAuthenticated && (
                        <div className="hidden md:flex items-center gap-4">
                            <NavLink href="/dashboard" icon={FiHome} label="Dashboard" />
                            <NavLink href="/market" icon={FiTrendingUp} label="Market" />
                            <NavLink href="/stocks" icon={FiSearch} label="Stocks" />
                            <NavLink href="/portfolio" icon={FiPieChart} label="Portfolio" />
                            <NavLink href="/watchlist" icon={FiStar} label="Watchlist" />

                            <div className="ml-4 flex items-center gap-3 border-l border-white/10 pl-4">
                                <div className="flex items-center gap-2 text-dark-text/80">
                                    <FiUser className="h-4 w-4" />
                                    <span className="text-sm">{user?.username}</span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 rounded-lg bg-red-600/20 px-3 py-2 text-red-400 hover:bg-red-600/30 transition"
                                >
                                    <FiLogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Desktop auth buttons */}
                    {!isAuthenticated && (
                        <div className="hidden md:flex items-center gap-3">
                            <Link
                                href="/login"
                                className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-600/30 hover:from-primary-600 hover:to-primary-700 transition"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden text-white"
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-white/10 bg-black/80 backdrop-blur-lg">
                    <div className="flex flex-col gap-2 px-4 py-4">
                        {isAuthenticated ? (
                            <>
                                <NavLink href="/dashboard" icon={FiHome} label="Dashboard" />
                                <NavLink href="/market" icon={FiTrendingUp} label="Market" />
                                <NavLink href="/stocks" icon={FiSearch} label="Stocks" />
                                <NavLink href="/portfolio" icon={FiPieChart} label="Portfolio" />
                                <NavLink href="/watchlist" icon={FiStar} label="Watchlist" />

                                <div className="mt-3 border-t border-white/10 pt-3">
                                    <div className="mb-2 flex items-center gap-2 text-dark-text/80">
                                        <FiUser className="h-4 w-4" />
                                        <span className="text-sm">{user?.username}</span>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600/20 px-4 py-3 text-red-400 hover:bg-red-600/30 transition"
                                    >
                                        <FiLogOut className="h-4 w-4" />
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="my-2 h-px w-full bg-white/10" />

                                {/* Login – clearly visible */}
                                <Link
                                    href="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="
                    flex items-center justify-center
                    rounded-xl
                    border border-white/20
                    bg-white/5
                    px-4 py-3
                    text-sm font-medium text-white
                    hover:bg-white/10
                    transition
                  "
                                >
                                    Login
                                </Link>

                                {/* Get Started – primary CTA */}
                                <Link
                                    href="/register"
                                    onClick={() => setMobileOpen(false)}
                                    className="
                    flex items-center justify-center
                    rounded-xl
                    bg-gradient-to-r from-primary-500 to-primary-600
                    px-4 py-3
                    text-sm font-semibold text-white
                    shadow-lg shadow-primary-600/30
                    hover:from-primary-600 hover:to-primary-700
                    transition
                  "
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
