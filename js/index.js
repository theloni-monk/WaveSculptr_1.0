import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import("../pkg/index.js").catch(console.error);
ReactDOM.render(React.createElement(React.StrictMode, null,
    React.createElement(App, null)), document.getElementById('root'));
