import React, { useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import './AssistanceRequestPopup.css';

const AssistanceRequestPopup = ({ 
  isOpen, 
  onClose, 
  serviceId, 
  bundleId, 
  requestType, 
  serviceName, 
  bundleName 
}) => {
  const [formData, setFormData] = useState({
    userName: '',
    userContact: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const requestData = {
        userName: formData.userName,
        userContact: formData.userContact,
        requestType,
        ...(requestType === 'service' ? { serviceId } : { bundleId })
      };

      await axios.post(API_ENDPOINTS.ASSISTANCE_REQUEST, requestData);
      
      setMessage({ 
        type: 'success', 
        text: 'Your assistance request has been submitted successfully! We will contact you soon.' 
      });
      
      // Reset form
      setFormData({ userName: '', userContact: '' });
      
      // Close popup after 2 seconds
      setTimeout(() => {
        onClose();
        setMessage({ type: '', text: '' });
      }, 2000);

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to submit request. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ userName: '', userContact: '' });
    setMessage({ type: '', text: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="assistance-popup-overlay" onClick={handleClose}>
      <div className="assistance-popup" onClick={(e) => e.stopPropagation()}>
        <div className="assistance-popup-header">
          <h3>Book Assistance Service</h3>
          <button className="close-btn" onClick={handleClose}>
            ×
          </button>
        </div>
        
        <div className="assistance-popup-content">
          <div className="service-info">
            <p>
              <strong>Requesting assistance for:</strong> {serviceName || bundleName}
            </p>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="userName">Your Name *</label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="userContact">Contact Number *</label>
              <input
                type="tel"
                id="userContact"
                name="userContact"
                value={formData.userContact}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssistanceRequestPopup; 