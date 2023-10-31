export interface AppError {
	statusCode: number
}

export interface Song {
	id: number
	filename: string
	metadata: Metadata
}

export interface Metadata {
	fileName: string
	title: string
	artist: string
	album: string
	genre: string
	key: string
	bpm: string
}
