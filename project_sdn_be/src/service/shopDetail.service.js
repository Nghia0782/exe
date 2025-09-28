import ShopDetail from '../models/ShopDetail.js';

const createShopDetail = async (user, data) => {
  try {
    const shopDetail = await ShopDetail.create({
      idUser: user.userId,
      contact: {
        phone: user?.phone,
        email: user?.email,
      },
      ...data,
    });

    return shopDetail;
  } catch (error) {
    throw error;
  }
};
const deleteShopDetailById = async (_id) => {
  try {
    const shopDetail = await ShopDetail.findByIdAndDelete(_id);
    return shopDetail;
  } catch (error) {
    throw error;
  }
};
const getAllShopDetail = async () => {
  try {
    const shopDetails = await ShopDetail.find();
    return shopDetails;
  } catch (error) {
    throw error;
  }
};
const getShopDetailById = async (_id) => {
  try {
    const shopDetail = await ShopDetail.findById(_id);
    return shopDetail;
  } catch (error) {
    throw error;
  }
};

const getShopDetailByUserId = async (userId) => {
  return await ShopDetail.findOne({ idUser: userId });
};
// Thêm hàm mới updateShopPackages
export const updateShopPackages = async (
  shopId,
  packagePost,
  packageInsurance
) => {
  try {
    // Tìm ShopDetail theo idUser (shopId)
    const shop = await ShopDetail.findOne({ idUser: shopId });
    if (!shop) {
      throw new Error('ShopDetail not found');
    }
    if (packagePost && packagePost.length > 0) {
      let newPackagePost = [];

      if (shop.packagePost.includes('Free')) {
        newPackagePost.push('Free');
      }
      // Loại bỏ "Free" từ packagePost gửi lên (vì đã được giữ)
      const filtered = packagePost.filter((p) => p !== 'Free');
      // Nếu shop đã có "Free" thì chỉ cho phép thêm tối đa 1 giá trị nữa, ngược lại tối đa 2
      const maxAllowed = newPackagePost.includes('Free') ? 1 : 2;
      if (filtered.length > maxAllowed) {
        throw new Error(
          `packagePost can have maximum ${maxAllowed} additional package(s)`
        );
      }
      newPackagePost = newPackagePost.concat(filtered);
      shop.packagePost = newPackagePost;
    }

    // Với packageInsurance, update trực tiếp (không có giới hạn)
    if (packageInsurance) {
      shop.packageInsurance = packageInsurance;
    }

    await shop.save();
    return shop;
  } catch (error) {
    throw error;
  }
};
export const updateSkipConfirmation = async (shopId, skipConfirmationValue) => {
  try {
    const shop = await ShopDetail.findOneAndUpdate(
      { idUser: shopId },
      { skipConfirmation: skipConfirmationValue },
      { new: true, runValidators: true }
    );
    if (!shop) {
      throw new Error('ShopDetail not found');
    }
    return shop;
  } catch (error) {
    throw error;
  }
};
// Thêm hàm updateShopDetail
export const updateShopDetail = async (userId, updateData) => {
  try {
    // Chỉ cho phép cập nhật các trường cơ bản
    const allowedFields = [
      'name',
      'avatar',
      'cover',
      'description',
      'location',
      'contact',
      'operatingHours',
    ];
    const update = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        update[key] = updateData[key];
      }
    }
    const shop = await ShopDetail.findOneAndUpdate({ idUser: userId }, update, {
      new: true,
      runValidators: true,
    });
    if (!shop) {
      throw new Error('ShopDetail not found');
    }
    return shop;
  } catch (error) {
    throw error;
  }
};
export default {
  createShopDetail,
  deleteShopDetailById,
  getAllShopDetail,
  getShopDetailById,
  getShopDetailByUserId,
  updateShopPackages,
  updateSkipConfirmation,
  updateShopDetail,
};
