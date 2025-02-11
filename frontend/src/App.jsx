import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import { NotificationProvider } from './Context/NotificationContext';
import Navbar from './components/Layout/Navbar';
import LandingPage from './components/Home/LandingPage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Unauthorized from './components/Auth/Unauthorized';
import { CssBaseline, ThemeProvider, createTheme, Container, Alert, AlertTitle } from '@mui/material';
import SuperAdminDashboard from './components/Dashboard/SuperAdminDashboard';
import CompanyDetails from './components/Dashboard/CompanyDetails';
import ProtectedRoute from './components/routes/ProtectedRoute';
import CompanyAdminDashboard from './components/Dashboard/CompanyAdminDashboard';
import EmployeeDashboard from './components/Dashboard/EmployeeDashboard';
import { ErrorBoundary } from 'react-error-boundary';
import Profile from './components/Profile/Profile';


// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
  },
});

function ErrorFallback({ error }) {
  return (
    <Container>
      <Alert severity="error" sx={{ mt: 2 }}>
        <AlertTitle>Something went wrong</AlertTitle>
        {error.message}
      </Alert>
    </Container>
  );
}

function NotificationErrorFallback({ error }) {
  return (
    <div role="alert">
      <p>Something went wrong with notifications:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AuthProvider>
        <ErrorBoundary FallbackComponent={NotificationErrorFallback}>
          <NotificationProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Router>
                <Navbar />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route 
                    path="/super_admin_dashboard" 
                    element={
                      <ProtectedRoute roles={['super_admin']}>
                        <SuperAdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/companies/:id" 
                    element={
                      <ProtectedRoute roles={['super_admin']}>
                        <CompanyDetails />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/company_admin_dashboard" 
                    element={
                      <ProtectedRoute roles={['company_admin']}>
                        <CompanyAdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route
                    path="/employee_dashboard"
                    element={
                      <ProtectedRoute roles={['employee']}>
                        <EmployeeDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Router>
            </ThemeProvider>
          </NotificationProvider>
        </ErrorBoundary>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;