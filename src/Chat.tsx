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
import {
  Button,
  Box,
  Typography
  // Dialog,
  // DialogActions,
  // DialogContent,
  // DialogContentText,
  // DialogTitle,
  // TextField
} from '@mui/material';
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
import IconButton from '@mui/material/IconButton';
import HelpIcon from '@mui/icons-material/Help';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { UserIDDialog } from './UserIDDialog';

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
  const [userId, setUserId] = useState<string>('');
  const [sessionId] = useState<string>(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
  const [showUserIDDialog, setShowUserIDDialog] = useState(true);
  const [segments, setSegments] = useState<ISegment[]>([]);
  const [messages, setMessages] = useState<IMessage[]>([
    {
      id: `msg-${Date.now()}`,
      message:
        "Welcome to today's Tidy Tuesday project! Please select a video you want to watch by entering its video ID (e.g., nx5yhXAQLxw):",
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
  const [kernelType, setKernelType] = useState('ir');
  const [popupStates, setPopupStates] = useState<Record<number, boolean>>({});
  const [needHelp, setNeedHelp] = useState(false);
  const currentSegmentIndexRef = useRef(currentSegmentIndex);
  const videoIdRef = useRef(videoId);
  const canGoOnRef = useRef(canGoOn);
  const [isReadyToSend, setIsReadyToSend] = useState(false);
  const [isAlredaySend, setIsAlredaySend] = useState(false);
  const [errorInCode, setErrorInCode] = useState('');
  const [selectedChoice, setSelectedChoice] = useState('');
  const [data, setData] = useState<DataRow[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [statistics, setStatistics] = useState<IStatistics | null>(null);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [histogramData, setHistogramData] = useState<any[]>([]);
  const [codes, setCodes] = useState<{ [messageId: string]: string }>({});
  const [checkedCode, setCheckedCode] = useState<string[]>([]);

  // dataset url and data attributes descriptions
  const getDatasetInfo = (videoId: string) => {
    const datasets: {
      [key: string]: { url: string; columns: { [key: string]: string } };
    } = {
      nx5yhXAQLxw: {
        url: 'https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2018/2018-10-16/recent-grads.csv',
        columns: {
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
        }
      },
      EF4A4OtQprg: {
        url: 'https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2019/2019-03-26/seattle_pets.csv',
        columns: {
          license_issue_date: 'Date the animal was registered with Seattle',
          license_number: 'Unique license number',
          animals_name: "Animal's name",
          species: "Animal's species (dog, cat, goat, etc)",
          primary_breed: 'Primary breed of the animal',
          secondary_breed: 'Secondary breed if mixed',
          zip_code: 'Zip code animal registered under'
        }
      },
      '1xsbTs9-a50': {
        url: 'https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2019/2019-07-02/media_franchises.csv',
        columns: {
          franchise: 'Franchise name',
          revenue_category: 'Revenue category',
          revenue: 'Revenue generated per category (in billions)',
          year_created: 'Year created',
          original_media: 'Original source of the franchise',
          creators: 'Creators of the franchise',
          owners: 'Current owners of the franchise'
        }
      },
      '1x8Kpyndss': {
        url: 'https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2020/2020-07-07/coffee_ratings.csv',
        columns: {
          total_cup_points: 'Total rating/points (0 - 100 scale)',
          species: 'Species of coffee bean (arabica or robusta)',
          owner: 'Owner of the farm',
          country_of_origin: 'Where the bean came from',
          farm_name: 'Name of the farm',
          lot_number: 'Lot number of the beans tested',
          mill: 'Mill where the beans were processed',
          ico_number: 'International Coffee Organization number',
          company: 'Company name',
          altitude: 'Altitude - this is a messy column',
          region: 'Region where bean came from',
          producer: 'Producer of the roasted bean',
          number_of_bags: 'Number of bags tested',
          bag_weight: 'Bag weight tested',
          in_country_partner: 'Partner for the country',
          harvest_year: 'When the beans were harvested (year)',
          grading_date: 'When the beans were graded',
          owner_1: 'Who owns the beans',
          variety: 'Variety of the beans',
          processing_method: 'Method for processing',
          aroma: 'Aroma grade',
          flavor: 'Flavor grade',
          aftertaste: 'Aftertaste grade',
          acidity: 'Acidity grade',
          body: 'Body grade',
          balance: 'Balance grade',
          uniformity: 'Uniformity grade',
          clean_cup: 'Clean cup grade',
          sweetness: 'Sweetness grade',
          cupper_points: 'Cupper Points',
          moisture: 'Moisture Grade',
          category_one_defects: 'Category one defects (count)',
          quakers: 'Quakers',
          color: 'Color of bean',
          category_two_defects: 'Category two defects (count)',
          expiration: 'Expiration date of the beans',
          certification_body: 'Who certified it',
          certification_address: 'Certification body address',
          certification_contact: 'Certification contact',
          unit_of_measurement: 'Unit of measurement',
          altitude_low_meters: 'Altitude low meters',
          altitude_high_meters: 'Altitude high meters',
          altitude_mean_meters: 'Altitude mean meters'
        }
      }
    };

    return datasets[videoId] || { url: '', columns: {} };
  };

  const datasetInfo = getDatasetInfo(videoId);
  const datasetUrl = datasetInfo.url;
  const columnDescriptions = datasetInfo.columns;

  // const datasetUrl =
  //   'https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2018/2018-10-16/recent-grads.csv';
  // const columnDescriptions: { [key: string]: string } = {
  //   Rank: 'Rank by median earnings',
  //   Major_code: 'Major code, FO1DP in ACS PUMS',
  //   Major: 'Major description',
  //   Major_category: 'Category of major from Carnevale et al',
  //   Total: 'Total number of people with major',
  //   Sample_size:
  //     'Sample size (unweighted) of full-time, year-round ONLY (used for earnings)',
  //   Men: 'Male graduates',
  //   Women: 'Female graduates',
  //   ShareWomen: 'Women as share of total',
  //   Employed: 'Number employed (ESR == 1 or 2)',
  //   Full_time: 'Employed 35 hours or more',
  //   Part_time: 'Employed less than 35 hours',
  //   Full_time_year_round:
  //     'Employed at least 50 weeks (WKW == 1) and at least 35 hours (WKHP >= 35)',
  //   Unemployed: 'Number unemployed (ESR == 3)',
  //   Unemployment_rate: 'Unemployed / (Unemployed + Employed)',
  //   Median: 'Median earnings of full-time, year-round workers',
  //   P25th: '25th percentile of earnings',
  //   P75th: '75th percentile of earnings',
  //   College_jobs: 'Number with job requiring a college degree',
  //   Non_college_jobs: 'Number with job not requiring a college degree',
  //   Low_wage_jobs: 'Number in low-wage service jobs'
  // };
  const description =
    selectedColumn in columnDescriptions
      ? columnDescriptions[selectedColumn]
      : 'Description not found';

  const initializeChat = useCallback(
    async (videoId: string, userId: string) => {
      props.onVideoIdChange({ videoId });
      // const kernel = props.getCurrentNotebookKernel();
      // setKernelType(kernel.name);
      setKernelType('ir');
      requestAPI<any>('segments', {
        body: JSON.stringify({
          videoId,
          userId,
          sessionId: sessionId
        }),
        method: 'POST'
      })
        .then(response => {
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
              videoId,
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
    },
    [props, setSegments, setMessages, setIsTyping]
  );

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
      question = stripHTMLTags(question);
      if (errorInCode === '' && needHelp === false) {
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
        setErrorInCode('');
        setNeedHelp(false);
      }

      if (videoId === '') {
        setIsTyping(true);
        setCanGoOn(true);

        const extractedVideoId = question.trim();
        setVideoId(extractedVideoId);
        initializeChat(extractedVideoId, userId);
      } else {
        setIsTyping(true);
        const currentNotebookContent = JSON.stringify(
          props.getCurrentNotebookContent()
        );
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
        if (selectedChoice !== '') {
          requestAPI<any>('update_bkt', {
            body: JSON.stringify({
              initialCode: '',
              filledCode: '',
              selectedChoice: selectedChoice,
              videoId: videoIdRef.current,
              segmentIndex: currentSegmentIndexRef.current,
              userId: userId,
              sessionId: sessionId
            }),
            method: 'POST'
          })
            .then(response => {
              console.log(response);
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
              }),
              method: 'POST'
            })
              .then(response => {
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
            selectedChoice: selectedChoice,
            userId: userId,
            sessionId: sessionId
          }),
          method: 'POST'
        })
          .then(response => {
            // Remove code blocks from the message before setting it
            const messageWithoutCode = response.message.replace(codeRegex, '');
            // Extract code blocks from the response
            let match;
            let codeBlock: string;
            while ((match = codeRegex.exec(response.message)) !== null) {
              codeBlock = match[2].trim().replace(/\\n/g, '\n');
              // Remove the first newline character if it exists at the beginning of the string
              codeBlock = codeBlock.replace(/^\n/, '');
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
      errorInCode,
      initializeChat
    ]
  );

  // Function to handle "Go On" button click
  const handleGoOn = () => {
    setCanGoOn(false); // Disable the button
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      const nextSegment = segments[currentSegmentIndex + 1];

      // After student click the "Go On" button, update the current sequence
      requestAPI<any>('update_seq', {
        body: JSON.stringify({
          videoId: videoId,
          segmentIndex: currentSegmentIndex + 1,
          category: nextSegment.category,
          userId: userId,
          sessionId: sessionId
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
    // const executedCellContent = args.cell.model.toJSON()['source'];
    const executedCellContent = args.cell.model.toJSON()['source'] as string;
    const cellType = args.cell.model.type;
    const executedCellOutput = args.cell.model.toJSON()[
      'outputs'
    ] as ICellOutput[];
    // if (executedCellOutput && executedCellOutput[0].output_type === 'error') {
    //   setErrorInCode(executedCellOutput[0].traceback.join('\n'));
    //   setIsReadyToSend(true);
    // Determine execution status and extract output/error
    let executionStatus = 'success';
    let outputText = null;
    let errorText = null;

    if (executedCellOutput && executedCellOutput[0]) {
      if (executedCellOutput[0].output_type === 'error') {
        executionStatus = 'error';
        errorText = executedCellOutput[0].traceback.join('\n');
        setErrorInCode(errorText);
        setIsReadyToSend(true);
      } else if (
        executedCellOutput[0].output_type === 'stream' ||
        executedCellOutput[0].output_type === 'execute_result'
      ) {
        outputText = JSON.stringify(executedCellOutput[0]);
      }
    }

    requestAPI<any>('log_code_execution', {
      body: JSON.stringify({
        userId: userId,
        sessionId: sessionId,
        code: executedCellContent,
        cellType: cellType,
        status: executionStatus,
        output: outputText,
        error: errorText,
        videoId: videoId,
        segmentIndex: currentSegmentIndex
      }),
      method: 'POST'
    }).catch(err => {
      console.error('Failed to log code execution:', err);
    });

    if (canGoOnRef.current === false) {
      requestAPI<any>('go_on', {
        body: JSON.stringify({
          videoId: videoIdRef.current,
          segmentIndex: currentSegmentIndexRef.current
        }),
        method: 'POST'
      })
        .then(response => {
          if (response.toLowerCase() === 'yes') {
            setCanGoOn(true);
          }
        })
        .catch(reason => {
          console.error(`Error on POST /jlab_ext_example/go_on .\n${reason}`);
        });
    }
    // Whatever it is ready to go on, send a new request for message
    // Set a flag or state to indicate readiness to send
    // setIsReadyToSend(true);
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
          requestAPI<any>('update_bkt', {
            body: JSON.stringify({
              initialCode: initialCode,
              filledCode: code,
              selectedChoice: '',
              videoId: videoIdRef.current,
              segmentIndex: currentSegmentIndexRef.current,
              userId: userId,
              sessionId: sessionId
            }),
            method: 'POST'
          })
            .then(response => {
              console.log(response);
            })
            .catch(reason => {
              console.error(
                `Error on POST /jlab_ext_example/update_bkt .\n${reason}`
              );
            });
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

  // Props for the MessageComponent
  interface IMessageComponentProps {
    message: IMessage;
    handleSend: (text: string) => void; // Assuming handleSend takes a string argument and returns void
  }

  function MessageComponent({ message, handleSend }: IMessageComponentProps) {
    const [isHovering, setIsHovering] = React.useState(false);

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    const containerStyle: CSSProperties = {
      display: 'flex',
      cursor: 'pointer'
    };

    const messageStyle: CSSProperties = {
      flex: '0 1 85%', // flex shorthand for: flex-grow, flex-shrink, flex-basis
      marginRight: 'auto',
      marginBottom: '5px'
    };

    const actionBarStyle: CSSProperties = {
      flex: '0 1 15%', // The action bar will take the remaining space
      display: isHovering ? 'flex' : 'none', // Only show the action bar when hovering
      justifyContent: 'flex-end' // Align buttons to the right
    };

    // Render based on message direction
    if (message.direction === 'incoming') {
      return (
        <div
          className="message-container"
          style={containerStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="message-content" style={messageStyle}>
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
          </div>
          <div className="message-actions" style={actionBarStyle}>
            <IconButton
              title="continue"
              onClick={() => handleSend('')}
              size="small"
            >
              <ArrowForwardIosIcon />
            </IconButton>
            <IconButton
              title="explain more"
              onClick={() => {
                setNeedHelp(true);
                handleSend('explain this in more detail: ' + message.message);
              }}
              size="small"
            >
              <HelpIcon />
            </IconButton>
          </div>
        </div>
      );
    } else {
      return (
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
      );
    }
  }

  const handleUserIDSubmit = (
    submittedUserId: string,
    selectedVideoId: string
  ) => {
    setUserId(submittedUserId);
    setVideoId(selectedVideoId);
    setShowUserIDDialog(false);
    initializeChat(selectedVideoId, submittedUserId);
    console.log(
      `User ID set: ${submittedUserId}, Video ID: ${selectedVideoId}, Session ID: ${sessionId}`
    );
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <UserIDDialog open={showUserIDDialog} onSubmit={handleUserIDSubmit} />
      <MainContainer style={{ height: '100%', width: '100%' }}>
        {/* <ModalComponent isOpen={isModalOpen} onClose={handleModalClose} /> */}
        <ChatContainer
          id="chatContainerId"
          style={{ height: '100%', width: '100%' }}
        >
          <MessageList
            scrollBehavior="auto"
            typingIndicator={
              isTyping ? <TypingIndicator content="Tutorly is typing" /> : null
            }
            style={{
              height: 'calc(100% - 45px)', // Adjusts the height, assuming 45px for MessageInput
              width: '100%',
              paddingBottom: '30px' // Add bottom padding to account for the typing indicator
            }}
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
                      <MessageComponent
                        key={message.id} // Make sure each message has a unique key
                        message={message}
                        handleSend={handleSend}
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
            style={{
              maxHeight: '100px',
              overflowY: 'auto'
            }}
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
