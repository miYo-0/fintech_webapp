'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import StockCard from '@/components/StockCard';
import { marketAPI } from '@/lib/api';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

export default function MarketPage() {
    const [indices, setIndices] = useState<any[]>([]);
    const [movers, setMovers] = useState<any>({ gainers: [], losers: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMarketData();
    }, []);

    const loadMarketData = async () => {
        try {
            const [indicesRes, moversRes] = await Promise.all([
                marketAPI.getIndices(),
                marketAPI.getMovers('US', 10).catch(() => ({ data: { gainers: [], losers: [] } })),
            ]);

            setIndices(indicesRes.data.indices || []);
            setMovers(moversRes.data || { gainers: [], losers: [] });
        } catch (error) {
            console.error('Failed to load market data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-900 to-dark-bg">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">Market Overview</h1>
                        <p className="text-dark-text/60">Real-time market indices and top movers</p>
                    </div>

                    {/* Market Indices */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-4">Major Indices</h2>
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
                                {indices.map((index) => (
                                    <StockCard
                                        key={index.symbol}
                                        symbol={index.symbol}
                                        name={index.name}
                                        price={index.price || 0}
                                        changePercent={index.change_percent}
                                        clickable={true}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Top Gainers */}
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <FiTrendingUp className="w-6 h-6 text-green-400" />
                            <h2 className="text-2xl font-bold text-white">Top Gainers</h2>
                        </div>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="glass rounded-xl p-6 animate-pulse">
                                        <div className="h-4 bg-white/10 rounded mb-3"></div>
                                        <div className="h-8 bg-white/10 rounded mb-2"></div>
                                        <div className="h-4 bg-white/10 rounded w-2/3"></div>
                                    </div>
                                ))}
                            </div>
                        ) : movers.gainers && movers.gainers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {movers.gainers.slice(0, 6).map((stock: any) => (
                                    <StockCard
                                        key={stock.symbol}
                                        symbol={stock.symbol}
                                        name={stock.name || stock.symbol}
                                        price={stock.price || 0}
                                        changePercent={stock.change_percent}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="glass rounded-xl p-8 text-center">
                                <p className="text-dark-text/60">No gainers data available</p>
                            </div>
                        )}
                    </div>

                    {/* Top Losers */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <FiTrendingDown className="w-6 h-6 text-red-400" />
                            <h2 className="text-2xl font-bold text-white">Top Losers</h2>
                        </div>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="glass rounded-xl p-6 animate-pulse">
                                        <div className="h-4 bg-white/10 rounded mb-3"></div>
                                        <div className="h-8 bg-white/10 rounded mb-2"></div>
                                        <div className="h-4 bg-white/10 rounded w-2/3"></div>
                                    </div>
                                ))}
                            </div>
                        ) : movers.losers && movers.losers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {movers.losers.slice(0, 6).map((stock: any) => (
                                    <StockCard
                                        key={stock.symbol}
                                        symbol={stock.symbol}
                                        name={stock.name || stock.symbol}
                                        price={stock.price || 0}
                                        changePercent={stock.change_percent}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="glass rounded-xl p-8 text-center">
                                <p className="text-dark-text/60">No losers data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
                    </ProtectedRoute>
    );
}
