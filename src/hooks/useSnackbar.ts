import { useState } from 'react'

const useSnackbar = () => {
	const [message, setMessage] = useState<string | null>(null)
	const [type, setType] = useState<'error' | 'success' | 'info' | 'warning' | null>(null)

	return {
		message,
		setMessage,
		type,
		setType,
	}
}

export default useSnackbar
