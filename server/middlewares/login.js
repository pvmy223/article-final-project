const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log the original end function
  const oldEnd = res.end;

  // Override end function to log response
  res.end = function (chunk, encoding) {
    // Log request details
    const duration = Date.now() - start;
    console.log(
      JSON.stringify({
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      })
    );

    // Call the original end function
    oldEnd.call(res, chunk, encoding);
  };

  next();
};

module.exports = requestLogger;
