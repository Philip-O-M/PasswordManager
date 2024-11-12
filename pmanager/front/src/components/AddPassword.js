import React, { useState } from 'react';
import axios from 'axios';

function AddPassword() {
    const [domain, setDomain] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleAddPassword = async () => {
        try {
            // Reset states
            setError('');
            setSuccess('');

            // Validate inputs
            if (!domain || !password) {
                setError('Both domain and password are required');
                return;
            }

            const response = await axios.post(
                'http://localhost:3000/set',
                { domain, password },
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Clear form and show success message
            setSuccess(response.data.message || 'Password added successfully');
            setDomain('');
            setPassword('');
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || 'Error adding password';
            setError(errorMessage);
            console.error('Error details:', error);
        }
    };

    return (
        <div className="container mt-5">
            <h2>Add Password</h2>
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            {success && (
                <div className="alert alert-success" role="alert">
                    {success}
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
            <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                    id="password"
                    type="password"
                    className="form-control"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <button 
                className="btn btn-primary"
                onClick={handleAddPassword}
                disabled={!domain || !password}
            >
                Add Password
            </button>
        </div>
    );
}

export default AddPassword;