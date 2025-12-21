// TypeScript type definitions

export interface Stock {
    id?: number;
    symbol: string;
    name: string;
    exchange: string;
    market: string;
    sector?: string;
    industry?: string;
    market_cap?: number;
    currency: string;
    quote?: StockQuote;
}

export interface StockQuote {
    price: number;
    change: number;
    change_percent: number;
    volume?: number;
    updated_at?: string;
    open?: number;
    high?: number;
    low?: number;
    previous_close?: number;
}

export interface HistoricalData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface TechnicalIndicators {
    sma_20?: number;
    sma_50?: number;
    sma_200?: number;
    ema_12?: number;
    ema_26?: number;
    rsi_14?: number;
    macd?: number;
    macd_signal?: number;
    macd_histogram?: number;
    bb_upper?: number;
    bb_middle?: number;
    bb_lower?: number;
    atr_14?: number;
    trend?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface User {
    id: number;
    email?: string;
    username: string;
    first_name?: string;
    last_name?: string;
    is_active: boolean;
    email_verified: boolean;
    preferred_market: string;
    theme: 'dark' | 'light';
    created_at?: string;
    last_login?: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
}

export interface Portfolio {
    id: number;
    user_id: number;
    name: string;
    description?: string;
    is_default: boolean;
    currency: string;
    created_at?: string;
    updated_at?: string;
    positions?: Position[];
    stats?: PortfolioStats;
}

export interface Position {
    id: number;
    portfolio_id: number;
    stock: Stock;
    quantity: number;
    average_price: number;
    total_cost: number;
    current_value?: number;
    gain_loss?: number;
    gain_loss_percent?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Transaction {
    id: number;
    portfolio_id: number;
    stock: Stock;
    transaction_type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    fees: number;
    total_amount: number;
    notes?: string;
    transaction_date: string;
    created_at?: string;
}

export interface PortfolioStats {
    total_value: number;
    total_cost: number;
    total_gain_loss: number;
    total_gain_loss_percent: number;
    position_count: number;
}

export interface Watchlist {
    id: number;
    user_id: number;
    name: string;
    description?: string;
    is_default: boolean;
    item_count: number;
    created_at?: string;
    updated_at?: string;
    items?: WatchlistItem[];
}

export interface WatchlistItem {
    id: number;
    watchlist_id: number;
    stock: Stock;
    notes?: string;
    alert_price_above?: number;
    alert_price_below?: number;
    added_at?: string;
}

export interface MarketIndex {
    symbol: string;
    name: string;
    price: number;
    change: number;
    change_percent: number;
    updated_at?: string;
}

export interface CompanyInfo extends Stock {
    description?: string;
    website?: string;
    employees?: number;
    country?: string;
    city?: string;
    state?: string;
    address?: string;
    phone?: string;
    enterprise_value?: number;
    ipo_date?: string;
}

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX';

export interface ChartDataPoint {
    time: string;
    value: number;
}

export interface APIError {
    error: string;
    message?: string;
}
