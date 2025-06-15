//basic setup for a Node.js backend using Express model

import express from "express"
import "dotenv/config"
import cors from "cors"
import mongoose from "mongoose"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import PDFDocument from "pdfkit"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here"

// SuperAdmin credentials from environment
const SUPERADMIN_USERNAME = process.env.SUPERADMIN_USERNAME || "superadmin"
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || "superadmin123"

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Serve static files from uploads directory
app.use("/uploads", express.static(uploadsDir))

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// User Schema
const userSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  location: {
    province: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    municipality: {
      type: String,
      required: true,
    }
  },
  licenseKey: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin',
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
})

const User = mongoose.model("User", userSchema)

// License Key Schema
const licenseKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
})

const LicenseKey = mongoose.model("LicenseKey", licenseKeySchema)

// Service Schema (updated to include user reference)
const serviceSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true,
  },
  documents: [{
    type: String,
    required: true,
  }],
  procedure: {
    type: String,
    required: true,
  },
  estimatedTime: {
    type: String,
    required: true,
  },
  charge: {
    type: String,
    required: true,
  },
  sampleFormUrl: {
    type: String,
    default: "",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Token system fields
  tokensEnabled: {
    type: Boolean,
    default: false,
  },
  dailyTokenLimit: {
    type: Number,
    default: 0,
  },
  tokensIssued: {
    type: Number,
    default: 0,
  },
  lastTokenReset: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

const Service = mongoose.model("Service", serviceSchema)

// Service Bundle Schema
const serviceBundleSchema = new mongoose.Schema({
  bundleName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  }],
  location: {
    province: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    municipality: {
      type: String,
      required: true,
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
})

const ServiceBundle = mongoose.model("ServiceBundle", serviceBundleSchema)

// Assistance Request Schema
const assistanceRequestSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  userContact: {
    type: String,
    required: true,
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    default: null,
  },
  bundleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceBundle',
    default: null,
  },
  requestType: {
    type: String,
    enum: ['service', 'bundle'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'resolved'],
    default: 'pending',
  },
  notes: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
})

const AssistanceRequest = mongoose.model("AssistanceRequest", assistanceRequestSchema)

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// Middleware to verify superadmin role
const authenticateSuperAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    if (user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Superadmin access required' })
    }
    req.user = user
    next()
  })
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true)
    } else {
      cb(new Error("Only PDF files are allowed!"), false)
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// Authentication Routes

// POST /api/auth/register - Register new admin
app.post("/api/auth/register", async (req, res) => {
  try {
    const { organizationName, username, password, province, district, municipality, licenseKey } = req.body

    // Validate input
    if (!organizationName || !username || !password || !province || !district || !municipality || !licenseKey) {
      return res.status(400).json({ error: "All fields including license key are required" })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" })
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" })
    }

    // Validate license key - all users need valid license keys
    const license = await LicenseKey.findOne({ key: licenseKey, isUsed: false })
    if (!license) {
      return res.status(400).json({ error: "Invalid or already used license key" })
    }

    // Check if license is expired
    if (license.expiresAt && license.expiresAt < new Date()) {
      return res.status(400).json({ error: "License key has expired" })
    }

    // Mark license as used
    license.isUsed = true
    await license.save()

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create new user - always as regular admin
    const user = new User({
      organizationName,
      username,
      password: hashedPassword,
      location: {
        province,
        district,
        municipality
      },
      licenseKey,
      role: 'admin', // Always create as regular admin
      isActive: true
    })

    const savedUser = await user.save()

    // Update license with user reference
    license.usedBy = savedUser._id
    await license.save()

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: savedUser._id, 
        username: savedUser.username,
        organizationName: savedUser.organizationName,
        location: savedUser.location,
        role: savedUser.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: savedUser._id,
        organizationName: savedUser.organizationName,
        username: savedUser.username,
        location: savedUser.location,
        role: savedUser.role
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/auth/login - Login admin
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" })
    }

    // Find user
    const user = await User.findOne({ username, isActive: true })
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password" })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        organizationName: user.organizationName,
        location: user.location,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        organizationName: user.organizationName,
        username: user.username,
        location: user.location,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/auth/superadmin-login - SuperAdmin login with env credentials
app.post("/api/auth/superadmin-login", async (req, res) => {
  try {
    const { username, password } = req.body

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" })
    }

    // Check against environment credentials
    if (username !== SUPERADMIN_USERNAME || password !== SUPERADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid superadmin credentials" })
    }

    // Generate JWT token for superadmin
    const token = jwt.sign(
      { 
        userId: 'superadmin', 
        username: SUPERADMIN_USERNAME,
        organizationName: 'System Administration',
        location: { province: 'System', district: 'System', municipality: 'System' },
        role: 'superadmin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      message: "SuperAdmin login successful",
      token,
      user: {
        id: 'superadmin',
        organizationName: 'System Administration',
        username: SUPERADMIN_USERNAME,
        location: { province: 'System', district: 'System', municipality: 'System' },
        role: 'superadmin'
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Service Routes (Updated for user-specific services)

// GET /api/services?q= - Search services by keyword (public - shows all services)
app.get("/api/services", async (req, res) => {
  try {
    const { q, province, district, municipality } = req.query
    let query = {}
    
    if (q) {
      // Search across multiple fields for better results
      query = {
        $or: [
          { serviceName: { $regex: q, $options: "i" } },
          { documents: { $elemMatch: { $regex: q, $options: "i" } } },
          { procedure: { $regex: q, $options: "i" } }
        ]
      }
    }
    
    const services = await Service.find(query).populate('userId', 'organizationName location')
    
    // Filter by location if provided
    let filteredServices = services;
    if (province || district || municipality) {
      filteredServices = services.filter(service => {
        if (!service.userId || !service.userId.location) return false;
        
        const userLocation = service.userId.location;
        
        if (province && userLocation.province.toLowerCase() !== province.toLowerCase()) {
          return false;
        }
        if (district && userLocation.district.toLowerCase() !== district.toLowerCase()) {
          return false;
        }
        if (municipality && userLocation.municipality.toLowerCase() !== municipality.toLowerCase()) {
          return false;
        }
        
        return true;
      });
    }
    
    res.json(filteredServices)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/services/:id - Get full detail of a specific service (public)
app.get("/api/services/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('userId', 'organizationName')
    if (!service) {
      return res.status(404).json({ error: "Service not found" })
    }
    res.json(service)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/admin/services - Get services for logged-in admin only
app.get("/api/admin/services", authenticateToken, async (req, res) => {
  try {
    const services = await Service.find({ userId: req.user.userId })
    res.json(services)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/admin/services - Add new service (admin only)
app.post("/api/admin/services", authenticateToken, async (req, res) => {
  try {
    const { serviceName, documents, procedure, estimatedTime, charge, sampleFormUrl, tokensEnabled, dailyTokenLimit } = req.body
    
    const service = new Service({
      serviceName,
      documents,
      procedure,
      estimatedTime,
      charge,
      sampleFormUrl: sampleFormUrl || "",
      userId: req.user.userId,
      tokensEnabled: tokensEnabled === true || tokensEnabled === 'true',
      dailyTokenLimit: tokensEnabled === true || tokensEnabled === 'true' ? parseInt(dailyTokenLimit) || 0 : 0,
      tokensIssued: 0,
      lastTokenReset: new Date()
    })
    
    await service.save()
    res.status(201).json(service)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// PUT /api/admin/services/:id - Update service (admin only, own services)
app.put("/api/admin/services/:id", authenticateToken, async (req, res) => {
  try {
    const { serviceName, documents, procedure, estimatedTime, charge, sampleFormUrl, tokensEnabled, dailyTokenLimit } = req.body
    
    const service = await Service.findOne({ _id: req.params.id, userId: req.user.userId })
    if (!service) {
      return res.status(404).json({ error: "Service not found or unauthorized" })
    }

    const tokenEnabledBool = tokensEnabled === true || tokensEnabled === 'true';
    const dailyTokenLimitInt = tokenEnabledBool ? parseInt(dailyTokenLimit) || 0 : 0;

    const updateData = {
      serviceName,
      documents,
      procedure,
      estimatedTime,
      charge,
      sampleFormUrl: sampleFormUrl || "",
      tokensEnabled: tokenEnabledBool,
      dailyTokenLimit: dailyTokenLimitInt,
    };

    // Reset token count if token settings changed
    if (service.tokensEnabled !== tokenEnabledBool || service.dailyTokenLimit !== dailyTokenLimitInt) {
      updateData.tokensIssued = 0;
      updateData.lastTokenReset = new Date();
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    
    res.json(updatedService)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/admin/services/:id - Delete service (admin only, own services)
app.delete("/api/admin/services/:id", authenticateToken, async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, userId: req.user.userId })
    if (!service) {
      return res.status(404).json({ error: "Service not found or unauthorized" })
    }
    
    // Delete associated file if exists
    if (service.sampleFormUrl) {
      const filePath = path.join(__dirname, "..", service.sampleFormUrl)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await Service.findByIdAndDelete(req.params.id)
    res.json({ message: "Service deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/upload - Upload and serve PDF sample form (admin only)
app.post("/api/upload", authenticateToken, upload.single("sampleForm"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }
    
    const fileUrl = `/uploads/${req.file.filename}`
    res.json({ 
      message: "File uploaded successfully",
      fileUrl: fileUrl 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/auth/me - Get current user info
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password')
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/locations - Get unique locations for search filters
app.get("/api/locations", async (req, res) => {
  try {
    const users = await User.find({}, 'location')
    
    const provinces = [...new Set(users.map(user => user.location.province))].sort()
    const districts = [...new Set(users.map(user => user.location.district))].sort()
    const municipalities = [...new Set(users.map(user => user.location.municipality))].sort()
    
    res.json({
      provinces,
      districts,
      municipalities
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/organization-services - Get services grouped by organization (public)
app.get("/api/organization-services", async (req, res) => {
  try {
    const services = await Service.find({}).populate('userId', 'organizationName location')
    
    // Group services by organization
    const organizationMap = new Map()
    
    services.forEach(service => {
      if (service.userId) {
        const orgName = service.userId.organizationName
        const orgLocation = service.userId.location
        
        if (!organizationMap.has(orgName)) {
          organizationMap.set(orgName, {
            organizationName: orgName,
            location: orgLocation,
            services: [],
            totalServices: 0
          })
        }
        
        organizationMap.get(orgName).services.push({
          _id: service._id,
          serviceName: service.serviceName,
          estimatedTime: service.estimatedTime,
          charge: service.charge,
          tokensEnabled: service.tokensEnabled
        })
        organizationMap.get(orgName).totalServices++
      }
    })
    
    // Convert map to array and sort by number of services (descending)
    const organizationServices = Array.from(organizationMap.values())
      .sort((a, b) => b.totalServices - a.totalServices)
      .slice(0, 12) // Limit to top 12 organizations
    
    res.json(organizationServices)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/services/:id/token - Request a token for a service
app.post("/api/services/:id/token", async (req, res) => {
  try {
    const { id } = req.params;
    const { userName, userContact } = req.body;

    if (!userName || !userContact) {
      return res.status(400).json({ error: "User name and contact are required" });
    }

    const service = await Service.findById(id).populate('userId', 'organizationName location');
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    if (!service.tokensEnabled) {
      return res.status(400).json({ error: "Tokens are not enabled for this service" });
    }

    // Check if we need to reset daily tokens
    const today = new Date();
    const lastReset = new Date(service.lastTokenReset);
    const isNewDay = today.toDateString() !== lastReset.toDateString();

    if (isNewDay) {
      service.tokensIssued = 0;
      service.lastTokenReset = today;
    }

    // Check if tokens are available
    if (service.tokensIssued >= service.dailyTokenLimit) {
      return res.status(400).json({ error: "Daily token limit reached. Please try again tomorrow." });
    }

    // Increment token count
    service.tokensIssued += 1;
    const tokenNumber = service.tokensIssued;
    await service.save();

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const filename = `token-${service._id}-${tokenNumber}-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, "../uploads", filename);

    // Create write stream
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // PDF Header
    doc.fontSize(24)
       .fillColor('#1f2937')
       .text('SERVICE TOKEN', { align: 'center' })
       .moveDown(0.5);

    // Token number with styling
    doc.fontSize(18)
       .fillColor('#dc2626')
       .text(`Token #${tokenNumber}`, { align: 'center' })
       .moveDown(0.5);

    // Date and time
    doc.fontSize(12)
       .fillColor('#6b7280')
       .text(`Generated on: ${today.toLocaleDateString()} at ${today.toLocaleTimeString()}`, { align: 'center' })
       .moveDown(1);

    // Draw a line
    doc.strokeColor('#e5e7eb')
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()
       .moveDown(1);

    // Service Details Section
    doc.fontSize(16)
       .fillColor('#1f2937')
       .text('SERVICE DETAILS', { underline: true })
       .moveDown(0.5);

    doc.fontSize(12)
       .fillColor('#374151')
       .text(`Service Name: ${service.serviceName}`, { indent: 20 })
       .moveDown(0.3)
       .text(`Estimated Time: ${service.estimatedTime}`, { indent: 20 })
       .moveDown(0.3)
       .text(`Service Charge: ${service.charge}`, { indent: 20 })
       .moveDown(1);

    // Organization Details Section
    doc.fontSize(16)
       .fillColor('#1f2937')
       .text('ORGANIZATION DETAILS', { underline: true })
       .moveDown(0.5);

    doc.fontSize(12)
       .fillColor('#374151')
       .text(`Organization: ${service.userId.organizationName}`, { indent: 20 })
       .moveDown(0.3);

    if (service.userId.location) {
      doc.text(`Location: ${service.userId.location.municipality}, ${service.userId.location.district}, ${service.userId.location.province}`, { indent: 20 })
         .moveDown(1);
    } else {
      doc.moveDown(1);
    }

    // User Details Section
    doc.fontSize(16)
       .fillColor('#1f2937')
       .text('APPLICANT DETAILS', { underline: true })
       .moveDown(0.5);

    doc.fontSize(12)
       .fillColor('#374151')
       .text(`Name: ${userName}`, { indent: 20 })
       .moveDown(0.3)
       .text(`Contact: ${userContact}`, { indent: 20 })
       .moveDown(1);

    // Required Documents Section
    doc.fontSize(16)
       .fillColor('#1f2937')
       .text('REQUIRED DOCUMENTS', { underline: true })
       .moveDown(0.5);

    doc.fontSize(12)
       .fillColor('#374151');

    service.documents.forEach((document, index) => {
      doc.text(`${index + 1}. ${document}`, { indent: 20 })
         .moveDown(0.2);
    });

    doc.moveDown(1);

    // Important Notes Section
    doc.fontSize(16)
       .fillColor('#1f2937')
       .text('IMPORTANT NOTES', { underline: true })
       .moveDown(0.5);

    doc.fontSize(11)
       .fillColor('#dc2626')
       .text('• Please bring all required documents listed above', { indent: 20 })
       .moveDown(0.2)
       .text('• This token is valid for today only', { indent: 20 })
       .moveDown(0.2)
       .text('• Arrive at the office during working hours', { indent: 20 })
       .moveDown(0.2)
       .text('• Keep this token with you at all times during your visit', { indent: 20 })
       .moveDown(1);

    // Footer
    doc.fontSize(10)
       .fillColor('#9ca3af')
       .text('This is a computer-generated token. No signature required.', { align: 'center' });

    // Finalize the PDF
    doc.end();

    // Wait for the PDF to be completely written before sending response
    stream.on('finish', () => {
      // Check if file exists and has content
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        if (stats.size > 0) {
          res.download(filepath, filename, (err) => {
            if (err) {
              console.error('Error downloading file:', err);
              res.status(500).json({ error: 'Error generating token' });
            } else {
              // Clean up file after download
              setTimeout(() => {
                if (fs.existsSync(filepath)) {
                  fs.unlinkSync(filepath);
                }
              }, 10000); // Delete after 10 seconds
            }
          });
        } else {
          res.status(500).json({ error: 'Generated PDF is empty' });
        }
      } else {
        res.status(500).json({ error: 'Failed to generate PDF file' });
      }
    });

    stream.on('error', (err) => {
      console.error('Error writing PDF:', err);
      res.status(500).json({ error: 'Error generating token' });
    });

  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/services/:id/token-status - Get token availability status
app.get("/api/services/:id/token-status", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    if (!service.tokensEnabled) {
      return res.json({
        tokensEnabled: false,
        tokensAvailable: 0,
        tokensIssued: 0,
        dailyLimit: 0
      });
    }

    // Check if we need to reset daily tokens
    const today = new Date();
    const lastReset = new Date(service.lastTokenReset);
    const isNewDay = today.toDateString() !== lastReset.toDateString();

    let tokensIssued = service.tokensIssued;
    if (isNewDay) {
      tokensIssued = 0;
    }

    const tokensAvailable = Math.max(0, service.dailyTokenLimit - tokensIssued);

    res.json({
      tokensEnabled: true,
      tokensAvailable,
      tokensIssued,
      dailyLimit: service.dailyTokenLimit
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assistance-request - Create assistance request
app.post("/api/assistance-request", async (req, res) => {
  try {
    const { userName, userContact, serviceId, bundleId, requestType } = req.body

    // Validate required fields
    if (!userName || !userContact || !requestType) {
      return res.status(400).json({ error: "Name, contact, and request type are required" })
    }

    // Validate request type and corresponding ID
    if (requestType === 'service' && !serviceId) {
      return res.status(400).json({ error: "Service ID is required for service requests" })
    }
    if (requestType === 'bundle' && !bundleId) {
      return res.status(400).json({ error: "Bundle ID is required for bundle requests" })
    }

    // Verify service or bundle exists
    if (requestType === 'service') {
      const service = await Service.findById(serviceId)
      if (!service) {
        return res.status(404).json({ error: "Service not found" })
      }
    } else if (requestType === 'bundle') {
      const bundle = await ServiceBundle.findById(bundleId)
      if (!bundle) {
        return res.status(404).json({ error: "Bundle not found" })
      }
    }

    const assistanceRequest = new AssistanceRequest({
      userName,
      userContact,
      serviceId: requestType === 'service' ? serviceId : null,
      bundleId: requestType === 'bundle' ? bundleId : null,
      requestType,
    })

    await assistanceRequest.save()
    res.status(201).json({ message: "Assistance request submitted successfully", request: assistanceRequest })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/superadmin/assistance-requests - Get all assistance requests (superadmin only)
app.get("/api/superadmin/assistance-requests", authenticateSuperAdmin, async (req, res) => {
  try {
    const requests = await AssistanceRequest.find()
      .populate('serviceId', 'serviceName')
      .populate('bundleId', 'bundleName')
      .sort({ createdAt: -1 })
    
    res.json(requests)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/superadmin/assistance-requests/:id - Update assistance request status (superadmin only)
app.put("/api/superadmin/assistance-requests/:id", authenticateSuperAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body
    
    const request = await AssistanceRequest.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    ).populate('serviceId', 'serviceName')
     .populate('bundleId', 'bundleName')
    
    if (!request) {
      return res.status(404).json({ error: "Assistance request not found" })
    }
    
    res.json(request)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// SUPERADMIN ROUTES

// GET /api/superadmin/users - Get all users (superadmin only)
app.get("/api/superadmin/users", authenticateSuperAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/superadmin/users/:id/status - Toggle user active status (superadmin only)
app.put("/api/superadmin/users/:id/status", authenticateSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/superadmin/license-keys - Get all license keys (superadmin only)
app.get("/api/superadmin/license-keys", authenticateSuperAdmin, async (req, res) => {
  try {
    const licenseKeys = await LicenseKey.find({})
      .populate('usedBy', 'username organizationName')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
    res.json(licenseKeys)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/superadmin/license-keys - Generate new license key (superadmin only)
app.post("/api/superadmin/license-keys", authenticateSuperAdmin, async (req, res) => {
  try {
    const { expiresAt, count = 1 } = req.body

    const licenseKeys = []
    for (let i = 0; i < count; i++) {
      const key = `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      
      const licenseKey = new LicenseKey({
        key,
        createdBy: req.user.userId === 'superadmin' ? null : req.user.userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      })

      const savedKey = await licenseKey.save()
      licenseKeys.push(savedKey)
    }

    res.status(201).json(licenseKeys)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/superadmin/license-keys/:id - Delete license key (superadmin only)
app.delete("/api/superadmin/license-keys/:id", authenticateSuperAdmin, async (req, res) => {
  try {
    const licenseKey = await LicenseKey.findById(req.params.id)
    if (!licenseKey) {
      return res.status(404).json({ error: "License key not found" })
    }

    if (licenseKey.isUsed) {
      return res.status(400).json({ error: "Cannot delete used license key" })
    }

    await LicenseKey.findByIdAndDelete(req.params.id)
    res.json({ message: "License key deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/superadmin/services - Get all services for bundle creation (superadmin only)
app.get("/api/superadmin/services", authenticateSuperAdmin, async (req, res) => {
  try {
    const { q } = req.query
    let query = {}
    
    if (q) {
      query = {
        $or: [
          { serviceName: { $regex: q, $options: "i" } },
          { documents: { $elemMatch: { $regex: q, $options: "i" } } },
          { procedure: { $regex: q, $options: "i" } }
        ]
      }
    }
    
    const services = await Service.find(query).populate('userId', 'organizationName location')
    res.json(services)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/superadmin/bundles - Get all service bundles (superadmin only)
app.get("/api/superadmin/bundles", authenticateSuperAdmin, async (req, res) => {
  try {
    const bundles = await ServiceBundle.find({})
      .populate('services', 'serviceName estimatedTime charge')
      .populate('createdBy', 'username organizationName')
      .sort({ createdAt: -1 })
    res.json(bundles)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/superadmin/bundles - Create new service bundle (superadmin only)
app.post("/api/superadmin/bundles", authenticateSuperAdmin, async (req, res) => {
  try {
    const { bundleName, description, services, location } = req.body

    if (!bundleName || !services || services.length === 0 || !location) {
      return res.status(400).json({ error: "Bundle name, services, and location are required" })
    }

    // Verify all services exist
    const existingServices = await Service.find({ _id: { $in: services } })
    if (existingServices.length !== services.length) {
      return res.status(400).json({ error: "One or more services not found" })
    }

    const bundle = new ServiceBundle({
      bundleName,
      description: description || '',
      services,
      location,
      createdBy: req.user.userId === 'superadmin' ? null : req.user.userId
    })

    const savedBundle = await bundle.save()
    const populatedBundle = await ServiceBundle.findById(savedBundle._id)
      .populate('services', 'serviceName estimatedTime charge')
      .populate('createdBy', 'username organizationName')

    res.status(201).json(populatedBundle)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/superadmin/bundles/:id - Update service bundle (superadmin only)
app.put("/api/superadmin/bundles/:id", authenticateSuperAdmin, async (req, res) => {
  try {
    const { bundleName, description, services, location, isActive } = req.body

    const bundle = await ServiceBundle.findById(req.params.id)
    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" })
    }

    // Verify all services exist if services are being updated
    if (services && services.length > 0) {
      const existingServices = await Service.find({ _id: { $in: services } })
      if (existingServices.length !== services.length) {
        return res.status(400).json({ error: "One or more services not found" })
      }
    }

    const updatedBundle = await ServiceBundle.findByIdAndUpdate(
      req.params.id,
      {
        bundleName: bundleName || bundle.bundleName,
        description: description !== undefined ? description : bundle.description,
        services: services || bundle.services,
        location: location || bundle.location,
        isActive: isActive !== undefined ? isActive : bundle.isActive
      },
      { new: true }
    ).populate('services', 'serviceName estimatedTime charge')
     .populate('createdBy', 'username organizationName')

    res.json(updatedBundle)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/superadmin/bundles/:id - Delete service bundle (superadmin only)
app.delete("/api/superadmin/bundles/:id", authenticateSuperAdmin, async (req, res) => {
  try {
    const bundle = await ServiceBundle.findByIdAndDelete(req.params.id)
    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" })
    }
    res.json({ message: "Bundle deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/bundles - Get active service bundles for public view
app.get("/api/bundles", async (req, res) => {
  try {
    const { province, district, municipality } = req.query
    let query = { isActive: true }
    
    // Filter by location if provided
    if (province || district || municipality) {
      if (province) query['location.province'] = { $regex: province, $options: 'i' }
      if (district) query['location.district'] = { $regex: district, $options: 'i' }
      if (municipality) query['location.municipality'] = { $regex: municipality, $options: 'i' }
    }
    
    const bundles = await ServiceBundle.find(query)
      .populate('services', 'serviceName estimatedTime charge userId')
      .populate({
        path: 'services',
        populate: {
          path: 'userId',
          select: 'organizationName location'
        }
      })
      .sort({ createdAt: -1 })
    
    res.json(bundles)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large" })
    }
  }
  res.status(500).json({ error: error.message })
})

const PORT = process.env.PORT || 5050

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
