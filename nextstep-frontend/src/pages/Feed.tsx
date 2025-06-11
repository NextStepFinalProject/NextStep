import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  CircularProgress,
  Button,
  List,
  Card,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Badge,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Switch,
  FormControlLabel,
  Container,
} from "@mui/material";
import { ThumbUp, Message, Delete } from '@mui/icons-material';
import { Post } from "../models/Post.tsx";
import api from "../serverApi.ts";
import {getUserAuth} from "../handlers/userAuth.ts";
import defaultProfileImage from '../../assets/defaultProfileImage.jpg'; // Import the default profile image
import NewPostModal from '../components/NewPost.tsx';


const Feed: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [commentsCount, setCommentsCount] = useState<{ [key: string]: number }>({});
  const [likesCount, setLikesCount] = useState<{ [key: string]: number }>({});
  const [isLikedByUser, setIsLikedByUser] = useState<{ [key: string]: boolean }>({}); // Track if the current user liked each post
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [postIdToDelete, setPostIdToDelete] = useState<string | null>(null);
  const [filterByUser, setFilterByUser] = useState(false);
  const [profileImages, setProfileImages] = useState<{ [key: string]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showNewPostModal, setShowNewPostModal] = useState(false);

  const auth = getUserAuth();

  const handleCreatePost = () => {
    setShowNewPostModal(true);
  };

  const handleDeletePost = async () => {
    if (postIdToDelete) {
      try {
        await api.delete(`/post/${postIdToDelete}`, {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        });
        setPosts(posts.filter(post => post.id !== postIdToDelete));
        setOpenDialog(false);
        setPostIdToDelete(null);
      } catch (err) {
        console.error("Failed to delete post:", err);
      }
    }
  };

  const handleOpenDialog = (e: React.FormEvent, postId: string) => {
    e.stopPropagation();
    setPostIdToDelete(postId);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setPostIdToDelete(null);
  };

  // useEffect(() => {
  //     const fetchResumeData = async () => {
  //       try {
  //         const resumeData = await api.get('/resume');
  //         const resume = await api.get(`/resource/resume/${resumeData.data.rawContentLink}`);
  //         console.log("a");
  //       } catch (err) {
  //         console.error('Failed to fetch resume data:', err);
  //       }
  //     };
  //     fetchResumeData();
  //   }, []);

  const fetchProfileImage = async (imageFilename: string | null) => {
    try {
      if (!imageFilename) {
        return defaultProfileImage;
      }
      const response = await api.get(`/resource/image/${imageFilename}`, {
        responseType: 'blob',
      });
      return URL.createObjectURL(response.data as Blob);
    } catch (error) {
      console.error('Error fetching profile image:', error);
      return defaultProfileImage;
    }
  };

  const handleLikePost = async (e: React.FormEvent, postId: string) => {
    e.stopPropagation();
    try {
      const value = !isLikedByUser[postId]; // Toggle the like state locally
      await api.put(
        `/post/${postId}/like`,
        { value }, // Send true to add a like, false to remove it
        {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        }
      );

      // Update the likes count and isLikedByUser state locally
      setLikesCount((prev) => ({
        ...prev,
        [postId]: value ? (prev[postId] || 0) + 1 : Math.max((prev[postId] || 0) - 1, 0),
      }));
      setIsLikedByUser((prev) => ({
        ...prev,
        [postId]: value,
      }));
    } catch (err) {
      console.error("Failed to toggle like for post:", err);
    }
  };

  const loadPosts = async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/post`, {
        params: {
          page,
          limit: 5, // Number of posts per page
          owner: filterByUser ? auth.userId : undefined,
        },
      });
      const { posts: postsData, totalPages: total, currentPage: current } = response.data;
      setPosts(postsData);
      setTotalPages(total);
      setCurrentPage(current);

      // Fetch profile images for each post owner
      const images: { [key: string]: string } = {};
      await Promise.all(
        postsData.map(async (post: Post) => {
          const imageUrl = await fetchProfileImage(post.ownerProfileImage as string);
          images[post.owner] = imageUrl;
        })
      );
      setProfileImages(images);

      // Fetch comments count for each post
      const commentsCountData: { [key: string]: number } = {};
      await Promise.all(
        postsData.map(async (post: Post) => {
          const commentsResponse = await api.get(`/comment/post/${post.id}`);
          commentsCountData[post.id] = (commentsResponse.data as Comment[]).length;
        })
      );
      setCommentsCount(commentsCountData);

      // Fetch likes count and determine if the user has liked each post
      const likesCountData: { [key: string]: number } = {};
      const isLikedByUserData: { [key: string]: boolean } = {};
      await Promise.all(
        postsData.map(async (post: Post) => {
          try {
            const likesResponse = await api.get(`/post/${post.id}/like`);
            likesCountData[post.id] = likesResponse.data.count;
            isLikedByUserData[post.id] = likesResponse.data.likedBy.includes(auth.userId); // Check if the current user liked the post
          } catch (error) {
            console.error(`Failed to fetch likes for post ${post.id}:`, error);
            likesCountData[post.id] = 0; // Default to 0 likes if there's an error
            isLikedByUserData[post.id] = false; // Default to not liked
          }
        })
      );
      setLikesCount(likesCountData);
      setIsLikedByUser(isLikedByUserData);
    } catch (err) {
      setError("Failed to load posts. Please try again later.");
      console.error("Failed to load posts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(currentPage);
  }, [currentPage, filterByUser]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", flexGrow: 1 }}>
          <Box sx={{ flexGrow: 1}}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Card
              sx={{
                mb: 2,
                p: 2,
                borderRadius: '12px',
                boxShadow: 2,
                width: '80vh',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={profileImages[auth.userId] || defaultProfileImage} sx={{ mr: 2 }} />
                <Box
                  sx={{
                    backgroundColor: 'background.paper',
                    borderRadius: '20px',
                    px: 2,
                    py: 1,
                    flexGrow: 1,
                  }}
                >
                  <Typography color="text.primary" sx={{ opacity: 0.7 }}>What's on your mind{', ' + auth.username || 'User'}?</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                <Button startIcon={<span style={{ color: 'green' }}>📝</span>} sx={{ textTransform: 'none' }}>
                  Share your resume
                </Button>
                <Button onClick={handleCreatePost} startIcon={<span style={{ color: 'orange' }}>📤</span>} sx={{ textTransform: 'none' }}>
                  Create a new post
                </Button>
              </Box>
            </Card>
            </Box>
            
            <FormControlLabel
                control={
                  <Switch
                    checked={filterByUser}
                    onChange={() => setFilterByUser(!filterByUser)}
                    color="primary"
                  />
                }
                label="Show only my posts"
              /> 
            <NewPostModal
                open={showNewPostModal}
                onClose={() => setShowNewPostModal(false)}
                onPostCreated={() => loadPosts(currentPage)}
            />
            <Box sx={{ width: '100%', maxHeight: '60vh' }}>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography color="error">{error}</Typography>
              ) : (
                <>
                  <List sx={{ overflowY: 'auto', maxHeight: '80vh' }}>
                    {posts.map((post) => (
                      <React.Fragment key={post.id}>
                        <Card sx={{
                          mb: 2,
                          height: '50%',
                          width: '80vh',
                          cursor: 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            boxShadow: 3,
                            backgroundColor: 'rgba(0, 0, 0, 0.03)',
                          },
                        }} onClick={() => navigate(`/post/${post.id}`)}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar
                                src={profileImages[post.owner] || defaultProfileImage}
                                sx={{ mr: 2 }}
                              />
                              <Typography variant="h6">{post.ownerUsername || post.owner}</Typography>
                            </Box>
                            <Typography variant="h5" component="div">
                              {post.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              <span dangerouslySetInnerHTML={{ __html: post.content }} />
                            </Typography>
                          </CardContent>
                          <CardActions disableSpacing>
                            <IconButton
                              aria-label="add to favorites"
                              onClick={(e) => handleLikePost(e, post.id)}
                              color={isLikedByUser[post.id] ? 'primary' : 'default'}
                            >
                              <Badge badgeContent={likesCount[post.id] || 0} color="primary">
                                <ThumbUp />
                              </Badge>
                            </IconButton>
                            <IconButton aria-label="comments">
                              <Badge badgeContent={commentsCount[post.id] || 0} color="primary">
                                <Message />
                              </Badge>
                            </IconButton>
                            {post.owner === auth.userId && (
                              <IconButton aria-label="delete" onClick={(e) => handleOpenDialog(e, post.id)}>
                                <Delete />
                              </IconButton>
                            )}
                          </CardActions>
                        </Card>
                      </React.Fragment>
                    ))}
                  </List>
                </>
              )}
            </Box>
             { totalPages > 0 && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
              <Button
                variant="outlined"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Typography sx={{ mx: 2 }}>{`Page ${currentPage} of ${totalPages}`}</Typography>
              <Button
                variant="outlined"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </Box>
          }
          </Box>
        </Box>

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Are you sure you want to delete this post?"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDeletePost} color="primary" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Feed;