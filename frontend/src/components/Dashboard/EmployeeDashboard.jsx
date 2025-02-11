import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  People as TeamIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useAuth } from '../../Context/AuthContext';
import api from '../../services/api';
import TaskList from './TaskList';
import CreateTask from './CreateTask';
import TaskTimeline from './TaskTimeline';
import TeamMembers from './TeamMembers';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [stats, setStats] = useState({
    assignedTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    teamMembers: 0,
  });
  const [openCreateTask, setOpenCreateTask] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [tasksRes, teamRes] = await Promise.all([
        api.get('/tasks/my-stats'),
        api.get('/users/team-members'),
      ]);

      setStats({
        assignedTasks: tasksRes.data.totalTasks || 0,
        completedTasks: tasksRes.data.completedTasks || 0,
        pendingTasks: tasksRes.data.pendingTasks || 0,
        teamMembers: teamRes.data.length || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Employee Dashboard</Typography>
        {user.canAssignTasks && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenCreateTask(true)}
          >
            Create Task
          </Button>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6">Assigned Tasks</Typography>
            <Typography variant="h4">{stats.assignedTasks}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6">Completed</Typography>
            <Typography variant="h4">{stats.completedTasks}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6">Pending</Typography>
            <Typography variant="h4">{stats.pendingTasks}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6">Team Members</Typography>
            <Typography variant="h4">{stats.teamMembers}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="My Tasks" value="tasks" icon={<TaskIcon />} />
          {user.canAssignTasks && (
            <Tab label="Team" value="team" icon={<TeamIcon />} />
          )}
          <Tab label="Timeline" value="timeline" icon={<TimelineIcon />} />
        </Tabs>
      </Box>

      {/* Content Area */}
      {activeTab === 'tasks' && <TaskList />}
      {activeTab === 'team' && user.canAssignTasks && <TeamMembers />}
      {activeTab === 'timeline' && <TaskTimeline />}

      {/* Create Task Dialog */}
      <CreateTask
        open={openCreateTask}
        onClose={() => setOpenCreateTask(false)}
        onTaskCreated={fetchDashboardData}
      />
    </Container>
  );
};

export default EmployeeDashboard; 