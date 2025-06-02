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
import { config } from '../config.ts';
import api from "../serverApi.ts";
import { getUserAuth } from '../handlers/userAuth.ts';

type Props = {
  open: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
};

const NewPostModal: React.FC<Props> = ({ open, onClose, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]); // Store images locally
  const auth = getUserAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Upload images to the server
    const uploadedImages: { [placeholder: string]: string } = {};
    for (const image of images) {
      const formData = new FormData();
      formData.append('file', image);

      const response = await api.post(`/resource/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${auth.accessToken}`,
        },
      });

      // Map the placeholder to the actual URL
      const imageUrl = `${config.app.backend_url()}/resources/images/${response.data}`;
      uploadedImages[image.name] = imageUrl;
    }

    // Replace placeholders in the content with actual URLs
    let updatedContent = content;
    Object.keys(uploadedImages).forEach((placeholder) => {
      updatedContent = updatedContent.replace(placeholder, uploadedImages[placeholder]);
    });

    try {
      await api.post(`/post`, {
        title,
        content: updatedContent,
      }, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
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
          backgroundColor: 'white',
          borderRadius: 2,
          p: 4,
          width: '40%',
          overflowY: 'auto',
          height: '80vh',
        }}
      >
        <Typography variant="h5" gutterBottom>
          Create New Post
        </Typography>
        <form onSubmit={handleSubmit}>
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
              imageUpload: true,
              imageUploadParam: 'file',
              imageUploadMethod: 'POST',
              charCounterCount: false,
              placeholderText: "Edit Your Content Here!",
              toolbarButtons: ["bold", "italic", "underline", "insertImage", "insertLink", "paragraphFormat"],
              pluginsEnabled: ["image"],
              imageUploadRemoteUrls: true,
              imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif'],
              events: {
                "image.beforeUpload": async function (fileList: File[]) {
                  const editor = this as any;
                  const firstFile = fileList[0];

                  if (firstFile) {
                    // Generate a placeholder for the image
                    const placeholder = `[[image-${firstFile.name}]]`;

                    // Insert the placeholder into the editor
                    editor.image.insert(placeholder, null, null, editor.image.get());

                    // Store the image locally
                    setImages((prevImages) => [...prevImages, firstFile]);
                  }

                  return false; // Prevent Froala's default upload mechanism
                },
              },
            }}
          />
          <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 2 }}>
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
