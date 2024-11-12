import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container">
                <Link className="navbar-brand" to="/">Keychain App</Link>
                <div className="collapse navbar-collapse">
                    <ul className="navbar-nav ml-auto">
                        <li className="nav-item"><Link className="nav-link" to="/signup">Signup</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/add-password">Add Password</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/view-password">View Password</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/delete-password">Delete Password</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/logout">Logout</Link></li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
