import React from 'react';
const Footer = () => {
    return (
        <footer style={{ 
            position: 'relative', 
            backgroundImage: 'linear-gradient(0deg, #2AF598 0%, #08AEEA 100%)',
            width: '100%',
            textAlign: 'center',
            padding: '1rem',
            marginTop: 'auto',
            color: '#fff',
        }}>
            <p>&copy; {new Date().getFullYear()} DiGiHealth. All rights reserved.</p>
        </footer>
    );
};

export default Footer;
