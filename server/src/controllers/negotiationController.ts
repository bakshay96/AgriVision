import { Request, Response } from 'express';
import Negotiation from '../models/Negotiation';
import Order from '../models/Order';
import Inventory from '../models/Inventory';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import { emitNegotiationUpdate } from '../services/socketService';

// ─── Helper ───────────────────────────────────────────────────────────────────────────────
const getTenantId = (req: AuthRequest): string => {
  return req.user?.tenantId || 'default';
};

// ─── Create Negotiation ───────────────────────────────────────────────────────────────────
export const createNegotiation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user?._id;
    const userRole = req.user?.role;
    
    const { inventoryId, proposedPricePerUnit, proposedQuantity, message } = req.body;
    
    if (!inventoryId || !proposedPricePerUnit || !proposedQuantity) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }
    
    // Get inventory details
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      res.status(404).json({ success: false, message: 'Inventory item not found' });
      return;
    }

    // Both BUYER and FARMER can initiate negotiation
    // A FARMER can initiate a proactive selling offer to a specific buyer (buyerId required)
    // A BUYER initiates offer on any inventory
    if (userRole !== 'BUYER' && userRole !== 'FARMER') {
      res.status(403).json({ success: false, message: 'Only buyers and farmers can initiate negotiations' });
      return;
    }

    // For FARMER: must own the inventory and must specify buyerId to send offer to
    if (userRole === 'FARMER') {
      if (inventory.farmerId.toString() !== userId?.toString()) {
        res.status(403).json({ success: false, message: 'You can only negotiate on your own inventory' });
        return;
      }
      if (!req.body.buyerId) {
        res.status(400).json({ success: false, message: 'buyerId is required for farmer-initiated negotiation' });
        return;
      }
    }

    const isFarmerInitiated = userRole === 'FARMER';
    const buyerId = isFarmerInitiated ? req.body.buyerId : userId;
    const farmerId = inventory.farmerId;

    // Check if active negotiation already exists
    const existingNegotiation = await Negotiation.findOne({
      tenantId,
      inventoryId,
      buyerId,
      status: { $in: ['pending', 'countered'] },
    });

    if (existingNegotiation) {
      res.status(400).json({ 
        success: false, 
        message: 'Active negotiation already exists for this item.' 
      });
      return;
    }

    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const negotiation = new Negotiation({
      tenantId,
      inventoryId,
      buyerId,
      farmerId,
      originalPricePerUnit: inventory.pricePerUnit,
      originalQuantity: inventory.quantity,
      proposedPricePerUnit,
      proposedQuantity,
      proposedBy: isFarmerInitiated ? 'farmer' : 'buyer',
      buyerMessage: isFarmerInitiated ? undefined : message,
      farmerMessage: isFarmerInitiated ? message : undefined,
      messages: [{
        senderId: userId,
        senderRole: isFarmerInitiated ? 'farmer' : 'buyer',
        message: message || (isFarmerInitiated
          ? `Special offer: ₹${proposedPricePerUnit}/${inventory.unit} for ${proposedQuantity} ${inventory.unit}.`
          : `I would like to negotiate the price. My offer: ₹${proposedPricePerUnit}/${inventory.unit} for ${proposedQuantity} ${inventory.unit}.`),
        proposedPrice: proposedPricePerUnit,
        proposedQuantity: proposedQuantity,
        timestamp: new Date(),
      }],
      status: 'pending',
      expiresAt,
    });

    await negotiation.save();

    const populated = await Negotiation.findById(negotiation._id)
      .populate('inventoryId', 'cropName variety images location pricePerUnit quantity unit')
      .populate('buyerId', 'name email phoneNumber')
      .populate('farmerId', 'name farmName email phoneNumber');

    res.status(201).json({
      success: true,
      message: 'Negotiation initiated successfully',
      data: { negotiation: populated },
    });

    // Notify the other party in real-time so their sidebar badge updates
    try {
      emitNegotiationUpdate(
        negotiation.buyerId.toString(),
        negotiation.farmerId.toString(),
        {
          negotiationId: negotiation._id.toString(),
          action: 'new',
          senderId: userId?.toString(),
          cropName: (populated?.inventoryId as any)?.cropName || '',
        }
      );
    } catch (e) { /* socket not critical */ }
  } catch (error: any) {
    console.error('[Negotiation] Create error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create negotiation' });
  }
};

// ─── Counter Offer ────────────────────────────────────────────────────────────────────────
export const counterOffer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;
    
    const { negotiationId } = req.params;
    const { counterPricePerUnit, counterQuantity, message } = req.body;
    
    // NOTE: Do NOT filter by tenantId — buyer and farmer each have unique tenantIds.
    // Ownership is verified by the buyerId/farmerId check below.
    const negotiation = await Negotiation.findOne({
      _id: negotiationId,
    });
    
    if (!negotiation) {
      res.status(404).json({ success: false, message: 'Negotiation not found' });
      return;
    }
    
    // Verify user is part of this negotiation
    if (negotiation.buyerId.toString() !== userId?.toString() && 
        negotiation.farmerId.toString() !== userId?.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    
    // Only pending or countered negotiations can be countered
    if (!['pending', 'countered'].includes(negotiation.status)) {
      res.status(400).json({ success: false, message: 'Cannot counter this negotiation' });
      return;
    }
    
    // Update counter offer
    negotiation.counterPricePerUnit = counterPricePerUnit;
    negotiation.counterQuantity = counterQuantity;
    negotiation.counterBy = userRole?.toLowerCase() as 'buyer' | 'farmer';
    
    if (userRole === 'BUYER') {
      negotiation.buyerMessage = message;
    } else {
      negotiation.farmerMessage = message;
    }
        
    // Add message to conversation thread
    negotiation.messages.push({
      senderId: userId,
      senderRole: userRole?.toLowerCase() as 'buyer' | 'farmer',
      message: message || `Counter offer: ₹${counterPricePerUnit}/unit for ${counterQuantity} units`,
      proposedPrice: counterPricePerUnit,
      proposedQuantity: counterQuantity,
      timestamp: new Date(),
    });
    
    negotiation.status = 'countered';
    
    // Reset expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    negotiation.expiresAt = expiresAt;
    
    await negotiation.save();
    
    res.status(200).json({
      success: true,
      message: 'Counter offer submitted',
      data: { negotiation },
    });

    // Emit real-time update
    try {
      emitNegotiationUpdate(
        negotiation.buyerId.toString(),
        negotiation.farmerId.toString(),
        { negotiationId: negotiation._id.toString(), action: 'counter', senderId: userId?.toString() }
      );
    } catch (e) { /* socket not critical */ }
  } catch (error: any) {
    console.error('[Negotiation] Counter error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit counter offer' });
  }
};

// ─── Accept Negotiation ───────────────────────────────────────────────────────────────────
export const acceptNegotiation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req); // still needed for new Order creation
    const userId = req.user?._id;
    const userRole = req.user?.role;
    
    const { negotiationId } = req.params;
    
    // NOTE: Do NOT filter by tenantId — buyer and farmer each have unique tenantIds.
    // Ownership is verified by the buyerId/farmerId check below.
    const negotiation = await Negotiation.findOne({
      _id: negotiationId,
    });
    
    if (!negotiation) {
      res.status(404).json({ success: false, message: 'Negotiation not found' });
      return;
    }
    
    // Verify user is part of this negotiation
    if (negotiation.buyerId.toString() !== userId?.toString() && 
        negotiation.farmerId.toString() !== userId?.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    
    // Cannot accept your own offer
    if (negotiation.proposedBy === userRole?.toLowerCase() && !negotiation.counterBy) {
      res.status(400).json({ success: false, message: 'Cannot accept your own offer' });
      return;
    }
    
    // If counter exists, acceptor should not be the one who countered
    if (negotiation.counterBy === userRole?.toLowerCase()) {
      res.status(400).json({ success: false, message: 'Cannot accept your own counter offer' });
      return;
    }
    
    // Determine agreed values
    const agreedPrice = negotiation.counterPricePerUnit || negotiation.proposedPricePerUnit;
    const agreedQuantity = negotiation.counterQuantity || negotiation.proposedQuantity;
    
    negotiation.status = 'accepted';
    negotiation.agreedPricePerUnit = agreedPrice;
    negotiation.agreedQuantity = agreedQuantity;
    negotiation.agreedAt = new Date();
    
    await negotiation.save();
    
    // Create order from negotiation
    const inventory = await Inventory.findById(negotiation.inventoryId);
    if (!inventory) {
      res.status(404).json({ success: false, message: 'Inventory not found' });
      return;
    }

    // Deduct agreed quantity from inventory
    if (inventory.quantity < agreedQuantity) {
      res.status(400).json({ success: false, message: 'Insufficient inventory quantity for agreed amount' });
      return;
    }
    inventory.quantity -= agreedQuantity;
    inventory.totalOrders += 1;
    await inventory.save();

    // Determine who accepted: pre-fill their deal confirmation
    const acceptorIsBuyer = userRole === 'BUYER';
    const dealConfirmationStatus = acceptorIsBuyer ? 'buyer_confirmed' : 'farmer_confirmed';

    const order = new Order({
      tenantId,
      buyerId: negotiation.buyerId,
      farmerId: negotiation.farmerId,
      negotiationId: negotiation._id,
      items: [{
        inventoryId: negotiation.inventoryId,
        cropName: inventory.cropName,
        variety: inventory.variety,
        quantity: agreedQuantity,
        unit: inventory.unit,
        pricePerUnit: agreedPrice,
        totalPrice: agreedQuantity * agreedPrice,
      }],
      totalAmount: agreedQuantity * agreedPrice,
      currency: inventory.currency,
      // Start as 'pending' so the OTHER party sees it and can confirm the deal
      status: 'pending',
      shippingAddress: {
        street: '',
        city: inventory.location?.city || '',
        state: inventory.location?.state || '',
        pinCode: inventory.location?.pin || '',
        country: inventory.location?.country || 'IN',
      },
      agreedPricePerUnit: agreedPrice,
      agreedQuantity: agreedQuantity,
      dealConfirmation: {
        status: dealConfirmationStatus as any,
        buyerConfirmedAt: acceptorIsBuyer ? new Date() : undefined,
        buyerNotes: acceptorIsBuyer ? 'Accepted via negotiation' : undefined,
        farmerConfirmedAt: !acceptorIsBuyer ? new Date() : undefined,
        farmerNotes: !acceptorIsBuyer ? 'Accepted via negotiation' : undefined,
      },
      verification: {
        requestedQuantity: agreedQuantity,
        quantityUnit: inventory.unit,
      },
      procurement: {
        arrangedBy: 'buyer',
      },
    });
    
    await order.save();
    
    // Update negotiation with order reference
    negotiation.orderId = order._id;
    await negotiation.save();
    
    res.status(200).json({
      success: true,
      message: 'Negotiation accepted and order created',
      data: { negotiation, order },
    });

    // Emit real-time update
    try {
      emitNegotiationUpdate(
        negotiation.buyerId.toString(),
        negotiation.farmerId.toString(),
        { negotiationId: negotiation._id.toString(), action: 'accepted', orderId: order._id.toString() }
      );
    } catch (e) { /* socket not critical */ }
  } catch (error: any) {
    console.error('[Negotiation] Accept error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to accept negotiation' });
  }
};

// ─── Reject Negotiation ───────────────────────────────────────────────────────────────────
export const rejectNegotiation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    const { negotiationId } = req.params;
    const { reason } = req.body;
    
    // NOTE: Do NOT filter by tenantId — buyer and farmer each have unique tenantIds.
    // Ownership is verified by the buyerId/farmerId check below.
    const negotiation = await Negotiation.findOne({
      _id: negotiationId,
    });
    
    if (!negotiation) {
      res.status(404).json({ success: false, message: 'Negotiation not found' });
      return;
    }
    
    // Verify user is part of this negotiation
    if (negotiation.buyerId.toString() !== userId?.toString() && 
        negotiation.farmerId.toString() !== userId?.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    
    negotiation.status = 'rejected';
    await negotiation.save();

    // Emit real-time update
    try {
      emitNegotiationUpdate(
        negotiation.buyerId.toString(),
        negotiation.farmerId.toString(),
        { negotiationId: negotiation._id.toString(), action: 'rejected' }
      );
    } catch (e) { /* socket not critical */ }

    res.status(200).json({
      success: true,
      message: 'Negotiation rejected',
      data: { negotiation },
    });
  } catch (error: any) {
    console.error('[Negotiation] Reject error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reject negotiation' });
  }
};

// ─── Get My Negotiations ──────────────────────────────────────────────────────────────────
export const getMyNegotiations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const { status } = req.query;
    
    // NOTE: Do NOT filter by tenantId here.
    // Each registered user gets a unique tenantId (UUID), so buyer and farmer have
    // different tenantIds. Filtering by tenantId would hide cross-user negotiations.
    // Ownership is guaranteed by buyerId / farmerId matching.
    const query: any = {};
    
    if (userRole === 'BUYER') {
      query.buyerId = userId;
    } else {
      query.farmerId = userId;
    }
    
    if (status) {
      query.status = status;
    }
    
    const negotiations = await Negotiation.find(query)
      .populate('inventoryId', 'cropName variety images location pricePerUnit quantity unit')
      .populate('buyerId', 'name email phoneNumber')
      .populate('farmerId', 'name farmName email phoneNumber')
      .populate('orderId', 'orderNumber status')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: { negotiations },
    });
  } catch (error: any) {
    console.error('[Negotiation] Get error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch negotiations' });
  }
};

// ─── Send Message in Negotiation Thread ────────────────────────────────────────────────────────────
export const sendNegotiationMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const { negotiationId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, message: 'Message cannot be empty' });
      return;
    }

    // NOTE: Do NOT filter by tenantId — buyer and farmer each have unique tenantIds.
    // Ownership is verified by the buyerId/farmerId check below.
    const negotiation = await Negotiation.findOne({ _id: negotiationId });

    if (!negotiation) {
      res.status(404).json({ success: false, message: 'Negotiation not found' });
      return;
    }

    if (negotiation.buyerId.toString() !== userId?.toString() &&
        negotiation.farmerId.toString() !== userId?.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    if (['accepted', 'rejected', 'expired'].includes(negotiation.status)) {
      res.status(400).json({ success: false, message: 'Cannot message on a closed negotiation' });
      return;
    }

    negotiation.messages.push({
      senderId: userId,
      senderRole: userRole?.toLowerCase() as 'buyer' | 'farmer',
      message: message.trim(),
      timestamp: new Date(),
    });

    await negotiation.save();

    const updated = await Negotiation.findById(negotiation._id)
      .populate('inventoryId', 'cropName variety images location pricePerUnit quantity unit')
      .populate('buyerId', 'name email phoneNumber')
      .populate('farmerId', 'name farmName email phoneNumber');

    res.status(200).json({ success: true, message: 'Message sent', data: { negotiation: updated } });

    // Emit real-time notification to both parties
    try {
      emitNegotiationUpdate(
        negotiation.buyerId.toString(),
        negotiation.farmerId.toString(),
        { negotiationId: negotiation._id.toString(), action: 'message', senderId: userId?.toString() }
      );
    } catch (e) { /* socket not critical */ }
  } catch (error: any) {
    console.error('[Negotiation] Message error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send message' });
  }
};

// ─── Get Single Negotiation ───────────────────────────────────────────────────────────────
export const getNegotiationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { negotiationId } = req.params;
    
    // NOTE: Do NOT filter by tenantId — buyer and farmer each have unique tenantIds.
    // Ownership is verified by the buyerId/farmerId check below.
    const negotiation = await Negotiation.findOne({ _id: negotiationId })
      .populate('inventoryId', 'cropName variety images location pricePerUnit quantity unit')
      .populate('buyerId', 'name email phoneNumber')
      .populate('farmerId', 'name farmName email phoneNumber')
      .populate('orderId', 'orderNumber status');
    
    if (!negotiation) {
      res.status(404).json({ success: false, message: 'Negotiation not found' });
      return;
    }
    
    // Verify user is part of this negotiation
    // After populate(), buyerId/farmerId are objects — extract _id for comparison
    const buyerIdStr = ((negotiation.buyerId as any)?._id || negotiation.buyerId).toString();
    const farmerIdStr = ((negotiation.farmerId as any)?._id || negotiation.farmerId).toString();
    const userIdStr = userId?.toString();

    if (buyerIdStr !== userIdStr && farmerIdStr !== userIdStr) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: { negotiation },
    });
  } catch (error: any) {
    console.error('[Negotiation] Get by ID error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch negotiation' });
  }
};
