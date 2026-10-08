import { Router } from 'express';
import { handleAnalyzeSelfie } from './analyze-selfie.ts';
import { handleStylist } from './stylist.ts';
import { handleAnalyzeGarment } from './analyze-garment.ts';
import { handleLookbook, handleLookbookAngle, handleLookbookCheck } from './lookbook-route.ts';

export * from './cache.ts';
export * from './analyze-selfie.ts';
export * from './stylist.ts';
export * from './analyze-garment.ts';

export const aiRouter = Router();

aiRouter.post('/analyze-selfie', handleAnalyzeSelfie);
aiRouter.post('/stylist', handleStylist);
aiRouter.post('/analyze-garment', handleAnalyzeGarment);
aiRouter.post('/lookbook/check', handleLookbookCheck);
aiRouter.post('/lookbook', handleLookbook);
aiRouter.post('/lookbook/angle', handleLookbookAngle);
