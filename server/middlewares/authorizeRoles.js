const authorizeRoles = (...roles) => {
    return (req, res, next) => {
      // Ensure user is authenticated first
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
  
      // Check if user's role is in the allowed roles
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Access denied',
          requiredRoles: roles,
          userRole: req.user.role
        });
      }
  
      next();
    };
  };

  module.exports = authorizeRoles;