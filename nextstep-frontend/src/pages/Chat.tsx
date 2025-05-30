import React, { useEffect, useState, useRef, useCallback } from 'react';
import './Chat.css';
import { config } from '../config';
import { io, Socket } from "socket.io-client";
import { LoginResponse } from '../models/LoginResponse';
import DividedList from '../components/DividedList';
import { Room } from '../models/Room';
import axios from 'axios';
import { Box, CircularProgress, Alert, Snackbar } from '@mui/material';

const Chat: React.FC = () => {
  const [messageContent, setMessageContent] = useState('');
  const [room, setRoom] = useState<Room>({ _id: null, messages: [] });
  const [onlineUsers, setOnlineUsers] = useState<LoginResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const usersMetadataCacheRef = useRef(new Set<LoginResponse>());
  const socketRef = useRef<Socket | null>(null);
  const userAuthRef = useRef<LoginResponse | null>(null);
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
      // Cleanup existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // Create new socket connection
      socketRef.current = io(config.app.backend_url(), {
        extraHeaders: {
          authorization: `Bearer ${userAuthRef.current.accessToken}`
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      // Connection event handlers
      socketRef.current.on('connect', () => {
        setIsConnected(true);
        setError(null);
        setIsLoading(false);
      });

      socketRef.current.on('connect_error', (err) => {
        setError('Connection error. Please try again.');
        setIsConnected(false);
        setIsLoading(false);
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
        setError('Disconnected from server. Attempting to reconnect...');
      });

      // Message handlers
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

  // Initial connection
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

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
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

      <div className="chat-container">
        <div className="message-input">
          <input
            type="text"
            onChange={(e) => setMessageContent(e.target.value)}
            value={messageContent}
            placeholder="Type your message..."
            disabled={!isConnected}
          />
          <button 
            onClick={sendMessageHandler}
            disabled={!isConnected || !messageContent.trim()}
          >
            Send
          </button>
        </div>

        <div className="chat-messages">
          {room.messages.length === 0 ? (
            <div className="no-messages">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            room.messages.map((m: any, index: number) => (
              <div key={index} className="message">
                <div className="message-header">
                  <span className="message-user">
                    {Array.from(usersMetadataCacheRef.current).find(u => u.id === m?.userId)?.email}
                  </span>
                  <span className="message-time">
                    {new Date(m?.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">{m?.content}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="online-users">
          <h3>Online Users:</h3>
          <DividedList 
            onlineUsers={onlineUsers} 
            onUserClick={onUserClick}
            disabled={!isConnected}
          />
        </div>
      </div>
    </Box>
  );
};

export default Chat;