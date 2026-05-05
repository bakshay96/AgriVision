import { Request, Response } from 'express';
import Feedback from '../models/Feedback';
import { AuthRequest } from '../middleware/auth';

export const createFeedback = async (req: Request | AuthRequest, res: Response) => {
  try {
    const { name, email, subject, message, rating, category } = req.body;
    const userId = (req as AuthRequest).user?._id;

    const feedback = await Feedback.create({
      userId,
      name,
      email,
      subject,
      message,
      rating,
      category,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
    });
  }
};

export const getFeedbacks = async (req: Request, res: Response) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedbacks',
    });
  }
};
