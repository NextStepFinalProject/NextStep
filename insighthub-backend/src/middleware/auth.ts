import {Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import {config} from '../config/config';
import { CustomRequest } from 'types/customRequest';
import {unless} from 'express-unless';
import * as usersService from '../services/users_service';


const getTokenFromHeader = (req: CustomRequest): string | undefined => {
  const authHeader= (req.headers['authorization'] as string | undefined) ?? (req.headers['Authorization'] as string | undefined);
  return authHeader?.split(' ')[1];
}

const authenticateTokenHandler: any & { unless: typeof unless } = async (req: CustomRequest, res: Response, next: NextFunction, ignoreExpiration = false): Promise<void> => {
  const token = getTokenFromHeader(req);

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  try {
    const isBlacklisted = await usersService.isAccessTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(403).json({ message: 'Token is blacklisted' });
      return;
    }

    const decoded = jwt.verify(token, config.token.access_token_secret(), { ignoreExpiration }) as jwt.JwtPayload;
    const user = await usersService.getUserById(decoded.userId);

    if (!user) {
      res.status(403).json({ message: 'Invalid token' });
      return;
    }

    req.user = user;
    next();

  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token expired' });
    } else {
      res.status(403).json({ message: 'Invalid token' });
    }
  }
};


// Middleware to authenticate token for all requests
const authenticateToken: any & { unless: typeof unless } = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  authenticateTokenHandler(req, res, next, false)
}

authenticateToken.unless = unless;

const authenticateTokenForParams: any & { unless: typeof unless } = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  if (Object.keys(req.query).length > 0) {
    authenticateTokenHandler(req, res, next, false)
  }
  else {
    next();
  }
}

const authenticateLogoutToken = async (req: CustomRequest, res: Response, next: NextFunction) => {
    authenticateTokenHandler(req, res, next, true)
}

authenticateLogoutToken.unless = unless;

export {authenticateToken, authenticateLogoutToken, authenticateTokenForParams};
