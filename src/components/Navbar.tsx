import { Box, Tab, Tabs, useTheme } from '@mui/material'

const Navbar = ({
	darkMode,
	setDarkMode,
}: {
	darkMode: boolean
	setDarkMode: (darkMode: boolean) => void
}) => {
	const theme = useTheme()

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
			}}
		>
			<Tabs
				value={darkMode ? 'dark' : 'light'}
				onChange={(e, value) => setDarkMode(value === 'dark')}
				aria-label="Dark mode toggle"
				variant="fullWidth"
				sx={{
					marginTop: 4,
					backgroundColor: theme.palette.background.default,
				}}
			>
				<Tab label="Light" value="light" />
				<Tab label="Dark" value="dark" />
			</Tabs>
		</Box>
	)
}

export default Navbar
