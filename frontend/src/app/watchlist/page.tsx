'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { watchlistAPI } from '@/lib/api';
import StockCard from '@/components/StockCard';
import { FiPlus, FiStar, FiTrash2 } from 'react-icons/fi';

export default function WatchlistPage() {
    const [watchlists, setWatchlists] = useState<any[]>([]);
    const [selectedWatchlist, setSelectedWatchlist] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newWatchlistName, setNewWatchlistName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadWatchlists();
    }, []);

    const loadWatchlists = async () => {
        try {
            const response = await watchlistAPI.list();
            const lists = response.data || [];
            setWatchlists(lists);
            if (lists.length > 0 && !selectedWatchlist) {
                loadWatchlistDetails(lists[0].id);
            }
        } catch (error) {
            console.error('Failed to load watchlists:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadWatchlistDetails = async (id: number) => {
        try {
            const response = await watchlistAPI.get(id);
            setSelectedWatchlist(response.data);
        } catch (error) {
            console.error('Failed to load watchlist details:', error);
        }
    };

    const handleCreateWatchlist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWatchlistName.trim()) return;

        setCreating(true);
        try {
            await watchlistAPI.create({ name: newWatchlistName });
            setNewWatchlistName('');
            setShowCreateForm(false);
            loadWatchlists();
        } catch (error) {
            console.error('Failed to create watchlist:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteWatchlist = async (id: number) => {
        if (!confirm('Are you sure you want to delete this watchlist?')) return;

        try {
            await watchlistAPI.delete(id);
            if (selectedWatchlist?.id === id) {
                setSelectedWatchlist(null);
            }
            loadWatchlists();
        } catch (error) {
            console.error('Failed to delete watchlist:', error);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-900 to-dark-bg">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Watchlists</h1>
                            <p className="text-dark-text/60">Track your favorite stocks</p>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition flex items-center gap-2"
                        >
                            <FiPlus className="w-5 h-5" />
                            <span>New Watchlist</span>
                        </button>
                    </div>

                    {/* Create Form */}
                    {showCreateForm && (
                        <div className="glass rounded-xl p-6 mb-8 animate-fade-in">
                            <h3 className="text-xl font-bold text-white mb-4">Create New Watchlist</h3>
                            <form onSubmit={handleCreateWatchlist} className="flex gap-4">
                                <input
                                    type="text"
                                    value={newWatchlistName}
                                    onChange={(e) => setNewWatchlistName(e.target.value)}
                                    placeholder="Watchlist name (e.g., Tech Stocks to Watch)"
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-dark-text/40 focus:outline-none focus:border-primary-500 transition"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="px-8 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition"
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <div className="glass rounded-xl p-12 text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
                            <p className="mt-4 text-dark-text/60">Loading watchlists...</p>
                        </div>
                    ) : watchlists.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Watchlist Sidebar */}
                            <div className="lg:col-span-1 space-y-2">
                                {watchlists.map((watchlist) => (
                                    <div
                                        key={watchlist.id}
                                        className={`glass rounded-lg p-4 cursor-pointer transition ${selectedWatchlist?.id === watchlist.id
                                                ? 'border-2 border-primary-500'
                                                : 'hover:bg-white/5'
                                            }`}
                                        onClick={() => loadWatchlistDetails(watchlist.id)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold text-white">{watchlist.name}</div>
                                                <div className="text-sm text-dark-text/60">
                                                    {watchlist.items?.length || 0} stocks
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteWatchlist(watchlist.id);
                                                }}
                                                className="text-red-400 hover:text-red-300 transition"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Watchlist Stocks */}
                            <div className="lg:col-span-3">
                                {selectedWatchlist ? (
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-6">
                                            {selectedWatchlist.name}
                                        </h2>
                                        {selectedWatchlist.items && selectedWatchlist.items.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedWatchlist.items.map((item: any) => (
                                                    <StockCard
                                                        key={item.id}
                                                        symbol={item.symbol}
                                                        name={item.stock_name || item.symbol}
                                                        price={item.current_price || 0}
                                                        changePercent={item.change_percent}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="glass rounded-xl p-12 text-center">
                                                <FiStar className="w-16 h-16 text-dark-text/20 mx-auto mb-4" />
                                                <p className="text-dark-text/60">No stocks in this watchlist</p>
                                                <p className="text-dark-text/40 text-sm mt-2">
                                                    Add stocks to start tracking them
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="glass rounded-xl p-12 text-center">
                                        <p className="text-dark-text/60">Select a watchlist to view stocks</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="glass rounded-xl p-12 text-center">
                            <FiStar className="w-16 h-16 text-dark-text/20 mx-auto mb-4" />
                            <p className="text-dark-text/60 text-lg mb-2">No watchlists yet</p>
                            <p className="text-dark-text/40 text-sm mb-6">
                                Create your first watchlist to start tracking stocks
                            </p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                            >
                                Create Watchlist
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
