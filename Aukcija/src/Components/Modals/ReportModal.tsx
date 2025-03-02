import { useState } from 'react';
import './../../Styles/modal.css'; // Stilovi za modal (možeš prilagoditi)

interface ReportModalProps {
    isOpen: boolean;
    onConfirm: (reportText: string) => void;
    onCancel: () => void;
    title: string;
    message: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onConfirm, onCancel, title, message }) => {
    const [reportText, setReportText] = useState('');

    // Handle the report text input change
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setReportText(e.target.value);
    };

    // Handle confirmation of the report submission
    const handleSubmit = () => {
        if (reportText.trim()) {
            onConfirm(reportText);
        } else {
            alert('Molimo vas da unesete razlog prijave.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{title}</h2>
                <p>{message}</p>
                {/* Textarea for entering the report description */}
                <textarea
                    placeholder="Unesite razlog prijave..."
                    value={reportText}
                    onChange={handleInputChange}
                    rows={4}
                    cols={50}
                />
                <div className="modal-buttons">
                    <button onClick={handleSubmit}>Potvrdi prijavu</button>
                    <button onClick={onCancel}>Odustani</button>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
