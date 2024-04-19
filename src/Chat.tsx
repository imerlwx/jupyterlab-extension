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
import { Button, Box, Typography } from '@mui/material';
import { ISignal, Signal } from '@lumino/signaling';
import { Cell, CodeCell, ICellModel } from '@jupyterlab/cells';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import axios from 'axios';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export interface ISegment {
  start: number;
  end: number;
  category: string;
}

interface IMessage {
  id: string;
  message: string;
  sentTime: string;
  direction: MessageDirection;
  sender: string;
  videoId: string | null;
  start: number | null;
  end: number | null;
  category: string | null;
  interaction: string | null;
  code: string | null;
}

interface ICellOutputType {
  output_type?: string;
}

export interface IVideoId {
  videoId: string;
}

interface IStatistics {
  mean: number;
  median: number;
  std: number;
}

type DataRow = Record<string, any>;

type ChatComponentProps = {
  onVideoIdChange: (videoId: IVideoId) => void;
  getCurrentNotebookContent: () => any;
  getCurrentNotebook: () => any;
  getCurrentNotebookKernel: () => any;
};

type ICellOutput = {
  ename: string;
  evalue: string;
  traceback: string[];
  output_type: string;
};

// Create a new React component for the Chat logic
const ChatComponent = (props: ChatComponentProps): JSX.Element => {
  const [player, setPlayer] = useState<any | null>(null);
  const [videoId, setVideoId] = useState('');
  const [segments, setSegments] = useState<ISegment[]>([]);
  const [messages, setMessages] = useState<IMessage[]>([
    {
      id: `msg-${Date.now()}`,
      message:
        "Welcome to today's Tidy Tuesday project! First, tell me your user id and which video you want to watch (format: video id, user id):",
      videoId: null,
      sentTime: '0 second',
      direction: 'incoming',
      sender: 'Tutorly',
      start: null,
      end: null,
      category: null,
      interaction: 'plain text',
      code: null
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
  const [errorInCode, setErrorInCode] = useState('');
  const [selectedChoice, setSelectedChoice] = React.useState('');
  const [data, setData] = useState<DataRow[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [statistics, setStatistics] = useState<IStatistics | null>(null);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [histogramData, setHistogramData] = useState<any[]>([]);
  const [codes, setCodes] = useState<{ [messageId: string]: string }>({});
  const [checkedCode, setCheckedCode] = useState<string[]>([]);
  // const [allBlanksFilled, setAllBlanksFilled] = useState<boolean>(false);
  // const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);

  // dataset url and data attributes descriptions
  const datasetUrl =
    'https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2018/2018-10-16/recent-grads.csv';
  const columnDescriptions: { [key: string]: string } = {
    Rank: 'Rank by median earnings',
    Major_code: 'Major code, FO1DP in ACS PUMS',
    Major: 'Major description',
    Major_category: 'Category of major from Carnevale et al',
    Total: 'Total number of people with major',
    Sample_size:
      'Sample size (unweighted) of full-time, year-round ONLY (used for earnings)',
    Men: 'Male graduates',
    Women: 'Female graduates',
    ShareWomen: 'Women as share of total',
    Employed: 'Number employed (ESR == 1 or 2)',
    Full_time: 'Employed 35 hours or more',
    Part_time: 'Employed less than 35 hours',
    Full_time_year_round:
      'Employed at least 50 weeks (WKW == 1) and at least 35 hours (WKHP >= 35)',
    Unemployed: 'Number unemployed (ESR == 3)',
    Unemployment_rate: 'Unemployed / (Unemployed + Employed)',
    Median: 'Median earnings of full-time, year-round workers',
    P25th: '25th percentile of earnings',
    P75th: '75th percentile of earnings',
    College_jobs: 'Number with job requiring a college degree',
    Non_college_jobs: 'Number with job not requiring a college degree',
    Low_wage_jobs: 'Number in low-wage service jobs'
  };
  const description =
    selectedColumn in columnDescriptions
      ? columnDescriptions[selectedColumn]
      : 'Description not found';

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
      console.log(errorInCode);
      if (errorInCode === '') {
        const newMessage: IMessage = {
          id: `msg-${Date.now()}`,
          message: question,
          sentTime: 'just now',
          direction: 'outgoing',
          sender: 'user',
          videoId: null,
          start: null,
          end: null,
          category: null,
          interaction: 'plain text',
          code: null
        };

        setMessages(prevMessages => [...prevMessages, newMessage]);
      } else {
        // const newMessage: IMessage = {
        //   id: `msg-${Date.now()}`,
        //   message: 'There is an error in the code. Please fix it.',
        //   sentTime: 'just now',
        //   direction: 'outgoing',
        //   sender: 'user',
        //   videoId: null,
        //   start: null,
        //   end: null,
        //   category: null,
        //   interaction: 'plain text',
        //   code: null
        // };

        // setMessages(prevMessages => [...prevMessages, newMessage]);
        setErrorInCode('');
      }

      if (videoId === '') {
        // console.log(question);
        setIsTyping(true);
        setCanGoOn(true);

        // Assuming question is a string like "openai api key, video_id, user_id"
        const parts = question.split(',').map(s => s.trim());
        // const apiKey = parts[0];
        const extractedVideoId = parts[0];
        const userId = parts.length > 1 ? parts[1] : '1'; // Fallback in case the user_id is missing

        setVideoId(extractedVideoId);
        props.onVideoIdChange({ videoId: extractedVideoId }); // Emit signal
        const kernel = props.getCurrentNotebookKernel();
        // console.log(kernel.name);
        setKernelType(kernel.name);
        requestAPI<any>('segments', {
          body: JSON.stringify({
            // apiKey: apiKey,
            videoId: extractedVideoId,
            userId: userId
          }),
          method: 'POST'
        })
          .then(response => {
            // console.log('initial response:', response);
            // const parsed = JSON.parse(response.replace(/'/g, '"'));
            setSegments(response);
            setMessages(prevMessages => [
              ...prevMessages,
              {
                id: `msg-${Date.now()}`,
                message:
                  "The video is segmented into several video clips. While you can navigate through the parts you like, I recommend following the video progress to learn and imitate his Exploratory Data Analysis process and do the task on your own.\n\nWhile watching the video, keep asking yourself these three questions: what is he doing, why is he doing it, and how will success in what he is doing help him find a solution to the problem? Now let's get started!",
                sentTime: 'just now',
                direction: 'incoming',
                sender: 'Tutorly',
                videoId: extractedVideoId,
                start: response[0].start,
                end: response[0].end,
                category: response[0].category,
                interaction: 'plain text',
                code: null
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
            selectedChoice: selectedChoice
          }),
          method: 'POST'
        })
          .then(response => {
            // console.log(response);
            // Remove code blocks from the message before setting it
            const messageWithoutCode = response.message.replace(codeRegex, '');
            // Extract code blocks from the response
            let match;
            let codeBlock: string;
            while ((match = codeRegex.exec(response.message)) !== null) {
              codeBlock = match[2].trim().replace(/\\n/g, '\n');
              // Remove the first newline character if it exists at the beginning of the string
              codeBlock = codeBlock.replace(/^\n/, '');
              // console.log(code);
              if (codeBlock) {
                // setCode(code);
                if (response.interaction === 'show-code') {
                  const activatedNotebook = props.getCurrentNotebook();
                  if (activatedNotebook) {
                    try {
                      NotebookActions.insertBelow(activatedNotebook);
                      const newCellIndex = activatedNotebook.activeCellIndex;
                      const newCell = activatedNotebook.widgets[
                        newCellIndex
                      ] as CodeCell;
                      if (newCell) {
                        newCell.model.sharedModel.setSource(codeBlock);
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
                } else {
                  // Function to show code in a pad with highlighted syntax
                }
              }
            }
            setMessages(prevMessages => [
              ...prevMessages,
              {
                id: `msg-${Date.now()}`,
                message: messageWithoutCode,
                sentTime: `${currentTime} seconds`,
                direction: 'incoming',
                sender: 'Tutorly',
                videoId: null,
                start: null,
                end: null,
                category: null,
                interaction: response.interaction,
                code: codeBlock
              }
            ]);
            setIsTyping(false);
            setSelectedChoice('');
            // New logic to check for 'need_response'
            if (!response.need_response) {
              setTimeout(() => {
                handleSend('');
              }, 0);
            }
            // setCode('');
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
      props.onVideoIdChange,
      selectedChoice,
      errorInCode
    ]
  );

  // Function to handle "Go On" button click
  const handleGoOn = () => {
    setCanGoOn(false); // Disable the button
    if (currentSegmentIndex < segments.length - 1) {
      // requestAPI<any>('go_on', {
      //   body: JSON.stringify({
      //     videoId: videoId,
      //     segmentIndex: currentSegmentIndex + 1
      //     // notebook: currentNotebookContent
      //   }),
      //   method: 'POST'
      // })
      //   .then(response => {
      //     // console.log(response);
      //     setCanGoOn(response.toLowerCase() === 'yes');
      //   })
      //   .catch(reason => {
      //     console.error(`Error on POST /jlab_ext_example/go_on .\n${reason}`);
      //   });
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
          id: `msg-${Date.now()}`,
          message: 'Now let us watch the next video segment!',
          videoId: videoId, // Assuming the videoId remains the same for all segments
          sentTime: `${nextSegment.start}`, // Segment start time
          direction: 'incoming',
          sender: 'Tutorly',
          start: nextSegment.start, // Store the start and end times in the message
          end: nextSegment.end,
          category: nextSegment.category,
          interaction: null,
          code: null
        }
      ]);
    } else if (currentSegmentIndex < segments.length + 2) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: `msg-${Date.now()}`,
          message:
            'Can you think of more tasks that are not in the video to do?',
          videoId: null,
          sentTime: 'just now',
          direction: 'incoming',
          sender: 'Tutorly',
          start: null, // Store the start and end times in the message
          end: null,
          category: 'Self-exploration',
          interaction: 'plain text',
          code: null
        }
      ]);
    } else {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: `msg-${Date.now()}`,
          message: 'Could you conclude what you have learned today?',
          videoId: null,
          sentTime: 'just now',
          direction: 'incoming',
          sender: 'Tutorly',
          start: null, // Store the start and end times in the message
          end: null,
          category: 'Conclusion',
          interaction: 'plain text',
          code: null
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
      if (errorInCode === '') {
        handleSend('');
      } else {
        handleSend(errorInCode);
      }
      setIsReadyToSend(false);
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
    const executedCellOutput = args.cell.model.toJSON()[
      'outputs'
    ] as ICellOutput[];
    const currentNotebookContent = JSON.stringify(
      props.getCurrentNotebookContent()
    );
    console.log(executedCellContent);
    console.log(executedCellOutput);
    if (executedCellOutput && executedCellOutput[0].output_type === 'error') {
      setErrorInCode(executedCellOutput[0].traceback.join('\n'));
      setIsReadyToSend(true);
    }
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

  useEffect(() => {
    axios.get(datasetUrl).then(response => {
      parseCSV(response.data, parsedData => {
        if (parsedData.length > 0) {
          const columns = Object.keys(parsedData[0]);
          console.log('Columns:', columns);
          setColumnNames(columns);
          setData(parsedData);
        }
      });
    });
  }, [datasetUrl]);

  function parseCSV(
    csvData: string,
    callback: (data: DataRow[]) => void
  ): void {
    Papa.parse(csvData, {
      header: true,
      complete: results => {
        console.log('Parsed Data:', results.data);
        callback(results.data as DataRow[]);
      },
      skipEmptyLines: true
    });
  }

  useEffect(() => {
    if (selectedColumn && data.length > 0) {
      const columnData: number[] = data
        .map(row => parseFloat(row[selectedColumn]))
        .filter(value => !isNaN(value));
      const mean =
        columnData.reduce((acc, val) => acc + val, 0) / columnData.length;
      const sortedColumnData = [...columnData].sort((a, b) => a - b);
      const mid = Math.floor(sortedColumnData.length / 2);
      const median =
        sortedColumnData.length % 2 !== 0
          ? sortedColumnData[mid]
          : (sortedColumnData[mid - 1] + sortedColumnData[mid]) / 2;
      const std = Math.sqrt(
        columnData
          .map(val => (val - mean) ** 2)
          .reduce((acc, val) => acc + val, 0) / columnData.length
      );

      setStatistics({ mean, median, std });
      console.log({ mean, median, std });
      const newHistogramData = calculateHistogramData(data, selectedColumn);
      setHistogramData(newHistogramData);
    }
  }, [selectedColumn, data]);

  const handleChange = (event: SelectChangeEvent) => {
    setSelectedColumn(event.target.value);
  };

  function calculateHistogramData(
    data: DataRow[],
    selectedColumn: string,
    bins: number = 10
  ): any[] {
    if (!data.length || !selectedColumn) {
      return [];
    }

    // Extract column values and filter out non-numeric data
    const columnData: number[] = data
      .map(row => parseFloat(row[selectedColumn]))
      .filter(value => !isNaN(value));

    const max = Math.max(...columnData);
    const min = Math.min(...columnData);
    const range = max - min;
    const binSize = range / bins;
    const histogramData = Array.from({ length: bins }, (_, i) => ({
      name: `${(min + binSize * i).toFixed(2)}-${(min + binSize * (i + 1)).toFixed(2)}`,
      value: 0
    }));

    // Count frequencies
    columnData.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
      histogramData[binIndex].value += 1;
    });

    return histogramData;
  }

  interface ICodeEditorWithBlanksProps {
    id: string;
    initialCode: string;
    code: string; // The current state of the code, managed externally
    onCodeChange: (newCode: string) => void; // Callback to update the code
    videoId: string;
    currentSegmentIndex: number;
    onReadyToSend: () => void; // Callback to notify when the code block is fully filled
  }

  interface IChoiceResponse {
    [key: string]: string[];
  }

  const handleCodeBlockReadyToSend = useCallback(() => {
    // Logic to handle sending or preparing to send the message
    handleSend('');
  }, [handleSend]);

  const CodeEditorWithBlanks: React.FC<ICodeEditorWithBlanksProps> = ({
    id,
    initialCode,
    code,
    onCodeChange,
    videoId,
    currentSegmentIndex,
    onReadyToSend
  }) => {
    const [isDropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const [commonChoices, setCommonChoices] = useState<string[]>([]);

    const videoIdRef = useRef(videoId);
    const currentSegmentIndexRef = useRef(currentSegmentIndex);

    useEffect(() => {
      videoIdRef.current = videoId;
      currentSegmentIndexRef.current = currentSegmentIndex;
    }, [videoId, currentSegmentIndex]);

    useEffect(() => {
      // Only run the check if this code block's ID hasn't been checked yet
      if (!checkedCode.includes(id)) {
        // Only run the check if all blanks haven't been confirmed as filled
        const blanksRemaining = code.includes('___');
        if (!blanksRemaining) {
          setCheckedCode(prevIds => [...prevIds, id]);
          // setAllBlanksFilled(true); // Set this to true to prevent future checks
          onReadyToSend(); // Call the parent callback instead of directly setting state
        }
      }
    }, [code, onReadyToSend, id, checkedCode]);

    useEffect(() => {
      if (videoId && currentSegmentIndex >= 0) {
        requestAPI<IChoiceResponse>('fill_blank', {
          body: JSON.stringify({
            videoId: videoIdRef.current,
            segmentIndex: currentSegmentIndexRef.current
          }),
          method: 'POST'
        })
          .then(response => {
            // console.log(response);
            if (response && Array.isArray(response)) {
              setCommonChoices(response);
            } else {
              // Handle unexpected response structure
              console.error('Unexpected response structure:', response);
            }
          })
          .catch(reason => {
            console.error(`Error on POST /fill_blank.\n${reason}`);
          });
      }
    }, [videoId, currentSegmentIndex]); // Dependencies on videoId and currentSegmentIndex to refetch when they change

    const handleCodeClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const selection: string = window.getSelection()?.toString() || '';
      if (selection === '___') {
        setDropdownOpen(true);
      } else {
        setDropdownOpen(false);
      }
    };

    const replaceBlankWithSelection = (choice: string) => {
      onCodeChange(code.replace('___', choice));
      setDropdownOpen(false); // Close the dropdown after selection
    };

    return (
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div onClick={handleCodeClick} style={{ flex: 1 }}>
          <SyntaxHighlighter language="r" style={docco}>
            {code}
          </SyntaxHighlighter>
        </div>
        {isDropdownOpen && (
          <div
            style={{
              marginLeft: '20px',
              background: 'white',
              padding: '10px',
              borderRadius: '5px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              zIndex: 1000,
              position: 'sticky',
              top: 0 // Adjust this to change the vertical alignment
            }}
          >
            {commonChoices.map((choice, index) => (
              <div
                key={index}
                onClick={() => replaceBlankWithSelection(choice)}
                style={{ padding: '5px', cursor: 'pointer' }}
              >
                {choice}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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
              isTyping ? <TypingIndicator content="Tutorly is typing" /> : null
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
                          marginBottom: '10px',
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
                            onClick={() => {
                              console.log('selected_choice:', selectedChoice);
                              handleSend('');
                            }}
                            disabled={!selectedChoice}
                            sx={{
                              padding: '4px 10px', // Reduces padding
                              fontSize: '0.75rem', // Reduces font size
                              marginTop: '8px'
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
                    {message.code && (
                      <div style={{ width: '61.8%', marginBottom: '8px' }}>
                        {message.interaction === 'fill-in-blanks' ? (
                          <CodeEditorWithBlanks
                            id={message.id}
                            initialCode={message.code}
                            code={codes[message.id] || message.code} // Use the current code from state, fallback to initial code
                            onCodeChange={newCode =>
                              setCodes(prev => ({
                                ...prev,
                                [message.id]: newCode
                              }))
                            }
                            videoId={videoId}
                            currentSegmentIndex={currentSegmentIndex}
                            onReadyToSend={handleCodeBlockReadyToSend}
                          />
                        ) : (
                          // <SyntaxHighlighter
                          //   language="r"
                          //   style={docco}
                          //   wrapLines={true}
                          //   lineProps={{
                          //     style: {
                          //       wordWrap: 'break-word',
                          //       whiteSpace: 'pre-wrap'
                          //     }
                          //   }}
                          // >
                          //   {message.code}
                          // </SyntaxHighlighter>
                          <SyntaxHighlighter
                            language="r"
                            style={docco}
                            wrapLines={true}
                            lineProps={lineNumber => ({
                              style: {
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              },
                              children: (
                                <React.Fragment>
                                  <span
                                    onClick={() =>
                                      handleSend(
                                        // eslint-disable-next-line prettier/prettier
                                        message.code!.split('\n')[lineNumber - 1]
                                      )
                                    }
                                    style={{
                                      cursor: 'pointer',
                                      marginLeft: '10px'
                                    }}
                                  >
                                    ❓
                                  </span>
                                </React.Fragment>
                              )
                            })}
                          >
                            {message.code}
                          </SyntaxHighlighter>
                        )}
                      </div>
                    )}
                    {message.interaction === 'drop-down' && (
                      <div>
                        <FormControl
                          sx={{ minWidth: 120, mt: 2, mb: 2 }}
                          size="small"
                        >
                          <InputLabel id="demo-simple-select-label">
                            Column
                          </InputLabel>
                          <Select
                            labelId="column-select-label"
                            id="column-select"
                            value={selectedColumn}
                            label="Column"
                            onChange={handleChange}
                          >
                            {columnNames.map(columnName => (
                              <MenuItem key={columnName} value={columnName}>
                                {columnName}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {statistics && (
                          <Box
                            sx={{
                              display: 'flex', // Use flex display to align items in a row
                              alignItems: 'center', // Align items vertically
                              p: 1,
                              backgroundColor: 'grey.200',
                              borderRadius: '4px',
                              width: '80%',
                              mb: 2
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6">Statistics</Typography>
                              <Typography>
                                Description: {description}
                              </Typography>
                              <Typography>
                                Mean: {statistics.mean.toFixed(2)}
                              </Typography>
                              <Typography>
                                Median: {statistics.median.toFixed(2)}
                              </Typography>
                              <Typography>
                                Standard Deviation: {statistics.std.toFixed(2)}
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 0 }}>
                              <BarChart
                                width={350}
                                height={140}
                                data={histogramData}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8884d8" />
                              </BarChart>
                            </Box>
                          </Box>
                        )}
                      </div>
                    )}
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
          const firstOutput = cell_json.outputs[0] as ICellOutputType;
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
