import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';

const SystemStatus = () => {
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
                return 'System Healthy';
            case 'error':
                return 'System Unreachable';
            case 'checking':
                return 'System Checking...';
            default:
                return 'Unknown Status';
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-[100] group flex items-center gap-2.5 bg-black/40 backdrop-blur-md border border-white/10 px-3.5 py-2.5 rounded-full shadow-lg transition-colors hover:bg-black/60 cursor-default">
            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`}></div>
            <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors">
                {getStatusText()}
            </span>
        </div>
    );
};

export default SystemStatus;
