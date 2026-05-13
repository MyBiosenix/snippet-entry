module.exports = function requireSelf(req, res, next) {
  const targetUserId =
    req.params.userId || req.params.id || req.body.userId || req.query.userId;

  if (!req.user || !targetUserId) {
    return res.status(403).json({ message: "Unauthorized user access" });
  }

  if (String(req.user._id) !== String(targetUserId)) {
    return res.status(403).json({ message: "You can only access your own data" });
  }

  next();
};
