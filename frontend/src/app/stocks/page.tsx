'use client';

import { useState } from 'react';
import EnhancedStockCard from '@/components/EnhancedStockCard';
import { stocksAPI } from '@/lib/api';
import { FiSearch } from 'react-icons/fi';

interface StockWithData {
    symbol: string;
    name: string;
    quote?: any;
    indicators?: any;
    loading?: boolean;
}

export default function StocksPage() {
    const [query, setQuery] = useState('');
    const [stocks, setStocks] = useState<StockWithData[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const fetchStockDetails = async (symbol: string) => {
        try {
            const [quoteRes, indicatorsRes] = await Promise.all([
                stocksAPI.getQuote(symbol).catch(() => ({ data: null })),
                stocksAPI.getIndicators(symbol).catch(() => ({ data: null })),
            ]);

            return {
                quote: quoteRes.data,
                indicators: indicatorsRes.data,
            };
        } catch (error) {
            console.error(`Failed to fetch details for ${symbol}:`, error);
            return { quote: null, indicators: null };
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);

        try {
            // Step 1: Get basic search results
            const response = await stocksAPI.search(query, 10); // Limit to 10
            const searchResults = response.data.results || [];

            // Step 2: Initialize stocks with loading state
            const initialStocks: StockWithData[] = searchResults.map((stock: any) => ({
                symbol: stock.symbol,
                name: stock.name || stock.longName || stock.symbol,
                loading: true,
            }));

            setStocks(initialStocks);
            setLoading(false);

            // Step 3: Fetch detailed data in batches (5 at a time)
            const batchSize = 5;
            for (let i = 0; i < initialStocks.length; i += batchSize) {
                const batch = initialStocks.slice(i, i + batchSize);

                // Fetch details for this batch in parallel
                const detailsPromises = batch.map(stock =>
                    fetchStockDetails(stock.symbol)
                );

                const detailsResults = await Promise.all(detailsPromises);

                // Update stocks with fetched data
                setStocks(prevStocks =>
                    prevStocks.map((stock, index) => {
                        const batchIndex = index - i;
                        if (batchIndex >= 0 && batchIndex < batchSize && detailsResults[batchIndex]) {
                            return {
                                ...stock,
                                quote: detailsResults[batchIndex].quote,
                                indicators: detailsResults[batchIndex].indicators,
                                loading: false,
                            };
                        }
                        return stock;
                    })
                );

                // Small delay between batches to avoid rate limiting
                if (i + batchSize < initialStocks.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (error) {
            console.error('Search failed:', error);
            setStocks([]);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-900 to-dark-bg">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Stock Search</h1>
                    <p className="text-dark-text/60">Search for stocks with comprehensive market data and technical analysis</p>
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
                            disabled={loading}
                            className="mt-4 px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Search'}
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
                            <>
                                <div className="mb-4 text-sm text-dark-text/60">
                                    Loading detailed market data and technical indicators...
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {stocks.map((stock) => (
                                        <EnhancedStockCard
                                            key={stock.symbol}
                                            symbol={stock.symbol}
                                            name={stock.name}
                                            quote={stock.quote}
                                            indicators={stock.indicators}
                                            loading={stock.loading}
                                        />
                                    ))}
                                </div>
                            </>
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
                        <p className="text-dark-text/40 text-sm mt-2">Get comprehensive market data and technical indicators</p>
                    </div>
                )}
            </div>
        </div>
    );
}
