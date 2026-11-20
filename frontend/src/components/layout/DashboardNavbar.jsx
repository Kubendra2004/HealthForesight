import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Badge,
  Button,
  Tooltip
} from '@mui/material';
import {
  Notifications,
  AccountCircle,
  Logout,
  Settings,
  Favorite,
  CalendarToday,
  ChatBubble,
  Assignment,
  MonitorHeart,
  People,
  Search
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const DashboardNavbar = ({ title, role }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    // Navigate to profile page when created
    console.log('Navigate to profile');
  };

  const handleSettings = () => {
    handleClose();
    // Navigate to settings page when created
    console.log('Navigate to settings');
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  // Define quick actions based on role
  const quickActions = {
    patient: [
      { icon: <CalendarToday />, label: 'Book Appointment', action: () => console.log('Book') },
      { icon: <ChatBubble />, label: 'AI Chat', action: () => console.log('Chat') },
      { icon: <Assignment />, label: 'Records', action: () => console.log('Records') },
      { icon: <MonitorHeart />, label: 'Health Check', action: () => console.log('Health') }
    ],
    doctor: [
      { icon: <People />, label: 'Patients', action: () => console.log('Patients') },
      { icon: <Search />, label: 'Search', action: () => console.log('Search') },
      { icon: <MonitorHeart />, label: 'AI Tools', action: () => console.log('AI Tools') },
      { icon: <Assignment />, label: 'Reports', action: () => console.log('Reports') }
    ]
  };

  const actions = quickActions[role] || [];

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: 'transparent',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(255, 255, 255, 0.7)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo & Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Favorite sx={{ color: '#6366f1', fontSize: '1.75rem' }} />
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              HealthForesight
            </Typography>
          </Box>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#0f172a', 
              fontWeight: 600,
              display: { xs: 'none', md: 'block' }
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {actions.map((item, index) => (
            <Tooltip key={index} title={item.label}>
              <IconButton
                onClick={item.action}
                sx={{
                  color: '#6366f1',
                  '&:hover': {
                    background: 'rgba(99, 102, 241, 0.1)'
                  }
                }}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          ))}
          
          <IconButton 
            sx={{ 
              color: '#64748b',
              '&:hover': { background: 'rgba(100, 116, 139, 0.1)' }
            }}
          >
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton onClick={handleMenu}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                fontWeight: 600
              }}
            >
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                borderRadius: 2,
                minWidth: 180,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <MenuItem onClick={handleProfile}>
              <AccountCircle sx={{ mr: 1.5, color: '#6366f1' }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleSettings}>
              <Settings sx={{ mr: 1.5, color: '#64748b' }} />
              Settings
            </MenuItem>
            <MenuItem 
              onClick={handleLogout}
              sx={{ color: '#ef4444' }}
            >
              <Logout sx={{ mr: 1.5 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default DashboardNavbar;
