import React, { useEffect, useState } from 'react';
import { companies, users, hierarchy, tasks } from '../services/api';

const CompanyAdminDashboard = () => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyData = await companies.getAll();
        const userData = await users.getEmployees();
        const hierarchyData = await hierarchy.getAll();
        const taskData = await tasks.getAll();
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* Your component code */}
    </div>
  );
};

export default CompanyAdminDashboard; 