import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


//react login.js code
function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    
    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost:3000/login', { username, password }, { withCredentials: true });
            alert(response.data.message || 'Login successful');
            navigate('/add-password');
        } catch (error) {
            setError('Error during login: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="container mt-5">
            <h2>Login</h2>
            <input
                type="text"
                className="form-control"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                className="form-control mt-2"
                placeholder="Master Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button className="btn btn-primary mt-3" onClick={handleLogin}>Log In</button>
            {error && <div className="mt-3 alert alert-danger">{error}</div>}
        </div>
    );
}

export default Login;