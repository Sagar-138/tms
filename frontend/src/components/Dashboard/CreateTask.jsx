import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../Context/AuthContext';
import { canAssignTaskTo } from '../../utils/hierarchyHelper';

const CreateTask = ({ open, onClose, onTaskCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: null,
    priority: 'medium',
    category: '',
    estimatedHours: '',
    attachments: [],
  });

  useEffect(() => {
    if (open) {
      fetchTeamMembers();
    }
  }, [open]);

  const fetchTeamMembers = async () => {
    try {
      const response = await api.get('/users/team-members');
      
      // Filter members based on hierarchy level
      const assignableMembers = response.data.filter(member => {
        if (!user.hierarchyLevel || !member.hierarchyLevel) return false;
        return user.hierarchyLevel.level < member.hierarchyLevel.level;
      });

      setTeamMembers(assignableMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setError('Failed to fetch team members');
    }
  };

  const handleFileChange = (event) => {
    setFormData({
      ...formData,
      attachments: [...event.target.files],
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'attachments') {
          formData.attachments.forEach(file => {
            formDataToSend.append('attachments', file);
          });
        } else if (key === 'dueDate') {
          formDataToSend.append(key, formData[key]?.toISOString());
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      await api.post('/tasks', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onTaskCreated();
      onClose();
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: null,
        priority: 'medium',
        category: '',
        estimatedHours: '',
        attachments: [],
      });
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Task</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          margin="dense"
          label="Title"
          fullWidth
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <FormControl fullWidth margin="dense">
          <InputLabel>Assign To</InputLabel>
          <Select
            value={formData.assignedTo}
            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
          >
            {teamMembers.map((member) => (
              <MenuItem 
                key={member._id} 
                value={member._id}
                disabled={!canAssignTaskTo(user.hierarchyLevel?.level, member.hierarchyLevel?.level)}
              >
                {member.name} ({member.hierarchyLevel?.name || 'N/A'})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DateTimePicker
          label="Due Date"
          value={formData.dueDate}
          onChange={(newValue) => setFormData({ ...formData, dueDate: newValue })}
          renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
        />

        <FormControl fullWidth margin="dense">
          <InputLabel>Priority</InputLabel>
          <Select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>

        <TextField
          margin="dense"
          label="Category"
          fullWidth
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        />

        <TextField
          margin="dense"
          label="Estimated Hours"
          type="number"
          fullWidth
          value={formData.estimatedHours}
          onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
        />

        <Box sx={{ mt: 2 }}>
          <input
            accept="*/*"
            style={{ display: 'none' }}
            id="task-attachments"
            multiple
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="task-attachments">
            <Button
              variant="outlined"
              component="span"
              startIcon={<UploadIcon />}
            >
              Upload Attachments
            </Button>
          </label>
          <Box sx={{ mt: 1 }}>
            {formData.attachments.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                onDelete={() => {
                  const newFiles = [...formData.attachments];
                  newFiles.splice(index, 1);
                  setFormData({ ...formData, attachments: newFiles });
                }}
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTask; 