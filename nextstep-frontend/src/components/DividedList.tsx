import { useState } from 'react';
import {
  Avatar,
  Box,
  List,
  ListItem,
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
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        {onlineUsers.map((user, index) => (
          <div key={user.id}>
            {index !== 0 && <Divider />}
            <ListItemButton
              onClick={() => handleUserClick(user)}
              disabled={disabled}
              sx={{
                py: 1,
                px: 2,
                backgroundColor: user.id === selectedUserId ? 'primary.main' : 'transparent',
                color: user.id === selectedUserId ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                  backgroundColor: user.id === selectedUserId ? 'primary.dark' : 'action.hover',
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
                  sx={{ width: 32, height: 32 }}
                />
              </ListItemAvatar>
              <ListItemText
                primary={user.email}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: user.id === selectedUserId ? 600 : 400,
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
