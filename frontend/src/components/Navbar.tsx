'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { FiHome, FiTrendingUp, FiSearch, FiPieChart, FiStar, FiLogOut, FiUser } from 'react-icons/fi';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="glass border-b border-white/10 sticky top-0 z-50 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent hover:scale-105 transition-transform">
                        StockScope
                    </Link>

                    {/* Navigation Links */}
                    {isAuthenticated ? (
                        <div className="flex items-center gap-6">
                            <Link
                                href="/dashboard"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isActive('/dashboard')
                                        ? 'bg-primary-600 text-white'
                                        : 'text-dark-text/80 hover:bg-white/10'
                                    }`}
                            >
                                <FiHome className="w-4 h-4" />
                                <span>Dashboard</span>
                            </Link>
                            <Link
                                href="/market"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isActive('/market')
                                        ? 'bg-primary-600 text-white'
                                        : 'text-dark-text/80 hover:bg-white/10'
                                    }`}
                            >
                                <FiTrendingUp className="w-4 h-4" />
                                <span>Market</span>
                            </Link>
                            <Link
                                href="/stocks"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isActive('/stocks')
                                        ? 'bg-primary-600 text-white'
                                        : 'text-dark-text/80 hover:bg-white/10'
                                    }`}
                            >
                                <FiSearch className="w-4 h-4" />
                                <span>Stocks</span>
                            </Link>
                            <Link
                                href="/portfolio"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isActive('/portfolio')
                                        ? 'bg-primary-600 text-white'
                                        : 'text-dark-text/80 hover:bg-white/10'
                                    }`}
                            >
                                <FiPieChart className="w-4 h-4" />
                                <span>Portfolio</span>
                            </Link>
                            <Link
                                href="/watchlist"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isActive('/watchlist')
                                        ? 'bg-primary-600 text-white'
                                        : 'text-dark-text/80 hover:bg-white/10'
                                    }`}
                            >
                                <FiStar className="w-4 h-4" />
                                <span>Watchlist</span>
                            </Link>

                            {/* User Menu */}
                            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
                                <div className="flex items-center gap-2 text-dark-text/80">
                                    <FiUser className="w-4 h-4" />
                                    <span className="text-sm">{user?.username}</span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
                                >
                                    <FiLogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <Link
                                href="/login"
                                className="px-6 py-2 rounded-lg text-white hover:bg-white/10 transition"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
