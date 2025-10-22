import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logError } from '../logger';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        logError(new Error('Validation error'), { errors: errorMessages, body: req.body });
        return res.status(400).json({
          message: 'Validation failed',
          errors: errorMessages
        });
      }
      
      logError(error as Error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        logError(new Error('Query validation error'), { errors: errorMessages, query: req.query });
        return res.status(400).json({
          message: 'Query validation failed',
          errors: errorMessages
        });
      }
      
      logError(error as Error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        logError(new Error('Params validation error'), { errors: errorMessages, params: req.params });
        return res.status(400).json({
          message: 'Parameter validation failed',
          errors: errorMessages
        });
      }
      
      logError(error as Error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};