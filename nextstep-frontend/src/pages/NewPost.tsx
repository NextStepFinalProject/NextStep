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
import { config } from '../config';
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
  const [images, setImages] = useState<File[]>([]);
  const auth = getUserAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
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

        const imageUrl = `${config.app.backend_url()}/resources/images/${response.data}`;
        uploadedImages[image.name] = imageUrl;
      }

      let updatedContent = content;
      Object.keys(uploadedImages).forEach((placeholder) => {
        updatedContent = updatedContent.replace(placeholder, uploadedImages[placeholder]);
      });

      await api.post(`/post`, {
        title,
        content: updatedContent,
      });

      onClose();
      onPostCreated?.(); // Call callback to reload posts in Feed
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Container maxWidth="md" sx={{ mt: 10, backgroundColor: 'white', borderRadius: 2, p: 4 }}>
        <Typography variant="h5" gutterBottom>Create New Post</Typography>
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
              placeholderText: "Edit Your Content Here!",
              toolbarButtons: ["bold", "italic", "underline", "insertImage", "insertLink", "paragraphFormat"],
              pluginsEnabled: ["image"],
              imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif'],
              events: {
                "image.beforeUpload": function (fileList: File[]) {
                  const editor = this as any;
                  const firstFile = fileList[0];

                  if (firstFile) {
                    const placeholder = `[[image-${firstFile.name}]]`;
                    editor.image.insert(placeholder, null, null, editor.image.get());
                    setImages((prev) => [...prev, firstFile]);
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
