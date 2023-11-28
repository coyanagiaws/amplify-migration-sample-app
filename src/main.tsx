import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import App from './App.tsx';
import './index.css';

Amplify.configure({
  Auth: {
    identityPoolId: '',
    region: 'ap-northeast-1',
    userPoolId: '',
    userPoolWebClientId: '',
  },
  API: {
    endpoints: [
      {
        name: 'restApi',
        endpoint: '',
        region: 'ap-northeast-1',
      },
    ],
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Authenticator.Provider>
      <App />
    </Authenticator.Provider>
  </React.StrictMode>
);
