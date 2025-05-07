import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="modern-footer">
            <div className="footer-content">
                <div className="footer-info">
                    <p>&copy; {new Date().getFullYear()} DiGiHealth. All rights reserved.</p>
                </div>
                <div className="footer-links">
                    <a href="/terms">Terms</a>
                    <a href="/privacy">Privacy</a>
                    <a href="/support">Support</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
