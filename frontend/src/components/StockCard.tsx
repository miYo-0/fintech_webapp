'use client';

import Link from 'next/link';

interface StockCardProps {
    symbol: string;
    name: string;
    price: number;
    change?: number;
    changePercent?: number;
    clickable?: boolean;
}

export default function StockCard({ symbol, name, price, change, changePercent, clickable = true }: StockCardProps) {
    const isPositive = (changePercent || 0) >= 0;

    const content = (
        <div className="glass rounded-xl p-6 card-hover">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="text-lg font-bold text-white">{symbol}</div>
                    <div className="text-sm text-dark-text/60">{name}</div>
                </div>
            </div>
            <div className="mt-3">
                <div className="text-2xl font-bold text-white">
                    ${price.toFixed(2)}
                </div>
                {(change !== undefined || changePercent !== undefined) && (
                    <div className={`text-sm font-semibold mt-1 ${isPositive ? 'positive' : 'negative'}`}>
                        {change !== undefined && (
                            <span>{isPositive ? '+' : ''}{change.toFixed(2)} </span>
                        )}
                        {changePercent !== undefined && (
                            <span>({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    if (clickable) {
        return <Link href={`/stocks/${symbol}`}>{content}</Link>;
    }

    return content;
}
