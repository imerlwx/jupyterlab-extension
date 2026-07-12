import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

// Append the participant's user ID to a Qualtrics URL as a query parameter
// so each survey response can be linked back to this participant. Qualtrics
// captures it via an Embedded Data field named `userId` (see the survey-flow
// setup in the deploy notes). Handles URLs that already have a query string.
const appendUserId = (url: string, userId: string): string => {
  if (!url) {
    return url;
  }
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}userId=${encodeURIComponent(userId)}`;
};

// Shared modern button styles, matching the blue accent used across the app.
const primaryBtnSx = {
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.9rem',
  // !important so the pill radius beats JupyterLab's base button CSS on
  // the server (which otherwise overrides MUI's sx border-radius).
  borderRadius: '999px !important',
  px: 3,
  py: 1,
  background: '#0969da',
  boxShadow: 'none',
  '&:hover': { background: '#0860c4', boxShadow: 'none' },
  '&.Mui-disabled': { background: '#cfd5dc', color: 'white' }
} as const;

const secondaryBtnSx = {
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.85rem',
  borderRadius: '999px !important',
  px: 2.5,
  py: 0.7,
  color: '#0969da',
  borderColor: '#0969da',
  '&:hover': { background: '#ddf4ff', borderColor: '#0969da' }
} as const;

interface IUserIDDialogProps {
  open: boolean;
  pretestUrl: string;
  videoSelectionMode?: 'manual' | 'assigned';
  videoLabels: Record<string, string>;
  posttestUrls: Record<number, string>;
  onSubmit: (userId: string, videoId: string) => Promise<void> | void;
  onCheckPretestStatus: (userId: string) => Promise<boolean>;
  onMarkPretestComplete: (
    userId: string,
    code: string
  ) => Promise<{ verified: boolean; message: string }>;
  onGetStudyProgress: (userId: string) => Promise<IStudyProgress>;
  onMarkPendingPosttestComplete: (
    userId: string,
    videoId: string,
    code: string
  ) => Promise<{ verified: boolean; message: string }>;
}

interface IStudyProgress {
  pretestCompleted: boolean;
  videoOrder: string[];
  finishedVideos: string[];
  completedVideos: string[];
  posttestIndex: number;
  studyCompleted: boolean;
  pendingPosttest: {
    available: boolean;
    questionnaireId: number | null;
    videoId: string | null;
  };
}

export const UserIDDialog: React.FC<IUserIDDialogProps> = ({
  open,
  pretestUrl,
  videoSelectionMode = 'manual',
  videoLabels,
  posttestUrls,
  onSubmit,
  onCheckPretestStatus,
  onMarkPretestComplete,
  onGetStudyProgress,
  onMarkPendingPosttestComplete
}) => {
  const [userId, setUserId] = useState('');
  const [videoId, setVideoId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsPretest, setNeedsPretest] = useState(false);
  const [pretestCode, setPretestCode] = useState('');
  const [pretestCodeError, setPretestCodeError] = useState('');
  const [posttestCode, setPosttestCode] = useState('');
  const [posttestCodeError, setPosttestCodeError] = useState('');
  const [isVerifyingPosttest, setIsVerifyingPosttest] = useState(false);
  const [studyProgress, setStudyProgress] = useState<IStudyProgress | null>(
    null
  );
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [progressError, setProgressError] = useState('');

  const isAssignedMode = videoSelectionMode === 'assigned';
  const assignedVideoId =
    studyProgress?.videoOrder.find(
      id => !studyProgress.completedVideos.includes(id)
    ) || '';
  const effectiveVideoId = isAssignedMode ? assignedVideoId || '' : videoId;

  const isValidUserId = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }
    const userIdPattern = /^[a-zA-Z0-9_-]+$/;
    return userIdPattern.test(trimmed);
  };

  useEffect(() => {
    const trimmed = userId.trim();
    if (!isValidUserId(trimmed)) {
      setStudyProgress(null);
      setProgressError('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoadingProgress(true);
        setProgressError('');
        const progress = await onGetStudyProgress(trimmed);
        setStudyProgress(progress);
      } catch (err) {
        console.error('Failed to load study progress:', err);
        setProgressError('Failed to load progress.');
      } finally {
        setIsLoadingProgress(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [userId, onGetStudyProgress]);

  const validateUserInput = () => {
    if (!userId.trim()) {
      setError('Please enter a user ID');
      return false;
    }

    // Validate user ID format (alphanumeric, hyphens, underscores)
    const userIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (!userIdPattern.test(userId.trim())) {
      setError(
        'User ID can only contain letters, numbers, hyphens, and underscores'
      );
      return false;
    }

    if (!isAssignedMode && !effectiveVideoId) {
      setError('Please select a video topic');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateUserInput()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const pretestCompleted = await onCheckPretestStatus(userId.trim());
      if (pretestCompleted) {
        await onSubmit(userId.trim(), effectiveVideoId || '');
        return;
      }

      setNeedsPretest(true);
    } catch (err) {
      console.error('Failed to check pre-test status:', err);
      setError('Failed to check pre-test status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPretest = async () => {
    setIsLoading(true);
    setError('');
    setPretestCodeError('');

    try {
      const result = await onMarkPretestComplete(
        userId.trim(),
        pretestCode.trim()
      );
      if (!result.verified) {
        setPretestCodeError(
          result.message || 'That code doesn’t match. Please try again.'
        );
        return;
      }
      await onSubmit(userId.trim(), effectiveVideoId || '');
    } catch (err) {
      console.error('Failed to verify pre-test completion code:', err);
      setError('Failed to verify the completion code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  const renderStatusBadge = (
    label: string,
    tone: 'success' | 'warning' | 'neutral'
  ) => {
    const palette = {
      success: {
        bg: '#e8f5e9',
        border: '#a5d6a7',
        text: '#1b5e20'
      },
      warning: {
        bg: '#fff8e1',
        border: '#ffe082',
        text: '#8a5a00'
      },
      neutral: {
        bg: '#eceff1',
        border: '#cfd8dc',
        text: '#37474f'
      }
    } as const;

    const color = palette[tone];
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 0.9,
          py: 0.2,
          ml: 0.8,
          borderRadius: 10,
          border: `1px solid ${color.border}`,
          backgroundColor: color.bg,
          color: color.text,
          fontSize: '0.72rem',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: 0.2,
          textTransform: 'uppercase'
        }}
      >
        {label}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      aria-labelledby="user-id-dialog-title"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)'
        }
      }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0969da 0%, #2a7de1 100%)',
          color: 'white',
          px: 4,
          py: 3
        }}
      >
        <Typography
          id="user-id-dialog-title"
          sx={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.2 }}
        >
          Welcome to Tutorly
        </Typography>
        <Typography
          sx={{ fontSize: '0.9rem', opacity: 0.92, mt: 0.5 }}
        >
          Your personal AI tutor for exploratory data analysis
        </Typography>
      </Box>
      <DialogContent sx={{ px: 4, py: 3 }}>
        <Box>
          <Typography
            variant="body2"
            sx={{ color: '#57606a', lineHeight: 1.5, mb: 1 }}
          >
            To get started, enter the participant ID we provided. We use it to
            track your learning progress and personalize the session.
          </Typography>
          {/* <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, mb: 3 }}
          >
            Your user ID is the one we provided you with.
          </Typography> */}
          {!isAssignedMode ? (
            <>
              <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
                Please select a video topic:
              </Typography>
              <RadioGroup
                value={videoId}
                onChange={e => setVideoId(e.target.value)}
                sx={{ mb: 3 }}
              >
                <FormControlLabel
                  value="EF4A4OtQprg"
                  control={<Radio />}
                  label="Seattle Pet Names"
                />
                <FormControlLabel
                  value="1xsbTs9-a50"
                  control={<Radio />}
                  label="Franchise Revenue"
                />
                <FormControlLabel
                  value="-1x8Kpyndss"
                  control={<Radio />}
                  label="Coffee Ratings"
                />
              </RadioGroup>
            </>
          ) : (
            <Box sx={{ mt: 2, mb: 2 }}>
              {assignedVideoId && (
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                  Next video:{' '}
                  {videoLabels?.[assignedVideoId] || assignedVideoId}
                </Typography>
              )}
            </Box>
          )}
          {isValidUserId(userId) && (
            <Box
              sx={{
                p: 2,
                mb: 2,
                border: '1px solid #d8d8d8',
                borderRadius: 1,
                backgroundColor: '#fafafa'
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Study Progress
              </Typography>
              {isLoadingProgress && (
                <Typography variant="body2">Loading progress...</Typography>
              )}
              {progressError && (
                <Typography variant="body2" color="error">
                  {progressError}
                </Typography>
              )}
              {studyProgress && (
                <>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Pre-test:
                    {studyProgress.pretestCompleted
                      ? renderStatusBadge('Completed', 'success')
                      : renderStatusBadge('Pending', 'warning')}
                  </Typography>
                  {studyProgress.videoOrder.map((id, index) => {
                    const videoDone = studyProgress.finishedVideos.includes(id);
                    const postDone = studyProgress.completedVideos.includes(id);
                    const videoLabel = videoLabels[id] || id;
                    const statusLabel = videoDone
                      ? postDone
                        ? 'Video + Post-test Completed'
                        : 'Video Completed, Post-test Pending'
                      : 'Not Started';
                    const statusTone: 'success' | 'warning' | 'neutral' =
                      videoDone
                        ? postDone
                          ? 'success'
                          : 'warning'
                        : 'neutral';
                    return (
                      <Typography key={id} variant="body2" sx={{ mb: 0.5 }}>
                        Video {index + 1} ({videoLabel}):
                        {renderStatusBadge(statusLabel, statusTone)}
                      </Typography>
                    );
                  })}
                  {studyProgress.pendingPosttest.available &&
                    studyProgress.pendingPosttest.questionnaireId &&
                    studyProgress.pendingPosttest.videoId && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Pending post-test available now. After submitting it,
                          enter the completion code shown at the end of the
                          survey.
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ ...secondaryBtnSx, mb: 1.5 }}
                          onClick={() =>
                            window.open(
                              appendUserId(
                                posttestUrls[
                                  studyProgress.pendingPosttest.questionnaireId!
                                ],
                                userId.trim()
                              ),
                              '_blank'
                            )
                          }
                        >
                          Open Pending Post-test
                        </Button>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1
                          }}
                        >
                          <TextField
                            size="small"
                            label="Completion code"
                            value={posttestCode}
                            error={!!posttestCodeError}
                            helperText={posttestCodeError || ''}
                            onChange={e => {
                              setPosttestCode(e.target.value);
                              setPosttestCodeError('');
                            }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ ...primaryBtnSx, mt: 0.4 }}
                            disabled={!posttestCode.trim() || isVerifyingPosttest}
                            onClick={async () => {
                              setIsVerifyingPosttest(true);
                              setPosttestCodeError('');
                              try {
                                const result =
                                  await onMarkPendingPosttestComplete(
                                    userId.trim(),
                                    studyProgress.pendingPosttest.videoId!,
                                    posttestCode.trim()
                                  );
                                if (!result.verified) {
                                  setPosttestCodeError(
                                    result.message ||
                                      'That code doesn’t match. Please try again.'
                                  );
                                  return;
                                }
                                setPosttestCode('');
                                const updated = await onGetStudyProgress(
                                  userId.trim()
                                );
                                setStudyProgress(updated);
                              } catch (err) {
                                console.error(
                                  'Failed to verify post-test code:',
                                  err
                                );
                                setPosttestCodeError(
                                  'Failed to verify the code. Please try again.'
                                );
                              } finally {
                                setIsVerifyingPosttest(false);
                              }
                            }}
                          >
                            Submit Code
                          </Button>
                        </Box>
                      </Box>
                    )}
                  {studyProgress.studyCompleted && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      All study tasks are completed.
                    </Typography>
                  )}
                </>
              )}
            </Box>
          )}
          {needsPretest && (
            <Box
              sx={{
                p: 2,
                mb: 2,
                border: '1px solid #d32f2f',
                borderRadius: 1,
                backgroundColor: '#fff8f8'
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Pre-test required before video access
              </Typography>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                Please finish the Qualtrics pre-test first. After submitting
                it, you will receive a completion code — enter it below to
                continue.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() =>
                  window.open(
                    appendUserId(pretestUrl, userId.trim()),
                    '_blank'
                  )
                }
                sx={{ ...secondaryBtnSx, mb: 1.5 }}
              >
                Open Pre-test
              </Button>
              <TextField
                fullWidth
                size="small"
                label="Pre-test completion code"
                value={pretestCode}
                error={!!pretestCodeError}
                helperText={pretestCodeError || ''}
                onChange={e => {
                  setPretestCode(e.target.value);
                  setPretestCodeError('');
                }}
              />
            </Box>
          )}
          <TextField
            autoFocus
            fullWidth
            label="User ID"
            variant="outlined"
            value={userId}
            onChange={e => {
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
      <DialogActions sx={{ px: 4, pb: 3, pt: 1 }}>
        {!needsPretest ? (
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={primaryBtnSx}
            disabled={
              !userId.trim() ||
              (!isAssignedMode && !effectiveVideoId) ||
              isLoading
            }
          >
            {isLoading ? (
              <CircularProgress size={18} sx={{ color: 'white' }} />
            ) : (
              'Start Learning'
            )}
          </Button>
        ) : (
          <Button
            onClick={handleConfirmPretest}
            variant="contained"
            sx={primaryBtnSx}
            disabled={!pretestCode.trim() || isLoading}
          >
            {isLoading ? (
              <CircularProgress size={18} sx={{ color: 'white' }} />
            ) : (
              'Continue to Videos'
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
