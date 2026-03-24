import * as React from 'react';
import { cn } from '@/lib/utils';

const cardStyles: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
};

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
    <div
        ref={ref}
        style={{ ...cardStyles, ...style }}
        className={cn(className)}
        {...props}
    />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
    <div
        ref={ref}
        style={{ padding: '20px', paddingBottom: '0', ...style }}
        className={cn('flex flex-col space-y-1.5', className)}
        {...props}
    />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, style, ...props }, ref) => (
    <h3
        ref={ref}
        style={{ fontSize: '18px', fontWeight: 600, color: '#111827', ...style }}
        className={cn('leading-none tracking-tight', className)}
        {...props}
    />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, style, ...props }, ref) => (
    <p
        ref={ref}
        style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px', ...style }}
        className={cn(className)}
        {...props}
    />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
    <div
        ref={ref}
        style={{ padding: '20px', ...style }}
        className={cn(className)}
        {...props}
    />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
    <div
        ref={ref}
        style={{ padding: '20px', paddingTop: '0', ...style }}
        className={cn('flex items-center', className)}
        {...props}
    />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
