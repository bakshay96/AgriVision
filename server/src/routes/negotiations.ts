import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  createNegotiation,
  counterOffer,
  acceptNegotiation,
  rejectNegotiation,
  getMyNegotiations,
  getNegotiationById,
  sendNegotiationMessage,
} from '../controllers/negotiationController';

const router = Router();

// All routes require authentication
router.use(protect);

// Get my negotiations
router.get('/', getMyNegotiations);

// Get single negotiation
router.get('/:negotiationId', getNegotiationById);

// Create new negotiation
router.post('/', createNegotiation);

// Counter offer
router.post('/:negotiationId/counter', counterOffer);

// Accept negotiation
router.post('/:negotiationId/accept', acceptNegotiation);

// Reject negotiation
router.post('/:negotiationId/reject', rejectNegotiation);

// Send message
router.post('/:negotiationId/message', sendNegotiationMessage);

export default router;

