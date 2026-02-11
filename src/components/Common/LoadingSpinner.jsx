const LoadingSpinner = ({ size = 'medium', text = '' }) => {
    const sizeClasses = {
        small: 'w-5 h-5 border-2',
        medium: 'w-8 h-8 border-3',
        large: 'w-12 h-12 border-4',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div
                className={`${sizeClasses[size]} border-gray-200 border-t-blue-600 rounded-full animate-spin`}
                style={{ borderTopWidth: size === 'small' ? '2px' : '3px' }}
            />
            {text && <p className="text-gray-500 text-sm">{text}</p>}
        </div>
    );
};

export default LoadingSpinner;
