import React from 'react';
import './../Styles/modal.css'; // Stilovi za modal (možeš prilagoditi)

interface ConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Potvrdi licitaciju</h2>
                <p>Da li ste sigurni da želite da licitirate?</p>
                <button onClick={onConfirm}>Da</button>
                <button onClick={onCancel}>Ne</button>
            </div>
        </div>
    );
};

export default ConfirmationModal;
