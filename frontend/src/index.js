import React from 'react';
import ReactDOM from 'react-dom';

// Import DAppProvider
import { ChainId, DAppProvider } from "@usedapp/core";

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <DAppProvider config={{
      supportedChains: [ChainId.BSCTestnet], // ,ChainId.Rinkeby
      notifications: {
        expirationPeriod: 1000,
        checkInterval: 1000
      }
    }}>
      <App />
    </DAppProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
