"use client";

import {useEffect, useState} from 'react';
import {getNetworkStatus} from '@/lib/api';

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [isSlowConnection, setIsSlowConnection] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateNetworkStatus = () => {
            const status = getNetworkStatus();
            setIsOnline(status.isOnline);
            setIsSlowConnection(status.isSlowConnection);
        };

        updateNetworkStatus();

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const connection = (navigator as any).connection ||
            (navigator as any).mozConnection ||
            (navigator as any).webkitConnection;

        if (connection) {
            const handleConnectionChange = () => {
                setIsSlowConnection(
                    connection.effectiveType === 'slow-2g' ||
                    connection.effectiveType === '2g'
                );
            };

            connection.addEventListener('change', handleConnectionChange);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
                connection.removeEventListener('change', handleConnectionChange);
            };
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return {
        isOnline,
        isSlowConnection,
        isOffline: !isOnline,
    };
}