import {
  sendToken,
  sendResetToken,
  sendResetCode,
  verifyUser,
  forgotPassword,
  checkToken,
  getEmailByToken,
  getAllUsers,
  register as registerService,
  login as loginService,
} from '../service/authentication/index.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import ProductDetail from '../models/ProductDetail.js';
import jwt from 'jsonwebtoken';
import { sendAccountOtpEmail } from '../utils/mailer.js';
// Register User
export const registerController = async (req, res) => {
  try {
    const { username, password, email, phoneNumber, address } = req.body;

    const result = await registerService(
      username,
      password,
      email,
      address,
      phoneNumber
    );

    if (result.status) {
      return res.status(201).json({
        message: 'Đăng ký thành công, mã OTP đã được gửi tới email',
      });
    }
    return res.status(400).json({ message: result.message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login User
export const loginController = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const result = await loginService(usernameOrEmail, password);
    console.log('✅ [POST] /register nhận được:', req.body);

    if (result.status) {
      const user = result.payload;
      const token = jwt.sign(
        {
          userId: user._id,
          roles: user.roles,
          isVerified: user.identityVerification?.status === 'verified',
          email: user.email,
          phone: user.phone,
        },
        process.env.SECRET_KEY,
        { expiresIn: '30d' }
      );

      res.status(200).json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          roles: user.roles,
          name: user.name,
          isVerified: user.identityVerification?.status === 'verified',
          phone: user.phone,
        },
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify Email
export const verifyUserController = async (req, res) => {
  const { token } = req.params;
  const result = await verifyUser(token);

  if (result.code !== 200 && result.code !== 201) {
    // Token lỗi hoặc hết hạn
    return res.status(result.code).json({ message: result.message });
  }

  const user = result.metadata;

  // Thống kê sản phẩm (có thể bỏ nếu chưa cần)
  const ownedProducts = await ProductDetail.countDocuments({ owner: user._id });
  const rentingProducts = await ProductDetail.countDocuments({
    renters: user._id,
  });

  return res.status(result.code).json({
    message: result.message,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      isVerified: true,
      joinDate: user.createdAt.toISOString(),
      phone: user.phone || '',
      address: user.address || '',
      ownedProducts,
      rentingProducts,
      registeredLessor: user.roles.includes('owner'),
    },
  });
};

// Forgot Password

export const resetPasswordWithCode = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res
      .status(400)
      .json({ message: 'Thiếu email, mã hoặc mật khẩu mới' });
  }

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: 'Không tìm thấy người dùng' });
  console.log('[DEBUG] code từ client:', code);
  console.log('[DEBUG] code trong DB:', user.resetCode);
  console.log('[DEBUG] hết hạn lúc  :', new Date(user.resetCodeExpiry));
  if (!user.resetCode || user.resetCode.toString() !== code.toString()) {
    return res.status(400).json({ message: 'Mã không chính xác' });
  }

  if (Date.now() > user.resetCodeExpiry) {
    return res.status(400).json({ message: 'Mã đã hết hạn' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetCode = null;
  user.resetCodeExpiry = null;

  await user.save();

  return res.status(200).json({ message: 'Đổi mật khẩu thành công' });
};
export const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email là bắt buộc' });

    const result = await sendResetCode(email);
    return res.status(result.code).json(result);
  } catch (error) {
    console.error('ForgotPwd error:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  const { recoveryToken } = req.params;
  const result = await forgotPassword(email, recoveryToken, newPassword);
  res.status(result.code).send(result.message);
};

// Get Email by token
export const getEmailFromToken = async (req, res) => {
  const { token } = req.params;
  const result = await getEmailByToken(token);
  res.status(result.code).send(result);
};

// Check Reset Token
export const checkResetTokenController = async (req, res) => {
  const { token } = req.params;
  const result = await checkToken(token);
  res.status(result.code).send(result);
};

// Change password for logged-in user
export const changePasswordController = async (req, res) => {
  try {
    const userId = req.user?._id || req.authenticatedUser?.userId;
    const { oldPassword, newPassword } = req.body;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Thiếu mật khẩu cũ hoặc mới' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User không tồn tại' });
    const ok = await bcrypt.compare(oldPassword, user.password || '');
    if (!ok) return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    return res.status(200).json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get all users
export const getAllUsersController = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function getClientUrl() {
  let client = process.env.CLIENT_URL || 'http://localhost:3000';

  // Thêm protocol nếu CI/CD cấu hình thiếu
  if (!/^https?:\/\//i.test(client)) {
    client = `https://${client.replace(/^\/+/, '')}`;
  }

  // Xoá dấu '/' cuối để tránh //oauth-callback
  return client.replace(/\/+$/, '');
}

// Google OAuth Callback Controller
export const googleCallbackController = async (req, res) => {
  try {
    const user = req.user;
    const FE_URL = getClientUrl();

    if (!user) {
      return res.redirect(`${FE_URL}/login?error=authentication_failed`);
    }

    // 1. Tạo JWT
    const tokenPayload = {
      userId: user._id,
      roles: user.roles,
      isVerified: user.identityVerification?.status === 'verified',
      email: user.email,
      phone: user.phone,
    };
    const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, {
      expiresIn: '30d',
    });

    // 2. Ghép URL redirect về FE
    const redirectUrl =
      `${FE_URL}/oauth-callback` +
      `?token=${encodeURIComponent(token)}` +
      `&user=${encodeURIComponent(
        JSON.stringify({
          _id: user._id,
          email: user.email,
          roles: user.roles,
          name: user.name,
          isVerified: user.identityVerification?.status === 'verified',
          phone: user.phone,
          avatar: user.avatar,
        })
      )}`;

    // Log hỗ trợ debug khi DEV
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Google OAuth] Redirect →', redirectUrl);
    }

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error('Google callback error:', err);
    return res.redirect(`${getClientUrl()}/login?error=server_error`);
  }
};
