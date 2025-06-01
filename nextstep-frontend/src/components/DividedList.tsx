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
  email: string;
}

interface DividedListProps {
  onlineUsers: User[];
  onUserClick: (user: User) => void;
  disabled?: boolean;
}

const DividedList: React.FC<DividedListProps> = ({ onlineUsers, onUserClick, disabled = false }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleUserClick = (user: User) => {
    if (disabled) return;
    setSelectedUserId(user.id);
    onUserClick(user);
  };

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
        {onlineUsers.map((user, index) => (
          <div key={user.id}>
            {index !== 0 && <Divider />}
            <ListItemButton
              onClick={() => handleUserClick(user)}
              disabled={disabled}
              sx={{
                py: 1.5,
                px: 2,
                backgroundColor: user.id === selectedUserId ? 'primary.main' : 'transparent',
                color: user.id === selectedUserId ? 'primary.contrastText' : 'text.primary',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: user.id === selectedUserId ? 'primary.dark' : 'action.hover',
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
                primary={user.email}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: user.id === selectedUserId ? 600 : 400,
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
