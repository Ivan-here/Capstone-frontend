import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import './NotFound.css';

const NotFound = ({
                      title = "Page Not Found",
                      message = "Oops! The page you are looking for doesn't exist or you don't have permission to view it.",
                      code = "404"
                  }) => {
    const navigate = useNavigate();

    return (
        <div className="error-wrapper">
            <div className="error-card">
                {/* Icon or Error Code */}
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <h1 className="error-code">{code}</h1>
                    <AlertTriangle
                        size={48}
                        color="#8B4513"
                        style={{ position: 'absolute', top: '-10px', right: '-40px', opacity: 0.2 }}
                    />
                </div>

                <h2 className="error-title">{title}</h2>
                <p className="error-message">{message}</p>

                <button className="btn-home" onClick={() => navigate('/browse')}>
                    <Home size={20} />
                    Go Back Home
                </button>
            </div>
        </div>
    );
};

export default NotFound;