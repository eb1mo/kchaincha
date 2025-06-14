const userSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  location: {
    province: {
      type: String,
      required: true,
      trim: true
    },
    district: {
      type: String,
      required: true,
      trim: true
    },
    municipality: {
      type: String,
      required: true,
      trim: true
    }
  }
}, {
  timestamps: true
}); 