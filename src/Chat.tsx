import { ReactWidget } from '@jupyterlab/ui-components';
import React, { useState, useEffect, useCallback } from 'react';
import { requestAPI } from './handler';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  MessageSeparator
} from '@chatscope/chat-ui-kit-react';
import { MessageDirection } from '@chatscope/chat-ui-kit-react/src/types/unions';
import { INotebookTracker } from '@jupyterlab/notebook';
import YouTube, { YouTubeEvent } from 'react-youtube';
import { Button } from '@mui/material';
import { ISignal, Signal } from '@lumino/signaling';
import { ICodeCellModel } from '@jupyterlab/cells';

export interface ISegment {
  start: number;
  end: number;
  category: string;
}

interface IMessage {
  message: string;
  sentTime: string;
  direction: MessageDirection;
  sender: string;
  videoId: string | null;
  start: number | null;
  end: number | null;
  category: string | null;
}

interface ICellOutput {
  output_type?: string;
}

export interface IVideoId {
  videoId: string;
}

type ChatComponentProps = {
  onVideoIdChange: (videoId: IVideoId) => void;
  getCurrentNotebookContent: () => any;
  getCurrentNotebook: () => any;
  getMetaDataChange: () => void;
};

// Create a new React component for the Chat logic
const ChatComponent = (props: ChatComponentProps): JSX.Element => {
  const [player, setPlayer] = useState<any | null>(null);
  const [videoId, setVideoId] = useState('');
  const [segments, setSegments] = useState<ISegment[]>([]);
  const [messages, setMessages] = useState<IMessage[]>([
    {
      message:
        "Welcome to today's Tidy Tuesday project! First, tell me which video you want to watch:",
      videoId: null,
      sentTime: '0 second',
      direction: 'incoming',
      sender: 'iTutor',
      start: null,
      end: null,
      category: null
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [canGoOn, setCanGoOn] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());

  const handleReady = (event: YouTubeEvent<number>) => {
    setPlayer(event.target);
  };

  function stripHTMLTags(input: string) {
    return input.replace(/<[^>]*>/g, '');
  }

  const handleSend = useCallback(
    async (question: string) => {
      setInputValue(''); // Reset inputValue after sending the message
      question = stripHTMLTags(question);
      const newMessage: IMessage = {
        message: question,
        sentTime: 'just now',
        direction: 'outgoing',
        sender: 'user',
        videoId: null,
        start: null,
        end: null,
        category: null
      };

      const newMessages = [...messages, newMessage];
      setMessages(newMessages);

      if (videoId === '') {
        setIsTyping(true);
        setCanGoOn(true);
        setVideoId(question);
        props.onVideoIdChange({ videoId: question }); // Emit signal
        requestAPI<any>('segments', {
          body: JSON.stringify({ videoId: question }),
          method: 'POST'
        })
          .then(response => {
            console.log(response);
            // const parsed = JSON.parse(response.replace(/'/g, '"'));
            setSegments(response);
            setMessages([
              ...newMessages,
              {
                message:
                  "The video is segmented into several video clips. While you can navigate through the parts you like, I recommend following the video progress to learn and imitate his Exploratory Data Analysis process and do the task on your own.\n\nWhile watching the video, keep asking yourself these three questions: what is he doing, why is he doing it, and how will success in what he is doing help him find a solution to the problem ? Now let's get started!",
                sentTime: 'just now',
                direction: 'incoming',
                sender: 'iTutor',
                videoId: question,
                start: response[0].start,
                end: response[0].end,
                category: response[0].category
              }
            ]);
            setIsTyping(false);
          })
          .catch(reason => {
            console.error(`Error on POST /jlab_ext_example/chats .\n${reason}`);
          });
      } else {
        setIsTyping(true);
        const currentNotebookContent = JSON.stringify(
          props.getCurrentNotebookContent()
        );
        console.log(currentNotebookContent);
        const currentTime = player ? Math.round(player.getCurrentTime()) : 0;

        let category = '';
        if (currentSegmentIndex < segments.length - 1) {
          category = segments[currentSegmentIndex].category;
        } else if (currentSegmentIndex < segments.length + 2) {
          category = 'Self-exploration';
        } else {
          category = 'Conclusion';
        }

        // Define a regex to extract code blocks enclosed in triple backticks
        // This will also capture the language type if present
        const codeRegex = /```(\w+)?\s*([\s\S]*?)```/gs;

        requestAPI<any>('chat', {
          body: JSON.stringify({
            state: `${currentTime} seconds`,
            notebook: currentNotebookContent,
            question: question,
            videoId: videoId,
            segments: segments,
            category: category
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
                sender: 'iTutor',
                videoId: null,
                start: null,
                end: null,
                category: null
              }
            ]);
            // Extract code blocks from the response
            let match;
            while ((match = codeRegex.exec(response)) !== null) {
              const code = match[2].trim();
              console.log(code);
              if (code) {
                const activatedNotebook = props.getCurrentNotebook();
                if (activatedNotebook) {
                  const nbContent = activatedNotebook;
                  if (nbContent && nbContent.contentFactory) {
                    try {
                      const cellModel: ICodeCellModel =
                        nbContent.contentFactory.createCodeCell({
                          cell: {
                            cell_type: 'code',
                            source: ['some code line 1', 'some code line 2'],
                            metadata: {}
                          },
                          metadataChanged: props.getMetaDataChange()
                        });
                      const cells = nbContent.model.cells;
                      cells.insert(cells.length, cellModel);
                    } catch (error) {
                      console.error(error);
                    }
                  } else {
                    console.error('nbContent or contentFactory is undefined');
                  }
                } else {
                  console.error('No active notebook');
                  // nbContent.model.initialize();
                  // model.cells.push(newCell);
                  // const newCell = activatedNotebook.createCodeCell({
                  //   cell: {
                  //     cell_type: 'code',
                  //     source: ["print('hello')"],
                  //     metadata: {}
                  //   }
                  // });
                  // console.log('New cell:', newCell);
                  // if (newCell) {
                  //   activatedNotebook.model.cells.push(newCell);
                  // } else {
                  //   console.error('New cell was not created.');
                  // }
                }
                // Assuming the notebook exposes a way to get the DOM element for a cell
                // const cellIndex = props.activeNotebook.model.cells.length - 1;
                // const cellElement =
                //   props.activeNotebook.getCellElement(cellIndex);

                // // Apply the flash effect
                // if (cellElement) {
                //   cellElement.classList.add('flash-cell');

                //   // Remove the class after animation to reset the cell's appearance
                //   setTimeout(() => {
                //     cellElement.classList.remove('flash-cell');
                //   }, 1000);
                // }
              }
            }
            setIsTyping(false);
          })
          .catch(reason => {
            console.error(`Error on POST /jlab_ext_example/chats .\n${reason}`);
          });

        if (category === 'Self-exploration') {
          setCanGoOn(false);
        } else if (category === 'Introduction') {
          setCanGoOn(true);
        } else {
          requestAPI<any>('go_on', {
            body: JSON.stringify({
              state: `${currentTime} seconds`,
              notebook: currentNotebookContent,
              question: question,
              videoId: videoId,
              segments: segments,
              category: category
            }),
            method: 'POST'
          })
            .then(response => {
              console.log(response);
              setCanGoOn(response.toLowerCase() === 'yes');
            })
            .catch(reason => {
              console.error(
                `Error on POST /jlab_ext_example/go_on .\n${reason}`
              );
            });
        }
      }
    },
    [
      messages,
      player,
      videoId,
      segments,
      props.getCurrentNotebookContent,
      props.onVideoIdChange
    ]
  );

  // Function to handle "Go On" button click
  const handleGoOn = () => {
    setCanGoOn(false); // Disable the button
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      const nextSegment = segments[currentSegmentIndex + 1];

      // Append the new message to the existing messages array
      setMessages([
        ...messages,
        {
          message:
            "Nice work on the previous task! Now let's move on to the next part of the video.",
          videoId: 'nx5yhXAQLxw', // Assuming the videoId remains the same for all segments
          sentTime: `${nextSegment.start}`, // Segment start time
          direction: 'incoming',
          sender: 'iTutor',
          start: nextSegment.start, // Store the start and end times in the message
          end: nextSegment.end,
          category: nextSegment.category
        }
      ]);
    } else if (currentSegmentIndex < segments.length + 2) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setMessages([
        ...messages,
        {
          message:
            'Can you think of more tasks that are not in the video to do?',
          videoId: null,
          sentTime: 'just now',
          direction: 'incoming',
          sender: 'iTutor',
          start: null, // Store the start and end times in the message
          end: null,
          category: 'Self-exploration'
        }
      ]);
    } else {
      setMessages([
        ...messages,
        {
          message: 'Could you conclude what you have learned today?',
          videoId: null,
          sentTime: 'just now',
          direction: 'incoming',
          sender: 'iTutor',
          start: null, // Store the start and end times in the message
          end: null,
          category: 'Conclusion'
        }
      ]);
    }
  };

  const checkForInactivity = useCallback(() => {
    if (Date.now() - lastActivityTime >= 240000) {
      // 2 minutes in milliseconds
      handleSend('');
      setLastActivityTime(Date.now()); // Reset the last activity time
    }
  }, [lastActivityTime, handleSend]);

  // Update lastActivityTime whenever user types something
  useEffect(() => {
    if (inputValue !== '' || (player && player.getOptions('isFullScreen'))) {
      setLastActivityTime(Date.now());
    }
  }, [inputValue]);

  // Setup an interval to check for inactivity every second
  useEffect(() => {
    const intervalId = setInterval(checkForInactivity, 1000);
    return () => clearInterval(intervalId);
  }, [checkForInactivity]);

  useEffect(() => {
    const chatContainer = document.getElementById('chatContainerId');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MainContainer style={{ height: '100%', width: '100%' }}>
        <ChatContainer
          id="chatContainerId"
          style={{ height: '100%', width: '100%' }}
        >
          <MessageList
            scrollBehavior="smooth"
            typingIndicator={
              isTyping ? <TypingIndicator content="iTutor is typing" /> : null
            }
            style={{ height: 'auto', width: '100%' }} // Leaving 50px for MessageInput
          >
            {messages
              .filter(
                message => message.message && message.message.trim() !== ''
              )
              .map((message, i) => (
                <>
                  {message.category && (
                    <MessageSeparator>{message.category}</MessageSeparator>
                  )}
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
                  {message.videoId && (
                    <div
                      style={{
                        overflow: 'hidden', // make sure the radius applies to the inner iframe
                        marginTop: '8px', // set distance between this video and the next message
                        paddingBottom: isTyping ? '40px' : '20px'
                      }}
                    >
                      <YouTube
                        videoId={message.videoId}
                        opts={{
                          height: '240',
                          width: '430',
                          playerVars: {
                            start: message.start || undefined, // Use the start and end time from the message
                            end: message.end || undefined
                          }
                        }}
                        onReady={handleReady}
                      />
                    </div>
                  )}
                </>
              ))}
          </MessageList>
          <MessageInput
            placeholder="Type message here"
            attachButton={false}
            onSend={handleSend}
            style={{ maxHeight: '100px', overflowY: 'auto' }}
            onChange={val => {
              console.log('onChange triggered with value: ', val);
              setInputValue(val);
            }}
            // style={{ height: '50px', width: '100%' }}
            disabled={isTyping} // Disable the input when isTyping is true
          />
        </ChatContainer>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGoOn}
          style={{
            position: 'absolute',
            bottom: 60, // Adjust as needed
            right: 10,
            zIndex: 1 // Make sure it appears above other elements
          }}
          disabled={!canGoOn || isTyping || videoId === ''} // Disable the input when isTyping is true
        >
          Go on
        </Button>
      </MainContainer>
    </div>
  );
};

// Create a new JupyterLab widget for the Chat
export class ChatWidget extends ReactWidget {
  constructor(private notebookTracker: INotebookTracker) {
    super();
    this.addClass('jp-Chat-widget');
  }

  private _videoIdChanged = new Signal<this, IVideoId>(this);
  public get videoIdChanged(): ISignal<this, IVideoId> {
    return this._videoIdChanged;
  }

  private _metadataChanged = new Signal<this, void>(this);
  public get metadataChanged(): ISignal<this, void> {
    return this._metadataChanged;
  }

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

  private _getCurrentNotebook(): any {
    return this.notebookTracker.currentWidget?.content;
  }

  render(): JSX.Element {
    return (
      <div style={{ height: '100%', width: '100%' }}>
        <ChatComponent
          getCurrentNotebookContent={this._getCurrentNotebookContent.bind(this)}
          onVideoIdChange={(videoId: IVideoId) =>
            this._videoIdChanged.emit(videoId)
          }
          getCurrentNotebook={this._getCurrentNotebook.bind(this)}
          getMetaDataChange={() => this._metadataChanged.emit()}
        />
      </div>
    );
  }
}
