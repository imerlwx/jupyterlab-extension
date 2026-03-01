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
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

interface UserIDDialogProps {
  open: boolean;
  onSubmit: (userId: string, videoId: string) => void;
}

const VIDEO_OPTIONS = [
  { id: 'nx5yhXAQLxw', label: 'Video 1 (nx5yhXAQLxw)' },
  { id: 'Kd9BNI6QMmQ', label: 'Video 2 (Kd9BNI6QMmQ)' },
  { id: 'EF4A4OtQprg', label: 'Video 3 (EF4A4OtQprg)' },
  { id: '1xsbTs9-a50', label: 'Video 4 (1xsbTs9-a50)' },
  { id: '1x8Kpyndss', label: 'Video 5 (1x8Kpyndss)' }
];

export const UserIDDialog: React.FC<UserIDDialogProps> = ({
  open,
  onSubmit
}) => {
  const [userId, setUserId] = useState('');
  const [videoId, setVideoId] = useState('nx5yhXAQLxw');
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

    onSubmit(userId.trim(), videoId);
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
            To get started, please enter your user ID and select a video.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
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
            sx={{ mb: 3 }}
          />

          <FormControl component="fieldset">
            <FormLabel component="legend">Select a video to watch:</FormLabel>
            <RadioGroup
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
            >
              {VIDEO_OPTIONS.map(option => (
                <FormControlLabel
                  key={option.id}
                  value={option.id}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
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
