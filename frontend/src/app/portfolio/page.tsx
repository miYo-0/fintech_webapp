'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { portfolioAPI } from '@/lib/api';
import Link from 'next/link';
import { FiPlus, FiPieChart, FiTrendingUp } from 'react-icons/fi';

export default function PortfolioPage() {
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newPortfolioName, setNewPortfolioName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadPortfolios();
    }, []);

    const loadPortfolios = async () => {
        try {
            const response = await portfolioAPI.list();
            setPortfolios(response.data || []);
        } catch (error) {
            console.error('Failed to load portfolios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePortfolio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPortfolioName.trim()) return;

        setCreating(true);
        try {
            await portfolioAPI.create({ name: newPortfolioName });
            setNewPortfolioName('');
            setShowCreateForm(false);
            loadPortfolios();
        } catch (error) {
            console.error('Failed to create portfolio:', error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-900 to-dark-bg">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Portfolios</h1>
                            <p className="text-dark-text/60">Manage and track your investment portfolios</p>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition flex items-center gap-2"
                        >
                            <FiPlus className="w-5 h-5" />
                            <span>New Portfolio</span>
                        </button>
                    </div>

                    {/* Create Form */}
                    {showCreateForm && (
                        <div className="glass rounded-xl p-6 mb-8 animate-fade-in">
                            <h3 className="text-xl font-bold text-white mb-4">Create New Portfolio</h3>
                            <form onSubmit={handleCreatePortfolio} className="flex gap-4">
                                <input
                                    type="text"
                                    value={newPortfolioName}
                                    onChange={(e) => setNewPortfolioName(e.target.value)}
                                    placeholder="Portfolio name (e.g., My Tech Stocks)"
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

                    {/* Portfolios List */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="glass rounded-xl p-6 animate-pulse">
                                    <div className="h-6 bg-white/10 rounded mb-4"></div>
                                    <div className="h-4 bg-white/10 rounded mb-2"></div>
                                    <div className="h-4 bg-white/10 rounded w-2/3"></div>
                                </div>
                            ))}
                        </div>
                    ) : portfolios.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {portfolios.map((portfolio) => (
                                <Link
                                    key={portfolio.id}
                                    href={`/portfolio/${portfolio.id}`}
                                    className="glass rounded-xl p-6 card-hover"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <FiPieChart className="w-8 h-8 text-primary-400" />
                                        {portfolio.total_value !== undefined && (
                                            <div className={`flex items-center gap-1 text-sm font-semibold ${(portfolio.total_return || 0) >= 0 ? 'positive' : 'negative'
                                                }`}>
                                                <FiTrendingUp className="w-4 h-4" />
                                                <span>{(portfolio.total_return || 0) >= 0 ? '+' : ''}{portfolio.total_return?.toFixed(2)}%</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{portfolio.name}</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-dark-text/60">Total Value</span>
                                            <span className="text-white font-semibold">
                                                ${portfolio.total_value?.toFixed(2) || '0.00'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-dark-text/60">Positions</span>
                                            <span className="text-white font-semibold">
                                                {portfolio.positions?.length || 0}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="glass rounded-xl p-12 text-center">
                            <FiPieChart className="w-16 h-16 text-dark-text/20 mx-auto mb-4" />
                            <p className="text-dark-text/60 text-lg mb-2">No portfolios yet</p>
                            <p className="text-dark-text/40 text-sm mb-6">Create your first portfolio to start tracking investments</p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                            >
                                Create Portfolio
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
