const checkSubscriberAccess = async (req, res, next) => {
    // Check if the content requires subscription
    const isPremiumContent = req.isPremium || false;
    
    // If not premium content, allow access
    if (!isPremiumContent) {
      return next();
    }
  
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required for premium content' });
    }
  
    // Check if user is a subscriber
    if (req.user.role !== 'subscriber') {
      return res.status(403).json({ 
        message: 'Premium content requires subscriber access' 
      });
    }
  
    // Check subscription expiry
    const now = new Date();
    if (!req.user.subscriberExpiryDate || req.user.subscriberExpiryDate < now) {
      return res.status(403).json({ 
        message: 'Subscription has expired',
        expiryDate: req.user.subscriberExpiryDate
      });
    }
  
    next();
  };

module.exports = checkSubscriberAccess;
