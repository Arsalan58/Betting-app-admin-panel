import React, { useEffect, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import { Doughnut, Bar } from 'react-chartjs-2';
import 'chart.js/auto'; // Import Chart.js
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GavelIcon from '@mui/icons-material/Gavel';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import PublicIcon from '@mui/icons-material/Public';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import axios from 'axios';
import { BASE_URL } from '../costants';

const theme = createTheme({
  palette: {
    primary: {
      main: '#604586',
    },
    secondary: {
      main: '#516294',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '16px',
          borderRadius: '8px',
        },
      },
    },
  },
});

const Home = () => {
  const [dashboardData, setDashboardData] = useState({
    totalCustomers:"",
    liveGames:"",
    totalGames:"",
    totalUsers:"",
  })
  useEffect(() => {
    const fetchData = async () => {
      const {data:{data}} = await axios.get(`${BASE_URL}/api/web/retrieve/dashboard`)
      // console.log(data)
      setDashboardData(data)
    }
    fetchData()
  }, [])

  return (
    <>
      <ThemeProvider theme={theme}>
        <Box sx={{ flexGrow: 1, p: 2 }}>
          <Grid container spacing={2} my={2}>
            {/* Key Metrics */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                  <Typography variant="h6" color="primary">Total Customers</Typography>
                </Box>
                <Typography variant="h4">{dashboardData?.totalCustomers}</Typography>
                {/* <CircularProgress variant="determinate" value={100} color="primary" /> */}
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SportsEsportsIcon sx={{ color: theme.palette.secondary.main, mr: 1 }} />
                  <Typography variant="h6" color="primary">Live Games</Typography>
                </Box>
                <Typography variant="h4">{dashboardData.liveGames}</Typography>
                {/* <CircularProgress variant="determinate" value={dashboardData.liveGames} color="secondary" /> */}
              </Paper>
            </Grid>

            {/* Additional Metrics */}
            {/* <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <GavelIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6" color="primary">Total Cross Bids</Typography>
            </Box>
            <Typography variant="h4">{dashboardData.totalCrossBids}</Typography>
          </Paper>
        </Grid> */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SportsEsportsIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                  <Typography variant="h6" color="primary">Total Games</Typography>
                </Box>
                <Typography variant="h4">{dashboardData.totalGames}</Typography>
              </Paper>
            </Grid>
            {/* <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EmojiPeopleIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6" color="primary">Total Jantri Bids</Typography>
            </Box>
            <Typography variant="h4">{dashboardData.totalJantriBids}</Typography>
          </Paper>
        </Grid> */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PublicIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                  <Typography variant="h6" color="primary">Total Users</Typography>
                </Box>
                <Typography variant="h4">{dashboardData.totalUsers}</Typography>
              </Paper>
            </Grid>


          </Grid>
          {/* <Grid container mt={5}>
                Charts
                <Grid item xs={12} md={6}>
          <Paper elevation={3}>
            <Typography variant="h6" color="primary" gutterBottom>Profit vs Loss</Typography>
            <Doughnut data={profitLossData} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3}>
            <Typography variant="h6" color="primary" gutterBottom>Live Games</Typography>
            <Bar data={gamesData} />
          </Paper>
        </Grid>
      </Grid> */}
        </Box>
      </ThemeProvider>
    </>
    )
  };

    export default Home;
