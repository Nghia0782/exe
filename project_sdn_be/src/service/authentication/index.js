import User from '../../models/User.js';
import {
  sendVerificationEmail,
  generateResetCode,
  sendResetCodeEmail,
  sendAccountOtpEmail,
} from '../../utils/mailer.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const register = async (username, password, email, address, phone) => {
  if (await User.findOne({ email })) {
    return { status: false, message: 'Email đã tồn tại' };
  }

  const hashed = await bcrypt.hash(password, 10);
  const token = jwt.sign(
    {
      name: username,
      email,
      password: hashed,
      address,
      phone,
      roles: ['renter'],
    },
    process.env.SECRET_KEY,
    { expiresIn: '1h' }
  );

  // Tạo mã OTP 6 số và lưu tạm (10 phút)
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
  await User.updateOne(
    { email },
    {
      $set: {
        name: username,
        email,
        password: hashed,
        address,
        phone,
        roles: ['renter'],
        'identityVerification.status': 'pending',
        verificationCode: otp,
        verificationCodeExpiry: Date.now() + 10 * 60 * 1000,
      },
    },
    { upsert: true }
  );

  await sendVerificationEmail(email, token);
  await sendAccountOtpEmail(email, otp);
  return { status: true };
};

export const login = async (usernameOrEmail, password) => {
  const user = await User.findOne({
    $or: [{ email: usernameOrEmail }, { name: usernameOrEmail }],
  });

  if (!user) return { status: false, message: 'Sai email hoặc tài khoản' };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return { status: false, message: 'Sai mật khẩu' };

  return { status: true, payload: user };
};

export const sendToken = async (email, userId) => {
  const token = jwt.sign({ userId }, process.env.SECRET_KEY, {
    expiresIn: '1h',
  });

  try {
    await sendVerificationEmail(email, token);
    return { payload: { token } };
  } catch (err) {
    console.error('Gửi email xác minh thất bại:', err.message);
    return { payload: { token }, warning: 'Email verification failed' };
  }
};

// src/service/authentication/index.js
export const verifyUser = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // A. Đã có user (do resend mail)  ➜ chỉ update status
    let user = await User.findOne({ email: decoded.email });
    if (user) {
      if (user.identityVerification?.status === 'verified') {
        return { code: 200, message: 'Đã xác minh trước đó', metadata: user };
      }

      user.identityVerification = {
        status: 'verified',
        verifiedAt: new Date(),
      };
      await user.save();
      return { code: 200, message: 'Xác minh thành công', metadata: user };
    }

    // B. Chưa có ➜ TẠO MỚI
    user = await User.create({
      name: decoded.name,
      email: decoded.email,
      password: decoded.password, // Đã hash trước khi gói token
      address: decoded.address,
      phone: decoded.phone,
      roles: decoded.roles,
      identityVerification: {
        status: 'pending',
        verifiedAt: new Date(),
      },
    });

    return {
      code: 201,
      message: 'Tạo tài khoản & xác minh thành công',
      metadata: user,
    };
  } catch (err) {
    return { code: 400, message: 'Token không hợp lệ hoặc hết hạn' };
  }
};

export const sendResetToken = async (email) => {
  const user = await User.findOne({ email });
  if (!user) return { code: 400, message: 'Không tìm thấy người dùng' };

  const resetToken = crypto.randomBytes(20).toString('hex');
  const token = jwt.sign({ email }, process.env.SECRET_KEY, {
    expiresIn: '15m',
  });

  console.log(`[Email] Gửi token reset password tới ${email}: ${token}`);

  return { code: 200, message: 'Token khôi phục đã được gửi qua email' };
};

export const forgotPassword = async (email, token, newPassword) => {
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (decoded.email !== email)
      return { code: 400, message: 'Email không khớp token' };

    const user = await User.findOne({ email });
    if (!user) return { code: 400, message: 'Không tìm thấy người dùng' };

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return { code: 200, message: 'Đổi mật khẩu thành công' };
  } catch (err) {
    return { code: 400, message: 'Token không hợp lệ hoặc đã hết hạn' };
  }
};

export const sendResetCode = async (email) => {
  const user = await User.findOne({ email });
  if (!user) return { code: 400, message: 'Email không tồn tại' };

  const code = generateResetCode();
  user.resetCode = code;
  user.resetCodeExpiry = Date.now() + 15 * 60 * 1000;
  await user.save();

  await sendResetCodeEmail(email, code);
  return { code: 200, message: 'Đã gửi mã khôi phục', email };
};

export const getEmailByToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    return { code: 200, email: decoded.email };
  } catch (err) {
    return { code: 400, message: 'Token không hợp lệ' };
  }
};

export const checkToken = async (token) => {
  try {
    jwt.verify(token, process.env.SECRET_KEY);
    return { code: 200, message: 'Token hợp lệ' };
  } catch (err) {
    return { code: 400, message: 'Token không hợp lệ hoặc hết hạn' };
  }
};

export const getAllUsers = async () => {
  const users = await User.find().select('-password');
  return users;
};
