import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { companies } from '../../services/api';

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const response = await companies.getOne(id);
        setCompany(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch company details');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/super_admin_dashboard')}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Company Details
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Name</Typography>
          <Typography color="text.secondary" paragraph>
            {company?.name}
          </Typography>

          <Typography variant="h6">Description</Typography>
          <Typography color="text.secondary" paragraph>
            {company?.description || 'No description provided'}
          </Typography>

          <Typography variant="h6">Admin</Typography>
          <Typography color="text.secondary" paragraph>
            {company?.admin?.name} ({company?.admin?.email})
          </Typography>

          <Typography variant="h6">Status</Typography>
          <Typography
            color={company?.active ? 'success.main' : 'error.main'}
            paragraph
          >
            {company?.active ? 'Active' : 'Inactive'}
          </Typography>

          <Typography variant="h6">Created At</Typography>
          <Typography color="text.secondary" paragraph>
            {new Date(company?.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CompanyDetails;