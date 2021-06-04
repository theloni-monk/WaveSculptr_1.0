import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import("../pkg/index.js").catch(console.error);
ReactDOM.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>,
    document.getElementById('root')
);