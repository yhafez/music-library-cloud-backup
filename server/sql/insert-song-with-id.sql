INSERT INTO songs (filename, metadata, id) VALUES ($1, $2, $3) RETURNING id;