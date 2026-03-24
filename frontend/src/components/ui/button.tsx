import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {
        const variantClasses = {
            default: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
            secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
            ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
            destructive: 'bg-red-600 text-white hover:bg-red-700',
            success: 'bg-green-600 text-white hover:bg-green-700',
        };

        const sizeClasses = {
            default: 'h-10 px-4 py-2 text-sm',
            sm: 'h-8 px-3 text-xs',
            lg: 'h-12 px-6 text-base',
            icon: 'h-10 w-10',
        };

        return (
            <button
                className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    variantClasses[variant],
                    sizeClasses[size],
                    className
                )}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
