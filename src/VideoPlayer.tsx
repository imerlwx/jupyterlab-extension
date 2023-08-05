import { ReactWidget } from '@jupyterlab/ui-components';
import React from 'react';
import { Box } from '@mui/material';
import { VideoSegmentWidget, IVideoId, ISegment } from './VideoSegment';

interface IVideoPlayerProps {
  segment: ISegment;
  videoId: string;
}

const VideoPlayerComponent = (props: IVideoPlayerProps): JSX.Element => {
  return (
    <p>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          height: 0,
          paddingBottom: '56.25%'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
          }}
        >
          {props && (
            <iframe
              title="video"
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${props.videoId}?start=${props.segment.start}&end=${props.segment.end}&autoplay=0`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          )}
        </Box>
      </Box>
      {/* <Typography variant="h5">Video ID: {props.segment.start}</Typography> */}
    </p>
  );
};

export class VideoPlayerWidget extends ReactWidget {
  private _segment: ISegment = { start: 1, end: 10, name: '' };
  private _videoId = '';

  constructor(videoSegmentWidget: VideoSegmentWidget) {
    super();
    this.addClass('jp-react-widget');
    videoSegmentWidget.segmentSelected.connect(this._onSegmentSelected, this);
    videoSegmentWidget.videoIdChanged.connect(this._onVideoIdChanged, this);
  }

  private _onSegmentSelected = (
    emitter: VideoSegmentWidget,
    segment: ISegment
  ) => {
    this._segment = segment;
    this.update();
  };

  private _onVideoIdChanged = (
    emitter: VideoSegmentWidget,
    videoId: IVideoId
  ) => {
    this._videoId = videoId.videoId;
    this.update();
  };

  render() {
    return (
      <VideoPlayerComponent segment={this._segment} videoId={this._videoId} />
    );
  }
}
