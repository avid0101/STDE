import { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';

const ToastContext = createContext(null);

const ANIMATION_DURATION = 400; // Match CSS animation duration

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration, isExiting: false }]);

        // Start exit animation before removal
        setTimeout(() => {
            setToasts(prev => prev.map(t =>
                t.id === id ? { ...t, isExiting: true } : t
            ));
        }, duration);

        // Actually remove after animation completes
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration + ANIMATION_DURATION);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        // Start exit animation
        setToasts(prev => prev.map(t =>
            t.id === id ? { ...t, isExiting: true } : t
        ));
        // Remove after animation
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, ANIMATION_DURATION);
    }, []);

    // Convenience methods
    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <Toast
                        key={t.id}
                        message={t.message}
                        type={t.type}
                        isExiting={t.isExiting}
                        onClose={() => removeToast(t.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export default ToastContext;

