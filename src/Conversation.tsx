import { ReactWidget } from '@jupyterlab/ui-components';
import React, { useState, useEffect, useCallback } from 'react';
import { VideoPlayerWidget } from './VideoPlayer';
import { requestAPI } from './handler';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator
} from '@chatscope/chat-ui-kit-react';
import { MessageDirection } from '@chatscope/chat-ui-kit-react/src/types/unions';
import { VideoSegmentWidget, IVideoId, IVideoSegments } from './VideoSegment';
import { INotebookTracker } from '@jupyterlab/notebook';

interface IConversationProps {
  currentTime: number;
  videoId: string;
  segments: string;
}

interface IMessage {
  message: string;
  sentTime: string;
  direction: MessageDirection;
  sender: string;
}

interface ICellOutput {
  output_type?: string;
}

// Create a new React component for the Conversation logic
const ConversationComponent = (
  props: IConversationProps & { getCurrentNotebookContent: () => any }
): JSX.Element => {
  const [messages, setMessages] = useState<IMessage[]>([
    {
      message: "Hello! Ask me anything and I'll help you along with the video!",
      sentTime: '0 second',
      direction: 'incoming',
      sender: 'iTutor'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());

  const handleSend = useCallback(
    async (question: string) => {
      if (!props.segments || !props.videoId) {
        // If segments or videoId are empty. Don't send the message.
        return;
      }
      setInputValue(''); // Reset inputValue after sending the message
      const currentTime = props.currentTime;
      const newMessage: IMessage = {
        message: question,
        sentTime: `${currentTime} seconds`,
        direction: 'outgoing',
        sender: 'user'
      };

      const newMessages = [...messages, newMessage];
      setMessages(newMessages);

      setIsTyping(true);
      const currentNotebookContent = JSON.stringify(
        props.getCurrentNotebookContent()
      );
      console.log(currentNotebookContent);

      requestAPI<any>('chat', {
        body: JSON.stringify({
          state: `${currentTime} seconds`,
          notebook: currentNotebookContent,
          question: question,
          videoId: props.videoId,
          segments: props.segments
        }),
        method: 'POST'
      })
        .then(response => {
          console.log(response);
          setMessages([
            ...newMessages,
            {
              message: response,
              sentTime: `${currentTime} seconds`,
              direction: 'incoming',
              sender: 'iTutor'
            }
          ]);
          setIsTyping(false);
        })
        .catch(reason => {
          console.error(`Error on POST /jlab_ext_example/chats .\n${reason}`);
        });
    },
    [messages, props.currentTime, props.segments, props.videoId]
  );

  const checkForInactivity = useCallback(() => {
    if (Date.now() - lastActivityTime >= 120000) {
      // 2 minutes in milliseconds
      handleSend('');
      setLastActivityTime(Date.now()); // Reset the last activity time
    }
  }, [lastActivityTime, handleSend]);

  // Update lastActivityTime whenever user types something
  useEffect(() => {
    if (inputValue !== '') {
      setLastActivityTime(Date.now());
    }
  }, [inputValue]);

  // Setup an interval to check for inactivity every second
  useEffect(() => {
    const intervalId = setInterval(checkForInactivity, 1000);
    return () => clearInterval(intervalId);
  }, [checkForInactivity]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MainContainer style={{ height: '100%', width: '100%' }}>
        <ChatContainer style={{ height: '100%', width: '100%' }}>
          <MessageList
            scrollBehavior="smooth"
            typingIndicator={
              isTyping ? <TypingIndicator content="iTutor is typing" /> : null
            }
            style={{ height: 'calc(100% - 50px)', width: '100%' }} // Leaving 50px for MessageInput
          >
            {messages
              .filter(
                message => message.message && message.message.trim() !== ''
              )
              .map((message, i) => (
                <Message
                  key={i}
                  model={{
                    message: message.message,
                    direction: message.direction,
                    sender: message.sender,
                    sentTime: message.sentTime,
                    position: 'single'
                  }}
                />
              ))}
          </MessageList>
          <MessageInput
            placeholder="Type message here"
            attachButton={false}
            onSend={handleSend}
            onChange={val => {
              console.log('onChange triggered with value: ', val);
              setInputValue(val);
            }}
            style={{ height: '50px', width: '100%' }}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
};

// Create a new JupyterLab widget for the Conversation
export class ConversationWidget extends ReactWidget {
  private _videoPlayerWidget: VideoPlayerWidget;
  private _videoSegmentWidget: VideoSegmentWidget;
  private _currentTime: number = 0;
  private _videoId: string = '';
  private _segments: string = '';

  constructor(
    videoPlayerWidget: VideoPlayerWidget,
    videoSegmentWidget: VideoSegmentWidget,
    private notebookTracker: INotebookTracker
  ) {
    super();
    this._videoPlayerWidget = videoPlayerWidget;
    this._videoSegmentWidget = videoSegmentWidget;

    // Listen to currentTime changes
    this._videoPlayerWidget.currentTimeChanged.connect(
      this._onCurrentTimeChanged,
      this
    );

    // Listen to videoId changes
    this._videoSegmentWidget.videoIdChanged.connect(
      this._onVideoIdChanged,
      this
    );

    // Listen to segment changes
    this._videoSegmentWidget.videoSegmentsChanged.connect(
      this._onVideoSegmentsChanged,
      this
    );

    this.addClass('jp-conversation-widget');
  }

  private _onCurrentTimeChanged = (
    emitter: VideoPlayerWidget,
    currentTime: number
  ) => {
    this._currentTime = currentTime;
    this.update();
    console.log(`Received currentTime: ${this._currentTime}`);
  };

  private _onVideoIdChanged = (
    emitter: VideoSegmentWidget,
    videoId: IVideoId
  ) => {
    this._videoId = videoId.videoId;
    this.update();
    console.log(`Received videoId: ${this._videoId}`);
  };

  private _onVideoSegmentsChanged = (
    emitter: VideoSegmentWidget,
    segments: IVideoSegments
  ) => {
    this._segments = `${JSON.stringify(segments.segments)}`;
    this.update();
    console.log(`Received segments: ${this._segments}`);
  };

  private _getCurrentNotebookContent(): any {
    // Check if a notebook is currently active
    if (this.notebookTracker.currentWidget) {
      const notebook = this.notebookTracker.currentWidget.content;
      const cells = notebook.widgets.map(cellWidget => {
        const cellModel = cellWidget.model;
        const cell_json = cellModel.toJSON();

        let output_type: string | null = null;
        if (Array.isArray(cell_json.outputs) && cell_json.outputs.length > 0) {
          const firstOutput = cell_json.outputs[0] as ICellOutput;
          output_type = firstOutput.output_type || null;
        }

        return {
          cell_type: cell_json.cell_type,
          source: cell_json.source,
          output_type: output_type
        };
      });
      return cells;
    }
    return null;
  }

  render(): JSX.Element {
    return (
      <div style={{ height: '100%', width: '100%' }}>
        <ConversationComponent
          currentTime={this._currentTime}
          videoId={this._videoId}
          segments={this._segments}
          getCurrentNotebookContent={this._getCurrentNotebookContent.bind(this)}
        />
      </div>
    );
  }
}
