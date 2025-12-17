import '../css/ConfirmModal.css';

export default function ConfirmModal({
    isOpen,
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmStyle = 'primary', // 'primary', 'danger', 'warning'
    onConfirm,
    onCancel,
    isExiting = false,
    // Input field props
    showInput = false,
    inputValue = '',
    inputPlaceholder = '',
    inputType = 'text',
    onInputChange = () => { }
}) {
    if (!isOpen) return null;

    const getConfirmButtonClass = () => {
        switch (confirmStyle) {
            case 'danger': return 'confirm-btn-danger';
            case 'warning': return 'confirm-btn-warning';
            default: return 'confirm-btn-primary';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && onConfirm) {
            onConfirm();
        }
    };

    return (
        <div className={`confirm-overlay ${isExiting ? 'confirm-overlay-exit' : ''}`}>
            <div className={`confirm-modal ${isExiting ? 'confirm-modal-exit' : ''}`}>
                {/* Glowing border effect */}
                <div className="confirm-glow"></div>

                {/* Modal content */}
                <div className="confirm-content">
                    {/* Icon */}
                    <div className="confirm-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>

                    {/* Text */}
                    <div className="confirm-text">
                        <h3 className="confirm-title">{title}</h3>
                        <p className="confirm-message">{message}</p>
                    </div>

                    {/* Input Field (optional) */}
                    {showInput && (
                        <input
                            type={inputType}
                            className="confirm-input"
                            value={inputValue}
                            onChange={(e) => onInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={inputPlaceholder}
                            autoFocus
                        />
                    )}

                    {/* Buttons */}
                    <div className="confirm-buttons">
                        <button
                            className="confirm-btn confirm-btn-cancel"
                            onClick={onCancel}
                        >
                            {cancelText}
                        </button>
                        <button
                            className={`confirm-btn ${getConfirmButtonClass()}`}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
