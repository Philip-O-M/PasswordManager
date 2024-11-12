import React, { useState } from 'react';
import axios from 'axios';

function DeletePassword() {
    const [domain, setDomain] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDeletePassword = async () => {
        if (!domain) {
            setError('Please enter a domain');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post(
                'http://localhost:3000/remove',
                { domain },
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            setSuccess(response.data.message || 'Password deleted successfully');
            setDomain(''); // Clear the input after successful deletion
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Error deleting password';
            setError(errorMessage);
            console.error('Delete error details:', error);
        } finally {
            setLoading(false);
        }
    };

    // Confirm deletion before proceeding
    const handleConfirmDelete = () => {
        if (window.confirm(`Are you sure you want to delete the password for "${domain}"?`)) {
            handleDeletePassword();
        }
    };

    return (
        <div className="container mt-5">
            <h2>Delete Password</h2>
            
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

            <button 
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={!domain || loading}
            >
                {loading ? 'Deleting...' : 'Delete Password'}
            </button>
        </div>
    );
}

export default DeletePassword;