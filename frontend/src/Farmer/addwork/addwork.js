import { useState } from 'react';
import './adwork.css';

const Addwork = () => {
    const [farmingWork, setFarmingWork] = useState({
        email:localStorage.getItem('user-name'),
        task: '',
        location: '',
        nopeople: '',
        salary: '',
        description: ''
    });
    const [message, setMessage] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFarmingWork({ ...farmingWork, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        await fetch('http://13.233.124.185:5000/addFarmingWork', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(farmingWork),
        })
        .then((resp) => resp.json())
        .then((data) => {
            setMessage('Farming work added successfully!');
            setFarmingWork({
                task: '',
                location: '',
                nopeople: '',
                salary: '',
                description: ''
            });
        })
        .catch((error) => {
            setMessage('Error adding farming work.');
        });
    };

    return (
        <div className="farming-work-form-container fade-in-animation">
            <h2>Add Farming Work</h2>
            <form onSubmit={handleSubmit} className="farming-work-form">
                <input 
                    type="text" 
                    name="task" 
                    placeholder="Task Name" 
                    value={farmingWork.task} 
                    onChange={handleInputChange} 
                    required 
                />
                <input 
                    type="text" 
                    name="location" 
                    placeholder="Location" 
                    value={farmingWork.location} 
                    onChange={handleInputChange} 
                    required 
                />
                <input
                    placeholder='No Of People Required'
                    type="number"
                    name="nopeople"
                    value={farmingWork.nopeople}
                    onChange={handleInputChange}
                    required
                />
                <input
                    placeholder='Salary per day'
                    type="number"
                    name="salary"
                    value={farmingWork.salary}
                    onChange={handleInputChange}
                    required
                />
                <textarea 
                    name="description" 
                    placeholder="Description of the work" 
                    value={farmingWork.description} 
                    onChange={handleInputChange} 
                    required 
                />
                <button type="submit" className="submit-btn">Add Work</button>
            </form>
            {message && <p className="message">{message}</p>}
        </div>
    );
}

export default Addwork;
