'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading, checkAuth } = useAuth();
    const router = useRouter();
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        // Check authentication when protected route is accessed
        const verifyAuth = async () => {
            if (!authChecked) {
                await checkAuth();
                setAuthChecked(true);
            }
        };

        verifyAuth();
    }, [authChecked, checkAuth]);

    useEffect(() => {
        // Redirect to login if not authenticated after check is complete
        if (authChecked && !loading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [authChecked, isAuthenticated, loading, router]);

    // Show loading state while checking auth
    if (!authChecked || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-900 to-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-dark-text/60">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, return null (will redirect via useEffect)
    if (!isAuthenticated) {
        return null;
    }

    // User is authenticated, show the protected content
    return <>{children}</>;
}
