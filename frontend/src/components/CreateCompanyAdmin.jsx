import React, { useState } from 'react';
import { auth, companies } from '../services/api'; // Updated import

const CreateCompanyAdmin = () => {
  const [formData, setFormData] = useState({
    // Your form data
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await companies.createWithAdmin(formData);
      // Handle the response
    } catch (error) {
      console.error('Error creating company admin:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form code */}
    </form>
  );
};

export default CreateCompanyAdmin; 