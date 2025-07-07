import { useState } from 'react';
import {
  Avatar,
  Box,
  List,
  ListItemAvatar,
  ListItemText,
  Divider,
  ListItemButton,
} from '@mui/material';

interface User {
  id: string;
  username?: string;
  email: string;
}

interface DividedListProps {
  onlineUsers: { id: string, username?: string, email: string }[];
  onUserClick: (user: { id: string, username?: string, email: string }) => void;
  disabled?: boolean;
  selectedUserId?: string | null;
}

const DividedList: React.FC<DividedListProps> = ({ onlineUsers, onUserClick, disabled = false, selectedUserId }) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
      <List
        sx={{
          width: '100%',
          maxWidth: 360,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          },
        }}
      >
        {onlineUsers.map((user: User, index: number) => (
          <div key={user.id}>
            {index !== 0 && <Divider />}
            <ListItemButton
              className={`divided-list-item${selectedUserId === user.id ? ' selected' : ''}`}
              onClick={() => !disabled && onUserClick(user)}
              disabled={disabled}
              sx={{
                py: 1.5,
                px: 2,
                backgroundColor: selectedUserId === user.id ? 'primary.main' : 'transparent',
                color: selectedUserId === user.id ? 'primary.contrastText' : 'text.primary',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: selectedUserId === user.id ? 'primary.dark' : 'action.hover',
                  transform: 'translateX(4px)',
                },
                '&.Mui-disabled': {
                  opacity: 0.5,
                },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  alt={user.email}
                  src="/static/images/avatar/1.jpg"
                  sx={{ 
                    width: 36, 
                    height: 36,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                />
              </ListItemAvatar>
              <ListItemText
                primary={user.username || user.email}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: selectedUserId === user.id ? 600 : 400,
                }}
                sx={{
                  transition: 'all 0.3s ease',
                }}
              />
            </ListItemButton>
          </div>
        ))}
      </List>
    </Box>
  );
};

export default DividedList;
