
import './../../Styles/modal.css'; // Stilovi za modal (možeš prilagoditi)

interface InfoModalProps {
    isOpen: boolean;
    onCancel: () => void;
    message: string;
    title: string;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, message, title, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{title}</h2>
                <p>{message}</p>
                {/* <img src='/assets/maxbidding.gif'></img> */}
                <br></br>
                <button onClick={onCancel}>OK</button>
            </div>
        </div>
    );
};

export default InfoModal;
