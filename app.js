// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Connect to MongoDB
//mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/', {
//  useNewUrlParser: true,
//  useUnifiedTopology: true,
//});

 //Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://babyTrackerDev:babyTrackerDev@babytracker.ucvqdzt.mongodb.net/?retryWrites=true&w=majority&appName=BabyTracker', {
 useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schemas
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const recordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id: { type: Number, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  type: { type: String, required: true }, // 'feeding' or 'diaper'
  feedingType: { type: String }, // For feeding records
  diaperType: { type: String }, // For diaper records
  details: { type: String },
  amount: { type: Number }, // For feeding records
  timestamp: { type: Number, required: true }
});

// Create models
const User = mongoose.model('User', userSchema);
const Record = mongoose.model('Record', recordSchema);

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
    req.user = { _id: decoded._id };
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// User registration
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      name
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'default_secret_key', {
      expiresIn: '7d'
    });
    
    res.status(201).json({ user: { id: user._id, email: user.email, name: user.name }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User login
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'default_secret_key', {
      expiresIn: '7d'
    });
    
    res.json({ user: { id: user._id, email: user.email, name: user.name }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create/update record
app.post('/api/records', auth, async (req, res) => {
  try {
    const { id, date, time, type, feedingType, diaperType, details, amount, timestamp } = req.body;
    
    // Check if record exists (for updates)
    let record = await Record.findOne({ user: req.user._id, id });
    
    if (record) {
      // Update existing record
      record.date = date;
      record.time = time;
      record.type = type;
      if (type === 'feeding') {
        record.feedingType = feedingType;
        record.amount = amount;
      } else {
        record.diaperType = diaperType;
      }
      record.details = details;
      record.timestamp = timestamp;
      
      await record.save();
    } else {
      // Create new record
      record = new Record({
        user: req.user._id,
        id,
        date,
        time,
        type,
        feedingType: type === 'feeding' ? feedingType : undefined,
        diaperType: type === 'diaper' ? diaperType : undefined,
        details,
        amount: type === 'feeding' ? amount : undefined,
        timestamp
      });
      
      await record.save();
    }
    
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all records for a user
app.get('/api/records', auth, async (req, res) => {
  try {
    const records = await Record.find({ user: req.user._id });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a record
app.delete('/api/records/:id', auth, async (req, res) => {
  try {
    const record = await Record.findOneAndDelete({ 
      user: req.user._id, 
      id: req.params.id 
    });
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json({ message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});