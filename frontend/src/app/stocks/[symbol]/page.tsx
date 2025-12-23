'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { stocksAPI } from '@/lib/api';
import { FiArrowLeft, FiTrendingUp, FiDollarSign, FiActivity } from 'react-icons/fi';
import Link from 'next/link';

export default function StockDetailPage() {
    const params = useParams();
    const symbol = params.symbol as string;
    const [quote, setQuote] = useState<any>(null);
    const [info, setInfo] = useState<any>(null);
    const [indicators, setIndicators] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (symbol) {
            loadStockData();
        }
    }, [symbol]);

    const loadStockData = async () => {
        try {
            const [quoteRes, infoRes, indicatorsRes] = await Promise.all([
                stocksAPI.getQuote(symbol),
                stocksAPI.getInfo(symbol).catch(() => ({ data: null })),
                stocksAPI.getIndicators(symbol).catch(() => ({ data: null })),
            ]);

            setQuote(quoteRes.data);
            setInfo(infoRes.data);
            setIndicators(indicatorsRes.data);
        } catch (error) {
            console.error('Failed to load stock data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-900 to-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-dark-text/60">Loading stock data...</p>
                </div>
            </div>
        );
    }

    const isPositive = (quote?.change_percent || 0) >= 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-900 to-dark-bg">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Back Button */}
                <Link href="/stocks" className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 mb-6">
                    <FiArrowLeft className="w-4 h-4" />
                    <span>Back to Search</span>
                </Link>

                {/* Stock Header */}
                <div className="glass rounded-2xl p-8 mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">{symbol.toUpperCase()}</h1>
                            <p className="text-dark-text/60 text-lg">
                                {info?.longName || info?.shortName || quote?.name || 'Company Name'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <div className="text-dark-text/60 text-sm mb-1">Current Price</div>
                            <div className="text-4xl font-bold text-white">
                                ${quote?.price?.toFixed(2) || 'N/A'}
                            </div>
                            {quote?.change !== undefined && (
                                <div className={`text-lg font-semibold mt-2 ${isPositive ? 'positive' : 'negative'}`}>
                                    {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.change_percent?.toFixed(2)}%)
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="text-dark-text/60 text-sm mb-1">Market Cap</div>
                            <div className="text-2xl font-bold text-white">
                                {info?.marketCap ? `$${(info.marketCap / 1e9).toFixed(2)}B` : 'N/A'}
                            </div>
                        </div>

                        <div>
                            <div className="text-dark-text/60 text-sm mb-1">Volume</div>
                            <div className="text-2xl font-bold text-white">
                                {quote?.volume ? quote.volume.toLocaleString() : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="glass rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <FiDollarSign className="w-5 h-5 text-primary-400" />
                            <div className="text-dark-text/60 text-sm">Day High</div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            ${quote?.day_high?.toFixed(2) || 'N/A'}
                        </div>
                    </div>

                    <div className="glass rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <FiDollarSign className="w-5 h-5 text-primary-400" />
                            <div className="text-dark-text/60 text-sm">Day Low</div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            ${quote?.day_low?.toFixed(2) || 'N/A'}
                        </div>
                    </div>

                    <div className="glass rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <FiTrendingUp className="w-5 h-5 text-primary-400" />
                            <div className="text-dark-text/60 text-sm">52 Week High</div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            ${quote?.year_high?.toFixed(2) || 'N/A'}
                        </div>
                    </div>

                    <div className="glass rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <FiTrendingUp className="w-5 h-5 text-primary-400" />
                            <div className="text-dark-text/60 text-sm">52 Week Low</div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            ${quote?.year_low?.toFixed(2) || 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Technical Indicators */}
                {indicators && (
                    <div className="glass rounded-2xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <FiActivity className="w-6 h-6 text-primary-400" />
                            <h2 className="text-2xl font-bold text-white">Technical Indicators</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {indicators.indicators?.rsi_14 !== undefined && (
                                <div>
                                    <div className="text-dark-text/60 text-sm mb-1">RSI (14)</div>
                                    <div className="text-2xl font-bold text-white">
                                        {indicators.indicators.rsi_14.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-dark-text/60 mt-1">
                                        {indicators.indicators.rsi_14 > 70 ? 'Overbought' : indicators.indicators.rsi_14 < 30 ? 'Oversold' : 'Neutral'}
                                    </div>
                                </div>
                            )}

                            {indicators.indicators?.macd !== undefined && (
                                <div>
                                    <div className="text-dark-text/60 text-sm mb-1">MACD</div>
                                    <div className="text-2xl font-bold text-white">
                                        {indicators.indicators.macd.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-dark-text/60 mt-1">
                                        Signal: {indicators.indicators.signal?.toFixed(2) || 'N/A'}
                                    </div>
                                </div>
                            )}

                            {indicators.indicators?.sma_50 !== undefined && (
                                <div>
                                    <div className="text-dark-text/60 text-sm mb-1">SMA (50)</div>
                                    <div className="text-2xl font-bold text-white">
                                        ${indicators.indicators.sma_50.toFixed(2)}
                                    </div>
                                </div>
                            )}

                            {indicators.indicators?.sma_20 !== undefined && (
                                <div>
                                    <div className="text-dark-text/60 text-sm mb-1">SMA (20)</div>
                                    <div className="text-2xl font-bold text-white">
                                        ${indicators.indicators.sma_20.toFixed(2)}
                                    </div>
                                </div>
                            )}

                            {indicators.indicators?.trend !== undefined && (
                                <div>
                                    <div className="text-dark-text/60 text-sm mb-1">Trend</div>
                                    <div className={`text-2xl font-bold ${indicators.indicators.trend === 'BULLISH' ? 'positive' :
                                            indicators.indicators.trend === 'BEARISH' ? 'negative' : 'text-white'
                                        }`}>
                                        {indicators.indicators.trend}
                                    </div>
                                </div>
                            )}

                            {indicators.indicators?.bb_upper !== undefined && (
                                <div>
                                    <div className="text-dark-text/60 text-sm mb-1">Bollinger Bands</div>
                                    <div className="text-lg font-bold text-white">
                                        U: ${indicators.indicators.bb_upper.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-dark-text/60">
                                        L: ${indicators.indicators.bb_lower?.toFixed(2) || 'N/A'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Company Info */}
                {info && (
                    <div className="glass rounded-2xl p-8 mt-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Company Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {info.sector && (
                                <div>
                                    <div className="text-dark-text/60 text-sm mb-1">Sector</div>
                                    <div className="text-lg text-white">{info.sector}</div>
                                </div>
                            )}
                            {info.industry && (
                                <div>
                                    <div className="text-dark-text/60 text-sm mb-1">Industry</div>
                                    <div className="text-lg text-white">{info.industry}</div>
                                </div>
                            )}
                            {info.website && (
                                <div>
                                    <div className="text-dark-text/60 text-sm mb-1">Website</div>
                                    <a href={info.website} target="_blank" rel="noopener noreferrer" className="text-lg text-primary-400 hover:text-primary-300">
                                        {info.website}
                                    </a>
                                </div>
                            )}
                        </div>
                        {info.longBusinessSummary && (
                            <div className="mt-6">
                                <div className="text-dark-text/60 text-sm mb-2">About</div>
                                <p className="text-white/80 leading-relaxed">{info.longBusinessSummary}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
