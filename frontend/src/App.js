import React, { useState, useCallback, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  CssBaseline,
  LinearProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import BlockIcon from '@mui/icons-material/Block';
import ImageIcon from '@mui/icons-material/Image';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TitleIcon from '@mui/icons-material/Title';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { createTheme, ThemeProvider, alpha } from '@mui/material/styles';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

function App() {
  const [imagePreview, setImagePreview] = useState(null);
  const [title, setTitle] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    model_invocations: 0,
    successful_invocations: 0,
    failed_invocations: 0,
    avg_processing_time: 0,
    processing_times: [],
    success_rate: 0,
    total_images: 0,
  });

  const theme = createTheme({
    palette: {
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/metrics`);
      setMetrics(response.data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    setError(null);
    setTitle(null);
    setConfidence(null);
    setExplanation(null);

    // Create image preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);

    // Upload and process image
    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${API_URL}/analyze-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setTitle(response.data.title);
      setConfidence(response.data.confidence);
      setExplanation(response.data.explanation);
      fetchMetrics();
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please wait a minute before trying again.');
      } else if (err.response?.status === 400) {
        setError(err.response.data.detail || 'Invalid image or inappropriate content detected.');
      } else {
        setError(err.response?.data?.detail || 'Error processing image');
      }
      setImagePreview(null);
    } finally {
      setLoading(false);
    }
  }, [fetchMetrics]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    }
  });

  const renderSecurityFeatures = () => (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon color="primary" /> Security Features
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SpeedIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Rate Limiting</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Maximum 5 requests per minute to prevent abuse and ensure fair usage.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <BlockIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Content Safety</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Automatic detection and blocking of inappropriate content.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ImageIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">File Types</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Support for JPEG, PNG, and GIF image formats.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderUploadArea = () => (
    <Box
      sx={{
        p: 3,
        border: '2px dashed',
        borderColor: 'primary.main',
        borderRadius: 2,
        textAlign: 'center',
        bgcolor: 'background.paper',
        cursor: 'pointer',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.05),
        },
      }}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Drag and drop an image here
      </Typography>
      <Typography variant="body2" color="text.secondary">
        or click to select a file
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Supported formats: JPEG, PNG, GIF
      </Typography>
    </Box>
  );

  const renderMetrics = () => {
    const modelInvocations = metrics?.model_invocations ?? 0;
    const success = metrics?.successful_invocations ?? 0;
    const failed = metrics?.failed_invocations ?? 0;
    const avgProcessingTime = metrics?.avg_processing_time ?? 0;
    const processingTimes = metrics?.processing_times ?? [];
    const successRate = metrics?.success_rate ?? 0;
    const totalImages = metrics?.total_images ?? 0;

    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" /> Performance Analytics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Model Invokes</Typography>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                {modelInvocations}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total number of model invoke calls (success + failed)
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Success Rate</Typography>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                {successRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Percentage of successfully processed images
              </Typography>
              <Box sx={{ mt: 2, height: 100, position: 'relative' }}>
                <Doughnut
                  data={{
                    labels: ['Success', 'Failed'],
                    datasets: [{
                      data: [success, failed],
                      backgroundColor: [
                        theme.palette.success.main,
                        theme.palette.error.main
                      ],
                      borderWidth: 0
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Avg. Latency</Typography>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                {avgProcessingTime.toFixed(2)}s
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average time to process and generate titles for images
              </Typography>
              <Box sx={{ mt: 2, height: 100, position: 'relative' }}>
                <Line
                  data={{
                    labels: processingTimes.map((_, i) => i + 1),
                    datasets: [{
                      label: 'Processing Time (s)',
                      data: processingTimes,
                      borderColor: theme.palette.primary.main,
                      tension: 0.4,
                      fill: false
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Seconds'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Images</Typography>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                {totalImages}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total number of images processed (success only)
              </Typography>
              <Box sx={{ mt: 2, height: 100, position: 'relative' }}>
                <Bar
                  data={{
                    labels: ['Processed', 'Failed'],
                    datasets: [{
                      data: [success, failed],
                      backgroundColor: [
                        theme.palette.primary.main,
                        theme.palette.error.main
                      ]
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Count'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Automatic Image Titling
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Upload an image and let our AI generate a descriptive title for it
          </Typography>
        </Box>

        {renderUploadArea()}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {imagePreview && (
          <Box sx={{ mt: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ position: 'relative', width: '100%', paddingTop: '75%' }}>
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Preview"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: 1
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {title && (
                      <>
                        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TitleIcon color="primary" /> Generated Title
                        </Typography>
                        <Typography variant="h4" color="primary" gutterBottom>
                          {title}
                        </Typography>
                        {explanation && (
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            {explanation}
                          </Typography>
                        )}
                        {confidence && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Confidence Score
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={confidence * 100} 
                              sx={{ 
                                height: 10, 
                                borderRadius: 5,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 5,
                                }
                              }} 
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {Math.round(confidence * 100)}% confidence in the generated title
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {renderSecurityFeatures()}
        {renderMetrics()}
      </Container>
    </ThemeProvider>
  );
}

export default App; 