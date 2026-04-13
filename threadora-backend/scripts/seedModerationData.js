require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Thread = require('../src/models/Thread');
const Comment = require('../src/models/Comment');
const Report = require('../src/models/Report');
const Category = require('../src/models/Category');
const SystemConfig = require('../src/models/SystemConfig');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/threadora');
    console.log('Connected to DB');

    // 1. Ensure System Config blocklist is active
    let config = await SystemConfig.findOne();
    if (!config) config = new SystemConfig();
    const toxicWords = ['spamtest', 'bannedword', 'toxicpost', 'scamurl'];
    config.blockedKeywords = [...new Set([...(config.blockedKeywords || []), ...toxicWords])];
    await config.save();
    console.log('Blocked words seeded:', toxicWords);

    // 2. Fetch or create Categories
    let category = await Category.findOne();
    if (!category) {
        category = await Category.create({ name: 'General', description: 'General Tech' });
    }

    // 3. Create 50 Users with varying credibility
    console.log('Creating 50 users...');
    const users = [];
    const roles = ['user', 'user', 'user', 'user', 'admin'];
    
    for (let i = 0; i < 50; i++) {
      // Create interesting distributions
      let score = 0;
      let isSuspended = false;
      
      const rand = Math.random();
      if (rand > 0.9) score = 25; // Highly Trusted
      else if (rand > 0.7) score = 10; // Trusted
      else if (rand > 0.4) score = 0; // Newcomer
      else if (rand > 0.1) score = -15; // Warning
      else { score = -60; isSuspended = true; } // Suspended

      users.push({
        username: `testuser_${i}_${Date.now()}`,
        email: `testuser${i}_${Date.now()}@example.com`,
        passwordHash: 'dummyhash',
        role: roles[Math.floor(Math.random() * roles.length)],
        credibilityScore: score,
        isSuspended: isSuspended,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
      });
    }
    const createdUsers = await User.insertMany(users);
    console.log('50 users inserted.');

    // 4. Create 150 Threads (Mix of normal and auto-flagged)
    console.log('Creating 150 threads...');
    const threads = [];
    
    for (let i = 0; i < 150; i++) {
      const author = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      
      // about 10% auto-flagged
      const isAutoFlagged = Math.random() < 0.1;
      const content = isAutoFlagged 
          ? `Check out this amazing scamurl to get free points. This is definitely a spamtest string!`
          : `This is a regular discussion regarding topic ${i}. I'm curious what everyone thinks of the new updates. Has anyone tried deploying this yet?`;
      
      const upvotes = Math.floor(Math.random() * 50);
      const downvotes = Math.floor(Math.random() * 10);

      threads.push({
        title: isAutoFlagged ? `Warning: Click this link! ${i}` : `Discussion Topic #${i}`,
        content,
        authorId: author._id,
        categoryId: category._id,
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        moderationStatus: isAutoFlagged ? 'flagged' : 'approved',
        isHidden: isAutoFlagged,
        systemFlagReason: isAutoFlagged ? 'Contains blocked keywords: scamurl' : null,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 5000000000))
      });
    }
    
    const createdThreads = await Thread.insertMany(threads);
    console.log('150 threads inserted.');

    // 5. Create 300 Comments (Some nested, some auto-flagged)
    console.log('Creating 300 comments...');
    const comments = [];
    for (let i = 0; i < 300; i++) {
       const author = createdUsers[Math.floor(Math.random() * createdUsers.length)];
       const targetThread = createdThreads[Math.floor(Math.random() * createdThreads.length)];
       
       const isAutoFlagged = Math.random() < 0.05; // 5% flagged
       const content = isAutoFlagged 
          ? `You are so toxicpost! Get out using bannedword.`
          : `I completely agree with this analysis on thread ${targetThread.title}. Great insights!`;
       
       const upvotes = Math.floor(Math.random() * 20);

       comments.push({
         threadId: targetThread._id,
         authorId: author._id,
         content,
         upvotes,
         score: upvotes,
         moderationStatus: isAutoFlagged ? 'flagged' : 'approved',
         isHidden: isAutoFlagged,
         systemFlagReason: isAutoFlagged ? 'Contains blocked keywords: toxicpost' : null,
         createdAt: new Date(Date.now() - Math.floor(Math.random() * 2000000000))
       });
    }
    const createdComments = await Comment.insertMany(comments);
    
    // Add some random replies
    for (let i = 0; i < 50; i++) {
       const author = createdUsers[Math.floor(Math.random() * createdUsers.length)];
       const parentComment = createdComments[Math.floor(Math.random() * createdComments.length)];
       await Comment.create({
         threadId: parentComment.threadId,
         parentId: parentComment._id,
         authorId: author._id,
         content: `replying to comment: adding extra insights!`,
         moderationStatus: 'approved'
       });
    }

    console.log('Comments and replies inserted.');

    // 6. Create Random User Reports
    console.log('Creating User Reports...');
    for (let i = 0; i < 20; i++) {
        const reporter = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        
        // 50% chance thread, 50% chance comment report
        const isThreadReport = Math.random() > 0.5;
        const reasons = ['spam', 'harassment', 'illegal', 'other'];
        
        if (isThreadReport) {
             const t = createdThreads[Math.floor(Math.random() * createdThreads.length)];
             await Report.create({
                 threadId: t._id,
                 reportedBy: reporter._id,
                 reason: reasons[Math.floor(Math.random() * reasons.length)]
             });
        } else {
             const c = createdComments[Math.floor(Math.random() * createdComments.length)];
             await Report.create({
                 commentId: c._id,
                 reportedBy: reporter._id,
                 reason: reasons[Math.floor(Math.random() * reasons.length)]
             });
        }
    }
    
    console.log('Data generation successful! Your dashboard and moderation queues are fully populated with rich data.');
    process.exit(0);

  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seedData();
