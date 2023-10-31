import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import reactSvgUrl from './assets/react.svg'

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

// Update favicon dynamically
const faviconLink: HTMLLinkElement | null = document.querySelector("link[rel~='icon']")
if (faviconLink) faviconLink.href = reactSvgUrl

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
)
