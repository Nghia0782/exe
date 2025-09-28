import {
    createOrderEvidence,
    getOrderEvidenceById,
    getEvidencesByOrderId,
    getEvidencesBySubmitter,
    updateEvidenceStatus,
    deleteOrderEvidence
} from '../service/orderEvidence.service.js';

export const createOrderEvidenceController = async (req, res) => {
    try {
        const role = req.user.roles.includes('owner') ? 'owner' : 'renter';
        const evidenceData = {
            ...req.body,
            submittedBy: role
        };

        const evidence = await createOrderEvidence(evidenceData);
        res.status(201).json({ success: true, data: evidence });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOrderEvidenceByIdController = async (req, res) => {
    try {
        const { evidenceId } = req.params;
        const evidence = await getOrderEvidenceById(evidenceId);

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Evidence not found'
            });
        }

        res.status(200).json({ success: true, data: evidence });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getEvidencesByOrderIdController = async (req, res) => {
    try {
        const { orderId } = req.params;
        const evidence = await getEvidencesByOrderId(orderId);

        res.status(200).json({ success: true, data: evidence });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getEvidencesBySubmitterController = async (req, res) => {
    try {
        const { status } = req.query;
        const role = req.user.roles.includes('owner') ? 'owner' : 'renter';
        
        const evidence = await getEvidencesBySubmitter(role, status);
        res.status(200).json({ success: true, data: evidence });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateEvidenceStatusController = async (req, res) => {
    try {
        const { evidenceId } = req.params;
        const { status, reviewNote } = req.body;

        // Chỉ owner mới có quyền review evidence
        if (!req.user.roles.includes('owner')) {
            return res.status(403).json({
                success: false,
                message: 'Only owner can review evidence'
            });
        }

        const evidence = await updateEvidenceStatus(
            evidenceId,
            status,
            req.user._id,
            reviewNote
        );

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Evidence not found'
            });
        }

        res.status(200).json({ success: true, data: evidence });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteOrderEvidenceController = async (req, res) => {
    try {
        const { evidenceId } = req.params;
        const evidence = await getOrderEvidenceById(evidenceId);

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Evidence not found'
            });
        }

        // Chỉ người tạo evidence mới có quyền xóa
        const role = req.user.roles.includes('owner') ? 'owner' : 'renter';
        if (evidence.submittedBy !== role) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this evidence'
            });
        }

        await deleteOrderEvidence(evidenceId);
        res.status(200).json({
            success: true,
            message: 'Evidence deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}; 