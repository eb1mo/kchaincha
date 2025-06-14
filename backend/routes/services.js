// Get all services with optional search and location filtering
router.get('/', async (req, res) => {
  try {
    const { query, province, district, municipality } = req.query;
    
    // Build the search filter
    let searchFilter = {};
    
    // Text search filter
    if (query) {
      searchFilter.$or = [
        { serviceName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { requiredDocuments: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Location filters
    let locationFilter = {};
    if (province) {
      locationFilter['userId.location.province'] = { $regex: province, $options: 'i' };
    }
    if (district) {
      locationFilter['userId.location.district'] = { $regex: district, $options: 'i' };
    }
    if (municipality) {
      locationFilter['userId.location.municipality'] = { $regex: municipality, $options: 'i' };
    }
    
    // Combine filters
    const finalFilter = { ...searchFilter, ...locationFilter };
    
    const services = await Service.find(finalFilter)
      .populate('userId', 'organizationName location')
      .sort({ createdAt: -1 });
    
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Server error' });
  }
}); 