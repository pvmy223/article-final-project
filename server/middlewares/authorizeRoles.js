exports.authorizeEditor = (req, res, next) => {
    if (req.user && req.user.role === 'editor') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Editor role required.' });
    }
};

exports.authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'administrator') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Administrator role required.' });
    }
};
