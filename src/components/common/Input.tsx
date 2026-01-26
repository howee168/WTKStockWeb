import React, { type InputHTMLAttributes } from 'react';
import styles from './Common.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className, style, ...props }) => {
    return (
        <div className={styles.inputWrapper}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.inputContainer} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {icon && (
                    <div style={{ position: 'absolute', left: '10px', color: 'var(--color-text-muted)', display: 'flex' }}>
                        {icon}
                    </div>
                )}
                <input
                    className={`${styles.input} ${error ? styles.inputError : ''} ${className || ''}`}
                    style={{
                        ...(icon ? { paddingLeft: '2.5rem' } : {}),
                        ...(style || {})
                    }}
                    {...props}
                />
            </div>
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};
