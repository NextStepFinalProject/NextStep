"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Alert,
  useTheme,
  alpha,
} from "@mui/material"
import { Close } from "@mui/icons-material"
import api from "../serverApi"
import { getUserAuth } from "../handlers/userAuth"
// Import Froala Editor components and styles
import FroalaEditorComponent from "react-froala-wysiwyg"
import "froala-editor/css/froala_style.min.css"
import "froala-editor/css/froala_editor.pkgd.min.css"
import "froala-editor/js/plugins/image.min.js"
import "froala-editor/js/plugins/link.min.js"
import "froala-editor/js/plugins/lists.min.js"
import "froala-editor/js/plugins/paragraph_format.min.js"
import "froala-editor/js/plugins/table.min.js"
import "froala-editor/js/plugins/file.min.js"
import { config } from "../config"

interface NewPostModalProps {
  open: boolean
  onClose: () => void
  onPostCreated: () => void
  withResume?: boolean
}

const NewPostModal: React.FC<NewPostModalProps> = ({ open, onClose, onPostCreated, withResume = false }) => {
  const theme = useTheme()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const editorRef = useRef<any>(null)
  const auth = getUserAuth();
  const [mountedEditor, setMountedEditor] = useState(false)

  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => {
        setMountedEditor(true)
      }, 100) // let the DOM settle
      return () => clearTimeout(timeout)
    } else {
      setMountedEditor(false)
    }
  }, [open])

  // Froala editor configuration
  const editorConfig = {
    placeholderText: "Write your post content here...",
    charCounterCount: true,
    toolbarButtons: [
      "bold", "italic", "underline", "strikeThrough", "|",
      "paragraphFormat", "align", "formatOL", "formatUL", "|",
      "insertLink", "insertImage", "insertFile", "insertTable", "|",
      "html",
    ],
    heightMin: 200,
    imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif'],
    fileAllowedTypes: ['*'],
    imageMaxSize: 5 * 1024 * 1024,
    fileMaxSize: 10 * 1024 * 1024,
    events: {
      'image.beforeUpload': function (files: File[]) {
        const editor = this as any;
        const file = files[0];
  
        const formData = new FormData();
        formData.append("file", file);
  
        fetch(`${config.app.backend_url()}/resource/image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
          body: formData,
        })
          .then(res => res.text()) // assuming backend returns just the image ID
          .then(imageId => {
            const imageUrl = `${config.app.backend_url()}/resource/image/${imageId}`;
            editor.image.insert(imageUrl, null, null, editor.image.get());
          })
          .catch(err => {
            console.error("Image upload error:", err);
            setError("Failed to upload image.");
          });
  
        return false;
      },
  
      'file.beforeUpload': function (files: File[]) {
        const editor = this as any;
        const file = files[0];
  
        const formData = new FormData();
        formData.append("file", file);
  
        fetch(`${config.app.backend_url()}/resource/file`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
          body: formData,
        })
          .then(res => res.text())
          .then((filename) => {
            const fileUrl = `${config.app.backend_url()}/resource/file/${filename}`;
            const html = `<a class="fr-file" href="${fileUrl}" target="_blank">${file.name}</a>`;
            editor.html.insert(html);
          })
          .catch(err => {
            console.error("File upload error:", err);
            setError("Failed to upload file.");
          });
  
        return false;
      },
    },
  };
  
  // Fetch resume data when opening in resume mode
  useEffect(() => {
    if (open && withResume) {
      fetchResumeData()
      setTitle("My Professional Resume")
      setContent("<p>I wanted to share my professional resume with the community.</p>")
      setError(null)
    }
    else if (open) {
      setTitle("")
      setContent("<p> I wanted to share.... </p>")
      setError(null)
      setResumeFile(null)
    }
  }, [open, withResume])

  // Reset form when modal is opened
  // useEffect(() => {
  //   if (open) {
  //     setTitle(withResume ? "My Professional Resume" : "")
  //     setContent(withResume ? "<p>I wanted to share my professional resume with the community.</p>" : "")
  //     setError(null)
  //   }
  // }, [open, withResume])

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any resources if needed
      if (resumeFile) {
        URL.revokeObjectURL(URL.createObjectURL(resumeFile))
      }
    }
  }, [resumeFile])

  const fetchResumeData = async () => {
    try {
      const resumeResponse = await api.get("/resume")

      if (resumeResponse.data && resumeResponse.data.rawContentLink) {
        const resumeFileResponse = await api.get(`/resource/resume/${resumeResponse.data.rawContentLink}`, {
          responseType: "blob",
        })

        const resumeBlob = new Blob([resumeFileResponse.data], { type: "application/pdf" })
        const resumeFileObj = new File([resumeBlob], `${resumeResponse.data.parsedData.fileName}`, {
          type: "application/pdf",
        })

        setResumeFile(resumeFileObj)
      } else {
        setError("No resume found. Please upload a resume first.")
      }
    } catch (err) {
      console.error("Failed to fetch resume data:", err)
      setError("Failed to load resume. Please try again later.")
    }
  }

  const insertResumeIntoEditor = async () => {
    if (!resumeFile || !editorRef.current?.editor) return;
  
    try {
      const formData = new FormData();
      formData.append("file", resumeFile);
  
      const response = await api.post("/resource/file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
  
      // const fileUrl = response.data;
      const fileName = resumeFile.name;
      
      const fileUrl = `${config.app.backend_url()}/resource/file/${response.data}`;

      const resumeHtml = `<p><a href="${fileUrl}" class="fr-file" title="${fileName}">📄 ${fileName}</a></p>`;
      editorRef.current.editor.html.insert(resumeHtml);
    } catch (error) {
      console.error("Failed to upload resume:", error);
      setError("Failed to upload resume file.");
    }
  };
  

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Please enter a title for your post")
      return
    }

    if (!content.trim()) {
      setError("Please enter content for your post")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Create the post with content that includes embedded files
      await api.post(
        "/post",
        { title, content },
        {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        },
      )

      onPostCreated()
      onClose()
    } catch (err) {
      console.error("Failed to create post:", err)
      setError("Failed to create post. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContentChange = (content: string) => {
    setContent(content)
  }

  useEffect(() => {
    if (open && withResume && resumeFile) {
      insertResumeIntoEditor()
    }
  }, [open, withResume, resumeFile])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          pb: 1,
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          {withResume ? "Share Your Resume" : "Create New Post"}
        </Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          margin="dense"
          id="post-title"
          label="Title"
          type="text"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 3 }}>
          {open && mountedEditor && (
            <FroalaEditorComponent
              ref={editorRef}
              tag="textarea"
              config={editorConfig}
              model={content}
              onModelChange={handleContentChange}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
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
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 500,
            ml: 1,
          }}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Posting...
            </>
          ) : (
            "Post"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default NewPostModal
