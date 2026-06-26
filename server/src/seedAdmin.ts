import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://akshaymaliedu_db_user:akshay@cluster0.o9hauwk.mongodb.net/agrivision_pro?appName=agri_vision_pro&retryWrites=true&w=majority';

async function seedAdmin() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    const adminEmail = 'admin@agrivision.com';
    const adminPassword = 'AdminPassword123';

    // Check if user already exists
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log(`User with email ${adminEmail} already exists. Updating role to ADMIN and ensuring active status...`);
      existing.role = 'ADMIN';
      existing.isActive = true;
      existing.password = adminPassword; // Triggers password pre-save hash
      await existing.save();
      console.log('Admin credentials updated successfully.');
    } else {
      console.log('Creating new Master Admin user...');
      const admin = await User.create({
        name: 'Master Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN',
        tenantId: 'admin-tenant-global',
        isActive: true,
        state: 'Maharashtra',
      });
      console.log('Admin user created successfully:', {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        tenantId: admin.tenantId,
      });
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedAdmin();
