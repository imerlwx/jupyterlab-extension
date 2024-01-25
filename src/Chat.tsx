import { ReactWidget } from '@jupyterlab/ui-components';
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  CSSProperties
} from 'react';
// import ReactMarkdown from 'react-markdown';
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
import {
  INotebookTracker,
  NotebookActions,
  Notebook,
  KernelError
} from '@jupyterlab/notebook';
import YouTube, { YouTubeEvent } from 'react-youtube';
import { Button } from '@mui/material';
import { ISignal, Signal } from '@lumino/signaling';
import { Cell, CodeCell, ICellModel } from '@jupyterlab/cells';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
// import AceEditor from 'react-ace';
// import 'ace-builds/src-noconflict/mode-r'; // import the mode for the language you need
// import 'ace-builds/src-noconflict/theme-monokai'; // import the theme of your choice

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
  interaction: string | null;
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
  getCurrentNotebookKernel: () => any;
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
      category: null,
      interaction: 'plain text'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  // const [inputValue, setInputValue] = useState('');
  const [canGoOn, setCanGoOn] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  // const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [kernelType, setKernelType] = useState('');
  const [popupStates, setPopupStates] = useState<Record<number, boolean>>({});
  // const [lastSendTime, setLastSendTime] = useState<number>(Date.now());
  const currentSegmentIndexRef = useRef(currentSegmentIndex);
  const videoIdRef = useRef(videoId);
  const canGoOnRef = useRef(canGoOn);
  const [isReadyToSend, setIsReadyToSend] = useState(false);
  const [isAlredaySend, setIsAlredaySend] = useState(false);
  const [needHint, setNeedHint] = useState(false);
  const [selectedChoice, setSelectedChoice] = React.useState('');
  // const [code, setCode] = React.useState<string>('');

  const handleReady = (event: YouTubeEvent<number>) => {
    setPlayer(event.target);
  };

  const openPopup = (index: number) => {
    setPopupStates(prevStates => ({ ...prevStates, [index]: true }));
  };

  const closePopup = (index: number) => {
    setPopupStates(prevStates => ({ ...prevStates, [index]: false }));
  };

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedChoice((event.target as HTMLInputElement).value);
  };

  const backdropStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 15
  };

  const openerAboveStyle: CSSProperties = {
    zIndex: 16
  };

  const openerBelowStyle: CSSProperties = {
    zIndex: 14
  };

  const popupStyle: CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 20
  };

  function stripHTMLTags(input: string) {
    return input.replace(/<[^>]*>/g, '');
  }

  const handleSend = useCallback(
    async (question: string) => {
      // setInputValue(''); // Reset inputValue after sending the message
      // setLastSendTime(Date.now()); // Update the last send time
      question = stripHTMLTags(question);
      const newMessage: IMessage = {
        message: question,
        sentTime: 'just now',
        direction: 'outgoing',
        sender: 'user',
        videoId: null,
        start: null,
        end: null,
        category: null,
        interaction: 'plain text'
      };

      setMessages(prevMessages => [...prevMessages, newMessage]);

      if (videoId === '') {
        // console.log(question);
        setIsTyping(true);
        setCanGoOn(true);
        setVideoId(question);
        props.onVideoIdChange({ videoId: question }); // Emit signal
        const kernel = props.getCurrentNotebookKernel();
        // console.log(kernel.name);
        setKernelType(kernel.name);
        requestAPI<any>('segments', {
          body: JSON.stringify({ videoId: question }),
          method: 'POST'
        })
          .then(response => {
            // console.log('initial response:', response);
            // const parsed = JSON.parse(response.replace(/'/g, '"'));
            setSegments(response);
            setMessages(prevMessages => [
              ...prevMessages,
              {
                message:
                  "The video is segmented into several video clips. While you can navigate through the parts you like, I recommend following the video progress to learn and imitate his Exploratory Data Analysis process and do the task on your own.\n\nWhile watching the video, keep asking yourself these three questions: what is he doing, why is he doing it, and how will success in what he is doing help him find a solution to the problem ? Now let's get started!",
                sentTime: 'just now',
                direction: 'incoming',
                sender: 'iTutor',
                videoId: question,
                start: response[0].start,
                end: response[0].end,
                category: response[0].category,
                interaction: 'plain text'
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
        // console.log(currentNotebookContent);
        const currentTime = player ? Math.round(player.getCurrentTime()) : 0;

        let category = '';
        if (currentSegmentIndex < segments.length - 1) {
          category = segments[currentSegmentIndex].category;
        } else if (currentSegmentIndex < segments.length + 2) {
          category = 'Self-exploration';
        } else {
          category = 'Conclusion';
        }

        // Update bkt when student has typed something in the chatbox
        if (question !== '') {
          requestAPI<any>('update_bkt', {
            body: JSON.stringify({
              // notebook: currentNotebookContent,
              cell: '',
              output: '',
              question: question,
              videoId: videoId,
              segmentIndex: currentSegmentIndex,
              kernelType: kernelType
            }),
            method: 'POST'
          })
            .then(response => {
              console.log('Question bkt updated');
            })
            .catch(reason => {
              console.error(
                `Error on POST /jlab_ext_example/update_bkt .\n${reason}`
              );
            });
        }

        if (category === 'Self-exploration') {
          setCanGoOn(false);
        } else if (category === 'Introduction') {
          setCanGoOn(true);
        } else {
          if (canGoOn === false) {
            requestAPI<any>('go_on', {
              body: JSON.stringify({
                videoId: videoId,
                segmentIndex: currentSegmentIndex
                // notebook: currentNotebookContent
              }),
              method: 'POST'
            })
              .then(response => {
                // console.log(response);
                setCanGoOn(response.toLowerCase() === 'yes');
              })
              .catch(reason => {
                console.error(
                  `Error on POST /jlab_ext_example/go_on .\n${reason}`
                );
              });
          }
        }

        // Define a regex to extract code blocks enclosed in triple backticks
        // This will also capture the language type if present
        const codeRegex = /```(\w+)?\s*([\s\S]*?)```/gs;

        requestAPI<any>('chat', {
          body: JSON.stringify({
            notebook: currentNotebookContent,
            question: question,
            videoId: videoId,
            category: category,
            segmentIndex: currentSegmentIndex,
            kernelType: kernelType,
            needHint: needHint,
            selectedChoice: selectedChoice
          }),
          method: 'POST'
        })
          .then(response => {
            // console.log(response);
            setSelectedChoice('');
            setMessages(prevMessages => [
              ...prevMessages,
              {
                message: response.message,
                sentTime: `${currentTime} seconds`,
                direction: 'incoming',
                sender: 'iTutor',
                videoId: null,
                start: null,
                end: null,
                category: null,
                interaction: response.interaction
              }
            ]);
            // Extract code blocks from the response
            let match;
            while ((match = codeRegex.exec(response.message)) !== null) {
              const code = match[2].trim();
              // console.log(code);
              if (code) {
                // setCode(code);
                const activatedNotebook = props.getCurrentNotebook();
                if (activatedNotebook) {
                  try {
                    NotebookActions.insertBelow(activatedNotebook);
                    const newCellIndex = activatedNotebook.activeCellIndex;
                    const newCell = activatedNotebook.widgets[
                      newCellIndex
                    ] as CodeCell;
                    if (newCell) {
                      newCell.model.sharedModel.setSource(code);
                      // Add unique identifier to the new cell's node
                      const uniqueID = `flash-${Date.now()}`;
                      newCell.node.id = uniqueID;

                      // Create dynamic CSS rules
                      const styleEl = document.createElement('style');
                      styleEl.innerHTML = `
                        @keyframes flashAnimation {
                          0% { background-color: yellow; }
                          100% { background-color: initial; }
                        }
                        #${uniqueID} {
                          animation: flashAnimation 1s ease;
                        }
                      `;
                      // Inject dynamic CSS into the DOM
                      document.head.appendChild(styleEl);

                      // Remove dynamic CSS and ID after 1 second
                      setTimeout(() => {
                        styleEl.remove();
                        newCell.node.id = '';
                      }, 2000);
                    }
                  } catch (error) {
                    console.error(error);
                  }
                } else {
                  console.error('No active notebook');
                }
              }
            }
            setIsTyping(false);
            // New logic to check for 'need_response'
            if (!response.need_response) {
              setTimeout(() => {
                handleSend('');
              }, 0);
            }
          })
          .catch(reason => {
            console.error(`Error on POST /jlab_ext_example/chats .\n${reason}`);
          });
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
      requestAPI<any>('go_on', {
        body: JSON.stringify({
          videoId: videoId,
          segmentIndex: currentSegmentIndex + 1
          // notebook: currentNotebookContent
        }),
        method: 'POST'
      })
        .then(response => {
          // console.log(response);
          setCanGoOn(response.toLowerCase() === 'yes');
        })
        .catch(reason => {
          console.error(`Error on POST /jlab_ext_example/go_on .\n${reason}`);
        });
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      const nextSegment = segments[currentSegmentIndex + 1];
      // console.log('nextSegment:', nextSegment);

      // After student click the "Go On" button, update the current sequence
      requestAPI<any>('update_seq', {
        body: JSON.stringify({
          videoId: videoId,
          segmentIndex: currentSegmentIndex + 1,
          category: nextSegment.category
        }),
        method: 'POST'
      })
        .then(() => {
          console.log('Update sequence successful.');
        })
        .catch(reason => {
          console.error(
            `Error on POST /jlab_ext_example/update_seq .\n${reason}`
          );
        });

      // Append the new message to the existing messages array
      setMessages(prevMessages => [
        ...prevMessages,
        {
          message: 'Now let us watch the next video segment!',
          videoId: videoId, // Assuming the videoId remains the same for all segments
          sentTime: `${nextSegment.start}`, // Segment start time
          direction: 'incoming',
          sender: 'iTutor',
          start: nextSegment.start, // Store the start and end times in the message
          end: nextSegment.end,
          category: nextSegment.category,
          interaction: null
        }
      ]);
    } else if (currentSegmentIndex < segments.length + 2) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setMessages(prevMessages => [
        ...prevMessages,
        {
          message:
            'Can you think of more tasks that are not in the video to do?',
          videoId: null,
          sentTime: 'just now',
          direction: 'incoming',
          sender: 'iTutor',
          start: null, // Store the start and end times in the message
          end: null,
          category: 'Self-exploration',
          interaction: 'plain text'
        }
      ]);
    } else {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          message: 'Could you conclude what you have learned today?',
          videoId: null,
          sentTime: 'just now',
          direction: 'incoming',
          sender: 'iTutor',
          start: null, // Store the start and end times in the message
          end: null,
          category: 'Conclusion',
          interaction: 'plain text'
        }
      ]);
    }
  };

  useEffect(() => {
    currentSegmentIndexRef.current = currentSegmentIndex;
    videoIdRef.current = videoId;
    canGoOnRef.current = canGoOn;
  }, [currentSegmentIndex, videoId, canGoOn]);

  useEffect(() => {
    // This effect runs when videoId changes
    if (videoId && isReadyToSend) {
      handleSend('');
      setNeedHint(false);
      setIsReadyToSend(false); // Reset the flag
    }
  }, [videoId, isReadyToSend, handleSend]);

  function onCellExecuted(
    sender: any,
    args: {
      notebook: Notebook;
      cell: Cell<ICellModel>;
      success: boolean;
      error?: KernelError | null | undefined;
    }
  ) {
    const executedCellContent = args.cell.model.toJSON()['source'];
    const executedCellOutput = args.cell.model.toJSON()['outputs'];
    const currentNotebookContent = JSON.stringify(
      props.getCurrentNotebookContent()
    );
    console.log(executedCellContent);
    console.log(executedCellOutput);
    // console.log(canGoOnRef.current);
    const kernel = props.getCurrentNotebookKernel();
    console.log(currentNotebookContent);
    requestAPI<any>('update_bkt', {
      body: JSON.stringify({
        // notebook: currentNotebookContent,
        cell: executedCellContent,
        output: executedCellOutput,
        question: '',
        videoId: videoIdRef.current,
        segmentIndex: currentSegmentIndexRef.current,
        kernelType: kernel.name
      }),
      method: 'POST'
    })
      .then(response => {
        // console.log(response);
        if (response) {
          console.log('video id is about:', videoId);
          // The user has fault or error in their code
          setNeedHint(true);
          // Set a flag or state to indicate readiness to send
          setIsReadyToSend(true);
        }
      })
      .catch(reason => {
        console.error(
          `Error on POST /jlab_ext_example/update_bkt .\n${reason}`
        );
      });

    if (canGoOnRef.current === false) {
      requestAPI<any>('go_on', {
        body: JSON.stringify({
          videoId: videoIdRef.current,
          segmentIndex: currentSegmentIndexRef.current
          // notebook: currentNotebookContent
        }),
        method: 'POST'
      })
        .then(response => {
          // console.log(response);
          if (response.toLowerCase() === 'yes') {
            setCanGoOn(true);
          }
          // setCanGoOn(response.toLowerCase() === 'yes');
          // console.log(canGoOnRef.current);
        })
        .catch(reason => {
          console.error(`Error on POST /jlab_ext_example/go_on .\n${reason}`);
        });
    }
    // Whatever it is ready to go on, send a new request for message
    console.log('video id is:', videoId);
    // Set a flag or state to indicate readiness to send
    setIsReadyToSend(true);
  }

  useEffect(() => {
    // Connect the signal
    NotebookActions.executed.connect(onCellExecuted);
    // Cleanup: disconnect the signal when the component is unmounted
    return () => {
      NotebookActions.executed.disconnect(onCellExecuted);
    };
  }, []);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MainContainer style={{ height: '100%', width: '100%' }}>
        <ChatContainer
          id="chatContainerId"
          style={{ height: '100%', width: '100%' }}
        >
          <MessageList
            scrollBehavior="auto"
            typingIndicator={
              isTyping ? <TypingIndicator content="iTutor is typing" /> : null
            }
            style={{ height: 'auto', width: '100%' }} // Leaving 50px for MessageInput
          >
            {messages
              .filter(
                message => message.message && message.message.trim() !== ''
              )
              .map((message, i) => {
                // Parse the message if it's a multiple-choice question
                const isMultipleChoice =
                  message.interaction === 'multiple-choice';
                const parsedMessage = isMultipleChoice
                  ? JSON.parse(message.message)
                  : null;

                return (
                  <>
                    {message.category && (
                      <MessageSeparator>{message.category}</MessageSeparator>
                    )}
                    {isMultipleChoice && parsedMessage ? (
                      // Render the multiple-choice question
                      <Box
                        sx={{
                          width: '85%',
                          padding: 2,
                          marginBottom: '20px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <FormControl component="fieldset" variant="standard">
                          <FormLabel component="legend">
                            {parsedMessage.question}
                          </FormLabel>
                          <RadioGroup
                            aria-label="multiple-choice-question"
                            name={`multiple-choice-${i}`}
                            value={selectedChoice}
                            onChange={handleRadioChange}
                          >
                            {parsedMessage.choices.map(
                              (choice: string, index: number) => (
                                <FormControlLabel
                                  key={index}
                                  value={choice}
                                  control={<Radio />}
                                  label={choice}
                                />
                              )
                            )}
                          </RadioGroup>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleSend('')}
                            disabled={!selectedChoice}
                            sx={{
                              padding: '4px 10px', // Reduces padding
                              fontSize: '0.75rem' // Reduces font size
                            }}
                          >
                            Submit
                          </Button>
                        </FormControl>
                      </Box>
                    ) : (
                      <Message
                        key={message.sentTime}
                        model={{
                          message: message.message,
                          direction: message.direction,
                          sender: message.sender,
                          sentTime: message.sentTime,
                          position: 'single'
                        }}
                      />
                    )}
                    {/* {code && (
                      <AceEditor
                        mode="r" // change this to match the language of your code
                        theme="monokai"
                        value={code}
                        name="codeEditor"
                        style={{ width: '100%', height: '200px' }}
                      />
                    )} */}
                    {message.videoId && (
                      <div
                        style={{
                          marginTop: '8px',
                          paddingBottom: isTyping ? '20px' : '10px'
                        }}
                      >
                        {popupStates[i] ? (
                          <div
                            style={backdropStyle}
                            onClick={() => closePopup(i)}
                          ></div>
                        ) : null}
                        <div
                          style={
                            popupStates[i] ? openerAboveStyle : openerBelowStyle
                          }
                          onClick={() => openPopup(i)}
                        >
                          <img
                            src={`https://img.youtube.com/vi/${message.videoId}/0.jpg`}
                            alt="YouTube Thumbnail"
                            style={{ width: '430px', height: '240px' }}
                          />
                        </div>
                        {popupStates[i] && (
                          <div style={popupStyle}>
                            <YouTube
                              key={i}
                              videoId={message.videoId}
                              opts={{
                                height: '540',
                                width: '960',
                                playerVars: {
                                  start: message.start || undefined,
                                  end: message.end || undefined,
                                  controls: 0,
                                  rel: 0
                                }
                              }}
                              onReady={handleReady}
                              onEnd={event => {
                                if (
                                  message.category !== 'Introduction' &&
                                  !isAlredaySend
                                  // && Date.now() - lastSendTime >= 60000
                                ) {
                                  setIsAlredaySend(true);
                                  handleSend('');
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })}
          </MessageList>
          <MessageInput
            placeholder="Type message here"
            attachButton={false}
            onSend={handleSend}
            style={{ maxHeight: '100px', overflowY: 'auto' }}
            disabled={isTyping} // Disable the input when isTyping is true
          />
        </ChatContainer>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setIsAlredaySend(false);
            handleGoOn();
          }}
          style={{
            position: 'absolute',
            bottom: 60, // Adjust as needed
            right: 10,
            zIndex: 19
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

  private _getCurrentNotebookKernel(): any {
    return this.notebookTracker.currentWidget?.sessionContext.session?.kernel;
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
          getCurrentNotebookKernel={this._getCurrentNotebookKernel.bind(this)}
        />
      </div>
    );
  }
}
