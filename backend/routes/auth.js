// Register route
router.post('/register', async (req, res) => {
  try {
    const { organizationName, username, password, province, district, municipality } = req.body;

    // Validation
    if (!organizationName || !username || !password || !province || !district || !municipality) {
      return res.status(400).json({ 
        message: 'All fields are required including location details' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      organizationName,
      username,
      password: hashedPassword,
      location: {
        province,
        district,
        municipality
      }
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        organizationName: user.organizationName,
        username: user.username,
        location: user.location
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Get user info route
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      organizationName: user.organizationName,
      username: user.username,
      location: user.location
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'Server error' });
  }
}); 