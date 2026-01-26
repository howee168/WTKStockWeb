import React, { type ReactNode } from 'react';
import styles from './Common.module.css';

interface CardProps {
    children: ReactNode;
    title?: string;
    action?: ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, action, className }) => {
    return (
        <div className={`${styles.card} ${className || ''}`}>
            {(title || action) && (
                <div className={styles.cardHeader}>
                    {title && <h3 className={styles.cardTitle}>{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className={styles.cardContent}>
                {children}
            </div>
        </div>
    );
};
