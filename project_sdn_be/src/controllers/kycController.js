import KycRequest from '../models/KycRequest.js'

export const submitKyc = async (req, res) => {
  try {
    const userId = req.user?._id
    const {
      idType, fullName, idNumber, issueDate, expiryDate, address,
    } = req.body

    const payload = {
      userId,
      idType: idType || 'cccd',
      fullName,
      idNumber,
      issueDate: issueDate ? new Date(issueDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      address,
      status: 'pending',
    }

    // Files uploaded through multer (fields: frontImage, backImage, selfieImage)
    if (req.files?.frontImage?.[0]) payload.frontImageUrl = req.files.frontImage[0].path || req.files.frontImage[0].location || req.files.frontImage[0].url
    if (req.files?.backImage?.[0]) payload.backImageUrl = req.files.backImage[0].path || req.files.backImage[0].location || req.files.backImage[0].url
    if (req.files?.selfieImage?.[0]) payload.selfieImageUrl = req.files.selfieImage[0].path || req.files.selfieImage[0].location || req.files.selfieImage[0].url

    // one active request per user: overwrite or create new pending
    const existing = await KycRequest.findOne({ userId }).sort({ createdAt: -1 })
    let doc
    if (existing && existing.status !== 'approved') {
      Object.assign(existing, payload)
      doc = await existing.save()
    } else {
      doc = await KycRequest.create(payload)
    }
    res.json({ success: true, status: doc.status, id: doc._id })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}

export const getStatus = async (req, res) => {
  try {
    const userId = req.user?._id
    const doc = await KycRequest.findOne({ userId }).sort({ createdAt: -1 })
    if (!doc) return res.json({ status: 'none' })
    res.json({ status: doc.status, reason: doc.reason })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}

export const adminList = async (req, res) => {
  try {
    const items = await KycRequest.find().sort({ createdAt: -1 }).limit(200)
    res.json({ items })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}

export const adminUpdate = async (req, res) => {
  try {
    const { id, status, reason } = req.body
    if (!id || !['approved','rejected'].includes(status)) return res.status(400).json({ message: 'Invalid payload' })
    const doc = await KycRequest.findByIdAndUpdate(id, { status, reason: status==='rejected'? (reason||'') : undefined }, { new: true })
    res.json({ success: true, status: doc?.status })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}

// Get all users with their KYC status for admin
export const adminGetAllUsersKycStatus = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const KycRequest = (await import('../models/KycRequest.js')).default;
    
    // Get all users
    const users = await User.find({}, 'name email _id identityVerification').limit(100);
    
    // Get all KYC requests
    const kycRequests = await KycRequest.find({}, 'userId status createdAt').sort({ createdAt: -1 });
    
    // Create a map of userId -> latest KYC status
    const kycMap = {};
    kycRequests.forEach(kyc => {
      if (!kycMap[kyc.userId] || new Date(kyc.createdAt) > new Date(kycMap[kyc.userId].createdAt)) {
        kycMap[kyc.userId] = kyc;
      }
    });
    
    // Combine user data with KYC status
    const usersWithKyc = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      userKycStatus: user.identityVerification?.status || 'none',
      kycRequestStatus: kycMap[user._id]?.status || 'none',
      kycRequestDate: kycMap[user._id]?.createdAt || null,
      canRent: (user.identityVerification?.status === 'verified') || (kycMap[user._id]?.status === 'approved')
    }));
    
    res.json({ 
      success: true, 
      data: usersWithKyc,
      summary: {
        total: usersWithKyc.length,
        canRent: usersWithKyc.filter(u => u.canRent).length,
        cannotRent: usersWithKyc.filter(u => !u.canRent).length
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}


