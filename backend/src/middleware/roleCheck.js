export const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Authentication required.' });
    }

    const userRole = req.user.role;

    // Treat FACULTY and FACULTY_COORDINATOR as equivalent
    const normalizedUserRole = userRole === 'FACULTY' ? 'FACULTY_COORDINATOR' : userRole;
    const normalizedAllowedRoles = roles.map(r => r === 'FACULTY' ? 'FACULTY_COORDINATOR' : r);

    // PLATFORM_ADMIN has universal access
    if (userRole === 'PLATFORM_ADMIN' || normalizedAllowedRoles.includes(normalizedUserRole)) {
      return next();
    }

    return res.status(403).json({
      error: `Forbidden. Role '${userRole}' does not have permission for this resource.`,
    });
  };
};
