import React from 'react';
import './../Styles/modal.css'; // Stilovi za modal (možeš prilagoditi)

interface ConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    message: string;
    title: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onConfirm, onCancel, message, title }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{title}</h2>
                <p>{message}</p>
                <button onClick={onConfirm}>Da</button>
                <button onClick={onCancel}>Ne</button>
            </div>
        </div>
    );
};

export default ConfirmationModal;
