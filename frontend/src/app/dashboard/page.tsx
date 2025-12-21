'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import StockCard from '@/components/StockCard';
import Link from 'next/link';
import { marketAPI, portfolioAPI, watchlistAPI } from '@/lib/api';
import { FiTrendingUp, FiPieChart, FiStar, FiArrowRight } from 'react-icons/fi';

export default function DashboardPage() {
    const [indices, setIndices] = useState<any[]>([]);
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [watchlists, setWatchlists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [indicesRes, portfoliosRes, watchlistsRes] = await Promise.all([
                marketAPI.getIndices(),
                portfolioAPI.list().catch(() => ({ data: [] })),
                watchlistAPI.list().catch(() => ({ data: [] })),
            ]);

            setIndices(indicesRes.data.indices || []);
            setPortfolios(portfoliosRes.data || []);
            setWatchlists(watchlistsRes.data || []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-900 to-dark-bg">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
                        <p className="text-dark-text/60">Welcome back! Here's your market overview</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Link href="/portfolio" className="glass rounded-xl p-6 card-hover">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-dark-text/60 text-sm">Portfolios</div>
                                <FiPieChart className="w-5 h-5 text-primary-400" />
                            </div>
                            <div className="text-3xl font-bold text-white">{portfolios.length}</div>
                            <div className="text-sm text-dark-text/60 mt-2 flex items-center gap-1">
                                Manage portfolios <FiArrowRight className="w-4 h-4" />
                            </div>
                        </Link>

                        <Link href="/watchlist" className="glass rounded-xl p-6 card-hover">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-dark-text/60 text-sm">Watchlists</div>
                                <FiStar className="w-5 h-5 text-primary-400" />
                            </div>
                            <div className="text-3xl font-bold text-white">{watchlists.length}</div>
                            <div className="text-sm text-dark-text/60 mt-2 flex items-center gap-1">
                                View watchlists <FiArrowRight className="w-4 h-4" />
                            </div>
                        </Link>

                        <Link href="/market" className="glass rounded-xl p-6 card-hover">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-dark-text/60 text-sm">Market Status</div>
                                <FiTrendingUp className="w-5 h-5 text-primary-400" />
                            </div>
                            <div className="text-3xl font-bold positive">Active</div>
                            <div className="text-sm text-dark-text/60 mt-2 flex items-center gap-1">
                                View markets <FiArrowRight className="w-4 h-4" />
                            </div>
                        </Link>
                    </div>

                    {/* Market Indices */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-white">Market Indices</h2>
                            <Link href="/market" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
                                View all <FiArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="glass rounded-xl p-6 animate-pulse">
                                        <div className="h-4 bg-white/10 rounded mb-3"></div>
                                        <div className="h-8 bg-white/10 rounded mb-2"></div>
                                        <div className="h-4 bg-white/10 rounded w-2/3"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {indices.slice(0, 4).map((index) => (
                                    <StockCard
                                        key={index.symbol}
                                        symbol={index.symbol}
                                        name={index.name}
                                        price={index.price || 0}
                                        changePercent={index.change_percent}
                                        clickable={false}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link href="/stocks" className="glass rounded-xl p-6 text-center card-hover">
                                <div className="text-primary-400 mb-3 flex justify-center">
                                    <FiTrendingUp className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">Search Stocks</h3>
                                <p className="text-sm text-dark-text/60">Find and analyze stocks</p>
                            </Link>

                            <Link href="/portfolio" className="glass rounded-xl p-6 text-center card-hover">
                                <div className="text-primary-400 mb-3 flex justify-center">
                                    <FiPieChart className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">View Portfolio</h3>
                                <p className="text-sm text-dark-text/60">Track your investments</p>
                            </Link>

                            <Link href="/watchlist" className="glass rounded-xl p-6 text-center card-hover">
                                <div className="text-primary-400 mb-3 flex justify-center">
                                    <FiStar className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">Manage Watchlist</h3>
                                <p className="text-sm text-dark-text/60">Monitor favorite stocks</p>
                            </Link>

                            <Link href="/market" className="glass rounded-xl p-6 text-center card-hover">
                                <div className="text-primary-400 mb-3 flex justify-center">
                                    <FiTrendingUp className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">Market Overview</h3>
                                <p className="text-sm text-dark-text/60">Browse market data</p>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
