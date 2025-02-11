import { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const EmployeesList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [hierarchyLevels, setHierarchyLevels] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    hierarchyLevel: '',
    reportsTo: '',
  });

  useEffect(() => {
    fetchEmployees();
    fetchHierarchyLevels();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users/employees');
      setEmployees(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchHierarchyLevels = async () => {
    try {
      const response = await api.get('/hierarchy');
      setHierarchyLevels(response.data);
    } catch (error) {
      console.error('Failed to fetch hierarchy levels:', error);
    }
  };

  const handleCreateEmployee = async () => {
    try {
      await api.post('/auth/register', {
        ...formData,
        role: 'employee',
      });
      setOpenDialog(false);
      fetchEmployees();
      setFormData({
        name: '',
        email: '',
        password: '',
        hierarchyLevel: '',
        reportsTo: '',
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create employee');
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Employees
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ float: 'right' }}
            onClick={() => setOpenDialog(true)}
          >
            Add Employee
          </Button>
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Hierarchy Level</TableCell>
                <TableCell>Reports To</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee._id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.hierarchyLevel?.name}</TableCell>
                  <TableCell>{employee.reportsTo?.name}</TableCell>
                  <TableCell>
                    <IconButton color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <TextField
            select
            margin="dense"
            label="Hierarchy Level"
            fullWidth
            value={formData.hierarchyLevel}
            onChange={(e) => setFormData({ ...formData, hierarchyLevel: e.target.value })}
          >
            {hierarchyLevels.map((level) => (
              <MenuItem key={level._id} value={level._id}>
                {level.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateEmployee} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmployeesList; 