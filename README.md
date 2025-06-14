# Kchaincha? - Government Service Checklist

A full-stack MERN application that provides easy access to government services information in one place. Users can search for government services and get detailed information about required documents, procedures, estimated time, and fees.

## 🚀 Features

### User Side (Public Interface)
- **Search Functionality**: Real-time search for government services
- **Service Details**: Complete information including:
  - Required documents checklist
  - Step-by-step procedures
  - Estimated processing time
  - Service charges/fees
  - Downloadable sample forms (PDF)
- **Responsive Design**: Mobile-friendly interface
- **Clean UI**: Modern design inspired by government service portals

### Admin Side (Private Interface)
- **Service Management**: Add, edit, and delete government services
- **File Upload**: Upload PDF sample forms for services
- **Document Management**: Dynamic form for adding multiple required documents
- **Service Overview**: Table view of all services with quick actions

## 🛠️ Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose
- **File Upload**: Multer for PDF handling
- **Routing**: React Router DOM
- **HTTP Client**: Axios

## 📁 Project Structure

```
neutrotex/
├── backend/
│   ├── src/
│   │   └── index.js          # Main server file
│   ├── uploads/              # PDF file storage
│   ├── seed-data.js          # Sample data script
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.jsx      # Homepage with search
│   │   │   ├── ServiceDetail.jsx  # Service details page
│   │   │   └── Admin.jsx     # Admin panel
│   │   ├── App.jsx           # Main app component
│   │   ├── main.jsx
│   │   └── index.css         # Tailwind CSS
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd neutrotex
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the backend directory:
   ```env
   PORT=5050
   MONGODB_URI=mongodb://localhost:27017/kchaincha
   ```

5. **Database Setup**
   
   Make sure MongoDB is running, then seed the database with sample data:
   ```bash
   cd backend
   node seed-data.js
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Server will run on `http://localhost:5050`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

## 📋 API Endpoints

### Services
- `GET /api/services?q=<query>` - Search services by keyword
- `GET /api/services/:id` - Get specific service details
- `POST /api/services` - Add new service (admin)
- `PUT /api/services/:id` - Update service (admin)
- `DELETE /api/services/:id` - Delete service (admin)

### File Upload
- `POST /api/upload` - Upload PDF sample form
- `GET /uploads/<filename>` - Serve uploaded files

## 🎨 Sample Services Included

The application comes pre-loaded with these government services:

1. **Citizenship Certificate** - नागरिकता प्रमाणपत्र
2. **Passport Application** - राहदानी
3. **PAN (Permanent Account Number)** - स्थायी लेखा नम्बर
4. **Driving License** - सवारी चालक अनुमतिपत्र
5. **Marriage Registration** - विवाह दर्ता

## 🔧 Usage

### For Users
1. Visit the homepage
2. Use the search bar to find government services
3. Click on any service to view detailed information
4. Download sample forms if available

### For Admins
1. Navigate to `/admin`
2. Click "Add New Service" to create a new service
3. Fill in all required information
4. Upload PDF sample forms if needed
5. Use the table to edit or delete existing services

## 🎯 Key Features Implemented

- ✅ Real-time search with debouncing
- ✅ Responsive design for all screen sizes
- ✅ File upload and serving for PDF forms
- ✅ Dynamic form handling for multiple documents
- ✅ Error handling and loading states
- ✅ Clean and intuitive UI/UX
- ✅ CRUD operations for service management
- ✅ MongoDB integration with Mongoose
- ✅ RESTful API design

## 🚀 Deployment Notes

### Backend Deployment
- Ensure MongoDB connection string is updated for production
- Set up proper environment variables
- Configure file upload directory permissions
- Set up CORS for production domain

### Frontend Deployment
- Update API base URL for production backend
- Build the project: `npm run build`
- Serve the `dist` folder using a web server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by Nepal's government service portals
- Built with modern web technologies for optimal performance
- Designed with user experience in mind

---

**Note**: This is a demonstration project for government service information management. In a production environment, additional security measures, authentication, and data validation should be implemented. 