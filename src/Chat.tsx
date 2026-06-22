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
// import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
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
// react-syntax-highlighter is no longer used: code blocks now render as
// flat <pre> with our own monospace styling so blanks and per-line ask
// buttons can be real React components.
import axios from 'axios';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Select, { SelectChangeEvent } from '@mui/material/Select';
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
  posttestQuestionnaireId?: number;
  posttestUrl?: string;
  posttestConfirmed?: boolean;
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
  const USE_RANDOM_VIDEO_ASSIGNMENT = true;
  const VIDEO_LABELS: Record<string, string> = {
    EF4A4OtQprg: 'Seattle Pet Names',
    '1xsbTs9-a50': 'Franchise Revenue',
    '-1x8Kpyndss': 'Coffee Ratings'
  };

  const PRETEST_QUALTRICS_URL =
    'https://stanforduniversity.qualtrics.com/jfe/form/SV_5sEuT23Z0EFjXBY';
  const POSTTEST_QUALTRICS_URLS: Record<number, string> = {
    1: 'https://stanforduniversity.qualtrics.com/jfe/form/SV_3CB4p2UZ6anRHTg',
    2: 'https://stanforduniversity.qualtrics.com/jfe/form/SV_3WSu6Jb2vlggT0q',
    3: 'https://stanforduniversity.qualtrics.com/jfe/form/SV_0OK5PJxoIQUFbnw'
  };

  const [player, setPlayer] = useState<any | null>(null);
  const [videoId, setVideoId] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [sessionId] = useState<string>(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
  const [showUserIDDialog, setShowUserIDDialog] = useState(true);
  const [userCondition, setUserCondition] = useState<string>('');
  const [segments, setSegments] = useState<ISegment[]>([]);
  const [messages, setMessages] = useState<IMessage[]>([
    {
      id: `msg-${Date.now()}`,
      message: "Welcome to today's Tidy Tuesday project!",
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
  // Tracks the latest incoming message's need_response flag.
  //   false → it's a read-only message; the docked button shows "Next
  //           message" enabled, and the student clicks when ready.
  //   true  → the message has an interaction widget; the button is
  //           disabled until the widget's own submission auto-advances.
  //   null  → between sends, waiting for the server to respond.
  const [lastNeedResponse, setLastNeedResponse] = useState<boolean | null>(
    null
  );
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  // const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [kernelType, setKernelType] = useState('ir');
  const [popupStates, setPopupStates] = useState<Record<number, boolean>>({});
  const [needHelp, setNeedHelp] = useState(false);
  const currentSegmentIndexRef = useRef(currentSegmentIndex);
  const videoIdRef = useRef(videoId);
  const canGoOnRef = useRef(canGoOn);
  // Mirror userId in a ref so callbacks captured by handleSend / initializeChat
  // (whose closures don't include userId) can still read the fresh value
  // after handleUserIDSubmit has setUserId'd.
  const userIdRef = useRef<string>('');
  // Mirror segments so handleSend can read the current list even when it's
  // invoked from a stale closure (e.g. the test-mode auto-fire scheduled
  // inside initializeChat, whose useCallback captured an empty segments[]).
  const segmentsRef = useRef<ISegment[]>([]);
  // Guard so the test-mode auto-fire runs at most once per segment, even if
  // initializeChat / handleGoOn somehow run twice — prevents draining the
  // freshly-built CUR_SEQ with repeated handleSend('') calls.
  const autoFiredSegmentRef = useRef<number>(-1);
  const [isReadyToSend, setIsReadyToSend] = useState(false);
  const [isAlredaySend, setIsAlredaySend] = useState(false);
  const [errorInCode, setErrorInCode] = useState('');
  const [selectedChoice, setSelectedChoice] = useState('');
  const [answeredQuestions, setAnsweredQuestions] = useState<
    Record<string, string>
  >({});
  const [data, setData] = useState<DataRow[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [statistics, setStatistics] = useState<IStatistics | null>(null);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [histogramData, setHistogramData] = useState<any[]>([]);
  const [codes, setCodes] = useState<{ [messageId: string]: string }>({});
  const [checkedCode, setCheckedCode] = useState<string[]>([]);
  const [posttestPromptedVideos, setPosttestPromptedVideos] = useState<
    Record<string, boolean>
  >({});
  const [lastSegmentWatched, setLastSegmentWatched] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);

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
      '-1x8Kpyndss': {
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
          // Build CUR_SEQ for segment 0 too — handleGoOn only runs when
          // advancing, so without this the first segment has no teaching
          // sequence and onEnd lands on the empty-CUR_SEQ fallback.
          requestAPI<any>('update_seq', {
            body: JSON.stringify({
              videoId,
              segmentIndex: 0,
              category: response[0].category,
              userId,
              sessionId: sessionId
            }),
            method: 'POST'
          })
            .then(() => {
              // Test-mode shortcut: skip the watch-the-video wait and
              // fire the first chat message immediately so the
              // "Next message" button becomes usable right away.
              // We sync the refs synchronously here because handleSend's
              // closure (captured at first render with empty state) reads
              // userId/videoId from these refs.
              if (
                userId.startsWith('test_') &&
                autoFiredSegmentRef.current !== 0
              ) {
                autoFiredSegmentRef.current = 0;
                userIdRef.current = userId;
                videoIdRef.current = videoId;
                setIsAlredaySend(true);
                setTimeout(() => handleSend(''), 150);
              }
            })
            .catch(reason => {
              console.error(
                `Error on POST /jlab_ext_example/update_seq (segment 0).\n${reason}`
              );
            });
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

  // Format a segment's length (from its start/end seconds) as a short,
  // human-readable duration for the video card.
  function formatSegmentDuration(
    start: number | null,
    end: number | null
  ): string | null {
    if (start == null || end == null) {
      return null;
    }
    const total = Math.max(0, Math.round(end - start));
    const m = Math.floor(total / 60);
    const s = total % 60;
    if (m === 0) {
      return `${s} sec`;
    }
    if (s === 0) {
      return `${m} min`;
    }
    return `${m} min ${s} sec`;
  }

  const handleSend = useCallback(
    async (
      question: string,
      opts?: { articulationAnswer?: string; displayText?: string }
    ) => {
      question = stripHTMLTags(question);
      const articulationAnswer = opts?.articulationAnswer ?? '';
      const displayText = opts?.displayText;
      if (errorInCode === '' && needHelp === false) {
        const outgoingText = displayText ?? question;
        if (outgoingText) {
          const newMessage: IMessage = {
            id: `msg-${Date.now()}`,
            message: outgoingText,
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
        }
      } else {
        setErrorInCode('');
        setNeedHelp(false);
      }

      // Use videoIdRef rather than the closure variable so the
      // test-mode auto-fire (which can race with setVideoId's state
      // propagation) doesn't mistake an already-set videoId for an
      // empty one and re-trigger initializeChat with a blank string.
      const currentVideoId = videoIdRef.current || videoId;
      if (currentVideoId === '') {
        setIsTyping(true);
        setCanGoOn(true);

        const extractedVideoId = question.trim();
        if (!extractedVideoId) {
          // No videoId in state and nothing to extract from the input —
          // ignore this stray send rather than firing initializeChat with
          // an empty string (which crashes /segments downstream).
          setIsTyping(false);
          return;
        }
        setVideoId(extractedVideoId);
        initializeChat(extractedVideoId, userId);
      } else {
        setIsTyping(true);
        // Disable the docked button while a response is in flight.
        setLastNeedResponse(null);
        const currentNotebookContent = JSON.stringify(
          props.getCurrentNotebookContent()
        );
        const currentTime = player ? Math.round(player.getCurrentTime()) : 0;

        // Read segment index + list from refs so a stale closure (e.g. the
        // test-mode auto-fire scheduled in initializeChat, which captured an
        // empty segments[]) still computes the correct category. Without
        // this, segment 0 ("Understand the dataset" in some videos) gets a
        // wrong category and the first teaching message never fires.
        const segIdxForCategory = currentSegmentIndexRef.current;
        const segsForCategory = segmentsRef.current;
        let category = '';
        if (segIdxForCategory < segsForCategory.length) {
          category = segsForCategory[segIdxForCategory].category;
        } else if (segIdxForCategory < segsForCategory.length + 2) {
          category = 'Self-exploration';
        } else {
          category = 'Conclusion';
        }

        // Use ref values for userId/videoId/segmentIndex so that callers
        // who invoke handleSend via a setTimeout (test-mode auto-fire,
        // for example) see the post-handleUserIDSubmit values rather than
        // the empty initial closure values.
        const effectiveUserId = userIdRef.current || userId;
        const effectiveVideoId = videoIdRef.current || videoId;
        const effectiveSegIdx = currentSegmentIndexRef.current;

        // Update bkt when student has typed something in the chatbox
        if (selectedChoice !== '') {
          requestAPI<any>('update_bkt', {
            body: JSON.stringify({
              initialCode: '',
              filledCode: '',
              selectedChoice: selectedChoice,
              videoId: effectiveVideoId,
              segmentIndex: effectiveSegIdx,
              userId: effectiveUserId,
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

        // Go-On is now gated purely by whether CUR_SEQ is empty (which is
        // what /go_on checks). No per-category overrides: a segment can
        // only be advanced past once all its teaching methods have fired.
        if (canGoOnRef.current === false) {
          requestAPI<any>('go_on', {
            body: JSON.stringify({
              videoId: effectiveVideoId,
              segmentIndex: effectiveSegIdx,
              userId: effectiveUserId
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

        // Define a regex to extract code blocks enclosed in triple backticks
        // This will also capture the language type if present
        const codeRegex = /```(\w+)?\s*([\s\S]*?)```/gs;

        requestAPI<any>('chat', {
          body: JSON.stringify({
            notebook: currentNotebookContent,
            question: question,
            videoId: effectiveVideoId,
            category: category,
            segmentIndex: effectiveSegIdx,
            kernelType: kernelType,
            selectedChoice: selectedChoice,
            articulationAnswer: articulationAnswer,
            userId: effectiveUserId,
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
            // Record whether the user must click "Next message" themselves
            // (need_response=false → wait for click) or whether the next
            // chat call will be triggered by an interactive widget's
            // submission (need_response=true → button stays disabled).
            setLastNeedResponse(
              response.need_response === undefined
                ? null
                : !!response.need_response
            );
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
          // Test-mode shortcut: bypass the video-watch step and fire
          // the first chat message of the new segment immediately so
          // the "Next message" button becomes usable without waiting.
          // Sync refs synchronously — handleSend reads from them.
          const nextIdx = currentSegmentIndex + 1;
          if (
            userId.startsWith('test_') &&
            autoFiredSegmentRef.current !== nextIdx
          ) {
            autoFiredSegmentRef.current = nextIdx;
            userIdRef.current = userId;
            videoIdRef.current = videoId;
            currentSegmentIndexRef.current = nextIdx;
            setIsAlredaySend(true);
            setTimeout(() => handleSend(''), 150);
          }
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

  const handleFinishVideo = () => {
    if (videoFinished) {
      return;
    }
    setVideoFinished(true);
    requestAPI<any>('mark_video_finished', {
      body: JSON.stringify({
        userId: userId,
        videoId: videoId
      }),
      method: 'POST'
    })
      .then(() => {
        void maybePromptPosttest(videoId);
      })
      .catch(err => {
        console.error('Failed to record finished video:', err);
      });
  };

  useEffect(() => {
    currentSegmentIndexRef.current = currentSegmentIndex;
    videoIdRef.current = videoId;
    canGoOnRef.current = canGoOn;
    userIdRef.current = userId;
    segmentsRef.current = segments;
  }, [currentSegmentIndex, videoId, canGoOn, userId, segments]);

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

    // onCellExecuted is connected once in a useEffect with [] deps, so its
    // closure permanently captures the first-render state. Read live
    // values from refs so we never POST with stale empty userId/videoId
    // (which would route the request to the "unknown" session and corrupt
    // both the log and the /go_on signal).
    const liveUserId = userIdRef.current || userId;
    const liveVideoId = videoIdRef.current || videoId;
    const liveSegIdx = currentSegmentIndexRef.current;

    requestAPI<any>('log_code_execution', {
      body: JSON.stringify({
        userId: liveUserId,
        sessionId: sessionId,
        code: executedCellContent,
        cellType: cellType,
        status: executionStatus,
        output: outputText,
        error: errorText,
        videoId: liveVideoId,
        segmentIndex: liveSegIdx
      }),
      method: 'POST'
    }).catch(err => {
      console.error('Failed to log code execution:', err);
    });

    if (canGoOnRef.current === false) {
      requestAPI<any>('go_on', {
        body: JSON.stringify({
          videoId: liveVideoId,
          segmentIndex: liveSegIdx,
          userId: liveUserId
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
          // Only keep columns that are numeric for at least half their rows,
          // so the dropdown hides categorical / text columns the histogram
          // and statistics block can't visualize.
          const sampleSize = Math.min(parsedData.length, 50);
          const numericColumns = columns.filter(col => {
            let numericCount = 0;
            for (let i = 0; i < sampleSize; i++) {
              const v = parsedData[i][col];
              if (v !== '' && v !== null && !isNaN(parseFloat(v as string))) {
                numericCount++;
              }
            }
            return numericCount / sampleSize >= 0.5;
          });
          setColumnNames(numericColumns);
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

      // Categorical / text column: nothing numeric to summarize. Clear state
      // so the UI shows a friendly note instead of crashing on undefined
      // median.toFixed.
      if (columnData.length === 0) {
        setStatistics(null);
        setHistogramData([]);
        return;
      }

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
    const [commonChoices, setCommonChoices] = useState<string[]>([]);
    // Open menu state: which blank's button is currently anchoring the menu.
    // `el` is used as the MUI Menu's anchorEl so the menu sits right under
    // the clicked button.
    const [menuAnchor, setMenuAnchor] = useState<{
      el: HTMLElement;
      blankIdx: number;
    } | null>(null);

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

    const handleSelectChoice = (choice: string) => {
      if (menuAnchor === null) {
        return;
      }
      const targetIdx = menuAnchor.blankIdx;
      let count = -1;
      const newCode = code.replace(/___/g, match => {
        count++;
        return count === targetIdx ? choice : match;
      });
      onCodeChange(newCode);
      setMenuAnchor(null);
    };

    // Split the code on the placeholder. The capturing group keeps the
    // placeholders themselves in the array so we can render each one as
    // an interactive button without losing positions in the surrounding
    // monospace text.
    const parts = code.split(/(___)/);
    let blankCounter = -1;

    return (
      <>
        <pre
          style={{
            margin: 0,
            padding: '12px 14px',
            background: '#f6f8fa',
            border: '1px solid #e1e4e8',
            borderRadius: '6px',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: '#24292f'
          }}
        >
          {parts.map((part, i) => {
            if (part === '___') {
              blankCounter += 1;
              const myIdx = blankCounter;
              return (
                <Button
                  key={`b-${i}`}
                  size="small"
                  variant="outlined"
                  onClick={e =>
                    setMenuAnchor({
                      el: e.currentTarget,
                      blankIdx: myIdx
                    })
                  }
                  sx={{
                    minWidth: 0,
                    padding: '0 6px',
                    margin: '0 2px',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 1.2,
                    textTransform: 'none',
                    color: '#0969da',
                    borderColor: '#0969da',
                    background: 'white',
                    '&:hover': { background: '#ddf4ff' }
                  }}
                >
                  ___
                </Button>
              );
            }
            return <span key={`t-${i}`}>{part}</span>;
          })}
        </pre>
        <Menu
          anchorEl={menuAnchor?.el ?? null}
          open={menuAnchor !== null}
          onClose={() => setMenuAnchor(null)}
          MenuListProps={{ dense: true }}
        >
          {commonChoices.length === 0 ? (
            <MenuItem disabled>(loading choices…)</MenuItem>
          ) : (
            commonChoices.map((choice, index) => (
              <MenuItem
                key={index}
                onClick={() => handleSelectChoice(choice)}
                sx={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  fontSize: '0.85rem'
                }}
              >
                {choice}
              </MenuItem>
            ))
          )}
        </Menu>
      </>
    );
  };

  // Structured-text articulation input: a guided multi-slot textarea form.
  interface IStructuredTextInputProps {
    messageId: string;
    intro: string;
    slots: string[];
    onSubmit: (combined: string) => void;
    isSubmitted: boolean;
    submittedValue?: string;
  }

  const StructuredTextInput: React.FC<IStructuredTextInputProps> = ({
    intro,
    slots,
    onSubmit,
    isSubmitted,
    submittedValue
  }) => {
    const [values, setValues] = useState<string[]>(() => slots.map(() => ''));
    const allEmpty = values.every(v => !v.trim());
    return (
      <Box
        sx={{
          width: '85%',
          padding: '14px 16px',
          marginBottom: '10px',
          boxSizing: 'border-box',
          backgroundColor: '#f7f9fc',
          border: '1px solid #e1e4e8',
          borderRadius: '10px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}
      >
        {intro && (
          <Typography
            sx={{
              fontWeight: 600,
              color: '#24292f',
              marginBottom: '10px',
              fontSize: '0.9rem'
            }}
          >
            {intro}
          </Typography>
        )}
        {slots.map((slot, idx) => (
          <Box key={idx} sx={{ marginBottom: '8px' }}>
            <Typography
              sx={{
                fontSize: '0.78rem',
                color: '#57606a',
                marginBottom: '2px',
                fontWeight: 500
              }}
            >
              {slot}
            </Typography>
            <textarea
              value={isSubmitted ? '' : values[idx]}
              onChange={e =>
                setValues(v =>
                  v.map((x, i) => (i === idx ? e.target.value : x))
                )
              }
              disabled={isSubmitted}
              placeholder="Write your thoughts here…"
              rows={2}
              style={{
                width: '100%',
                resize: 'vertical',
                padding: '6px 8px',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                background: isSubmitted ? '#f6f8fa' : 'white',
                boxSizing: 'border-box'
              }}
            />
          </Box>
        ))}
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            if (isSubmitted || allEmpty) {
              return;
            }
            const combined = slots
              .map((s, i) => `${s}: ${values[i].trim()}`)
              .filter((line, i) => values[i].trim() !== '')
              .join('\n\n');
            onSubmit(combined);
          }}
          disabled={isSubmitted || allEmpty}
          sx={{
            padding: '6px 14px',
            fontSize: '0.8rem',
            marginTop: '6px',
            textTransform: 'none',
            borderRadius: '6px'
          }}
        >
          {isSubmitted ? 'Submitted' : 'Submit'}
        </Button>
        {isSubmitted && submittedValue && (
          <Box
            sx={{
              marginTop: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: '#eef2f7',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap'
            }}
          >
            {submittedValue}
          </Box>
        )}
      </Box>
    );
  };

  // Compare-with-expert Reflection card. The Articulation that precedes
  // this is now a single open question, so the expert answer + one
  // feedback line is enough — much lighter than the prior 3-field
  // similarity/difference/suggestion layout. Older payloads with the
  // 3-field shape still render (backward-compat).
  interface ICompareWithExpertProps {
    studentAnswer: string;
    expertAnswer: string;
    feedback?: string;
    similarity?: string;
    difference?: string;
    suggestion?: string;
  }

  const CompareWithExpert: React.FC<ICompareWithExpertProps> = ({
    expertAnswer,
    feedback,
    similarity,
    difference,
    suggestion
  }) => {
    const hasLegacyFields = !!(similarity || difference || suggestion);
    return (
      <Box
        sx={{
          width: '85%',
          padding: '14px 16px',
          marginBottom: '10px',
          boxSizing: 'border-box',
          backgroundColor: '#f7f9fc',
          border: '1px solid #e1e4e8',
          borderRadius: '10px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            background: '#e6f4ea',
            border: '1px solid #b7e1c1',
            fontSize: '0.85rem',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.4
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: '4px',
              color: '#2f6a3b'
            }}
          >
            Expert interpretation
          </div>
          {expertAnswer || '(unavailable)'}
        </div>
        {feedback && (
          <Box
            sx={{
              marginTop: '10px',
              padding: '8px 10px',
              borderRadius: '6px',
              background: '#fff8e1',
              border: '1px solid #ffe3a3',
              fontSize: '0.85rem',
              color: '#24292f',
              lineHeight: 1.4
            }}
          >
            <strong>Feedback:</strong> {feedback}
          </Box>
        )}
        {!feedback && hasLegacyFields && (
          <Box sx={{ marginTop: '10px', fontSize: '0.85rem' }}>
            {similarity && (
              <div style={{ marginBottom: '4px' }}>
                <strong>What you got right:</strong> {similarity}
              </div>
            )}
            {difference && (
              <div style={{ marginBottom: '4px' }}>
                <strong>What to refine:</strong> {difference}
              </div>
            )}
            {suggestion && (
              <div>
                <strong>Try next:</strong> {suggestion}
              </div>
            )}
          </Box>
        )}
      </Box>
    );
  };

  // "Expert reading" card used by the Modeling move. Surfaces the hidden
  // interpretation process the video tutor doesn't narrate: where the
  // expert looks, what they compare, and what they notice. The conclusion
  // ("What this tells us") starts hidden so the student has a moment to
  // mentally fill it in from what they just saw in the video before
  // confirming. Modeling does NOT update BKT — this is teaching, not
  // assessment.
  interface IExpertReadingProps {
    whereToLook: string;
    whatToCompare: string;
    whatToNotice: string;
  }

  const ExpertReading: React.FC<IExpertReadingProps> = ({
    whereToLook,
    whatToCompare,
    whatToNotice
  }) => {
    const [revealed, setRevealed] = useState<boolean>(false);
    const rowStyle: CSSProperties = {
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-start',
      marginBottom: '10px'
    };
    const iconStyle: CSSProperties = {
      fontSize: '1rem',
      lineHeight: '1.2',
      flex: '0 0 auto',
      width: '20px',
      textAlign: 'center'
    };
    const labelStyle: CSSProperties = {
      fontSize: '0.72rem',
      color: '#57606a',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      marginBottom: '2px'
    };
    const bodyStyle: CSSProperties = {
      fontSize: '0.85rem',
      color: '#24292f',
      lineHeight: 1.4
    };
    return (
      <Box
        sx={{
          width: '85%',
          padding: '14px 16px',
          marginBottom: '10px',
          boxSizing: 'border-box',
          backgroundColor: '#f7f9fc',
          border: '1px solid #e1e4e8',
          borderRadius: '10px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}
      >
        <Typography
          sx={{
            fontWeight: 600,
            color: '#24292f',
            marginBottom: '12px',
            fontSize: '0.9rem'
          }}
        >
          How the expert reads this
        </Typography>
        <div style={rowStyle}>
          <span style={iconStyle}>👁</span>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Where to look</div>
            <div style={bodyStyle}>{whereToLook || '(unavailable)'}</div>
          </div>
        </div>
        <div style={rowStyle}>
          <span style={iconStyle}>⚖</span>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>What to compare</div>
            <div style={bodyStyle}>{whatToCompare || '(unavailable)'}</div>
          </div>
        </div>
        <div style={{ ...rowStyle, marginBottom: 0 }}>
          <span style={iconStyle}>💡</span>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>What this tells us</div>
            {revealed ? (
              <div
                style={{
                  ...bodyStyle,
                  padding: '8px 10px',
                  background: '#e6f4ea',
                  border: '1px solid #b7e1c1',
                  borderRadius: '6px'
                }}
              >
                {whatToNotice || '(unavailable)'}
              </div>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setRevealed(true)}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.78rem',
                  padding: '2px 12px',
                  borderRadius: '6px',
                  color: '#0969da',
                  borderColor: '#0969da',
                  '&:hover': { background: '#ddf4ff' }
                }}
              >
                Reveal
              </Button>
            )}
          </div>
        </div>
      </Box>
    );
  };

  // "Task intent" card used by the Modeling move in programming segments.
  // Frames the segment's goal and rationale before any practice — the
  // video shows the code but doesn't motivate why the chart type or
  // function chain was chosen, so this card makes that intention explicit.
  // No BKT update fires — Modeling is teaching, not assessment.
  interface ITaskIntentProps {
    taskGoal: string;
    approach: string;
    rationale: string;
  }

  const TaskIntent: React.FC<ITaskIntentProps> = ({
    taskGoal,
    approach,
    rationale
  }) => {
    const rowStyle: CSSProperties = {
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-start',
      marginBottom: '10px'
    };
    const iconStyle: CSSProperties = {
      fontSize: '1rem',
      lineHeight: '1.2',
      flex: '0 0 auto',
      width: '20px',
      textAlign: 'center'
    };
    const labelStyle: CSSProperties = {
      fontSize: '0.72rem',
      color: '#57606a',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      marginBottom: '2px'
    };
    const bodyStyle: CSSProperties = {
      fontSize: '0.85rem',
      color: '#24292f',
      lineHeight: 1.4
    };
    return (
      <Box
        sx={{
          width: '85%',
          padding: '14px 16px',
          marginBottom: '10px',
          boxSizing: 'border-box',
          backgroundColor: '#f7f9fc',
          border: '1px solid #e1e4e8',
          borderRadius: '10px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}
      >
        <Typography
          sx={{
            fontWeight: 600,
            color: '#24292f',
            marginBottom: '12px',
            fontSize: '0.9rem'
          }}
        >
          What we&rsquo;re doing in this clip
        </Typography>
        <div style={rowStyle}>
          <span style={iconStyle}>🎯</span>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>The task</div>
            <div style={bodyStyle}>{taskGoal || '(unavailable)'}</div>
          </div>
        </div>
        <div style={rowStyle}>
          <span style={iconStyle}>🛠</span>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>The approach</div>
            <div style={bodyStyle}>{approach || '(unavailable)'}</div>
          </div>
        </div>
        <div style={{ ...rowStyle, marginBottom: 0 }}>
          <span style={iconStyle}>💡</span>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Why this approach</div>
            <div style={bodyStyle}>{rationale || '(unavailable)'}</div>
          </div>
        </div>
      </Box>
    );
  };

  // Props for the MessageComponent
  interface IMessageComponentProps {
    message: IMessage;
    handleSend: (text: string) => void; // Assuming handleSend takes a string argument and returns void
  }

  function MessageComponent({ message }: IMessageComponentProps) {
    // The hover-only "continue" and "explain more" buttons used to live
    // here. They've moved to a single docked action bar next to "Go on"
    // at the bottom of the chat panel, so MessageComponent just renders
    // the bubble with no overlay chrome.
    if (message.direction === 'incoming') {
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

  const handleUserIDSubmit = async (
    submittedUserId: string,
    selectedVideoId: string
  ) => {
    let finalVideoId = selectedVideoId;
    if (USE_RANDOM_VIDEO_ASSIGNMENT) {
      try {
        const assignment = await requestAPI<any>('get_assigned_video', {
          body: JSON.stringify({ userId: submittedUserId }),
          method: 'POST'
        });
        if (assignment.studyCompleted || !assignment.videoId) {
          setUserId(submittedUserId);
          setVideoId('');
          setShowUserIDDialog(false);
          setMessages(prevMessages => [
            ...prevMessages,
            {
              id: `msg-${Date.now()}`,
              message:
                'You have completed all assigned video sessions and post-tests. Thank you for participating!',
              sentTime: 'just now',
              direction: 'incoming',
              sender: 'Tutorly',
              videoId: null,
              start: null,
              end: null,
              category: 'Study Complete',
              interaction: 'plain text',
              code: null
            }
          ]);
          return;
        }
        finalVideoId = assignment.videoId;
      } catch (err) {
        console.error('Failed to get assigned video from backend:', err);
        return;
      }
    }

    setUserId(submittedUserId);
    setVideoId(finalVideoId);
    setLastSegmentWatched(false);
    setVideoFinished(false);
    setShowUserIDDialog(false);
    console.log(`User ID set: ${submittedUserId}, Session ID: ${sessionId}`);

    // Fetch user's experimental condition
    requestAPI<any>('get_condition', {
      body: JSON.stringify({ userId: submittedUserId }),
      method: 'POST'
    })
      .then(response => {
        setUserCondition(response.condition);
        console.log(`User assigned to condition: ${response.condition}`);
      })
      .catch(err => {
        console.error('Failed to get user condition:', err);
        // Default to full_coggen if error
        setUserCondition('full_coggen');
      });
    initializeChat(finalVideoId, submittedUserId);
    console.log(
      `User ID set: ${submittedUserId}, Video ID: ${finalVideoId}, Condition: ${userCondition}, Session ID: ${sessionId}`
    );
  };

  const handleCheckPretestStatus = async (
    submittedUserId: string
  ): Promise<boolean> => {
    const response = await requestAPI<any>('get_pretest_status', {
      body: JSON.stringify({ userId: submittedUserId }),
      method: 'POST'
    });
    return !!response.pretestCompleted;
  };

  const handleMarkPretestComplete = async (
    submittedUserId: string
  ): Promise<void> => {
    await requestAPI<any>('mark_pretest_complete', {
      body: JSON.stringify({ userId: submittedUserId }),
      method: 'POST'
    });
  };

  const handleGetStudyProgress = async (submittedUserId: string) => {
    return requestAPI<any>('get_study_progress', {
      body: JSON.stringify({ userId: submittedUserId }),
      method: 'POST'
    });
  };

  const handleMarkPendingPosttestComplete = async (
    submittedUserId: string,
    completedVideoId: string
  ) => {
    await requestAPI<any>('mark_posttest_complete', {
      body: JSON.stringify({
        userId: submittedUserId,
        videoId: completedVideoId
      }),
      method: 'POST'
    });
  };

  const handleMarkPosttestComplete = async (
    submittedUserId: string,
    completedVideoId: string,
    messageId: string
  ): Promise<void> => {
    await requestAPI<any>('mark_posttest_complete', {
      body: JSON.stringify({
        userId: submittedUserId,
        videoId: completedVideoId
      }),
      method: 'POST'
    });

    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, posttestConfirmed: true } : msg
      )
    );

    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: `msg-${Date.now()}`,
        message:
          'Thanks! Your post-test completion has been recorded. You can continue with your next assigned video session when ready.',
        sentTime: 'just now',
        direction: 'incoming',
        sender: 'Tutorly',
        videoId: null,
        start: null,
        end: null,
        category: null,
        interaction: 'plain text',
        code: null
      }
    ]);
  };

  const maybePromptPosttest = async (completedVideoId: string) => {
    if (
      !userId ||
      !completedVideoId ||
      posttestPromptedVideos[completedVideoId]
    ) {
      return;
    }

    try {
      const response = await requestAPI<any>('get_next_posttest', {
        body: JSON.stringify({
          userId: userId,
          videoId: completedVideoId
        }),
        method: 'POST'
      });

      setPosttestPromptedVideos(prev => ({
        ...prev,
        [completedVideoId]: true
      }));

      if (!response.available || !response.nextQuestionnaireId) {
        return;
      }

      const questionnaireId = Number(response.nextQuestionnaireId);
      const questionnaireUrl = POSTTEST_QUALTRICS_URLS[questionnaireId] || '';
      if (!questionnaireUrl) {
        console.error(
          `No post-test URL configured for questionnaire ${questionnaireId}`
        );
        return;
      }

      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: `msg-${Date.now()}`,
          message: `You have finished this video learning session. Please complete post-test #${response.orderPosition}.`,
          sentTime: 'just now',
          direction: 'incoming',
          sender: 'Tutorly',
          videoId: null,
          start: null,
          end: null,
          category: 'Post-test',
          interaction: 'post-test',
          code: null,
          posttestQuestionnaireId: questionnaireId,
          posttestUrl: questionnaireUrl,
          posttestConfirmed: false
        }
      ]);
    } catch (error) {
      console.error('Failed to retrieve post-test assignment:', error);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <UserIDDialog
        open={showUserIDDialog}
        pretestUrl={PRETEST_QUALTRICS_URL}
        posttestUrls={POSTTEST_QUALTRICS_URLS}
        videoLabels={VIDEO_LABELS}
        videoSelectionMode={USE_RANDOM_VIDEO_ASSIGNMENT ? 'assigned' : 'manual'}
        onSubmit={handleUserIDSubmit}
        onCheckPretestStatus={handleCheckPretestStatus}
        onMarkPretestComplete={handleMarkPretestComplete}
        onGetStudyProgress={handleGetStudyProgress}
        onMarkPendingPosttestComplete={handleMarkPendingPosttestComplete}
      />
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
                // Parse JSON-bearing messages safely
                const isMultipleChoice =
                  message.interaction === 'multiple-choice';
                const isStructuredText =
                  message.interaction === 'structured-text';
                const isCompareWithExpert =
                  message.interaction === 'compare-with-expert';
                const isExpertReading =
                  message.interaction === 'expert-reading';
                const isTaskIntent = message.interaction === 'task-intent';
                const needsJsonParse =
                  isMultipleChoice ||
                  isStructuredText ||
                  isCompareWithExpert ||
                  isExpertReading ||
                  isTaskIntent;
                let parsedMessage: any = null;
                if (needsJsonParse) {
                  try {
                    parsedMessage = JSON.parse(message.message);
                  } catch (err) {
                    parsedMessage = null;
                  }
                }

                return (
                  <>
                    {message.category && (
                      <MessageSeparator>{message.category}</MessageSeparator>
                    )}
                    {isMultipleChoice && parsedMessage ? (
                      // Render the multiple-choice question
                      (() => {
                        const answered = answeredQuestions[message.id];
                        const isAnswered = !!answered;
                        const correctAnswer: string | undefined =
                          parsedMessage['correct answer'] ||
                          parsedMessage.correctAnswer;
                        const rationale: string | undefined =
                          parsedMessage.rationale;
                        const isCorrect =
                          isAnswered &&
                          !!correctAnswer &&
                          answered === correctAnswer;
                        return (
                          <Box
                            sx={{
                              width: '85%',
                              padding: '14px 16px',
                              marginBottom: '10px',
                              boxSizing: 'border-box',
                              backgroundColor: '#f7f9fc',
                              border: '1px solid #e1e4e8',
                              borderRadius: '10px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                            }}
                          >
                            <FormControl
                              component="fieldset"
                              variant="standard"
                              disabled={isAnswered}
                              sx={{ width: '100%' }}
                            >
                              <FormLabel
                                component="legend"
                                sx={{
                                  fontWeight: 600,
                                  color: '#24292f',
                                  marginBottom: '8px',
                                  '&.Mui-disabled': { color: '#24292f' }
                                }}
                              >
                                {parsedMessage.question}
                              </FormLabel>
                              <RadioGroup
                                aria-label="multiple-choice-question"
                                name={`multiple-choice-${i}`}
                                value={isAnswered ? answered : selectedChoice}
                                onChange={handleRadioChange}
                              >
                                {parsedMessage.choices.map(
                                  (choice: string, index: number) => (
                                    <FormControlLabel
                                      key={index}
                                      value={choice}
                                      control={<Radio size="small" />}
                                      label={choice}
                                      sx={{
                                        marginY: '2px',
                                        paddingX: '6px',
                                        borderRadius: '6px',
                                        backgroundColor: !isAnswered
                                          ? 'transparent'
                                          : correctAnswer &&
                                            choice === correctAnswer
                                            ? '#e6f4ea'
                                            : choice === answered
                                              ? '#fdecea'
                                              : 'transparent',
                                        '&:hover': {
                                          backgroundColor: isAnswered
                                            ? undefined
                                            : '#eef2f7'
                                        }
                                      }}
                                    />
                                  )
                                )}
                              </RadioGroup>
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                  if (!selectedChoice || isAnswered) {
                                    return;
                                  }
                                  setAnsweredQuestions(prev => ({
                                    ...prev,
                                    [message.id]: selectedChoice
                                  }));
                                  handleSend('');
                                }}
                                disabled={!selectedChoice || isAnswered}
                                sx={{
                                  padding: '6px 14px',
                                  fontSize: '0.8rem',
                                  marginTop: '10px',
                                  alignSelf: 'flex-start',
                                  textTransform: 'none',
                                  borderRadius: '6px'
                                }}
                              >
                                {isAnswered ? 'Submitted' : 'Submit'}
                              </Button>
                              {isAnswered && (correctAnswer || rationale) && (
                                <Box
                                  sx={{
                                    marginTop: '10px',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: isCorrect
                                      ? '#e6f4ea'
                                      : '#fff4e5',
                                    border: `1px solid ${isCorrect ? '#b7e1c1' : '#ffd9a8'
                                      }`,
                                    fontSize: '0.85rem',
                                    color: '#24292f'
                                  }}
                                >
                                  {correctAnswer && (
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        marginBottom: rationale ? '4px' : 0
                                      }}
                                    >
                                      {isCorrect
                                        ? 'Correct!'
                                        : `Correct answer: ${correctAnswer}`}
                                    </div>
                                  )}
                                  {rationale && <div>{rationale}</div>}
                                </Box>
                              )}
                            </FormControl>
                          </Box>
                        );
                      })()
                    ) : isStructuredText && parsedMessage ? (
                      <StructuredTextInput
                        messageId={message.id}
                        intro={parsedMessage.intro || ''}
                        slots={
                          Array.isArray(parsedMessage.slots)
                            ? parsedMessage.slots
                            : []
                        }
                        isSubmitted={!!answeredQuestions[message.id]}
                        submittedValue={answeredQuestions[message.id]}
                        onSubmit={combined => {
                          setAnsweredQuestions(prev => ({
                            ...prev,
                            [message.id]: combined
                          }));
                          // Keep the answer visible only inside the locked
                          // input box. Do not echo it as a chat bubble; the
                          // Reflection that follows will reference it.
                          handleSend('', { articulationAnswer: combined });
                        }}
                      />
                    ) : isCompareWithExpert && parsedMessage ? (
                      <CompareWithExpert
                        studentAnswer={parsedMessage.studentAnswer || ''}
                        expertAnswer={parsedMessage.expertAnswer || ''}
                        feedback={parsedMessage.feedback}
                        similarity={parsedMessage.similarity}
                        difference={parsedMessage.difference}
                        suggestion={parsedMessage.suggestion}
                      />
                    ) : isExpertReading && parsedMessage ? (
                      <ExpertReading
                        whereToLook={parsedMessage.where_to_look || ''}
                        whatToCompare={parsedMessage.what_to_compare || ''}
                        whatToNotice={parsedMessage.what_to_notice || ''}
                      />
                    ) : isTaskIntent && parsedMessage ? (
                      <TaskIntent
                        taskGoal={parsedMessage.task_goal || ''}
                        approach={parsedMessage.approach || ''}
                        rationale={parsedMessage.rationale || ''}
                      />
                    ) : (
                      <MessageComponent
                        key={message.id} // Make sure each message has a unique key
                        message={message}
                        handleSend={handleSend}
                      />
                    )}
                    {message.interaction === 'post-test' &&
                      message.posttestUrl && (
                        <Box
                          sx={{
                            width: '85%',
                            padding: 2,
                            marginBottom: '10px',
                            boxSizing: 'border-box',
                            border: '1px solid #d8d8d8',
                            borderRadius: 1,
                            backgroundColor: '#fafafa'
                          }}
                        >
                          <Typography variant="body2" sx={{ mb: 1.5 }}>
                            Open the assigned questionnaire and submit it before
                            starting your next video.
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ mr: 1 }}
                            onClick={() => {
                              // Append the participant's ID so the Qualtrics
                              // response can be linked back to this user.
                              const base = message.posttestUrl || '';
                              const sep = base.includes('?') ? '&' : '?';
                              const url = `${base}${sep}userId=${encodeURIComponent(userId)}`;
                              window.open(url, '_blank');
                            }}
                          >
                            Open Post-test
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            disabled={!!message.posttestConfirmed}
                            onClick={() => {
                              void handleMarkPosttestComplete(
                                userId,
                                videoId,
                                message.id
                              );
                            }}
                          >
                            {message.posttestConfirmed
                              ? 'Post-test Recorded'
                              : 'I Completed the Post-test'}
                          </Button>
                        </Box>
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
                          <pre
                            style={{
                              margin: 0,
                              padding: '12px 14px',
                              background: '#f6f8fa',
                              border: '1px solid #e1e4e8',
                              borderRadius: '6px',
                              fontFamily:
                                'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                              fontSize: '0.85rem',
                              lineHeight: 1.6,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              color: '#24292f'
                            }}
                          >
                            {(message.code || '')
                              .split('\n')
                              .map((line, lineIdx, arr) => (
                                <div
                                  key={lineIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start'
                                  }}
                                >
                                  <span
                                    style={{
                                      flex: 1,
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word'
                                    }}
                                  >
                                    {line || ' '}
                                  </span>
                                  {line.trim() !== '' && (
                                    <span
                                      onClick={() => handleSend(line)}
                                      title="Ask about this line"
                                      style={{
                                        cursor: 'pointer',
                                        marginLeft: '8px',
                                        opacity: 0.55,
                                        userSelect: 'none'
                                      }}
                                      onMouseEnter={e =>
                                        (e.currentTarget.style.opacity = '1')
                                      }
                                      onMouseLeave={e =>
                                        (e.currentTarget.style.opacity = '0.55')
                                      }
                                    >
                                      ❓
                                    </span>
                                  )}
                                </div>
                              ))}
                          </pre>
                        )}
                      </div>
                    )}
                    {message.interaction === 'drop-down' && (
                      <Box
                        sx={{
                          width: '85%',
                          padding: '14px 16px',
                          marginBottom: '10px',
                          boxSizing: 'border-box',
                          backgroundColor: '#f7f9fc',
                          border: '1px solid #e1e4e8',
                          borderRadius: '10px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: '#24292f',
                            marginBottom: '8px',
                            fontSize: '0.9rem'
                          }}
                        >
                          Explore the dataset
                        </Typography>
                        <Typography
                          sx={{
                            color: '#57606a',
                            fontSize: '0.8rem',
                            marginBottom: '10px'
                          }}
                        >
                          Pick a numeric column to see its description, summary
                          statistics, and distribution.
                        </Typography>
                        <FormControl
                          sx={{ minWidth: 200, mb: selectedColumn ? 2 : 0 }}
                          size="small"
                          fullWidth
                        >
                          <InputLabel id="column-select-label">
                            Column
                          </InputLabel>
                          <Select
                            labelId="column-select-label"
                            id="column-select"
                            value={selectedColumn}
                            label="Column"
                            onChange={handleChange}
                            sx={{
                              backgroundColor: 'white',
                              borderRadius: '6px',
                              fontSize: '0.85rem'
                            }}
                          >
                            {columnNames.map(columnName => (
                              <MenuItem
                                key={columnName}
                                value={columnName}
                                sx={{ fontSize: '0.85rem' }}
                              >
                                {columnName}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {selectedColumn && !statistics && (
                          <Box
                            sx={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              backgroundColor: '#fff4e5',
                              border: '1px solid #ffd9a8',
                              fontSize: '0.85rem',
                              color: '#24292f',
                              marginTop: '4px'
                            }}
                          >
                            <strong>{selectedColumn}</strong> looks like a
                            categorical / text column, so numeric statistics
                            and a histogram aren&rsquo;t available. Try a
                            numeric column (e.g., counts or revenues) to see
                            the summary and distribution.
                          </Box>
                        )}
                        {statistics && (
                          <Box
                            sx={{
                              padding: '12px 14px',
                              borderRadius: '8px',
                              backgroundColor: 'white',
                              border: '1px solid #e1e4e8',
                              marginTop: '4px'
                            }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: '#24292f',
                                marginBottom: '8px'
                              }}
                            >
                              {selectedColumn}
                            </Typography>
                            {description && (
                              <Typography
                                sx={{
                                  fontSize: '0.8rem',
                                  color: '#57606a',
                                  marginBottom: '10px',
                                  lineHeight: 1.4
                                }}
                              >
                                {description}
                              </Typography>
                            )}
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                marginBottom: '12px'
                              }}
                            >
                              {[
                                { label: 'Mean', value: statistics.mean },
                                { label: 'Median', value: statistics.median },
                                { label: 'Std Dev', value: statistics.std }
                              ].map(stat => (
                                <Box
                                  key={stat.label}
                                  sx={{
                                    flex: '1 1 80px',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#f7f9fc',
                                    border: '1px solid #e1e4e8'
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: '0.7rem',
                                      color: '#57606a',
                                      fontWeight: 500,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.03em'
                                    }}
                                  >
                                    {stat.label}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontSize: '1rem',
                                      fontWeight: 600,
                                      color: '#24292f',
                                      fontFamily:
                                        'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
                                    }}
                                  >
                                    {stat.value.toFixed(2)}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                            <Box
                              sx={{
                                width: '100%',
                                overflow: 'hidden'
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  color: '#57606a',
                                  marginBottom: '4px'
                                }}
                              >
                                Distribution
                              </Typography>
                              <BarChart
                                width={340}
                                height={150}
                                data={histogramData}
                                margin={{
                                  top: 4,
                                  right: 8,
                                  bottom: 4,
                                  left: 0
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#e1e4e8"
                                />
                                <XAxis
                                  dataKey="name"
                                  tick={{ fontSize: 10, fill: '#57606a' }}
                                />
                                <YAxis
                                  tick={{ fontSize: 10, fill: '#57606a' }}
                                />
                                <Tooltip />
                                <Bar
                                  dataKey="value"
                                  fill="#0969da"
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </Box>
                          </Box>
                        )}
                      </Box>
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
                          style={{
                            ...(popupStates[i]
                              ? openerAboveStyle
                              : openerBelowStyle),
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            cursor: 'pointer',
                            width: 'fit-content'
                          }}
                          onClick={() => openPopup(i)}
                        >
                          {/* Thumbnail with rounded corners + play overlay */}
                          <div
                            style={{
                              position: 'relative',
                              width: '260px',
                              height: '146px',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              flex: '0 0 auto',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                          >
                            <img
                              src={`https://img.youtube.com/vi/${message.videoId}/0.jpg`}
                              alt="Video segment thumbnail"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />
                            {/* dark gradient for contrast */}
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background:
                                  'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)'
                              }}
                            />
                            {/* play button */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '52px',
                                height: '52px',
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.55)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <div
                                style={{
                                  width: 0,
                                  height: 0,
                                  borderTop: '10px solid transparent',
                                  borderBottom: '10px solid transparent',
                                  borderLeft: '16px solid white',
                                  marginLeft: '4px'
                                }}
                              />
                            </div>
                          </div>
                          {/* Side info: label + duration + hint */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#24292f'
                              }}
                            >
                              {(() => {
                                const idx = segments.findIndex(
                                  s =>
                                    s.start === message.start &&
                                    s.end === message.end
                                );
                                return idx >= 0
                                  ? `Video segment ${idx + 1}`
                                  : 'Video segment';
                              })()}
                            </span>
                            {formatSegmentDuration(
                              message.start,
                              message.end
                            ) && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '0.8rem',
                                  color: '#57606a'
                                }}
                              >
                                <span aria-hidden="true">⏱</span>
                                {formatSegmentDuration(
                                  message.start,
                                  message.end
                                )}
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: '#0969da',
                                fontWeight: 500
                              }}
                            >
                              Click to play
                            </span>
                          </div>
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
                                const lastSegment =
                                  segments.length > 0
                                    ? segments[segments.length - 1]
                                    : null;
                                const isLastSegmentVideo =
                                  !!lastSegment &&
                                  message.start === lastSegment.start &&
                                  message.end === lastSegment.end;
                                if (isLastSegmentVideo) {
                                  setLastSegmentWatched(true);
                                }
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
            onSend={text => handleSend(text)}
            style={{
              maxHeight: '100px',
              overflowY: 'auto'
            }}
            disabled={isTyping} // Disable the input when isTyping is true
          />
        </ChatContainer>
        {(() => {
          const isOnLastSegment =
            segments.length > 0 && currentSegmentIndex === segments.length - 1;
          // Single morphing button. While the segment still has pending
          // teaching messages (canGoOn=false), it acts as "Next message"
          // and is enabled only when the latest message was read-only
          // (need_response=false). When the segment's CUR_SEQ is empty
          // (canGoOn=true), it becomes the "Go on to next clip" button
          // (or the "I have finished this video" final-segment variant).
          const inSegment = !canGoOn;
          const nextEnabled =
            inSegment &&
            lastNeedResponse === false &&
            !isTyping &&
            videoId !== '';
          const goOnEnabled = !isOnLastSegment
            ? canGoOn && !isTyping && videoId !== ''
            : (() => {
              const dslReady = userCondition === 'control' ? true : canGoOn;
              return (
                lastSegmentWatched &&
                dslReady &&
                !isTyping &&
                videoId !== '' &&
                !videoFinished
              );
            })();
          const enabled = inSegment ? nextEnabled : goOnEnabled;
          const label = inSegment
            ? 'Next message'
            : isOnLastSegment
              ? 'I have finished this video'
              : 'Go on to next clip';
          const onClick = () => {
            if (inSegment) {
              handleSend('');
            } else {
              setIsAlredaySend(false);
              if (isOnLastSegment) {
                handleFinishVideo();
              } else {
                handleGoOn();
              }
            }
          };
          return (
            <Box
              sx={{
                position: 'absolute',
                bottom: 60,
                right: 10,
                zIndex: 19,
                display: 'flex',
                padding: '6px 8px',
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid #e1e4e8',
                borderRadius: '999px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                backdropFilter: 'blur(4px)'
              }}
            >
              <Button
                variant="contained"
                onClick={onClick}
                disabled={!enabled}
                size="small"
                endIcon={<ArrowForwardIosIcon style={{ fontSize: 12 }} />}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  padding: '4px 16px',
                  // !important so the pill radius beats JupyterLab's own
                  // button CSS on the server (its base styles otherwise
                  // override MUI's sx border-radius).
                  borderRadius: '999px !important',
                  background: '#0969da',
                  boxShadow: 'none',
                  '&:hover': {
                    background: '#0860c4',
                    boxShadow: 'none'
                  },
                  '&.Mui-disabled': {
                    background: '#cfd5dc',
                    color: 'white'
                  }
                }}
              >
                {label}
              </Button>
            </Box>
          );
        })()}
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
