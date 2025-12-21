'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiTrendingUp, FiSearch, FiBarChart2, FiDollarSign } from 'react-icons/fi';
import { marketAPI } from '@/lib/api';
import type { MarketIndex } from '@/types';

export default function HomePage() {
    const [indices, setIndices] = useState<MarketIndex[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMarketData();
    }, []);

    const loadMarketData = async () => {
        try {
            const response = await marketAPI.getIndices();
            setIndices(response.data.indices || []);
        } catch (error) {
            console.error('Failed to load indices:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-900 to-dark-bg">
            {/* Hero Section */}

            <main className="max-w-7xl mx-auto px-6 py-16">
                {/* Hero */}
                <div className="text-center mb-16 animate-fade-in">
                    <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-primary-200 to-white bg-clip-text text-transparent">
                        Advanced Stock Market Analysis
                    </h1>
                    <p className="text-xl text-dark-text/80 mb-8 max-w-3xl mx-auto">
                        Real-time market data, powerful screeners, technical analysis, and portfolio tracking - all in one beautiful platform
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/register" className="px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition transform hover:scale-105">
                            Start Free Trial
                        </Link>
                        <Link href="/market" className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/20 transition">
                            Explore Markets
                        </Link>
                    </div>
                </div>

                {/* Market Indices */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold mb-6 text-white">Market Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {loading ? (
                            <>
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="glass rounded-xl p-6 animate-pulse">
                                        <div className="h-4 bg-white/10 rounded mb-3"></div>
                                        <div className="h-8 bg-white/10 rounded mb-2"></div>
                                        <div className="h-4 bg-white/10 rounded w-2/3"></div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            indices.map((index) => (
                                <div key={index.symbol} className="glass rounded-xl p-6 card-hover">
                                    <div className="text-sm text-dark-text/60 mb-1">{index.name}</div>
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {index.price?.toFixed(2) || 'N/A'}
                                    </div>
                                    <div className={`text-sm font-semibold ${(index.change_percent || 0) >= 0 ? 'positive' : 'negative'
                                        }`}>
                                        {(index.change_percent || 0) >= 0 ? '+' : ''}
                                        {index.change_percent?.toFixed(2) || '0.00'}%
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FeatureCard
                        icon={<FiSearch className="w-8 h-8" />}
                        title="Stock Screener"
                        description="Filter thousands of stocks with custom criteria and technical indicators"
                    />
                    <FeatureCard
                        icon={<FiBarChart2 className="w-8 h-8" />}
                        title="Technical Analysis"
                        description="Advanced charts with RSI, MACD, Bollinger Bands, and more"
                    />
                    <FeatureCard
                        icon={<FiDollarSign className="w-8 h-8" />}
                        title="Portfolio Tracking"
                        description="Monitor your investments with real-time P&L calculations"
                    />
                    <FeatureCard
                        icon={<FiTrendingUp className="w-8 h-8" />}
                        title="Market Insights"
                        description="Stay updated with top gainers, losers, and market trends"
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-24 py-12 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 text-center text-dark-text/60">
                    <p>&copy; 2024 StockScope. Built for serious traders and investors.</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="glass rounded-xl p-6 card-hover">
            <div className="text-primary-400 mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-dark-text/70 text-sm">{description}</p>
        </div>
    );
}
