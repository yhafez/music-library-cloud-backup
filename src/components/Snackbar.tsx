import { Alert, Snackbar } from '@mui/material'

interface SnackbarProps {
	message: string | null
	setMessage: (message: string | null) => void
	type: 'error' | 'success' | 'info' | 'warning' | null
	setType: (type: 'error' | 'success' | 'info' | 'warning' | null) => void
}

const SnackbarComponent = ({ message, setMessage, type, setType }: SnackbarProps) => {
	const handleClose = () => {
		setMessage(null)
		setType(null)
	}

	return (
		<Snackbar open={!!message} autoHideDuration={6000} onClose={handleClose}>
			<Alert severity={type || 'error'} onClose={handleClose}>
				{message}
			</Alert>
		</Snackbar>
	)
}

export default SnackbarComponent
