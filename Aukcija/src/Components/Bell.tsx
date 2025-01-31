import { Bell } from "lucide-react";

const NotificationBell = ({ count }: { count: number }) => {


    return (
        <div className="relative">
        <Bell  size={24} className="text-gray-600" />
        {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {count}
            </span>
        )}
        </div>
    );
};

export default NotificationBell;