import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import reactSvgUrl from './assets/react.svg';
import './index.css';


// Update favicon dynamically
const faviconLink: HTMLLinkElement | null
	= document.querySelector("link[rel~='icon']");
if (faviconLink) faviconLink.href = reactSvgUrl;


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
)
