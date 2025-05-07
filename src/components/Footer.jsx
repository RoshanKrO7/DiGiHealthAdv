import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="modern-footer">
            <div className="footer-content">
                <div className="footer-info">
                    <p>&copy; {new Date().getFullYear()} DiGiHealth. All rights reserved.</p>
                </div>
                <div className="footer-links">
                    <Link to="/terms">Terms</Link>
                    <Link to="/privacy">Privacy</Link>
                    <Link to="/support/contact">Support</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
