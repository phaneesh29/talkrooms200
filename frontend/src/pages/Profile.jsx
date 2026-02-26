import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from '../utils/axios';
import { useNavigate, Link } from 'react-router';
import { Loader2, ArrowLeft, User2, Lock } from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Forms state
    const [username, setUsername] = useState('');
    const [updatingUsername, setUpdatingUsername] = useState(false);

    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [updatingPassword, setUpdatingPassword] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get('/auth/profile');
                if (response.status === 200) {
                    setUser(response.data.user);
                    setUsername(response.data.user.username);
                }
            } catch (error) {
                toast.error('Unauthorized! Please login again.');
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    const handleUpdateUsername = async (e) => {
        e.preventDefault();
        setUpdatingUsername(true);
        try {
            const response = await axios.put('/auth/profile', { username });
            if (response.status === 200) {
                toast.success(response.data.message);
                setUser(response.data.user);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update username');
        } finally {
            setUpdatingUsername(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast.error("New passwords do not match");
        }
        setUpdatingPassword(true);
        try {
            const response = await axios.put('/auth/password', {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword,
                confirmPassword: passwordData.confirmPassword
            });
            if (response.status === 200) {
                toast.success(response.data.message);
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setUpdatingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center min-h-screen justify-center text-purple-400">
                <Loader2 size={64} className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center py-12 px-4 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="glow-blob bg-blue-600/30 w-[400px] h-[400px] top-[10%] left-[10%] animate-float"></div>
            <div className="glow-blob bg-purple-600/30 w-[500px] h-[500px] bottom-[-100px] right-[-100px] animate-float" style={{ animationDelay: '1.5s' }}></div>

            <div className="w-full max-w-2xl animate-fade-in relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-4 mb-4">
                    <Link to="/" className="p-2 glass-card rounded-xl hover:bg-white/10 transition-colors text-white">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Profile Settings</h1>
                </div>

                <div className="glass-card rounded-2xl p-8 space-y-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <User2 size={24} className="text-purple-400" />
                        Update Username
                    </h2>
                    <form onSubmit={handleUpdateUsername} className="space-y-4">
                        <div className="relative">
                            <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                                    setUsername(val);
                                }}
                                placeholder="Username"
                                pattern="^[a-z0-9]+$"
                                title="Only lowercase letters and numbers allowed. No special characters."
                                required
                                className="w-full pl-10 pr-3 py-3 rounded-xl glass-input"
                            />
                        </div>
                        <p className="text-xs text-purple-200/60 pl-1">Lowercase letters and numbers only</p>
                        <button
                            type="submit"
                            disabled={updatingUsername || username === user?.username}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {updatingUsername ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Username"}
                        </button>
                    </form>
                </div>

                <div className="glass-card rounded-2xl p-8 space-y-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Lock size={24} className="text-blue-400" />
                        Change Password
                    </h2>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="password"
                                value={passwordData.oldPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                placeholder="Old Password"
                                required
                                className="w-full pl-10 pr-3 py-3 rounded-xl glass-input"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                placeholder="New Password (min 6 characters)"
                                minLength={6}
                                required
                                className="w-full pl-10 pr-3 py-3 rounded-xl glass-input"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                placeholder="Confirm New Password"
                                minLength={6}
                                required
                                className="w-full pl-10 pr-3 py-3 rounded-xl glass-input"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={updatingPassword}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {updatingPassword ? <Loader2 className="h-5 w-5 animate-spin" /> : "Change Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
