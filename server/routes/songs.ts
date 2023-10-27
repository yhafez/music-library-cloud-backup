import { Router } from 'express';
import s3Routes from './s3';
import dbRoutes from './db';

const songsRouter = Router();

// Sub-routes for S3 and DB operations
songsRouter.use('/s3', s3Routes);
songsRouter.use('/db', dbRoutes);

export default songsRouter;
