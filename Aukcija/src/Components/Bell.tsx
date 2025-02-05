import { Bell } from "lucide-react";

interface NotificationBellProps {
    count: number;
    onClick: () => void;
    className?: string;
}

const NotificationBell = ({ count, onClick, className }: NotificationBellProps) => {
    return (
        <div className="relative inline-block">
            <Bell size={24} className={`text-gray-600 ${className}`} onClick={onClick} />
            {count > 0 && (
                <span
                    style={{
                        position: "relative",
                        bottom: "20px",
                        right: "10px",
                        backgroundColor: "red",
                        color: "white",
                        fontSize: "12px",
                        fontWeight: "bold",
                        padding: "2px 6px",
                        borderRadius: "9999px",
                        zIndex: 100,
                    }}
                >
                    {count}
                </span>
            )}
        </div>
    );
};

export default NotificationBell;
