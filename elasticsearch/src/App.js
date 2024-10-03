import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  const fetchEmployees = async (term) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/employees?q=${term}`);
      setEmployees(response.data);
      console.log(response.data);
      setError(null); 
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Error fetching employees'); 
    }
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim() === '') {
      setEmployees([]);
      return;
    }

    fetchEmployees(term); 
  };

  return (
    <div className="App">
      <h1>Employee Search</h1>
      <input
        type="text"
        placeholder="Search by Department"
        value={searchTerm}
        onChange={handleSearchChange}
        className='searchBox'
      />
      {error && <p className="error">{error}</p>}
      <div className="employee-list">
        {employees.length > 0 ? (
          employees.map((employee, index) => (
            <div key={index} className="employee">
              <p><strong>Name:</strong>{employee.Name}</p>
              <p><strong>Department:</strong> {employee.Department}</p>
              <p><strong>Age:</strong> {employee.Age}</p>
              <p><strong>Job:</strong> {employee.JobTitle}</p>
              {/* <p><strong>City:</strong>{employee.City}</p> */}
            </div>
          ))
        ) : (
          <p>No employees found.</p>
        )}
      </div>
    </div>
  );
}

export default App;
