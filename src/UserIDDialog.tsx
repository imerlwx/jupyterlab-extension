import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box
} from '@mui/material';

interface UserIDDialogProps {
  open: boolean;
  onSubmit: (userId: string) => void;
}

export const UserIDDialog: React.FC<UserIDDialogProps> = ({
  open,
  onSubmit
}) => {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!userId.trim()) {
      setError('Please enter a user ID');
      return;
    }

    // Validate user ID format (alphanumeric, hyphens, underscores)
    const userIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (!userIdPattern.test(userId.trim())) {
      setError('User ID can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    onSubmit(userId.trim());
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      aria-labelledby="user-id-dialog-title"
    >
      <DialogTitle id="user-id-dialog-title">
        Welcome to AI Programming Tutor!
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            To get started, please enter your user ID. This will be used to track your learning progress and provide personalized assistance.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
            Your user ID can be your name, student ID, or any identifier you'd like to use. It should only contain letters, numbers, hyphens (-), and underscores (_).
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="User ID"
            variant="outlined"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setError('');
            }}
            onKeyPress={handleKeyPress}
            error={!!error}
            helperText={error || 'Example: john_doe, student_123, or jsmith'}
            placeholder="Enter your user ID"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!userId.trim()}
        >
          Start Learning
        </Button>
      </DialogActions>
    </Dialog>
  );
};
