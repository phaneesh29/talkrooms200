import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';

const SystemStatus = ({ variant = 'footer' }) => {
    const [status, setStatus] = useState('checking'); // 'checking', 'healthy', 'error'

    useEffect(() => {
        let isMounted = true;

        const checkHealth = async () => {
            try {
                const res = await axios.get('/health');
                if (isMounted) {
                    if (res.status === 200) {
                        setStatus('healthy');
                    } else {
                        setStatus('error');
                    }
                }
            } catch (error) {
                if (isMounted) {
                    setStatus('error');
                }
            }
        };

        // Initial check
        checkHealth();

        // Check every 30 seconds
        const intervalId = setInterval(checkHealth, 30000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const getStatusColor = () => {
        switch (status) {
            case 'healthy':
                return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]';
            case 'error':
                return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse';
            case 'checking':
            default:
                return 'bg-yellow-500 animate-pulse';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'healthy':
                return 'All systems are operational'; // Updated text for green state
            case 'error':
                return 'System Unreachable';
            case 'checking':
                return 'System Checking...';
            default:
                return 'Unknown Status';
        }
    };

    if (variant === 'dot') {
        const titleText = getStatusText();
        return (
            <div
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 shrink-0 rounded-full ${getStatusColor()}`}
                title={titleText}
            ></div>
        );
    }

    // Default to 'footer' variant
    return (
        <footer className="w-full py-6 mt-8 flex justify-center items-center gap-2.5 border-t border-white/5 bg-black/20 backdrop-blur-sm z-10 transition-colors cursor-default">
            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`}></div>
            <span className="text-xs sm:text-sm font-medium text-white/60 hover:text-white/90 transition-colors">
                {getStatusText()}
            </span>
        </footer>
    );
};

export default SystemStatus;
