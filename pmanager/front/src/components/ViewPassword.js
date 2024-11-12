import React, { useState } from 'react';
import axios from 'axios';

function ViewPassword() {
    const [domain, setDomain] = useState('');
    const [retrievedPassword, setRetrievedPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleViewPassword = async () => {
        if (!domain) {
            setError('Please enter a domain');
            return;
        }

        setLoading(true);
        setError('');
        setRetrievedPassword('');

        try {
            const response = await axios.post(
                'http://localhost:3000/get',
                { domain },
                { withCredentials: true }
            );
            setRetrievedPassword(response.data.password);
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Error retrieving password';
            setError(errorMessage);
            setRetrievedPassword('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <h2>View Password</h2>
            
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            <div className="mb-3">
                <label htmlFor="domain" className="form-label">Domain</label>
                <input
                    id="domain"
                    type="text"
                    className="form-control"
                    placeholder="e.g., example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                />
            </div>

            <button 
                className="btn btn-primary"
                onClick={handleViewPassword}
                disabled={!domain || loading}
            >
                {loading ? 'Loading...' : 'View Password'}
            </button>

            {retrievedPassword && (
                <div className="mt-3 p-3 border rounded">
                    <strong>Password: </strong>
                    <span className="font-monospace">{retrievedPassword}</span>
                </div>
            )}
        </div>
    );
}

export default ViewPassword;