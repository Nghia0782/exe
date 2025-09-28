import User from '../models/User.js';
import ProductDetail from '../models/ProductDetail.js';

// Lấy thông tin chính sách đặt cọc cho sản phẩm
export const getDepositPolicy = async (req, res) => {
    try {
        const { productId } = req.params;
        const customerId = req.authenticatedUser?.userId || req.user?._id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Lấy thông tin user để kiểm tra KYC status
        const user = await User.findById(customerId);
        const userKycStatus = user?.kycStatus || 'unverified';

        // Lấy thông tin sản phẩm
        const product = await ProductDetail.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Tính deposit dựa trên KYC status
        let depositPercentage = 0;
        let depositAmount = 0;
        
        if (userKycStatus === 'unverified') {
            depositPercentage = product.depositPolicy?.unverified || 100;
        } else if (userKycStatus === 'verified') {
            depositPercentage = product.depositPolicy?.verified || 30;
        } else if (userKycStatus === 'premium') {
            depositPercentage = product.depositPolicy?.premium || 0;
        }
        
        depositAmount = Math.round(product.price * depositPercentage / 100);

        res.status(200).json({
            success: true,
            data: {
                productId: product._id,
                productName: product.title,
                productPrice: product.price,
                userKycStatus,
                depositPolicy: product.depositPolicy,
                currentDepositPercentage: depositPercentage,
                currentDepositAmount: depositAmount,
                isDepositRequired: depositAmount > 0,
                policyDescription: getDepositPolicyDescription(userKycStatus, depositPercentage)
            }
        });

    } catch (error) {
        console.error('[getDepositPolicy] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function để tạo mô tả chính sách
const getDepositPolicyDescription = (kycStatus, depositPercentage) => {
    if (kycStatus === 'unverified') {
        return `Tài khoản chưa xác minh: Cọc ${depositPercentage}% giá trị sản phẩm. Tiền cọc sẽ được hoàn trả khi bạn trả thiết bị trong tình trạng tốt.`;
    } else if (kycStatus === 'verified') {
        return `Tài khoản đã xác minh: Cọc ${depositPercentage}% giá trị sản phẩm. Tiền cọc sẽ được hoàn trả khi bạn trả thiết bị trong tình trạng tốt.`;
    } else if (kycStatus === 'premium') {
        return `Tài khoản Premium: Không cần đặt cọc. Bạn có thể thuê thiết bị mà không cần đặt cọc.`;
    }
    return 'Chính sách đặt cọc không xác định.';
};

export default {
    getDepositPolicy
};
