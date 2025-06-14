"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Typography,
  Box,
  Button,
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
  Divider,
  Paper,
  Chip,
  useTheme,
  alpha,
  Tooltip,
  Skeleton,
} from "@mui/material"
import {
  ThumbUp,
  Message,
  Delete,
  Bookmark,
  BookmarkBorder,
  Article,
  Send,
  Description,
} from "@mui/icons-material"
import type { Post } from "../models/Post.tsx"
import api from "../serverApi.ts"
import { getUserAuth } from "../handlers/userAuth.ts"
import defaultProfileImage from "../../assets/defaultProfileImage.jpg"
import NewPostModal from "../components/NewPost.tsx"

const Feed: React.FC = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const [posts, setPosts] = useState<Post[]>([])
  const [commentsCount, setCommentsCount] = useState<{ [key: string]: number }>({})
  const [likesCount, setLikesCount] = useState<{ [key: string]: number }>({})
  const [isLikedByUser, setIsLikedByUser] = useState<{ [key: string]: boolean }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [postIdToDelete, setPostIdToDelete] = useState<string | null>(null)
  const [filterByUser, setFilterByUser] = useState(false)
  const [profileImages, setProfileImages] = useState<{ [key: string]: string }>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showNewPostModal, setShowNewPostModal] = useState(false)
  const [showResumePostModal, setShowResumePostModal] = useState(false)
  const [savedPosts, setSavedPosts] = useState<string[]>([])

  const auth = getUserAuth()

  const handleCreatePost = () => {
    setShowNewPostModal(true)
  }

  const handleShareResume = () => {
    setShowResumePostModal(true)
  }

  const handleDeletePost = async () => {
    if (postIdToDelete) {
      try {
        await api.delete(`/post/${postIdToDelete}`, {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        })
        setPosts(posts.filter((post) => post.id !== postIdToDelete))
        setOpenDialog(false)
        setPostIdToDelete(null)
      } catch (err) {
        console.error("Failed to delete post:", err)
      }
    }
  }

  const handleOpenDialog = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation()
    setPostIdToDelete(postId)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setPostIdToDelete(null)
  }

  const fetchProfileImage = async (imageFilename: string | null) => {
    try {
      if (!imageFilename) {
        return defaultProfileImage
      }
      const response = await api.get(`/resource/image/${imageFilename}`, {
        responseType: "blob",
      })
      return URL.createObjectURL(response.data as Blob)
    } catch (error) {
      console.error("Error fetching profile image:", error)
      return defaultProfileImage
    }
  }

  const handleLikePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation()
    try {
      const value = !isLikedByUser[postId]
      await api.put(
        `/post/${postId}/like`,
        { value },
        {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        },
      )

      setLikesCount((prev) => ({
        ...prev,
        [postId]: value ? (prev[postId] || 0) + 1 : Math.max((prev[postId] || 0) - 1, 0),
      }))
      setIsLikedByUser((prev) => ({
        ...prev,
        [postId]: value,
      }))
    } catch (err) {
      console.error("Failed to toggle like for post:", err)
    }
  }

  const toggleSavePost = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation()
    setSavedPosts((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]))
  }

  const formatContent = (content: string) => {
    // Strip HTML tags for preview
    const strippedContent = content.replace(/<[^>]*>?/gm, "")
    return strippedContent.length > 150 ? strippedContent.substring(0, 150) + "..." : strippedContent
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""

    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60))
        return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`
      }
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }
  }

  const loadPosts = async (page: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get(`/post`, {
        params: {
          page,
          limit: 5,
          owner: filterByUser ? auth.userId : undefined,
        },
      })
      const { posts: postsData, totalPages: total, currentPage: current } = response.data
      setPosts(postsData)
      setTotalPages(total)
      setCurrentPage(current)

      // Fetch profile images for each post owner
      const images: { [key: string]: string } = {}
      await Promise.all(
        postsData.map(async (post: Post) => {
          const imageUrl = await fetchProfileImage(post.ownerProfileImage as string)
          images[post.owner] = imageUrl
        }),
      )
      setProfileImages(images)

      // Fetch comments count for each post
      const commentsCountData: { [key: string]: number } = {}
      await Promise.all(
        postsData.map(async (post: Post) => {
          const commentsResponse = await api.get(`/comment/post/${post.id}`)
          commentsCountData[post.id] = (commentsResponse.data as Comment[]).length
        }),
      )
      setCommentsCount(commentsCountData)

      // Fetch likes count and determine if the user has liked each post
      const likesCountData: { [key: string]: number } = {}
      const isLikedByUserData: { [key: string]: boolean } = {}
      await Promise.all(
        postsData.map(async (post: Post) => {
          try {
            const likesResponse = await api.get(`/post/${post.id}/like`)
            likesCountData[post.id] = likesResponse.data.count
            isLikedByUserData[post.id] = likesResponse.data.likedBy.includes(auth.userId)
          } catch (error) {
            console.error(`Failed to fetch likes for post ${post.id}:`, error)
            likesCountData[post.id] = 0
            isLikedByUserData[post.id] = false
          }
        }),
      )
      setLikesCount(likesCountData)
      setIsLikedByUser(isLikedByUserData)
    } catch (err) {
      setError("Failed to load posts. Please try again later.")
      console.error("Failed to load posts:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPosts(currentPage)
  }, [currentPage, filterByUser])

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const renderSkeletons = () => {
    return Array(3)
      .fill(0)
      .map((_, index) => (
        <Card
          key={`skeleton-${index}`}
          sx={{
            mb: 3,
            borderRadius: 2,
            overflow: "hidden",
            boxShadow:
              theme.palette.mode === "dark" ? "0 4px 20px 0 rgba(0,0,0,0.25)" : "0 4px 20px 0 rgba(0,0,0,0.08)",
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ width: "60%" }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={16} />
              </Box>
            </Box>
            <Skeleton variant="text" width="90%" height={30} />
            <Skeleton variant="rectangular" width="100%" height={80} sx={{ mt: 2, borderRadius: 1 }} />
          </CardContent>
          <CardActions sx={{ px: 2, pb: 2 }}>
            <Skeleton variant="circular" width={36} height={36} sx={{ mr: 1 }} />
            <Skeleton variant="circular" width={36} height={36} sx={{ mr: 1 }} />
            <Skeleton variant="circular" width={36} height={36} />
          </CardActions>
        </Card>
      ))
  }

  return (
    <Container
      component="main"
      maxWidth="md"
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        py: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(10px)",
          boxShadow: theme.palette.mode === "dark" ? "0 4px 20px 0 rgba(0,0,0,0.25)" : "0 4px 20px 0 rgba(0,0,0,0.08)",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar
            src={profileImages[auth.userId] || defaultProfileImage}
            sx={{
              width: 48,
              height: 48,
              mr: 2,
              border: `2px solid ${theme.palette.primary.main}`,
            }}
          />
          <Paper
            onClick={handleCreatePost}
            sx={{
              flexGrow: 1,
              p: 1.5,
              pl: 3,
              borderRadius: "24px",
              cursor: "pointer",
              backgroundColor: alpha(theme.palette.background.default, 0.6),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              "&:hover": {
                backgroundColor: alpha(theme.palette.background.default, 0.9),
              },
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography color="text.secondary" sx={{ fontWeight: 400 }}>
              What's on your mind{auth.username ? `, ${auth.username}` : ""}?
            </Typography>
            <Button
              variant="contained"
              size="small"
              sx={{
                borderRadius: "20px",
                minWidth: 0,
                width: 36,
                height: 36,
                p: 0,
              }}
            >
              <Send fontSize="small" />
            </Button>
          </Paper>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "space-around" }}>
          <Button
            onClick={handleCreatePost}
            startIcon={<Article />}
            sx={{
              textTransform: "none",
              borderRadius: "10px",
              py: 1,
              fontWeight: 500,
              flex: 1,
              mr: 1,
              color: theme.palette.primary.main,
            }}
          >
            Create Post
          </Button>

          <Button
            onClick={handleShareResume}
            startIcon={<Description />}
            sx={{
              textTransform: "none",
              borderRadius: "10px",
              py: 1,
              fontWeight: 500,
              flex: 1,
              ml: 1,
              color: theme.palette.success.main,
            }}
          >
            Share Resume
          </Button>
        </Box>
      </Paper>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          px: 1,
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 700,
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(45deg, #60a5fa 30%, #34d399 90%)"
                : "linear-gradient(45deg, #3b82f6 30%, #10b981 90%)",
            backgroundClip: "text",
            textFillColor: "transparent",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {filterByUser ? "My Posts" : "Community Feed"}
        </Typography>

        <FormControlLabel
          control={<Switch checked={filterByUser} onChange={() => setFilterByUser(!filterByUser)} color="primary" />}
          label={
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Show My Posts
            </Typography>
          }
        />
      </Box>

      {/* Regular post creation modal */}
      <NewPostModal
        open={showNewPostModal}
        onClose={() => setShowNewPostModal(false)}
        onPostCreated={() => loadPosts(currentPage)}
      />

      {/* Resume sharing modal */}
      <NewPostModal
        open={showResumePostModal}
        onClose={() => setShowResumePostModal(false)}
        onPostCreated={() => loadPosts(currentPage)}
        withResume={true}
      />

      <Box sx={{ width: "100%", mb: 4 }}>
        {isLoading ? (
          renderSkeletons()
        ) : error ? (
          <Paper
            sx={{
              p: 4,
              borderRadius: 2,
              textAlign: "center",
              backgroundColor: alpha(theme.palette.error.light, 0.1),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            }}
          >
            <Typography color="error" variant="h6">
              {error}
            </Typography>
            <Button variant="outlined" color="primary" onClick={() => loadPosts(currentPage)} sx={{ mt: 2 }}>
              Try Again
            </Button>
          </Paper>
        ) : posts.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              borderRadius: 2,
              textAlign: "center",
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: "blur(10px)",
              boxShadow:
                theme.palette.mode === "dark" ? "0 4px 20px 0 rgba(0,0,0,0.25)" : "0 4px 20px 0 rgba(0,0,0,0.08)",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {filterByUser ? "You haven't created any posts yet" : "No posts found"}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreatePost}
              sx={{
                borderRadius: "12px",
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Create Your First Post
            </Button>
          </Paper>
        ) : (
          <>
            {posts.map((post, index) => (
              <Card
                key={post.id}
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  overflow: "hidden",
                  cursor: "pointer",
                  boxShadow:
                    theme.palette.mode === "dark" ? "0 4px 20px 0 rgba(0,0,0,0.25)" : "0 4px 20px 0 rgba(0,0,0,0.08)",
                  backgroundColor: theme.palette.background.paper,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow:
                      theme.palette.mode === "dark" ? "0 8px 30px 0 rgba(0,0,0,0.3)" : "0 8px 30px 0 rgba(0,0,0,0.12)",
                  },
                  animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                  "@keyframes fadeIn": {
                    "0%": {
                      opacity: 0,
                      transform: "translateY(20px)",
                    },
                    "100%": {
                      opacity: 1,
                      transform: "translateY(0)",
                    },
                  },
                }}
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar
                        src={profileImages[post.owner] || defaultProfileImage}
                        sx={{
                          width: 48,
                          height: 48,
                          mr: 2,
                          border: `2px solid ${theme.palette.primary.main}`,
                        }}
                      />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {post.ownerUsername || post.owner}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {post.createdAt && formatDate(post.createdAt)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      {post.owner === auth.userId && (
                        <Tooltip title="Delete post">
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenDialog(e, post.id)}
                            sx={{
                              color: theme.palette.text.secondary,
                              "&:hover": {
                                color: theme.palette.error.main,
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                              },
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{
                      mb: 1.5,
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {post.title}
                  </Typography>
                  <Box
                  
                    sx={{
                      mb: 2,
                      lineHeight: 1.6,
                      fontSize: "0.95rem",
                      color: theme.palette.text.secondary,
                      "& img": {
                        maxWidth: "100%",
                        borderRadius: 1,
                        marginTop: 1,
                      },
                      "& p": {
                        marginBottom: "0.5em",
                      },
                      "& a": {
                        color: theme.palette.primary.main,
                        textDecoration: "none",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      },
                    }}
                  >
                    <span dangerouslySetInnerHTML={{ __html: post.content }} />
                  </Box>
                </CardContent>

                <Divider sx={{ opacity: 0.6 }} />

                <CardActions sx={{ px: 3, py: 1.5, justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title={isLikedByUser[post.id] ? "Unlike" : "Like"}>
                      <IconButton
                        onClick={(e) => handleLikePost(e, post.id)}
                        color={isLikedByUser[post.id] ? "primary" : "default"}
                        size="small"
                        sx={{
                          transition: "transform 0.2s",
                          "&:hover": { transform: "scale(1.1)" },
                        }}
                      >
                        <Badge
                          badgeContent={likesCount[post.id] || 0}
                          color="primary"
                          sx={{
                            "& .MuiBadge-badge": {
                              fontSize: "0.7rem",
                              height: "18px",
                              minWidth: "18px",
                            },
                          }}
                        >
                          <ThumbUp fontSize="small" />
                        </Badge>
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Comments">
                      <IconButton
                        size="small"
                        sx={{
                          transition: "transform 0.2s",
                          "&:hover": { transform: "scale(1.1)" },
                        }}
                      >
                        <Badge
                          badgeContent={commentsCount[post.id] || 0}
                          color="primary"
                          sx={{
                            "& .MuiBadge-badge": {
                              fontSize: "0.7rem",
                              height: "18px",
                              minWidth: "18px",
                            },
                          }}
                        >
                          <Message fontSize="small" />
                        </Badge>
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={savedPosts.includes(post.id) ? "Unsave" : "Save"}>
                      <IconButton
                        onClick={(e) => toggleSavePost(e, post.id)}
                        size="small"
                        color={savedPosts.includes(post.id) ? "primary" : "default"}
                        sx={{
                          transition: "transform 0.2s",
                          "&:hover": { transform: "scale(1.1)" },
                        }}
                      >
                        {savedPosts.includes(post.id) ? (
                          <Bookmark fontSize="small" />
                        ) : (
                          <BookmarkBorder fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Chip
                    label="Read more"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{
                      borderRadius: "8px",
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                    onClick={() => navigate(`/post/${post.id}`)}
                  />
                </CardActions>
              </Card>
            ))}
          </>
        )}
      </Box>

      {!isLoading && posts.length > 0 && totalPages > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            mt: 2,
            mb: 4,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            sx={{
              borderRadius: "10px",
              px: 3,
              py: 1,
              fontWeight: 500,
              textTransform: "none",
            }}
          >
            Previous
          </Button>

          <Box
            sx={{
              px: 3,
              py: 1,
              borderRadius: "10px",
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontWeight: 600,
            }}
          >
            {`Page ${currentPage} of ${totalPages}`}
          </Box>

          <Button
            variant="outlined"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            sx={{
              borderRadius: "10px",
              px: 3,
              py: 1,
              fontWeight: 500,
              textTransform: "none",
            }}
          >
            Next
          </Button>
        </Box>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Delete Post</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. Are you sure you want to delete this post?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeletePost}
            variant="contained"
            color="error"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 500,
              ml: 1,
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default Feed
