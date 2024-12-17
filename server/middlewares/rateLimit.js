const rateLimit = (options = {}) => {
    const { 
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 100, // limit each IP to 100 requests per windowMs
      message = 'Too many requests, please try again later'
    } = options;
  
    // In-memory store for tracking requests (replace with Redis in production)
    const requests = new Map();
  
    return (req, res, next) => {
      const ip = req.ip;
      const now = Date.now();
      
      // Clean up old requests
      const windowStart = now - windowMs;
      const userRequests = (requests.get(ip) || [])
        .filter(timestamp => timestamp > windowStart);
  
      // Check if max requests exceeded
      if (userRequests.length >= max) {
        return res.status(429).json({ message });
      }
  
      // Add current request timestamp
      userRequests.push(now);
      requests.set(ip, userRequests);
  
      next();
    };
  };

module.exports = rateLimit;