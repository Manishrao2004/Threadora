require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/threadora';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');

    const email = 'superadmin@test.com';
    const password = 'password123';
    const username = 'SuperAdmin';

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      console.log('User already exists. Updating role to admin and resetting password...');
      user.role = 'admin';
      user.passwordHash = password; // mongoose hooks will handle hashing
      await user.save();
      console.log('User updated successfully!');
    } else {
      console.log('Creating new admin user...');
      user = new User({
        username,
        email,
        passwordHash: password, // mongoose hooks will handle hashing
        role: 'admin'
      });
      await user.save();
      console.log('Admin created successfully!');
    }

    console.log(`\nCredentials:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}\n`);
    
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
