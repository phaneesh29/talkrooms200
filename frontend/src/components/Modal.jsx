import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-[#0f1225] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 border border-white/10 animate-fade-in scale-100 min-h-[150px]">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-purple-200/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="text-purple-50/90">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
