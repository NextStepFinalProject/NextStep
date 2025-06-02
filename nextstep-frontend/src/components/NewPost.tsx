import React, { useState } from 'react';
import {
  Button,
  Typography,
  Container,
  Modal,
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
  const auth = getUserAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post(`/post`, {
        title,
        content,
      }, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });

      onClose();
      onPostCreated?.(); // Refresh feed if needed
    } catch (error) {
      console.error('Error creating post:', error);
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
              placeholderText: "Edit Your Content Here!",
              toolbarButtons: ["bold", "italic", "underline", "insertImage", "insertLink", "paragraphFormat"],
              pluginsEnabled: ["image"],
              imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif'],
              events: {
                "image.beforeUpload": async function (files: File[]) {
                  const editor = this as any;
                  const file = files[0];

                  if (!file) return false;

                  try {
                    const formData = new FormData();
                    formData.append('file', file);

                    const response = await api.post(`/resource/image`, formData, {
                      headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${auth.accessToken}`,
                      },
                    });

                    const imageUrl = `${config.app.backend_url()}/resources/images/${response.data}`;
                    editor.image.insert(imageUrl, null, null, editor.image.get());
                  } catch (err) {
                    console.error('Error uploading image:', err);
                  }

                  return false;
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
      </Container>
    </Modal>
  );
};

export default NewPostModal;
