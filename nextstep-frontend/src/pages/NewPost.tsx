import React, { useState } from 'react';
import { Container, Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import FroalaEditor from 'react-froala-wysiwyg';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/js/plugins/image.min.js';
import api from "../serverApi.ts";
import { getUserAuth } from '../handlers/userAuth.ts';

const NewPost: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();
  const auth = getUserAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Submit the post with the content (images are already uploaded and URLs are in place)
      await api.post(`/post`, {
        title,
        content,
      });

      navigate('/feed'); // Redirect to feed after successful post creation
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
        <Typography component="h1" variant="h4" gutterBottom>
          Create New Post
        </Typography>
        <form onSubmit={handleSubmit} style={{ width: '90vh', overflowY: 'scroll', height: '60vh', marginTop: '1rem' }}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem', padding: '10px', fontSize: '16px' }}
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
                    console.error('Error uploading image:', error);
                  });

                  return false; // Prevent default upload
                },
                'image.error': function (error: any, response: any) {
                  console.error('Image upload error:', error, response);
                }
              }
            }}
          />
          <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2 }}>
            Submit
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            onClick={() => navigate('/feed')}
            sx={{ mt: 2 }}
          >
            Back to Feed
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default NewPost;