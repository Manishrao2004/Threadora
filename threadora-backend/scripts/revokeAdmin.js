const mongoose = require('mongoose');
const User = require('../src/models/User');
const { MONGODB_URI } = require('../src/config/env');

const revokeAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    const result = await User.updateMany({}, { role: 'user' });
    console.log(`Successfully reset ${result.modifiedCount} users to user role.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

revokeAdmin();
