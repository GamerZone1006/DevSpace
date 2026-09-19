/* eslint-disable no-unused-vars */
import React from 'react';
// import './loader.css';

export default function Loader({ text = "Compiling DevSpace..." }) {
    return (
        <div className="devspace-loader-container">
            <div className="cyber-loader">
                <span className="cyber-loader-code">&#123; &#125;</span>
            </div>
            <p className="loader-text">{text}</p>
        </div>
    );
}