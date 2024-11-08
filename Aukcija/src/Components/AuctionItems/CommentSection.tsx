import React, { useState, useEffect } from "react";
import api from "../../api"; // Assuming `api` is configured for making HTTP requests
import './../../Styles/commentSection.css';

interface Comment {
    id: number;
    user: string; // Email address of the user
    content: string;
    created_at: string;
}

interface CommentSectionProps {
    auctionItemId: number; // ID of the auction item to load comments for
}

function CommentSection({ auctionItemId }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        try {
            const response = await api.get(`/api/comments/${auctionItemId}`);
            setComments(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch comments:", error);
            setLoading(false);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const response = await api.post("/api/comments/create/", {
                auction_item_id: auctionItemId,
                content: newComment,
            });
            setComments((prevComments) => [...prevComments, response.data]);
            setNewComment(""); // Clear input field after submitting
        } catch (error) {
            console.error("Failed to submit comment:", error);
        }
    };

    // Function to get a "user-friendly" username from email
    const getUserNameFromEmail = (email: string) => {
        const username = email.split('@')[0]; // Get part before '@'
        return username.charAt(0).toUpperCase() + username.slice(1); // Capitalize first letter
    };

    return (
        <div className="comment-section">
            <h3>Komentari</h3>
            
            {loading ? (
                <p>učitavanje komentara...</p>
            ) : comments.length > 0 ? (
                <ul className="comment-list">
                    {comments.map((comment) => (
                        <li key={comment.id} className="comment-item">
                            <strong>{getUserNameFromEmail(comment.user)}</strong> {/* Display username */}
                            <p>{comment.content}</p>
                            <small>{new Date(comment.created_at).toLocaleString()}</small>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Još nema komentara! Budi prvi koji će komentarisati ovu aukciju!</p>
            )}

            <form onSubmit={handleCommentSubmit} className="comment-form">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write your comment here..."
                    rows={3}
                    required
                />
                <button type="submit">Postavi komentar</button>
            </form>
        </div>
    );
}

export default CommentSection;
