"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Avatar,
  Divider,
  IconButton,
  Collapse,
  Badge,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  useTheme,
  alpha,
  Tooltip,
  Chip,
  Skeleton,
} from "@mui/material"
import {
  ArrowBack,
  Comment as CommentIcon,
  ThumbUp as ThumbUpIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
} from "@mui/icons-material"
import FroalaEditor from "react-froala-wysiwyg"
import "froala-editor/css/froala_style.min.css"
import "froala-editor/css/froala_editor.pkgd.min.css"
import "froala-editor/js/plugins/image.min.js"
import type { Post as PostModel } from "../models/Post"
import type { Comment } from "../models/Comment"
import { getUserAuth } from "../handlers/userAuth.ts"
import api from "../serverApi.ts"
import defaultProfileImage from "../../assets/defaultProfileImage.jpg"
import { config } from "../config.ts"
import { motion } from "framer-motion"

const PostDetails: React.FC = () => {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const [post, setPost] = useState<PostModel | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentProfileImages, setCommentProfileImages] = useState<{ [key: string]: string }>({})
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentsOpen, setCommentsOpen] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedContent, setEditedContent] = useState("")
  const [openDialog, setOpenDialog] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [profileImage, setProfileImage] = useState<string>(defaultProfileImage)
  const [isSaved, setIsSaved] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const auth = getUserAuth()

  const fetchProfileImage = async (imageFilename: string | null) => {
    try {
      if (!imageFilename) {
        return defaultProfileImage
      }

      // If it's a Google profile image URL, return it directly
      if (imageFilename.startsWith("https://")) {
        return imageFilename
      }

      // Otherwise, fetch from our backend
      const response = await api.get(`/resource/image/${imageFilename}`, {
        responseType: "blob",
      })
      return URL.createObjectURL(response.data as Blob)
    } catch (error) {
      console.error("Error fetching profile image:", error)
      return defaultProfileImage
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const loadPostDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const postResponse = await api.get(`/post/${postId}`)
      const postData = postResponse.data as PostModel
      setPost(postData)
      setEditedTitle(postData.title)
      setEditedContent(postData.content)

      // Fetch profile image for the post owner
      const imageUrl = await fetchProfileImage(postData.ownerProfileImage as string)
      setProfileImage(imageUrl)

      // Fetch likes count and determine if the user has liked the post
      try {
        const likesResponse = await api.get(`/post/${postId}/like`)
        setLikesCount(likesResponse.data.count)
        setIsLiked(likesResponse.data.likedBy.includes(auth.userId))
      } catch (err) {
        console.error("Failed to fetch likes:", err)
      }

      // Fetch comments
      try {
        const commentsResponse = await api.get(`/comment/post/${postId}`)
        const commentsData = commentsResponse.data as Comment[]
        setComments(commentsData)

        // Fetch profile images for each comment owner
        const images: { [key: string]: string } = {}
        await Promise.all(
          commentsData.map(async (comment) => {
            const imageUrl = await fetchProfileImage(comment.ownerProfileImage as string)
            images[comment.id] = imageUrl
          }),
        )
        setCommentProfileImages(images)
      } catch (err) {
        console.log("Failed to load comments:", err)
      }
    } catch (err) {
      setError("Failed to load post details. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLikeToggle = async () => {
    try {
      const value = !isLiked
      await api.put(
        `/post/${postId}/like`,
        { value },
        {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        },
      )
      setIsLiked(value)
      setLikesCount((prev) => (value ? prev + 1 : Math.max(prev - 1, 0)))
    } catch (err) {
      console.error("Failed to toggle like:", err)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      setIsSubmittingComment(true)
      const response = await api.post(`/comment`, {
        content: newComment,
        postId,
      })
      const newCommentData = response.data as Comment

      // Fetch profile image for the new comment owner
      const imageUrl = await fetchProfileImage(newCommentData.ownerProfileImage as string)
      setCommentProfileImages((prev) => ({
        ...prev,
        [newCommentData.id]: imageUrl,
      }))

      setComments([...comments, newCommentData])
      setNewComment("")
    } catch (err) {
      console.error("Failed to add comment:", err)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/comment/${commentId}`)
      setComments(comments.filter((comment) => comment.id !== commentId))
    } catch (err) {
      console.error("Failed to delete comment:", err)
    }
  }

  const handleEditPost = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedTitle(post?.title || "")
    setEditedContent(post?.content || "")
  }

  const handleSaveEdit = async () => {
    try {
      const response = await api.put(`/post/${postId}`, {
        title: editedTitle,
        content: editedContent,
      })
      setPost(response.data as PostModel)
      setIsEditing(false)
    } catch (err) {
      console.error("Failed to update post:", err)
    }
  }

  const handleDeletePost = async () => {
    try {
      await api.delete(`/post/${postId}`)
      navigate("/feed")
    } catch (err) {
      console.error("Failed to delete post:", err)
    }
  }

  const handleOpenDialog = () => {
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleCommentToggle = () => {
    setCommentsOpen(!commentsOpen)
  }

  const handleSaveToggle = () => {
    setIsSaved(!isSaved)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: post?.title || "Shared post",
          text: "Check out this post!",
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing", error))
    } else {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          alert("Link copied to clipboard!")
        })
        .catch((err) => {
          console.error("Failed to copy link: ", err)
        })
    }
  }

  useEffect(() => {
    loadPostDetails()
  }, [postId])

  const renderSkeleton = () => (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="20%" height={16} />
        </Box>
      </Box>

      <Skeleton variant="text" width="70%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 1 }} />

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Skeleton variant="circular" width={36} height={36} />
        <Skeleton variant="circular" width={36} height={36} />
        <Skeleton variant="circular" width={36} height={36} />
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" sx={{ mb: 2 }}>
        <Skeleton width="30%" />
      </Typography>

      {[1, 2].map((i) => (
        <Box key={i} sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
            <Skeleton variant="text" width="40%" />
          </Box>
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="80%" />
        </Box>
      ))}
    </Box>
  )

  return (
    <Container component="main" maxWidth="md" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: theme.palette.background.paper,
            boxShadow:
              theme.palette.mode === "dark" ? "0 4px 20px 0 rgba(0,0,0,0.25)" : "0 4px 20px 0 rgba(0,0,0,0.08)",
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Box
            sx={{
              p: 3,
              display: "flex",
              alignItems: "center",
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              backgroundColor: alpha(theme.palette.background.default, 0.4),
            }}
          >
            <IconButton
              color="primary"
              onClick={() => navigate("/feed")}
              sx={{
                mr: 1,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                ml: 1,
              }}
            >
              Post Details
            </Typography>

            {post?.owner === auth.userId && !isEditing && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Edit post">
                  <IconButton
                    color="primary"
                    onClick={handleEditPost}
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      },
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete post">
                  <IconButton
                    color="error"
                    onClick={handleOpenDialog}
                    sx={{
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.error.main, 0.2),
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            {isEditing && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Save changes">
                  <IconButton
                    onClick={handleSaveEdit}
                    sx={{
                      color: theme.palette.success.main,
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.success.main, 0.2),
                      },
                    }}
                  >
                    <CheckIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cancel editing">
                  <IconButton
                    onClick={handleCancelEdit}
                    sx={{
                      color: theme.palette.error.main,
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.error.main, 0.2),
                      },
                    }}
                  >
                    <CancelIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {isLoading ? (
            <Box sx={{ p: 4 }}>{renderSkeleton()}</Box>
          ) : error ? (
            <Box
              sx={{
                p: 4,
                textAlign: "center",
                backgroundColor: alpha(theme.palette.error.light, 0.1),
              }}
            >
              <Typography color="error" variant="h6" sx={{ mb: 2 }}>
                {error}
              </Typography>
              <Button variant="contained" color="primary" onClick={loadPostDetails}>
                Try Again
              </Button>
            </Box>
          ) : (
            post && (
              <>
                <Box sx={{ p: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 3,
                      pb: 2,
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <Avatar
                      src={profileImage}
                      sx={{
                        width: 56,
                        height: 56,
                        mr: 2,
                        border: `2px solid ${theme.palette.primary.main}`,
                      }}
                    />
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                        }}
                      >
                        {post.ownerUsername || auth.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {post.createdAt && formatDate(post.createdAt)}
                        {post.updatedAt && post.updatedAt !== post.createdAt && (
                          <Chip
                            label="Edited"
                            size="small"
                            sx={{
                              ml: 1,
                              height: 20,
                              fontSize: "0.7rem",
                              backgroundColor: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.main,
                            }}
                          />
                        )}
                      </Typography>
                    </Box>
                  </Box>

                  {isEditing ? (
                    <>
                      <TextField
                        label="Title"
                        variant="outlined"
                        fullWidth
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        sx={{
                          mb: 3,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />
                      {editedContent !== null && (
                        <Box sx={{ mb: 3 }}>
                          <FroalaEditor
                            tag="textarea"
                            model={editedContent || ""}
                            onModelChange={setEditedContent}
                            config={{
                              placeholderText: "Edit your content here...",
                              charCounterCount: false,
                              toolbarButtons: [
                                "bold",
                                "italic",
                                "underline",
                                "insertImage",
                                "insertLink",
                                "paragraphFormat",
                              ],
                              imageUploadRemoteUrls: true,
                              imageAllowedTypes: ["jpeg", "jpg", "png", "gif"],
                              events: {
                                initialized: function () {
                                  const editor = this as any
                                  if (editor && editor.html) {
                                    editor.html.set(editedContent || "")
                                  }
                                },
                                contentChanged: function () {
                                  const editor = this as any
                                  if (editor && editor.html) {
                                    setEditedContent(editor.html.get())
                                  }
                                },
                                "image.beforeUpload": function (files: File[]) {
                                  const editor = this as any
                                  const file = files[0]

                                  // Create FormData
                                  const formData = new FormData()
                                  formData.append("file", file)

                                  // Upload the image
                                  fetch(`${config.app.backend_url()}/resource/image`, {
                                    method: "POST",
                                    headers: {
                                      Authorization: `Bearer ${auth.accessToken}`,
                                    },
                                    body: formData,
                                  })
                                    .then((response) => response.text())
                                    .then((imageId) => {
                                      // Construct the full image URL
                                      const imageUrl = `${config.app.backend_url()}/resource/image/${imageId}`
                                      // Insert the uploaded image
                                      editor.image.insert(imageUrl, null, null, editor.image.get())
                                    })
                                    .catch((error) => {
                                      console.error("Error uploading image:", error)
                                    })

                                  return false // Prevent default upload
                                },
                              },
                              pluginsEnabled: ["image", "link", "paragraphFormat"],
                            }}
                          />
                        </Box>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography
                        variant="h4"
                        component="h1"
                        gutterBottom
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.text.primary,
                          mb: 3,
                        }}
                      >
                        {post.title}
                      </Typography>

                      <Box
                        sx={{
                          mb: 4,
                          "& img": {
                            maxWidth: "100%",
                            height: "auto",
                            borderRadius: 2,
                          },
                          "& p": {
                            lineHeight: 1.7,
                            fontSize: "1rem",
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
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                      </Box>
                    </>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mt: 4,
                      pt: 2,
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title={isLiked ? "Unlike" : "Like"}>
                        <IconButton
                          onClick={handleLikeToggle}
                          color={isLiked ? "primary" : "default"}
                          sx={{
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.1)" },
                          }}
                        >
                          <Badge
                            badgeContent={likesCount}
                            color="primary"
                            sx={{
                              "& .MuiBadge-badge": {
                                fontSize: "0.7rem",
                                height: "18px",
                                minWidth: "18px",
                              },
                            }}
                          >
                            <ThumbUpIcon />
                          </Badge>
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={commentsOpen ? "Hide comments" : "Show comments"}>
                        <IconButton
                          onClick={handleCommentToggle}
                          color={commentsOpen ? "primary" : "default"}
                          sx={{
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.1)" },
                          }}
                        >
                          <Badge
                            badgeContent={comments.length}
                            color="primary"
                            sx={{
                              "& .MuiBadge-badge": {
                                fontSize: "0.7rem",
                                height: "18px",
                                minWidth: "18px",
                              },
                            }}
                          >
                            <CommentIcon />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title={isSaved ? "Unsave" : "Save"}>
                        <IconButton
                          onClick={handleSaveToggle}
                          color={isSaved ? "primary" : "default"}
                          sx={{
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.1)" },
                          }}
                        >
                          {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Share">
                        <IconButton
                          onClick={handleShare}
                          sx={{
                            transition: "transform 0.2s",
                            "&:hover": { transform: "scale(1.1)" },
                          }}
                        >
                          <ShareIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>

                <Collapse in={commentsOpen}>
                  <Box
                    sx={{
                      px: 4,
                      pb: 4,
                      backgroundColor: alpha(
                        theme.palette.mode === "dark" ? theme.palette.background.default : theme.palette.grey[50],
                        0.5,
                      ),
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        py: 2,
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      }}
                    >
                      Comments ({comments.length})
                    </Typography>

                    <Box
                      sx={{
                        mb: 3,
                        maxHeight: comments.length > 5 ? "400px" : "auto",
                        overflowY: comments.length > 5 ? "auto" : "visible",
                        pr: comments.length > 5 ? 2 : 0,
                        "&::-webkit-scrollbar": {
                          width: "8px",
                        },
                        "&::-webkit-scrollbar-track": {
                          background: "transparent",
                        },
                        "&::-webkit-scrollbar-thumb": {
                          backgroundColor: alpha(theme.palette.text.secondary, 0.3),
                          borderRadius: "4px",
                        },
                        "&::-webkit-scrollbar-thumb:hover": {
                          backgroundColor: alpha(theme.palette.text.secondary, 0.5),
                        },
                      }}
                    >
                      {comments.length === 0 ? (
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            textAlign: "center",
                            backgroundColor: alpha(theme.palette.background.paper, 0.5),
                            border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
                            borderRadius: 2,
                          }}
                        >
                          <Typography color="text.secondary">No comments yet. Be the first to comment!</Typography>
                        </Paper>
                      ) : (
                        comments.map((comment, index) => (
                          <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                mb: 2,
                                borderRadius: 2,
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <Avatar
                                  src={commentProfileImages[comment.id] || defaultProfileImage}
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    mr: 2,
                                  }}
                                />
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 600,
                                    flexGrow: 1,
                                  }}
                                >
                                  {comment.owner}
                                </Typography>
                                {comment.owner === auth.userId && (
                                  <Tooltip title="Delete comment">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteComment(comment.id)}
                                      sx={{
                                        color: theme.palette.text.secondary,
                                        "&:hover": {
                                          color: theme.palette.error.main,
                                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                                        },
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                              <Box
                                sx={{
                                  ml: 7,
                                  "& img": {
                                    maxWidth: "100%",
                                    height: "auto",
                                    borderRadius: 1,
                                  },
                                }}
                              >
                                <div dangerouslySetInnerHTML={{ __html: comment.content }} />
                              </Box>
                            </Paper>
                          </motion.div>
                        ))
                      )}
                    </Box>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mb: 2,
                          fontWeight: 600,
                        }}
                      >
                        Add a comment
                      </Typography>

                      {newComment && <FroalaEditor
                        tag="textarea"
                        model={newComment || ""}
                        onModelChange={setNewComment}
                        config={{
                          placeholderText: "Write a comment...",
                          charCounterCount: false,
                          toolbarButtons: ["bold", "italic", "underline", "insertImage", "insertLink"],
                          imageUploadRemoteUrls: true,
                          imageAllowedTypes: ["jpeg", "jpg", "png", "gif"],
                          events: {
                            initialized: function () {
                              const editor = this as any
                              if (editor && editor.html) {
                                editor.html.set(newComment || "")
                              }
                            },
                            contentChanged: function () {
                              const editor = this as any
                              if (editor && editor.html) {
                                setNewComment(editor.html.get())
                              }
                            },
                            "image.beforeUpload": function (files: File[]) {
                              const editor = this as any
                              const file = files[0]

                              // Create FormData
                              const formData = new FormData()
                              formData.append("file", file)

                              // Upload the image
                              fetch(`${config.app.backend_url()}/resource/image`, {
                                method: "POST",
                                headers: {
                                  Authorization: `Bearer ${auth.accessToken}`,
                                },
                                body: formData,
                              })
                                .then((response) => response.text())
                                .then((imageId) => {
                                  // Construct the full image URL
                                  const imageUrl = `${config.app.backend_url()}/resource/image/${imageId}`
                                  // Insert the uploaded image
                                  editor.image.insert(imageUrl, null, null, editor.image.get())
                                })
                                .catch((error) => {
                                  console.error("Error uploading image:", error)
                                })

                              return false // Prevent default upload
                            },
                          },
                          pluginsEnabled: ["image", "link"],
                        }}
                      />
              }

                      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || isSubmittingComment}
                          sx={{
                            borderRadius: "12px",
                            px: 3,
                            py: 1,
                            fontWeight: 600,
                            textTransform: "none",
                          }}
                        >
                          {isSubmittingComment ? "Posting..." : "Post Comment"}
                        </Button>
                      </Box>
                    </Paper>
                  </Box>
                </Collapse>
              </>
            )
          )}
        </Paper>
      </motion.div>

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

export default PostDetails
