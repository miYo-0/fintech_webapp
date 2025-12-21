'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only redirect if we're sure the user is not authenticated
        // This prevents redirects while auth is still being checked
        if (!loading && !isAuthenticated) {
            // Double-check localStorage before redirecting (only in browser)
            const hasToken = typeof window !== 'undefined' && localStorage.getItem('access_token');
            if (!hasToken) {
                router.push('/login');
            }
        }
    }, [isAuthenticated, loading, router]);

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-900 to-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-dark-text/60">Loading...</p>
                </div>
            </div>
        );
    }

    // If not authenticated and no token in localStorage, return null (will redirect via useEffect)
    // Check if window exists to avoid SSR errors
    if (!isAuthenticated && (typeof window === 'undefined' || !localStorage.getItem('access_token'))) {
        return null;
    }

    // User is authenticated or has a token, show the protected content
    return <>{children}</>;
}
