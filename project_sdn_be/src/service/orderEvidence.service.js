import OrderEvidence from '../models/OrderEvidence.js';

export const createOrderEvidence = async (evidenceData) => {
    try {
        const evidence = new OrderEvidence(evidenceData);
        return await evidence.save();
    } catch (error) {
        throw error;
    }
};

export const getOrderEvidenceById = async (evidenceId) => {
    try {
        const evidence = await OrderEvidence.findById(evidenceId)
            .populate('orderId')
            .populate('reviewedBy', '-password');
        return evidence;
    } catch (error) {
        throw error;
    }
};

export const getEvidencesByOrderId = async (orderId) => {
    try {
        const evidence = await OrderEvidence.find({ orderId })
            .populate('reviewedBy', '-password')
            .sort({ createdAt: -1 });
        return evidence;
    } catch (error) {
        throw error;
    }
};

export const getEvidencesBySubmitter = async (submittedBy, status = null) => {
    try {
        const query = { submittedBy };
        if (status) {
            query.status = status;
        }
        
        const evidence = await OrderEvidence.find(query)
            .populate('orderId')
            .populate('reviewedBy', '-password')
            .sort({ createdAt: -1 });
        return evidence;
    } catch (error) {
        throw error;
    }
};

export const updateEvidenceStatus = async (evidenceId, status, reviewerId, reviewNote) => {
    try {
        const evidence = await OrderEvidence.findByIdAndUpdate(
            evidenceId,
            {
                status,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
                reviewNote
            },
            { new: true }
        ).populate('reviewedBy', '-password');
        return evidence;
    } catch (error) {
        throw error;
    }
};

export const deleteOrderEvidence = async (evidenceId) => {
    try {
        return await OrderEvidence.findByIdAndDelete(evidenceId);
    } catch (error) {
        throw error;
    }
}; 