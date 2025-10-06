import express, {Request, Response, NextFunction, application} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes';

//Load Environment variables
dotenv.config();

//Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

//Security headers
app.use(helmet({
    contentSecurityPolicy: false,
}))

//CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
    ? 'https://yourdomain.com'
    : 'http://localhost:3000', //Dev server
    credentials: true,
}))

//Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

//Body parsing
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//Compression
app.use(compression());

//Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
});

/*
    API Routes
*/


app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'server is running',
        timeStamp: new Date().toISOString(),
    });
});

app.use('/api', apiRoutes);

/* 
    Static File Serving
*/

//Portfolio Frontend
app.use(express.static(path.join(__dirname, '../public')));

//Webapps
app.use('/apps', express.static(path.join(__dirname, '../public/apps')));

app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ 
            error: 'API endpoint not found',
            path: req.path,
        });
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
})

// 404 handler for API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.stack);
  
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

app.listen(PORT, () => {
    console.log(`
        Server is running
        Port: ${PORT}
        Environment: ${process.env.NODE_ENV || 'development'}
        Local: http://localhost:${PORT}
        `);
});

export default app;