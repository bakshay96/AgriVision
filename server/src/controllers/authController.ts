import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User, { IUser } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const generateToken = (user: IUser): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  return jwt.sign(
    { id: user._id.toString(), tenantId: user.tenantId, role: user.role },
    secret,
    { expiresIn: '7d' } as object
  );
};

const sanitizeUser = (user: IUser) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  tenantId: user.tenantId,
  farmName: user.farmName,
  farmLocation: user.farmLocation,
  farmSizeAcres: user.farmSizeAcres,
  phoneNumber: user.phoneNumber,
  avatar: user.avatar,
});

// POST /api/auth/register
export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password, role, farmName, farmLocation, farmSizeAcres, phoneNumber } =
    req.body;

  const existing = await User.findOne({ email: email?.toLowerCase().trim() });
  if (existing) {
    throw createError('This email address is already registered', 409);
  }

  // Normalise role — accept both 'farmer' and 'FARMER' from the frontend
  const normalisedRole = (role || 'FARMER').toString().toUpperCase();

  // Each new registration creates a new tenantId (or join existing via invite — future feature)
  const tenantId = uuidv4();

  const user = await User.create({
    tenantId,
    name: name?.trim(),
    email: email?.toLowerCase().trim(),
    password,
    role: normalisedRole,
    farmName: farmName?.trim(),
    farmLocation,
    farmSizeAcres,
    phoneNumber,
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user: sanitizeUser(user), token },
  });
};

// POST /api/auth/login
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError('Email and password are required', 400);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) {
    throw createError('Invalid credentials', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw createError('Invalid credentials', 401);
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { user: sanitizeUser(user), token },
  });
};

// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }
  res.status(200).json({
    success: true,
    data: { user: sanitizeUser(req.user) },
  });
};

// PUT /api/auth/profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const allowed = ['name', 'farmName', 'farmLocation', 'farmSizeAcres', 'phoneNumber', 'avatar'];
  const updates: Partial<IUser> = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      (updates as Record<string, unknown>)[field] = req.body[field];
    }
  });

  const updated = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated',
    data: { user: sanitizeUser(updated as IUser) },
  });
};
