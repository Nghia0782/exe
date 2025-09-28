import nodemailer from 'nodemailer';

// Tự động rơi về chế độ test nếu thiếu thông tin SMTP
let transporter;
if (process.env.SMTP_MAIL && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  // Không có credentials → dùng Ethereal để tránh lỗi khi dev
  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
}

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
export const sendVerificationEmail = async (to, token) => {
  const verificationLink = `${CLIENT_URL}/verification/${token}`;

  await transporter.sendMail({
    from: `"Techrental" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Xác minh tài khoản Techrental',
    html: `<h3>Chào bạn,</h3>
    <p>Vui lòng click vào liên kết sau để xác minh tài khoản (hoặc sử dụng mã OTP nếu có):</p>
    <a href="${verificationLink}">${verificationLink}</a>
    <p>Nếu bạn không đăng ký, vui lòng bỏ qua email này.</p>`,
  });
};

export const generateResetCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendResetCodeEmail = async (to, code) => {
  await transporter.sendMail({
    from: `"TechRental Support" <${process.env.SMTP_MAIL}>`,
    to,
    subject: 'Mã khôi phục mật khẩu TechRental',
    html: `
      <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu TechRental.</p>
      <p>Mã xác thực của bạn là:</p>
      <h2 style="letter-spacing:4px">${code}</h2>
      <p>Mã có hiệu lực trong 15&nbsp;phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    `,
  });
  return code; // để Controller lưu vào DB
};

export const sendAccountOtpEmail = async (to, code) => {
  await transporter.sendMail({
    from: `"Techrental" <${process.env.SMTP_MAIL}>`,
    to,
    subject: 'Mã xác minh tài khoản Techrental',
    html: `
      <p>Mã xác minh của bạn là:</p>
      <h2 style="letter-spacing:6px">${code}</h2>
      <p>Mã có hiệu lực trong 10 phút.</p>
    `,
  });
  return code;
};

export const sendOrderApprovedEmail = async (to, orderId, userId) => {
  const orderLink = `${CLIENT_URL}/personal/${userId}/orders`;
  await transporter.sendMail({
    from: `"TechRental" <${process.env.SMTP_MAIL}>`,
    to,
    subject: 'Đơn hàng của bạn đã được duyệt - TechRental',
    html: `
      <h3>Xin chào,</h3>
      <p>Đơn hàng <strong>${orderId}</strong> của bạn đã được <strong>duyệt</strong>.</p>
      <p>Vui lòng truy cập để <strong>thanh toán</strong> và hoàn tất thủ tục thuê:</p>
      <a href="${orderLink}" target="_blank">${orderLink}</a>
      <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.</p>
      <br/>
      <p>Trân trọng,</p>
      <p><strong>TechRental Team</strong></p>
    `,
  });
};

// Gửi mail khi đặt hàng thành công
export const sendOrderPlacedEmail = async (to, orderId, userId) => {
  const orderLink = `${CLIENT_URL}/personal/${userId}/orders`;
  await transporter.sendMail({
    from: `"TechRental" <${process.env.SMTP_MAIL}>`,
    to,
    subject: 'Bạn đã đặt hàng thành công - TechRental',
    html: `
      <h3>Xin chào,</h3>
      <p>Bạn đã đặt đơn hàng <strong>${orderId}</strong> thành công.</p>
      <p>Vui lòng truy cập để xem chi tiết đơn hàng:</p>
      <a href="${orderLink}" target="_blank">${orderLink}</a>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của TechRental!</p>
    `,
  });
};

// Gửi mail khi thanh toán thành công
export const sendOrderPaidEmail = async (to, orderId, userId) => {
  const orderLink = `${CLIENT_URL}/personal/${userId}/orders`;
  await transporter.sendMail({
    from: `"TechRental" <${process.env.SMTP_MAIL}>`,
    to,
    subject: 'Thanh toán thành công - TechRental',
    html: `
      <h3>Xin chào,</h3>
      <p>Đơn hàng <strong>${orderId}</strong> của bạn đã được thanh toán thành công.</p>
      <p>Vui lòng truy cập để xem chi tiết đơn hàng:</p>
      <a href="${orderLink}" target="_blank">${orderLink}</a>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của TechRental!</p>
    `,
  });
};

// Gửi mail khi shop cập nhật trạng thái đơn hàng
export const sendOrderStatusUpdatedEmail = async (to, orderId, userId, status) => {
  const orderLink = `${CLIENT_URL}/personal/${userId}/orders`;
  await transporter.sendMail({
    from: `"TechRental" <${process.env.SMTP_MAIL}>`,
    to,
    subject: `Cập nhật trạng thái đơn hàng - TechRental`,
    html: `
      <h3>Xin chào,</h3>
      <p>Đơn hàng <strong>${orderId}</strong> của bạn đã được cập nhật trạng thái: <strong>${status}</strong>.</p>
      <p>Vui lòng truy cập để xem chi tiết đơn hàng:</p>
      <a href="${orderLink}" target="_blank">${orderLink}</a>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của TechRental!</p>
    `,
  });
};
