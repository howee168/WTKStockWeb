import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Lock, AlertCircle } from 'lucide-react';
import styles from './Login.module.css';

const Login: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get the page they were trying to visit before being redirected to login
    const from = (location.state as any)?.from?.pathname || '/';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Small delay to prevent brute forcing and give UI feedback
        setTimeout(() => {
            const success = login(password);

            if (success) {
                navigate(from, { replace: true });
            } else {
                setError('Invalid password. Please try again.');
                setPassword('');
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <div className={styles.logoContainer}>
                    <img
                        src="/logowtkhighqualitynobackground.png"
                        alt="stockList logo"
                        className={styles.logo}
                    />
                    <h1 className={styles.title}>
                        stock<span>List</span>
                    </h1>
                    <p className={styles.subtitle}>Please enter the password to access the system</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.errorMessage}>
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <Input
                            type="password"
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={<Lock size={18} />}
                            required
                            autoFocus
                        />
                    </div>

                    <Button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading || !password}
                    >
                        {isLoading ? 'Verifying...' : 'Login to System'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default Login;
