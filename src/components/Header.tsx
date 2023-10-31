import { Typography } from '@mui/material'

const Header = () => {
	return (
		<Typography
			variant="h4"
			component="h1"
			align="center"
			gutterBottom
			sx={{
				marginTop: 4,
			}}
		>
			Music Library Cloud Backup
		</Typography>
	)
}

export default Header
