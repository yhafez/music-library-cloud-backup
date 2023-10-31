import { parseBuffer } from 'music-metadata'

const getMetadata = async (fileName: string, fileContent: Buffer, mimeType: string) => {
	const metadataResults = await parseBuffer(fileContent, { mimeType })
	return {
		fileName,
		title: metadataResults.common.title || '',
		artist: metadataResults.common.artist || '',
		album: metadataResults.common.album || '',
		genre: metadataResults.common.genre?.join(', ') || '',
		key: metadataResults.common.key || '',
		bpm: metadataResults.common.bpm?.toString() || '',
	}
}

export default getMetadata
