export const checkCollegeAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Platform admin can access all colleges
  if (req.user.role === 'PLATFORM_ADMIN') {
    return next();
  }

  const userCollegeId = req.user.college?._id?.toString() || req.user.college?.toString();
  if (!userCollegeId) {
    return res.status(403).json({ error: 'User is not associated with any college.' });
  }

  // If a collegeId is present in params, body, or query, verify match
  const targetCollegeId = req.params.collegeId || req.body.collegeId || req.body.college || req.query.collegeId;
  if (targetCollegeId && targetCollegeId.toString() !== userCollegeId) {
    return res.status(403).json({ error: 'Forbidden: Access restricted to your assigned college.' });
  }

  next();
};
