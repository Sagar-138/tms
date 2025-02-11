import { Box, Button, Container, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SecurityIcon from '@mui/icons-material/Security';
import GroupsIcon from '@mui/icons-material/Groups';


const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <TaskAltIcon sx={{ fontSize: 50 }} />,
      title: 'Task Management',
      description: 'Efficiently manage and track tasks across your organization.'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 50 }} />,
      title: 'Role-Based Access',
      description: 'Secure role-based access control for different user levels.'
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 50 }} />,
      title: 'Team Collaboration',
      description: 'Seamless collaboration between team members and departments.'
    }
  ];

  return (
    <Box>
    
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container>
          <Typography variant="h2" component="h1" gutterBottom>
            Welcome to TaskManager Pro
          </Typography>
          <Typography variant="h5" component="h2" sx={{ mb: 4 }}>
            Streamline your workflow with our powerful task management solution
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate('/register')}
            sx={{ mr: 2 }}
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            size="large"
            onClick={() => navigate('/login')}
          >
            Learn More
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          gutterBottom
          sx={{ mb: 6 }}
        >
          Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 3,
                  height: '100%',
                  border: '1px solid #eee',
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-5px)',
                    transition: 'all 0.3s ease-in-out'
                  }
                }}
              >
                <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary">
                  {feature.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Call to Action Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8, textAlign: 'center' }}>
        <Container>
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to Get Started?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Join thousands of teams already using TaskManager Pro
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/register')}
          >
            Sign Up Now
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;