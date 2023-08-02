import { ReactWidget } from '@jupyterlab/ui-components';
import React, { useState } from 'react';
import { Button, Paper, TextField, Typography } from '@mui/material';
import { ISignal, Signal } from '@lumino/signaling';
import { requestAPI } from './handler';

export interface ISegment {
  start: number;
  end: number;
  url: string;
}

export interface IVideoId {
  videoId: string;
}

type VideoSegmentComponentProps = {
  onSegmentSelected: (segment: ISegment) => void;
  onVideoIdChange: (videoId: IVideoId) => void;
};

const VideoSegmentComponent = (
  props: VideoSegmentComponentProps
): JSX.Element => {
  const [input, setInput] = useState(''); // Input state
  // const [videoId, setVideoId] = useState('');
  const [videoSegments, setVideoSegments] = useState([]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSubmit = () => {
    // setVideoId(input);
    props.onVideoIdChange({ videoId: input }); // Emit signal
    // Fetch video segments from server
    requestAPI<any>('segments', {
      body: JSON.stringify({ videoId: input }),
      method: 'POST'
    })
      .then(response => {
        console.log(response);
        setVideoSegments(response);
      })
      .catch(reason => {
        console.error(
          `Error on POST /jlab_ext_example/segments ${input}.\n${reason}`
        );
      });
  };

  const handleSegmentClick = (segment: ISegment) => {
    props.onSegmentSelected(segment);
  };

  return (
    <div>
      <Paper
        elevation={3}
        sx={{
          borderRadius: 2,
          backgroundColor: '#f5f5f5',
          p: 2,
          height: '100vh'
        }}
      >
        <TextField
          label="Video ID"
          variant="outlined"
          value={input}
          size="small"
          onChange={handleInputChange}
          sx={{ pb: 1 }}
        />
        <Button onClick={handleSubmit}>Submit</Button>
        <Typography variant="h5">Video Segments</Typography>
        <div>
          {videoSegments.map((segment, index) => (
            <Button key={index} onClick={() => handleSegmentClick(segment)}>
              Segment {index + 1}
            </Button>
          ))}
        </div>
      </Paper>
    </div>
  );
};

export class VideoSegmentWidget extends ReactWidget {
  constructor() {
    super();
    this.addClass('jp-react-widget');
  }

  // Send the videoId and chosen segment to the VideoPlayerWidget
  private _segmentSelected = new Signal<this, ISegment>(this);

  public get segmentSelected(): ISignal<this, ISegment> {
    return this._segmentSelected;
  }

  private _videoIdChanged = new Signal<this, IVideoId>(this);

  public get videoIdChanged(): ISignal<this, IVideoId> {
    return this._videoIdChanged;
  }

  render(): JSX.Element {
    return (
      <VideoSegmentComponent
        onSegmentSelected={(segment: ISegment) =>
          this._segmentSelected.emit(segment)
        }
        onVideoIdChange={(videoId: IVideoId) =>
          this._videoIdChanged.emit(videoId)
        }
      />
    );
  }
}
