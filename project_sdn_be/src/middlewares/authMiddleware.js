import jwt from 'jsonwebtoken';
import User from '../models/User.js';
// Parse and verify token
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).send('Unauthorized');

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const userDoc = await User.findById(decoded.userId || decoded._id).select(
      '-password'
    );
    if (!userDoc) return res.status(401).send('User not found');
    req.user = userDoc;
    req.authenticatedUser = decoded;
    next();
  } catch (error) {
    console.error('JWT verify error:', error.message);
    res.status(403).send('Forbidden: Invalid Token');
  }
};

// Authorize by role
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (
      !req.authenticatedUser ||
      !roles.some((role) => req.authenticatedUser.roles.includes(role))
    ) {
      return res.status(403).send('Access Denied: Insufficient Permission');
    }
    next();
  };
};

// Ensure email verified
export const ensureVerifiedUser = (req, res, next) => {
  const isVerifiedByIdentity = req.user?.identityVerification?.status === 'verified';
  const isKycVerified = req.user?.kycStatus === 'verified' || req.user?.kycStatus === 'premium';
  if (isVerifiedByIdentity || isKycVerified) return next();
  return res.status(401).send('User not verified');
};

// Ensure KYC approved (manual admin) before allowing sensitive actions (e.g., rent)
export const ensureKycApproved = async (req, res, next) => {
  const user = req.user || {};
  const userId = user._id;
  
  console.log(`[KYC Check] User ID: ${userId}, Email: ${user.email}`);
  
  // Check multiple possible KYC status fields
  const kycApproved = 
    user.kycStatus === 'approved' || 
    user.identityVerification?.status === 'verified' ||
    user.isKycApproved === true || 
    req.authenticatedUser?.isKycApproved === true;
    
  console.log(`[KYC Check] User model KYC status:`, {
    kycStatus: user.kycStatus,
    identityVerification: user.identityVerification?.status,
    isKycApproved: user.isKycApproved,
    tokenKycApproved: req.authenticatedUser?.isKycApproved,
    kycApproved
  });
    
  if (kycApproved) {
    console.log(`[KYC Check] User ${userId} approved via user model`);
    return next();
  }
  
  // If not approved in user model, check KycRequest model as fallback
  try {
    const KycRequest = (await import('../models/KycRequest.js')).default;
    const kycRequest = await KycRequest.findOne({ userId: user._id }).sort({ createdAt: -1 });
    
    console.log(`[KYC Check] KycRequest for user ${userId}:`, {
      found: !!kycRequest,
      status: kycRequest?.status,
      createdAt: kycRequest?.createdAt
    });
    
    if (kycRequest && kycRequest.status === 'approved') {
      console.log(`[KYC Check] User ${userId} approved via KycRequest model`);
      return next();
    }
  } catch (error) {
    console.error(`[KYC Check] Error checking KycRequest for user ${userId}:`, error);
  }
  
  console.log(`[KYC Check] User ${userId} KYC not approved, blocking access`);
  return res.status(403).json({ message: 'KYC required: Please verify your identity before proceeding.' });
};