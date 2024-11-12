import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Logout() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogout = async () => {
        const confirmLogout = window.confirm('Are you sure you want to log out?');
        
        if (confirmLogout) {
            setLoading(true);
            setError('');

            try {
                // Call the server logout endpoint
                await axios.post('http://localhost:3000/logout', {}, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                // Clear all client-side storage
                localStorage.clear();
                sessionStorage.clear();
                
                // Clear cookies
                const cookies = document.cookie.split(';');
                for (let cookie of cookies) {
                    const eqPos = cookie.indexOf('=');
                    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                }

                // Show success message
                alert('Logged out successfully');
                
                // Redirect to login page
                navigate('/login');
            } catch (error) {
                console.error('Logout error:', error);
                setError('Error during logout. Please try again.');
                
                // If server call fails, still clear client-side data and redirect
                localStorage.clear();
                sessionStorage.clear();
                navigate('/login');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="container mt-5">
            <h2>Logout</h2>
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            <button 
                className="btn btn-danger"
                onClick={handleLogout}
                disabled={loading}
            >
                {loading ? 'Logging out...' : 'Log Out'}
            </button>
            
            <div className="mt-3 text-muted">
                <small>
                    Logging out will clear all stored data and return you to the login page.
                </small>
            </div>
        </div>
    );
}

export default Logout;