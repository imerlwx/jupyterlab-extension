import { ReactWidget } from '@jupyterlab/ui-components';
import React, { useEffect, useState } from 'react';
// import { Box } from '@mui/material';
import { ISignal, Signal } from '@lumino/signaling';
import YouTube, { YouTubeEvent } from 'react-youtube';
import { VideoSegmentWidget, IVideoId, ISegment } from './VideoSegment';

interface IVideoPlayerProps {
  segment: ISegment;
  videoId: string;
  onCurrentTimeChanged: (time: number) => void;
}

const VideoPlayerComponent = (props: IVideoPlayerProps): JSX.Element => {
  const [player, setPlayer] = useState<any | null>(null);

  const onPlayerStateChange = (event: YouTubeEvent<number>) => {
    setPlayer(event.target);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (player) {
        const currentTime = Math.round(player.getCurrentTime());
        props.onCurrentTimeChanged(currentTime);
      }
    }, 1000); // Update every 1 second

    return () => clearInterval(interval); // Cleanup
  }, [player]); // Dependency array includes `player` so effect updates when player changes

  const opts = {
    playerVars: {
      start: props.segment.start,
      end: props.segment.end,
      autoplay: 0 as 0 | 1 | undefined
    }
  };

  return (
    // <Box
    //   sx={{
    //     position: 'relative',
    //     width: '100%',
    //     paddingBottom: '56.25%',
    //     height: 'auto',
    //     overflow: 'hidden'
    //   }}
    // >
    //   <Box
    //     sx={{
    //       position: 'absolute',
    //       top: 0,
    //       right: 0,
    //       bottom: 0,
    //       left: 0
    //     }}
    //   >
    <div
      style={{
        position: 'relative',
        paddingBottom: '56.25%',
        height: 'auto',
        overflow: 'hidden',
        width: '100%'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      >
        {props && (
          <YouTube
            videoId={props.videoId}
            opts={opts}
            onStateChange={onPlayerStateChange}
          />
        )}
      </div>
    </div>
    //   </Box>
    // </Box>
  );
};

export class VideoPlayerWidget extends ReactWidget {
  private _segment: ISegment = { start: 1, end: 10, name: '' };
  private _videoId = '';

  // New Signal for emitting the current time of the video
  private _currentTimeChanged = new Signal<this, number>(this);
  public get currentTimeChanged(): ISignal<this, number> {
    return this._currentTimeChanged;
  }

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
      <div style={{ height: '100%', width: '100%' }}>
        <VideoPlayerComponent
          segment={this._segment}
          videoId={this._videoId}
          onCurrentTimeChanged={(time: number) =>
            this._currentTimeChanged.emit(time)
          }
        />
      </div>
    );
  }
}
