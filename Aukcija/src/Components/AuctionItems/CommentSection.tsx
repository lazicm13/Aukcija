import React, { useState, useEffect } from "react";
import api from "../../api"; // Assuming `api` is configured for making HTTP requests
import './../../Styles/commentSection.css';

interface Comment {
    id: number;
    user: string; // User's full name
    userId: number; // User ID for ownership check
    content: string;
    created_at: string;
    replies?: Comment[];
}

interface CommentSectionProps {
    auctionItemId: number;
    ownerId: number; // Owner ID for the auction item
}

function CommentSection({ auctionItemId, ownerId }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(""); 
    // const [reply, setReply] = useState<string>(""); 
    // const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null); 
    const [userId, setUserId] = useState(0);

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        try {
            const response = await api.get(`/api/comments/${auctionItemId}/`);
            setComments(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch comments:", error);
            setLoading(false);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newComment.trim()) {
            setError("Komentar ne može biti prazan.");
            return;
        }

        if (newComment.length > 300) {
            setError("Komentar ne može biti duži od 300 karaktera.");
            return;
        }

        try {
            const response = await api.post("/api/comments/create/", {
                auction_item_id: auctionItemId,
                content: newComment,
            });
            setComments((prevComments) => [...prevComments, response.data]);
            setNewComment("");
            setError("");
        } catch (error) {
            console.error("Failed to submit comment:", error);
        }
    };

    const deleteComment = async (commentId: number) => {
        try {
            await api.delete(`/api/comments/${commentId}/delete/`);
            setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
        } catch (error) {
            console.error("Failed to delete comment:", error);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get('/api/current_user_data/');
                setUserId(response.data.id);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    return (
        <div className="comment-section">
            <h3>Komentari</h3>
            <hr className="comment-hr" />
            {loading ? (
                <p>Učitavanje komentara...</p>
            ) : comments.length > 0 ? (
                <ul className="comment-list">
                    {comments.map((comment) => (
                        
                        <li key={comment.id} className="comment-item">
                            {(comment.userId === userId || userId === ownerId) && (
                                <button onClick={() => deleteComment(comment.id)} className="delete-comment-btn">Obriši komentar</button>
                            )}
                            <strong>
                                {comment.user}{" "}
                                {comment.userId === ownerId && <span style={{color: "red"}}>(Prodavac)</span>}
                            </strong>
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
                    placeholder="Napišite svoj komentar ovde..."
                    rows={3}
                />
                <button type="submit">Postavi komentar</button>
            </form>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

export default CommentSection;

