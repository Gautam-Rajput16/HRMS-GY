import { cn } from '@/lib/utils';

interface SpinnerProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-2',
        lg: 'w-12 h-12 border-3',
    };

    return (
        <div
            className={cn(
                'rounded-full border-gray-200 border-t-indigo-600 animate-spin',
                sizeClasses[size],
                className
            )}
        />
    );
}
