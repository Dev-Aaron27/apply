// middlewares/errorHandler.js
export function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server",
    error: err.message
  });
}
