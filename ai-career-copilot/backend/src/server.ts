
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as GeminiAPI from './gemini-api';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for potential large payloads

// --- REQUEST LOGGER ---
// This simple logger helps determine if requests are reaching the backend from Firebase Hosting.
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[Server] Incoming request: ${req.method} ${req.originalUrl} from ${req.ip}`);
    next();
});

// --- HEALTH CHECK ---
// A request to /api/health on the frontend is proxied to /api/health on the backend.
app.get('/api/health', (req: Request, res: Response) => {
    console.log('[Server] Health check successful.');
    res.status(200).json({ status: 'ok' });
});

// --- API ROUTES ---
// Firebase Hosting rewrites preserve the path, so the backend must handle the full /api prefix.
const apiRouter = express.Router();

apiRouter.post('/analyze/career-paths', async (req, res, next) => {
    try {
        const { resumeText } = req.body;
        if (!resumeText) return res.status(400).json({ message: 'resumeText is required.' });
        const result = await GeminiAPI.analyzeResumeForCareerPaths(resumeText);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

apiRouter.post('/analyze/job-match', async (req, res, next) => {
    try {
        const { resumeText, jdText } = req.body;
        if (!resumeText || !jdText) return res.status(400).json({ message: 'resumeText and jdText are required.' });
        const result = await GeminiAPI.analyzeJobMatch(resumeText, jdText);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

apiRouter.post('/analyze/jd-from-url', async (req, res, next) => {
    try {
        const { jobUrl } = req.body;
        if (!jobUrl) return res.status(400).json({ message: 'jobUrl is required.' });
        const result = await GeminiAPI.getJdFromUrl(jobUrl);
        res.json(result); // The result from the service is already a string
    } catch (error) {
        next(error);
    }
});

apiRouter.post('/generate/salary-strategy', async (req, res, next) => {
    try {
        const { details } = req.body;
        if (!details) return res.status(400).json({ message: 'details object is required.' });
        const result = await GeminiAPI.getSalaryStrategy(details);
        res.json(result); // Result is a string
    } catch (error) {
        next(error);
    }
});

apiRouter.post('/generate/resume-content', async (req, res, next) => {
    try {
        const { rawExperience, jobDescription } = req.body;
        if (!rawExperience) return res.status(400).json({ message: 'rawExperience is required.' });
        const result = await GeminiAPI.generateResumeContent(rawExperience, jobDescription);
        res.json(result); // Result is a string
    } catch (error) {
        next(error);
    }
});

apiRouter.post('/generate/interview-report', async (req, res, next) => {
    try {
        const { transcript } = req.body;
        if (!transcript) return res.status(400).json({ message: 'transcript is required.' });
        const result = await GeminiAPI.generateInterviewReport(transcript);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

apiRouter.post('/generate/interview-turn', async (req, res, next) => {
    try {
        const result = await GeminiAPI.generateInterviewTurn(req.body);
        res.json({ text: result }); // Wrap primitive string in object
    } catch (error) {
        next(error);
    }
});

apiRouter.post('/generate/learning-path', async (req, res, next) => {
    try {
        const { resumeText, targetRole } = req.body;
        if (!resumeText || !targetRole) return res.status(400).json({ message: 'resumeText and targetRole are required.' });
        const result = await GeminiAPI.getLearningPath(resumeText, targetRole);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Mount the router under the /api prefix
app.use('/api', apiRouter);


// --- ERROR HANDLING ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Server Error] ${req.path}`, err);
    res.status(500).json({ message: err.message || 'An internal server error occurred.' });
});

// --- 404 HANDLER ---
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ message: 'Not Found', requestedPath: req.originalUrl });
});

// --- SERVER STARTUP ---
app.listen(port, () => {
    console.log(`✅ Backend server listening on port ${port}`);
});