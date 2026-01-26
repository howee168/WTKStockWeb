import React, { type ButtonHTMLAttributes } from 'react';
import styles from './Common.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    className,
    ...props
}) => {
    return (
        <button
            className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className || ''}`}
            {...props}
        >
            {icon && <span className={styles.btnIcon}>{icon}</span>}
            {children}
        </button>
    );
};
