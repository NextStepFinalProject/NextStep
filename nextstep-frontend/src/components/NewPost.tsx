import React, { useState } from 'react';
import {
  Button,
  Typography,
  Container,
  Modal,
  Snackbar,
  Alert,
} from '@mui/material';
import FroalaEditor from 'react-froala-wysiwyg';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/js/plugins/image.min.js';
import api from "../serverApi.ts";
import { getUserAuth } from '../handlers/userAuth.ts';
import { config } from '../config.ts';

type Props = {
  open: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
};

const NewPostModal: React.FC<Props> = ({ open, onClose, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const auth = getUserAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Submit the post with the content (images are already uploaded and URLs are in place)
      await api.post(`/post`, {
        title,
        content,
      });

      onClose();
      onPostCreated?.(); // Refresh feed if needed
    } catch (error) {
      setError('Error creating post: ' + error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Container
        maxWidth="md"
        sx={{
          mt: 10,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          p: 4,
          width: '40%',
          overflowY: 'auto',
          height: '80vh',
          color: 'text.primary',
        }}
      >
        <Typography variant="h5" gutterBottom color="text.primary">
          Create New Post
        </Typography>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ 
              width: '100%', 
              marginBottom: '1rem', 
              padding: '10px', 
              fontSize: '16px',
              backgroundColor: 'transparent',
              color: 'inherit',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '4px',
            }}
            required
          />
          <FroalaEditor
            tag="textarea"
            model={content}
            onModelChange={setContent}
            config={{
              placeholderText: "Edit Your Content Here!",
              charCounterCount: false,
              toolbarButtons: [
                "bold",
                "italic",
                "underline",
                "insertImage",
                "insertLink",
                "paragraphFormat",
                "alert",
              ],
              imageUploadURL: `${config.app.backend_url()}/resource/image`,
              imageUploadParams: {
                Authorization: `Bearer ${auth.accessToken}`
              },
              imageUploadMethod: 'POST',
              imageMaxSize: 5 * 1024 * 1024, // 5MB
              imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif'],
              events: {
                'image.beforeUpload': function (files: File[]) {
                  const editor = this as any;
                  const file = files[0];
                  
                  // Create FormData
                  const formData = new FormData();
                  formData.append('file', file);

                  // Upload the image
                  fetch(`${config.app.backend_url()}/resource/image`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${auth.accessToken}`
                    },
                    body: formData
                  })
                  .then(response => response.text())
                  .then(imageId => {
                    // Construct the full image URL
                    const imageUrl = `${config.app.backend_url()}/resource/image/${imageId}`;
                    // Insert the uploaded image
                    editor.image.insert(imageUrl, null, null, editor.image.get());
                  })
                  .catch(error => {
                    setError('Error uploading image: ' + error);
                  });

                  return false; // Prevent default upload
                },
                'image.error': function (error: any, response: any) {
                  setError('Image upload error: ' + error + ', response: ' + response);
                }
              }
            }}
          />
          <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3}}>
            Submit
          </Button>
          <Button fullWidth onClick={onClose} sx={{ mt: 1 }}>
            Cancel
          </Button>
        </form>
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
      </Container>
    </Modal>
  );
};

export default NewPostModal;
