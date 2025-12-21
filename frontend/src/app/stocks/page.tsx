'use client';

import { useState } from 'react';
import StockCard from '@/components/StockCard';
import { stocksAPI } from '@/lib/api';
import { FiSearch } from 'react-icons/fi';

export default function StocksPage() {
    const [query, setQuery] = useState('');
    const [stocks, setStocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);

        try {
            const response = await stocksAPI.search(query, 20);
            setStocks(response.data || []);
        } catch (error) {
            console.error('Search failed:', error);
            setStocks([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-900 to-dark-bg">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Stock Search</h1>
                    <p className="text-dark-text/60">Search for stocks by symbol or company name</p>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <form onSubmit={handleSearch} className="max-w-2xl">
                        <div className="relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-text/40" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search for stocks (e.g., AAPL, Microsoft, TSLA)..."
                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-dark-text/40 focus:outline-none focus:border-primary-500 transition"
                            />
                        </div>
                        <button
                            type="submit"
                            className="mt-4 px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Results */}
                {loading ? (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Searching...</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="glass rounded-xl p-6 animate-pulse">
                                    <div className="h-4 bg-white/10 rounded mb-3"></div>
                                    <div className="h-8 bg-white/10 rounded mb-2"></div>
                                    <div className="h-4 bg-white/10 rounded w-2/3"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : searched ? (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Search Results ({stocks.length})
                        </h2>
                        {stocks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {stocks.map((stock) => (
                                    <StockCard
                                        key={stock.symbol}
                                        symbol={stock.symbol}
                                        name={stock.name || stock.longName || stock.symbol}
                                        price={stock.regularMarketPrice || stock.price || 0}
                                        changePercent={stock.regularMarketChangePercent || stock.change_percent}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="glass rounded-xl p-12 text-center">
                                <p className="text-dark-text/60 text-lg">No stocks found</p>
                                <p className="text-dark-text/40 text-sm mt-2">Try searching with a different keyword</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="glass rounded-xl p-12 text-center">
                        <FiSearch className="w-16 h-16 text-dark-text/20 mx-auto mb-4" />
                        <p className="text-dark-text/60 text-lg">Start searching for stocks</p>
                        <p className="text-dark-text/40 text-sm mt-2">Enter a stock symbol or company name above</p>
                    </div>
                )}
            </div>
        </div>
    );
}
