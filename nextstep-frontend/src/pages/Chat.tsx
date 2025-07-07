import React, { useEffect, useState, useRef, useCallback } from 'react';
import './Chat.css';
import { config } from '../config';
import { io, Socket } from "socket.io-client";
import { LoginResponse } from '../models/LoginResponse';
import { Room } from '../models/Room';
import axios from 'axios';
import { 
  Box, 
  CircularProgress, 
  Alert, 
  Snackbar, 
  TextField, 
  Button, 
  Typography,
  Paper,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import DividedList from '../components/DividedList';

const Chat: React.FC = () => {
  const [messageContent, setMessageContent] = useState('');
  const [room, setRoom] = useState<Room>({ _id: null, messages: [] });
  const [onlineUsers, setOnlineUsers] = useState<LoginResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const usersMetadataCacheRef = useRef(new Set<LoginResponse>());
  const socketRef = useRef<Socket | null>(null);
  const userAuthRef =  useRef(JSON.parse(localStorage.getItem(config.localStorageKeys.userAuth) as string) as LoginResponse);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize user auth
  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem(config.localStorageKeys.userAuth);
      if (!storedAuth) {
        throw new Error('No authentication found');
      }
      userAuthRef.current = JSON.parse(storedAuth) as LoginResponse;
    } catch (err) {
      setError('Authentication error. Please log in again.');
      setIsLoading(false);
    }
  }, []);

  const connectHandler = useCallback(() => {
    if (!userAuthRef.current) {
      setError('Authentication error. Please log in again.');
      setIsLoading(false);
      return;
    }

    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      socketRef.current = io(config.app.backend_url(), {
        extraHeaders: {
          authorization: `Bearer ${userAuthRef.current.accessToken}`
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      socketRef.current.on('connect', () => {
        setIsConnected(true);
        setError(null);
        setIsLoading(false);
      });

      socketRef.current.on('connect_error', (_) => {
        setError('Connection error. Please try again.');
        setIsConnected(false);
        setIsLoading(false);
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
        setError('Disconnected from server. Attempting to reconnect...');
      });

      socketRef.current.on(config.socketMethods.messageFromServer, ({ roomId, message }: any) => {
        setRoom(prevRoom => {
          if (prevRoom && prevRoom._id === roomId) {
            return { ...prevRoom, messages: [...prevRoom.messages, message] };
          }
          return prevRoom;
        });
      });

      socketRef.current.on(config.socketMethods.onlineUsers, (receivedOnlineUsers: LoginResponse[]) => {
        setOnlineUsers(receivedOnlineUsers);
        receivedOnlineUsers.forEach(user => {
          usersMetadataCacheRef.current.add(user);
        });
      });

    } catch (err) {
      setError('Failed to connect to chat server');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userAuthRef.current) {
      connectHandler();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectHandler]);

  const sendMessageHandler = () => {
    if (!isConnected || !room._id || !messageContent.trim()) return;

    try {
      socketRef.current?.emit(config.socketMethods.messageFromClient, {
        roomId: room._id,
        messageContent: messageContent.trim()
      });
      setMessageContent('');
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const onUserClick = async (user: LoginResponse) => {
    if (!userAuthRef.current) return;
    setSelectedUserId(user.id!);
    try {
      setIsLoading(true);
      const response = await axios.get<Room>(`${config.app.backend_url()}/room/user/${user.id}`, {
        headers: { Authorization: `Bearer ${userAuthRef.current.accessToken}` }
      });

      setRoom(response.data);
      socketRef.current?.emit(config.socketMethods.enterRoom, response.data._id);
    } catch (err) {
      setError('Failed to load chat room');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [room.messages]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: '100%', 
      mx: 'auto', 
      p: 3,
      display: 'flex',
      gap: 3,
    }}>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Paper 
        elevation={3}
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)',
          },
          flex: 1,
          maxWidth: '1200px',
        }}
      >
        <Box className="message-input" sx={{ 
          display: 'flex', 
          gap: 2,
          bgcolor: 'background.default',
          p: 2,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            disabled={!isConnected}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessageHandler();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '& fieldset': {
                  borderColor: 'divider',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: '1px',
                },
                '& input': {
                  color: 'text.primary',
                  '&::placeholder': {
                    color: 'text.secondary',
                    opacity: 0.7,
                  },
                },
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessageHandler}
            disabled={!isConnected || !messageContent.trim()}
            endIcon={<SendIcon />}
            sx={{ 
              borderRadius: 2,
              px: 3,
              minWidth: '100px',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(9, 132, 227, 0.2)',
              },
              '&.Mui-disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled',
              },
            }}
          >
            Send
          </Button>
        </Box>

        <Paper
          className="chat-messages"
          elevation={0}
          sx={{
            bgcolor: 'background.default',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            p: 2,
            maxHeight: '60vh',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          {room.messages.length === 0 ? (
            <Box className="no-messages" sx={{ py: 4 }}>
              <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.7 }}>
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          ) : (
            room.messages.map((m: any, index: number) => (
              <Box 
                key={index} 
                className="message"
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  maxWidth: '80%',
                  ml: m?.userId === userAuthRef.current?.userId ? 'auto' : 0,
                  mr: m?.userId === userAuthRef.current?.userId ? 0 : 'auto',
                  bgcolor: m?.userId === userAuthRef.current?.userId ? 'primary.main' : 'background.paper',
                  color: m?.userId === userAuthRef.current?.userId ? 'primary.contrastText' : 'text.primary',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  },
                }}
              >
                <Box className="message-header" sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: m?.userId === userAuthRef.current?.userId ? 'inherit' : 'primary.main',
                      fontWeight: 600,
                    }}
                    className="message-user"
                  >
                    {Array.from(usersMetadataCacheRef.current).find(u => u.userId === m?.userId)?.email}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: m?.userId === userAuthRef.current?.userId ? 'inherit' : 'text.secondary',
                      opacity: 0.8,
                    }}
                    className="message-time"
                  >
                    {new Date(m?.createdAt).toLocaleTimeString()}
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'inherit',
                    lineHeight: 1.5,
                  }}
                  className="message-content"
                >
                  {m?.content}
                </Typography>
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </Paper>
      </Paper>

      <Paper
        elevation={3}
        sx={{
          width: 300,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)',
          },
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          height: 'fit-content',
          position: 'sticky',
          top: 24,
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}>
          <Typography 
            variant="h6" 
            color="text.primary" 
            sx={{ 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            Online Users
          </Typography>
          <Box sx={{ 
            ml: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'success.main',
            fontSize: '0.875rem',
          }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: 'success.main',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: '0 0 0 0 rgba(0, 200, 83, 0.4)',
                },
                '70%': {
                  boxShadow: '0 0 0 6px rgba(0, 200, 83, 0)',
                },
                '100%': {
                  boxShadow: '0 0 0 0 rgba(0, 200, 83, 0)',
                },
              },
            }} />
            {onlineUsers.length} online
          </Box>
        </Box>
        <DividedList 
          onlineUsers={onlineUsers.map(user => ({ id: user.id, email: user.email }))} 
          onUserClick={onUserClick}
          disabled={!isConnected}
          selectedUserId={selectedUserId}
        />
      </Paper>
    </Box>
  );
};

export default Chat;