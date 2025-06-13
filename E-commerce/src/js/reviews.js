// API base URL
const API_URL = 'http://localhost:3000';

// Submit a new review
export async function submitReview(review) {
    try {
        const response = await fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review)
        });
        if (!response.ok) {
            throw new Error('Failed to submit review');
        }
        alert('Review submitted successfully!');
    } catch (error) {
        console.error('Submit review error:', error.message);
        alert('Failed to submit review.');
    }
}

// Delete a review
export async function deleteReview(reviewId) {
    try {
        const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to delete review');
        }
        alert('Review deleted successfully!');
    } catch (error) {
        console.error('Delete review error:', error.message);
        alert('Failed to delete review.');
    }
}