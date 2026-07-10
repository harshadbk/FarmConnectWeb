import {useState} from 'react'
import './addwork.css'

const Feedback = () => {
    const [feedback, setFeedback] = useState({
        email:localStorage.getItem('user-name'),
        name: '',
        entityType: '', 
        whome:'',
        comments: '',
        rating: 1
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFeedback({ ...feedback, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Feedback Submitted:', feedback);

        await fetch('http://13.233.124.185/addfeedback', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(feedback),
        })
        .catch((error) => {
            console.error('Error:', error);
            alert("An error occurred while adding the investment.");
        });

        setFeedback({ name: '', entityType: '',whome:'', comments: '', rating: 1 });
        alert('Thank you for your feedback!');
    };
  return (
        <div className="feedback-form-container">
            <h2>Feedback Form</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="name">Your Name:</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={feedback.name}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="entityType">Entity Type:</label>
                <select
                    id="entityType"
                    name="entityType"
                    value={feedback.entityType}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select Entity</option>
                    <option value="farmer">Farmer</option>
                    <option value="shopkeeper">Shopkeeper</option>
                    <option value="merchant">Merchant</option>
                    <option value="worker">Worker</option>
                </select>

                <label htmlFor="name">To Whom:</label>
                <input
                    type="text"
                    id="whome"
                    name="whome"
                    value={feedback.whome}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="rating">Rating:</label>
                <input
                    type="number"
                    id="rating"
                    name="rating"
                    value={feedback.rating}
                    onChange={handleChange}
                    min="1"
                    max="5"
                    required
                />

                <label htmlFor="comments">Comments:</label>
                <textarea
                    id="comments"
                    name="comments"
                    value={feedback.comments}
                    onChange={handleChange}
                    rows="4"
                    required
                />

                <button type="submit">Submit Feedback</button>
            </form>
        </div>

  )
}

export default Feedback
