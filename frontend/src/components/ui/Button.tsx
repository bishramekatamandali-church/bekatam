
import React, { ReactNode } from 'react';
import { Link, LinkProps } from "react-router-dom";

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const baseClasses = "inline-flex items-center justify-center rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 dark:bg-purple-500 dark:hover:bg-purple-600 dark:focus:ring-purple-400',
  secondary: 'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600',
  outline: 'border border-purple-600 text-purple-600 hover:bg-purple-100 focus:ring-purple-500 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/50',
  ghost: 'text-purple-600 hover:bg-purple-100 focus:ring-purple-500 dark:text-purple-400 dark:hover:bg-purple-900/50',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

// Base props that are common to both button and link
interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

// Props for when the component is a button
type ButtonAsButton = CommonProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
  asLink?: false;
  to?: never;
};

// Props for when the component is a react-router Link or an external link
type ButtonAsLink = CommonProps & Omit<LinkProps, 'className' | 'children'> & {
  asLink: true;
  to: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const Button: React.FC<ButtonProps> = (props) => {
    const { variant = 'primary', size = 'md', className = '', children } = props;
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    if (props.asLink) {
        const { variant: _v, size: _s, className: _c, children: _ch, asLink: _al, to, ...rest } = props;
        const isExternal = typeof to === 'string' && (to.startsWith('http') || to.startsWith('mailto:') || to.startsWith('tel:'));
        
        if (isExternal) {
            // For external links, render a standard <a> tag.
            // Destructure React Router specific props to avoid them being passed to the <a> tag.
            const { reloadDocument, replace, state, ...anchorProps } = rest as any;
            return (
                <a href={to} target="_blank" rel="noopener noreferrer" {...anchorProps} className={classes}>
                    {children}
                </a>
            );
        }
        
        // For internal links, render React Router's Link.
        return (
            <Link to={to} {...rest} className={classes}>
                {children}
            </Link>
        );
    }
    
    // FIX: The type attribute conflicts. By casting props to ButtonAsButton in this branch,
    // we ensure TypeScript correctly infers the types for the rest props, resolving the conflict.
    const { variant: _v, size: _s, className: _c, children: _ch, asLink, ...buttonProps } = props as ButtonAsButton;
    return (
        <button {...buttonProps} className={classes}>
            {children}
        </button>
    );
};

export default Button;
