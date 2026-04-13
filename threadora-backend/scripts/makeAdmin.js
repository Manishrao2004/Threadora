const mongoose = require('mongoose');
const User = require('../src/models/User');
const { MONGODB_URI } = require('../src/config/env');

const makeAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    // Update all existing users to be admins for testing purposes
    const result = await User.updateMany({}, { role: 'admin' });
    console.log(`Successfully updated ${result.modifiedCount} users to admin role.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

makeAdmin();
