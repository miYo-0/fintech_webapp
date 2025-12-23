'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiTrendingUp, FiTrendingDown, FiActivity, FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface EnhancedStockCardProps {
    symbol: string;
    name: string;
    quote?: any;
    indicators?: any;
    loading?: boolean;
}

export default function EnhancedStockCard({ symbol, name, quote, indicators, loading }: EnhancedStockCardProps) {
    const [showMarketStats, setShowMarketStats] = useState(false);
    const [showIndicators, setShowIndicators] = useState(false);

    const isPositive = (quote?.change_percent || 0) >= 0;

    if (loading) {
        return (
            <div className="glass rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-white/10 rounded mb-3 w-20"></div>
                <div className="h-8 bg-white/10 rounded mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
            </div>
        );
    }

    return (
        <div className="glass rounded-xl p-6 hover:border-primary-500/30 transition">
            {/* Header */}
            <Link href={`/stocks/${symbol}`}>
                <div className="mb-4 cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-sm text-primary-400 font-semibold">{symbol}</div>
                            <div className="text-white font-medium text-sm mt-1">{name}</div>
                        </div>
                        {quote && (
                            <div className={`text-sm font-semibold ${isPositive ? 'positive' : 'negative'}`}>
                                {isPositive ? '+' : ''}{quote.change_percent?.toFixed(2)}%
                            </div>
                        )}
                    </div>

                    {quote && (
                        <div className="text-2xl font-bold text-white">
                            ${quote.price?.toFixed(2)}
                        </div>
                    )}
                </div>
            </Link>

            {/* Market Stats Section */}
            {quote && (
                <>
                    <button
                        onClick={() => setShowMarketStats(!showMarketStats)}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition"
                    >
                        <span className="text-sm text-dark-text/60">Market Stats</span>
                        {showMarketStats ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                    </button>

                    {showMarketStats && (
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            {quote.volume && (
                                <div>
                                    <div className="text-dark-text/40">Volume</div>
                                    <div className="text-white font-medium">{quote.volume.toLocaleString()}</div>
                                </div>
                            )}
                            {quote.market_cap && (
                                <div>
                                    <div className="text-dark-text/40">Market Cap</div>
                                    <div className="text-white font-medium">${(quote.market_cap / 1e9).toFixed(2)}B</div>
                                </div>
                            )}
                            {quote.high && (
                                <div>
                                    <div className="text-dark-text/40">Day High</div>
                                    <div className="text-white font-medium">${quote.high?.toFixed(2)}</div>
                                </div>
                            )}
                            {quote.low && (
                                <div>
                                    <div className="text-dark-text/40">Day Low</div>
                                    <div className="text-white font-medium">${quote.low?.toFixed(2)}</div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Technical Indicators Section */}
            {indicators?.indicators && (
                <>
                    <button
                        onClick={() => setShowIndicators(!showIndicators)}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition mt-2"
                    >
                        <span className="text-sm text-dark-text/60 flex items-center gap-2">
                            <FiActivity className="w-4 h-4" />
                            Technical Indicators
                        </span>
                        {showIndicators ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                    </button>

                    {showIndicators && (
                        <div className="mt-3 space-y-2 text-sm">
                            {indicators.indicators.rsi_14 !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-dark-text/40">RSI (14)</span>
                                    <span className="text-white font-medium">
                                        {indicators.indicators.rsi_14.toFixed(2)}
                                        <span className="text-xs ml-2 text-dark-text/60">
                                            {indicators.indicators.rsi_14 > 70 ? 'Overbought' :
                                                indicators.indicators.rsi_14 < 30 ? 'Oversold' : 'Neutral'}
                                        </span>
                                    </span>
                                </div>
                            )}
                            {indicators.indicators.macd !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-dark-text/40">MACD</span>
                                    <span className="text-white font-medium">{indicators.indicators.macd.toFixed(2)}</span>
                                </div>
                            )}
                            {indicators.indicators.sma_50 !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-dark-text/40">SMA (50)</span>
                                    <span className="text-white font-medium">${indicators.indicators.sma_50.toFixed(2)}</span>
                                </div>
                            )}
                            {indicators.indicators.trend && (
                                <div className="flex justify-between items-center">
                                    <span className="text-dark-text/40">Trend</span>
                                    <span className={`font-semibold flex items-center gap-1 ${indicators.indicators.trend === 'BULLISH' ? 'positive' :
                                            indicators.indicators.trend === 'BEARISH' ? 'negative' : 'text-white'
                                        }`}>
                                        {indicators.indicators.trend === 'BULLISH' && <FiTrendingUp className="w-4 h-4" />}
                                        {indicators.indicators.trend === 'BEARISH' && <FiTrendingDown className="w-4 h-4" />}
                                        {indicators.indicators.trend}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
