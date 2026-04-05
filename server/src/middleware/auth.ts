import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
  tenantId?: string;
}

interface JwtPayload {
  id: string;
  tenantId: string;
  role: string;
  iat: number;
  exp: number;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Not authorized. No token.' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User not found or inactive.' });
      return;
    }

    req.user = user;
    req.tenantId = decoded.tenantId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token is invalid or expired.' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this route.`,
      });
      return;
    }
    next();
  };
};
