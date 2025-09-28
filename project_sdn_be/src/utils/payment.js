import crypto from 'crypto';
import qs from 'qs';

// VNPay configuration (support both legacy and new env names)
const VNPAY_CONFIG = {
    vnp_TmnCode: process.env.VNP_TMNCODE || process.env.VNPAY_TMN_CODE || '2QXUI4J4',
    vnp_HashSecret: process.env.VNP_HASHSECRET || process.env.VNPAY_HASH_SECRET || 'RAOEXHYVSDDIIENYWSLDIIENYWSLDIIEN',
    vnp_Url: process.env.VNP_URL || process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    // ReturnUrl nên trỏ về backend để xác minh và cập nhật, sau đó redirect về frontend
    vnp_ReturnUrl: process.env.VNP_RETURNURL || process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/deposits/vnpay-return',
    vnp_IpnUrl: process.env.VNP_IPNURL || process.env.VNPAY_IPN_URL || 'http://localhost:5000/api/deposits/vnpay-ipn'
};

// Tạo payment URL cho VNPay
export const createPaymentUrl = async (paymentData) => {
    try {
        const {
            amount,
            orderId,
            orderDescription,
            customerId,
            bankCode = ''
        } = paymentData;

        const date = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const formatVnpDate = (d) => {
            const y = d.getFullYear();
            const m = pad(d.getMonth() + 1);
            const day = pad(d.getDate());
            const hh = pad(d.getHours());
            const mm = pad(d.getMinutes());
            const ss = pad(d.getSeconds());
            return `${y}${m}${day}${hh}${mm}${ss}`; // YYYYMMDDHHmmss (14 chars)
        };

        const createDate = formatVnpDate(date);
        const expireDate = formatVnpDate(new Date(date.getTime() + 15 * 60 * 1000)); // +15 phút

        // Đảm bảo orderInfo không chứa ký tự đặc biệt
        const orderInfo = (orderDescription || `Thanh toan don hang ${orderId}`)
            .replace(/[^a-zA-Z0-9\s]/g, '') // Loại bỏ ký tự đặc biệt
            .substring(0, 255); // Giới hạn độ dài
        const orderType = 'other';
        const locale = 'vn';
        const currCode = 'VND';
        const vnpAmount = Math.round(amount * 100); // VNPay yêu cầu amount * 100, làm tròn

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = VNPAY_CONFIG.vnp_TmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        // VNPay yêu cầu vnp_TxnRef phải là số và có độ dài tối đa 15 ký tự
        let txnRef = String(orderId).replace(/[^0-9]/g, '');
        if (!txnRef || txnRef.length === 0) {
            txnRef = Date.now().toString();
        }
        vnp_Params['vnp_TxnRef'] = txnRef.substring(0, 15);
        vnp_Params['vnp_OrderInfo'] = orderInfo;
        vnp_Params['vnp_OrderType'] = orderType;
        vnp_Params['vnp_Amount'] = vnpAmount;
        vnp_Params['vnp_ReturnUrl'] = VNPAY_CONFIG.vnp_ReturnUrl;
        vnp_Params['vnp_IpAddr'] = process.env.VNP_IPADDR || '127.0.0.1';
        vnp_Params['vnp_CreateDate'] = createDate;
        vnp_Params['vnp_ExpireDate'] = expireDate;
        // Khai báo rõ kiểu chữ ký theo khuyến nghị của VNPay
        vnp_Params['vnp_SecureHashType'] = 'HMACSHA512';

        if (bankCode !== null && bankCode !== '') {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        // Validation các tham số bắt buộc
        if (!vnp_Params['vnp_TmnCode']) {
            throw new Error('VNP_TMNCODE is required');
        }
        if (!vnp_Params['vnp_Amount'] || vnp_Params['vnp_Amount'] <= 0) {
            throw new Error('Amount must be greater than 0');
        }
        if (!vnp_Params['vnp_TxnRef']) {
            throw new Error('Transaction reference is required');
        }

        // Tạo query string theo chuẩn VNPay
        const querystring = createQueryString(vnp_Params);
        
        // Tạo secure hash theo chuẩn VNPay
        const signData = querystring;
        const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret);
        const signed = hmac.update(signData, 'utf-8').digest('hex');
        
        // Debug log để kiểm tra
        console.log('[VNPAY DEBUG] All params before signing:', vnp_Params);
        console.log('[VNPAY DEBUG] Sign data:', signData);
        console.log('[VNPAY DEBUG] Hash secret length:', VNPAY_CONFIG.vnp_HashSecret.length);
        console.log('[VNPAY DEBUG] Generated signature:', signed);
        
        vnp_Params['vnp_SecureHash'] = signed;
        
        // Log chẩn đoán (không lộ secret)
        try {
            console.log('[VNPAY] Build params', {
                vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode,
                vnp_Amount: vnpAmount,
                vnp_TxnRef: vnp_Params['vnp_TxnRef'],
                vnp_ReturnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
                vnp_Url: VNPAY_CONFIG.vnp_Url,
                bankCode: vnp_Params['vnp_BankCode'] || ''
            });
        } catch (_) {}

        // Tạo URL cuối cùng
        const finalParams = { ...vnp_Params };
        const finalQueryString = createQueryString(finalParams);
        const paymentUrl = VNPAY_CONFIG.vnp_Url + '?' + finalQueryString;
        
        return paymentUrl;

    } catch (error) {
        console.error('Error creating payment URL:', error);
        throw error;
    }
};

// Xác minh payment return từ VNPay
export const verifyPaymentReturn = (vnp_Params) => {
    try {
        const secureHash = vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        const signData = createQueryString(vnp_Params);
        
        const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret);
        const signed = hmac.update(signData, 'utf-8').digest('hex');

        return secureHash === signed;
    } catch (error) {
        console.error('Error verifying payment return:', error);
        return false;
    }
};

// Sắp xếp object theo key - Logic chuẩn VNPay
const sortObject = (obj) => {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
        if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
            sorted[key] = obj[key];
        }
    }
    return sorted;
};

// Tạo query string theo chuẩn VNPay
const createQueryString = (params) => {
    const sortedParams = sortObject(params);
    const queryParts = [];
    
    for (const key in sortedParams) {
        if (sortedParams.hasOwnProperty(key)) {
            const value = sortedParams[key];
            // VNPay yêu cầu thay thế khoảng trắng bằng dấu + thay vì %20
            const encodedValue = encodeURIComponent(value).replace(/%20/g, '+');
            queryParts.push(`${key}=${encodedValue}`);
        }
    }
    
    return queryParts.join('&');
};

// Tạo payment URL cho MoMo (placeholder)
export const createMoMoPaymentUrl = async (paymentData) => {
    // TODO: Implement MoMo payment
    throw new Error('MoMo payment not implemented yet');
};

// Tạo payment URL cho Bank Transfer (placeholder)
export const createBankTransferInfo = async (paymentData) => {
    // TODO: Implement Bank Transfer
    return {
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountName: 'Rentiva Technology',
        amount: paymentData.amount,
        content: `RENTIVA ${paymentData.orderId}`
    };
};
