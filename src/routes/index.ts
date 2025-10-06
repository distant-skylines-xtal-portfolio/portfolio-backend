import {Router, Request, Response} from 'express';

const router = Router();

router.get('/projects', (req: Request, res: Response) => {
    res.json({
        message: 'projects endpoint',
        data: [
            {id: 1, name: 'portfolio frontend site'},
        ],
    });
});

export default router;