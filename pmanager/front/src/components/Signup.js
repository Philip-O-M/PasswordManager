import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// react signup code
function Signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate  =  useNavigate();
    const handleSignup = async () => {
        try {
            const response = await axios.post('http://localhost:3000/signup', { username, password }, { withCredentials: true });
            alert(response.data.message || 'Signup successful');
            navigate('/login');
        } catch (error) {
            alert('Error during signup');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Signup</h2>
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
            <button className="btn btn-primary mt-3" onClick={handleSignup}>Sign Up</button>
        </div>
    );
}

export default Signup;