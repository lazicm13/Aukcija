import { useState } from "react";
import "./../Styles/authentication.css"

function ChangePasswordPage() {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Handle form submission logic here (e.g., send request to API)
        console.log("Old Password:", oldPassword);
        console.log("New Password:", newPassword);
        console.log("Confirm New Password:", confirmNewPassword);
    };

    return (
        <div className="auth-container">
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange} className="auth-form">
                <div className="form-group">
                    <label htmlFor="oldPassword">Old Password</label>
                    <input
                        type="password"
                        id="oldPassword"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmNewPassword">Confirm New Password</label>
                    <input
                        type="password"
                        id="confirmNewPassword"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="auth-button">
                    Change Password
                </button>
            </form>
        </div>
    );
}

export default ChangePasswordPage;
