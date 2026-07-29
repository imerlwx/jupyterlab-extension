"use strict";
(self["webpackChunkjlab_ext_example"] = self["webpackChunkjlab_ext_example"] || []).push([["lib_index_js"],{

/***/ "./lib/Chat.js":
/*!*********************!*\
  !*** ./lib/Chat.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ChatWidget: () => (/* binding */ ChatWidget)
/* harmony export */ });
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _handler__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./handler */ "./lib/handler.js");
/* harmony import */ var _chatscope_chat_ui_kit_react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @chatscope/chat-ui-kit-react */ "webpack/sharing/consume/default/@chatscope/chat-ui-kit-react/@chatscope/chat-ui-kit-react");
/* harmony import */ var _chatscope_chat_ui_kit_react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_chatscope_chat_ui_kit_react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react_youtube__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react-youtube */ "webpack/sharing/consume/default/react-youtube/react-youtube");
/* harmony import */ var react_youtube__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_youtube__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @mui/material */ "webpack/sharing/consume/default/@mui/material/@mui/material");
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_mui_material__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _lumino_signaling__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @lumino/signaling */ "webpack/sharing/consume/default/@lumino/signaling");
/* harmony import */ var _lumino_signaling__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_lumino_signaling__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _mui_material_Radio__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @mui/material/Radio */ "./node_modules/@mui/material/Radio/Radio.js");
/* harmony import */ var _mui_material_RadioGroup__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @mui/material/RadioGroup */ "./node_modules/@mui/material/RadioGroup/RadioGroup.js");
/* harmony import */ var _mui_material_FormControlLabel__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @mui/material/FormControlLabel */ "./node_modules/@mui/material/FormControlLabel/FormControlLabel.js");
/* harmony import */ var _mui_material_FormControl__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @mui/material/FormControl */ "./node_modules/@mui/material/FormControl/FormControl.js");
/* harmony import */ var _mui_material_FormLabel__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @mui/material/FormLabel */ "./node_modules/@mui/material/FormLabel/FormLabel.js");
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! axios */ "webpack/sharing/consume/default/axios/axios");
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(axios__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _mui_material_InputLabel__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @mui/material/InputLabel */ "./node_modules/@mui/material/InputLabel/InputLabel.js");
/* harmony import */ var _mui_material_MenuItem__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @mui/material/MenuItem */ "./node_modules/@mui/material/MenuItem/MenuItem.js");
/* harmony import */ var _mui_material_Menu__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @mui/material/Menu */ "./node_modules/@mui/material/Menu/Menu.js");
/* harmony import */ var _mui_material_Select__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! @mui/material/Select */ "./node_modules/@mui/material/Select/Select.js");
/* harmony import */ var _mui_icons_material_ArrowForwardIos__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! @mui/icons-material/ArrowForwardIos */ "./node_modules/@mui/icons-material/ArrowForwardIos.js");
/* harmony import */ var papaparse__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! papaparse */ "webpack/sharing/consume/default/papaparse/papaparse");
/* harmony import */ var papaparse__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(papaparse__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var recharts__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! recharts */ "webpack/sharing/consume/default/recharts/recharts");
/* harmony import */ var recharts__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(recharts__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var _UserIDDialog__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./UserIDDialog */ "./lib/UserIDDialog.js");


// import ReactMarkdown from 'react-markdown';

// import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';










// react-syntax-highlighter is no longer used: code blocks now render as
// flat <pre> with our own monospace styling so blanks and per-line ask
// buttons can be real React components.









// Shared button styles for interaction cards, matching the app's pill-button
// language (docked Next/Go-on, dialog buttons). borderRadius uses !important
// so the pill shape survives JupyterLab's base button CSS on the server.
const cardPrimaryBtnSx = {
    textTransform: 'none',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '5px 16px',
    borderRadius: '999px !important',
    background: '#0969da',
    boxShadow: 'none',
    '&:hover': { background: '#0860c4', boxShadow: 'none' },
    '&.Mui-disabled': { background: '#cfd5dc', color: 'white' }
};
const cardOutlinedBtnSx = {
    textTransform: 'none',
    fontSize: '0.78rem',
    fontWeight: 500,
    padding: '3px 14px',
    borderRadius: '999px !important',
    color: '#0969da',
    borderColor: '#0969da',
    '&:hover': { background: '#ddf4ff', borderColor: '#0969da' }
};
// Create a new React component for the Chat logic
const ChatComponent = (props) => {
    const USE_RANDOM_VIDEO_ASSIGNMENT = true;
    const VIDEO_LABELS = {
        EF4A4OtQprg: 'Seattle Pet Names',
        '1xsbTs9-a50': 'Franchise Revenue',
        '-1x8Kpyndss': 'Coffee Ratings'
    };
    const PRETEST_QUALTRICS_URL = 'https://stanforduniversity.qualtrics.com/jfe/form/SV_5sEuT23Z0EFjXBY';
    const POSTTEST_QUALTRICS_URLS = {
        1: 'https://stanforduniversity.qualtrics.com/jfe/form/SV_3CB4p2UZ6anRHTg',
        2: 'https://stanforduniversity.qualtrics.com/jfe/form/SV_3WSu6Jb2vlggT0q',
        3: 'https://stanforduniversity.qualtrics.com/jfe/form/SV_0OK5PJxoIQUFbnw'
    };
    const [player, setPlayer] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);
    const [videoId, setVideoId] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');
    const [userId, setUserId] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');
    const [sessionId] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const [showUserIDDialog, setShowUserIDDialog] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(true);
    const [userCondition, setUserCondition] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');
    const [segments, setSegments] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);
    const [messages, setMessages] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([
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
    const [isTyping, setIsTyping] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    // const [inputValue, setInputValue] = useState('');
    const [canGoOn, setCanGoOn] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    // Tracks the latest incoming message's need_response flag.
    //   false → it's a read-only message; the docked button shows "Next
    //           message" enabled, and the student clicks when ready.
    //   true  → the message has an interaction widget; the button is
    //           disabled until the widget's own submission auto-advances.
    //   null  → between sends, waiting for the server to respond.
    const [lastNeedResponse, setLastNeedResponse] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);
    const [currentSegmentIndex, setCurrentSegmentIndex] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(0);
    // const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
    const [kernelType, setKernelType] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('ir');
    const [popupStates, setPopupStates] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({});
    const [needHelp, setNeedHelp] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    const currentSegmentIndexRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(currentSegmentIndex);
    const videoIdRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(videoId);
    const canGoOnRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(canGoOn);
    // Mirror userId in a ref so callbacks captured by handleSend / initializeChat
    // (whose closures don't include userId) can still read the fresh value
    // after handleUserIDSubmit has setUserId'd.
    const userIdRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)('');
    // Mirror segments so handleSend can read the current list even when it's
    // invoked from a stale closure (e.g. the test-mode auto-fire scheduled
    // inside initializeChat, whose useCallback captured an empty segments[]).
    const segmentsRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)([]);
    // Guard so the test-mode auto-fire runs at most once per segment, even if
    // initializeChat / handleGoOn somehow run twice — prevents draining the
    // freshly-built CUR_SEQ with repeated handleSend('') calls.
    const autoFiredSegmentRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(-1);
    const [isReadyToSend, setIsReadyToSend] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    const [isAlredaySend, setIsAlredaySend] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    const [errorInCode, setErrorInCode] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');
    const [selectedChoice, setSelectedChoice] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');
    const [answeredQuestions, setAnsweredQuestions] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({});
    const [data, setData] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);
    const [selectedColumn, setSelectedColumn] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');
    const [statistics, setStatistics] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);
    const [columnNames, setColumnNames] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);
    const [histogramData, setHistogramData] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);
    const [codes, setCodes] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({});
    const [checkedCode, setCheckedCode] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);
    const [posttestPromptedVideos, setPosttestPromptedVideos] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({});
    // Per post-test-card completion-code entry and its validation error,
    // keyed by the chat message id of the post-test card.
    const [posttestCodeInputs, setPosttestCodeInputs] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({});
    const [posttestCodeErrors, setPosttestCodeErrors] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({});
    const [videoFinished, setVideoFinished] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    // dataset url and data attributes descriptions
    const getDatasetInfo = (videoId) => {
        const datasets = {
            nx5yhXAQLxw: {
                url: 'https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2018/2018-10-16/recent-grads.csv',
                columns: {
                    Rank: 'Rank by median earnings',
                    Major_code: 'Major code, FO1DP in ACS PUMS',
                    Major: 'Major description',
                    Major_category: 'Category of major from Carnevale et al',
                    Total: 'Total number of people with major',
                    Sample_size: 'Sample size (unweighted) of full-time, year-round ONLY (used for earnings)',
                    Men: 'Male graduates',
                    Women: 'Female graduates',
                    ShareWomen: 'Women as share of total',
                    Employed: 'Number employed (ESR == 1 or 2)',
                    Full_time: 'Employed 35 hours or more',
                    Part_time: 'Employed less than 35 hours',
                    Full_time_year_round: 'Employed at least 50 weeks (WKW == 1) and at least 35 hours (WKHP >= 35)',
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
    const description = selectedColumn in columnDescriptions
        ? columnDescriptions[selectedColumn]
        : 'Description not found';
    const initializeChat = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async (videoId, userId) => {
        props.onVideoIdChange({ videoId });
        // const kernel = props.getCurrentNotebookKernel();
        // setKernelType(kernel.name);
        setKernelType('ir');
        // Gap 2: mark the start of this learning session so time-on-task has a
        // start_time. Fire-and-forget — logging must never block the chat.
        (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('log_session_start', {
            body: JSON.stringify({ userId, videoId, sessionId }),
            method: 'POST'
        }).catch(err => console.error('Failed to log session start:', err));
        (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('segments', {
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
                    message: "The video is segmented into several video clips. While you can navigate through the parts you like, I recommend following the video progress to learn and imitate his Exploratory Data Analysis process and do the task on your own.\n\nWhile watching the video, keep asking yourself these three questions: what is he doing, why is he doing it, and how will success in what he is doing help him find a solution to the problem? Now let's get started!",
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
            (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('update_seq', {
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
                if (userId.startsWith('test_') &&
                    autoFiredSegmentRef.current !== 0) {
                    autoFiredSegmentRef.current = 0;
                    userIdRef.current = userId;
                    videoIdRef.current = videoId;
                    setIsAlredaySend(true);
                    setTimeout(() => handleSend(''), 150);
                }
            })
                .catch(reason => {
                console.error(`Error on POST /jlab_ext_example/update_seq (segment 0).\n${reason}`);
            });
            setIsTyping(false);
        })
            .catch(reason => {
            console.error(`Error on POST /jlab_ext_example/chats .\n${reason}`);
        });
    }, [props, setSegments, setMessages, setIsTyping]);
    const handleReady = (event) => {
        setPlayer(event.target);
    };
    const openPopup = (index) => {
        setPopupStates(prevStates => ({ ...prevStates, [index]: true }));
    };
    const closePopup = (index) => {
        setPopupStates(prevStates => ({ ...prevStates, [index]: false }));
    };
    const handleRadioChange = (event) => {
        setSelectedChoice(event.target.value);
    };
    const backdropStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 15
    };
    const openerAboveStyle = {
        zIndex: 16
    };
    const openerBelowStyle = {
        zIndex: 14
    };
    const popupStyle = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 20
    };
    function stripHTMLTags(input) {
        return input.replace(/<[^>]*>/g, '');
    }
    // Format a segment's length (from its start/end seconds) as a short,
    // human-readable duration for the video card.
    function formatSegmentDuration(start, end) {
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
    const handleSend = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async (question, opts) => {
        var _a;
        question = stripHTMLTags(question);
        const articulationAnswer = (_a = opts === null || opts === void 0 ? void 0 : opts.articulationAnswer) !== null && _a !== void 0 ? _a : '';
        const displayText = opts === null || opts === void 0 ? void 0 : opts.displayText;
        if (errorInCode === '' && needHelp === false) {
            const outgoingText = displayText !== null && displayText !== void 0 ? displayText : question;
            if (outgoingText) {
                const newMessage = {
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
        }
        else {
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
        }
        else {
            setIsTyping(true);
            // Disable the docked button while a response is in flight.
            setLastNeedResponse(null);
            const currentNotebookContent = JSON.stringify(props.getCurrentNotebookContent());
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
            }
            else if (segIdxForCategory < segsForCategory.length + 2) {
                category = 'Self-exploration';
            }
            else {
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
                (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('update_bkt', {
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
                    console.error(`Error on POST /jlab_ext_example/update_bkt .\n${reason}`);
                });
            }
            // Go-On is now gated purely by whether CUR_SEQ is empty (which is
            // what /go_on checks). No per-category overrides: a segment can
            // only be advanced past once all its teaching methods have fired.
            if (canGoOnRef.current === false) {
                (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('go_on', {
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
                    console.error(`Error on POST /jlab_ext_example/go_on .\n${reason}`);
                });
            }
            // Define a regex to extract code blocks enclosed in triple backticks
            // This will also capture the language type if present
            const codeRegex = /```(\w+)?\s*([\s\S]*?)```/gs;
            (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('chat', {
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
                let codeBlock;
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
                                    _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_3__.NotebookActions.insertBelow(activatedNotebook);
                                    const newCellIndex = activatedNotebook.activeCellIndex;
                                    const newCell = activatedNotebook.widgets[newCellIndex];
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
                                }
                                catch (error) {
                                    console.error(error);
                                }
                            }
                            else {
                                console.error('No active notebook');
                            }
                        }
                        else {
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
                setLastNeedResponse(response.need_response === undefined
                    ? null
                    : !!response.need_response);
            })
                .catch(reason => {
                console.error(`Error on POST /jlab_ext_example/chats .\n${reason}`);
            });
        }
    }, [
        messages,
        player,
        videoId,
        segments,
        props.getCurrentNotebookContent,
        props.onVideoIdChange,
        selectedChoice,
        errorInCode,
        initializeChat
    ]);
    // Function to handle "Go On" button click
    const handleGoOn = () => {
        setCanGoOn(false); // Disable the button
        if (currentSegmentIndex < segments.length - 1) {
            setCurrentSegmentIndex(currentSegmentIndex + 1);
            const nextSegment = segments[currentSegmentIndex + 1];
            // After student click the "Go On" button, update the current sequence
            (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('update_seq', {
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
                if (userId.startsWith('test_') &&
                    autoFiredSegmentRef.current !== nextIdx) {
                    autoFiredSegmentRef.current = nextIdx;
                    userIdRef.current = userId;
                    videoIdRef.current = videoId;
                    currentSegmentIndexRef.current = nextIdx;
                    setIsAlredaySend(true);
                    setTimeout(() => handleSend(''), 150);
                }
            })
                .catch(reason => {
                console.error(`Error on POST /jlab_ext_example/update_seq .\n${reason}`);
            });
            // Append the new message to the existing messages array
            setMessages(prevMessages => [
                ...prevMessages,
                {
                    id: `msg-${Date.now()}`,
                    message: 'Now let us watch the next video segment!',
                    videoId: videoId,
                    sentTime: `${nextSegment.start}`,
                    direction: 'incoming',
                    sender: 'Tutorly',
                    start: nextSegment.start,
                    end: nextSegment.end,
                    category: nextSegment.category,
                    interaction: null,
                    code: null
                }
            ]);
        }
        else if (currentSegmentIndex < segments.length + 2) {
            setCurrentSegmentIndex(currentSegmentIndex + 1);
            setMessages(prevMessages => [
                ...prevMessages,
                {
                    id: `msg-${Date.now()}`,
                    message: 'Can you think of more tasks that are not in the video to do?',
                    videoId: null,
                    sentTime: 'just now',
                    direction: 'incoming',
                    sender: 'Tutorly',
                    start: null,
                    end: null,
                    category: 'Self-exploration',
                    interaction: 'plain text',
                    code: null
                }
            ]);
        }
        else {
            setMessages(prevMessages => [
                ...prevMessages,
                {
                    id: `msg-${Date.now()}`,
                    message: 'Could you conclude what you have learned today?',
                    videoId: null,
                    sentTime: 'just now',
                    direction: 'incoming',
                    sender: 'Tutorly',
                    start: null,
                    end: null,
                    category: 'Conclusion',
                    interaction: 'plain text',
                    code: null
                }
            ]);
        }
    };
    // Gap 2: record the end of this learning session so time-on-task has an
    // end_time. Called on a clean finish and on page unload; `reason` lets the
    // analyst tell a completed session from an abandoned/idle one.
    const logSessionEnd = (reason) => {
        if (!userId || !videoId) {
            return;
        }
        (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('log_session_end', {
            body: JSON.stringify({ userId, videoId, sessionId, reason }),
            method: 'POST'
        }).catch(err => console.error('Failed to log session end:', err));
    };
    const handleFinishVideo = () => {
        if (videoFinished) {
            return;
        }
        setVideoFinished(true);
        (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('mark_video_finished', {
            body: JSON.stringify({
                userId: userId,
                videoId: videoId
            }),
            method: 'POST'
        })
            .then(() => {
            logSessionEnd('finished_video');
            void maybePromptPosttest(videoId);
        })
            .catch(err => {
            console.error('Failed to record finished video:', err);
        });
    };
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
        currentSegmentIndexRef.current = currentSegmentIndex;
        videoIdRef.current = videoId;
        canGoOnRef.current = canGoOn;
        userIdRef.current = userId;
        segmentsRef.current = segments;
    }, [currentSegmentIndex, videoId, canGoOn, userId, segments]);
    // Gap 2: log session end when the participant closes/leaves the page, so an
    // abandoned session still gets an end_time. Uses a beacon (a normal request
    // is cancelled during unload) and reads ids from refs so the listener,
    // registered once, always sees the current session. `pagehide` is more
    // reliable than `beforeunload` on mobile/bfcache.
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
        const handlePageHide = () => {
            if (userIdRef.current && videoIdRef.current) {
                (0,_handler__WEBPACK_IMPORTED_MODULE_10__.beaconAPI)('log_session_end', {
                    userId: userIdRef.current,
                    videoId: videoIdRef.current,
                    sessionId,
                    reason: 'unload'
                });
            }
        };
        window.addEventListener('pagehide', handlePageHide);
        return () => window.removeEventListener('pagehide', handlePageHide);
    }, [sessionId]);
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
        // This effect runs when videoId changes
        if (videoId && isReadyToSend) {
            if (errorInCode === '') {
                handleSend('');
            }
            else {
                handleSend(errorInCode);
            }
            setIsReadyToSend(false);
        }
    }, [videoId, isReadyToSend, handleSend]);
    function onCellExecuted(sender, args) {
        // const executedCellContent = args.cell.model.toJSON()['source'];
        const executedCellContent = args.cell.model.toJSON()['source'];
        const cellType = args.cell.model.type;
        const executedCellOutput = args.cell.model.toJSON()['outputs'];
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
            }
            else if (executedCellOutput[0].output_type === 'stream' ||
                executedCellOutput[0].output_type === 'execute_result') {
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
        (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('log_code_execution', {
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
            (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('go_on', {
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
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
        // Connect the signal
        _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_3__.NotebookActions.executed.connect(onCellExecuted);
        // Cleanup: disconnect the signal when the component is unmounted
        return () => {
            _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_3__.NotebookActions.executed.disconnect(onCellExecuted);
        };
    }, []);
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
        axios__WEBPACK_IMPORTED_MODULE_7___default().get(datasetUrl).then(response => {
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
                            if (v !== '' && v !== null && !isNaN(parseFloat(v))) {
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
    function parseCSV(csvData, callback) {
        papaparse__WEBPACK_IMPORTED_MODULE_8___default().parse(csvData, {
            header: true,
            complete: results => {
                callback(results.data);
            },
            skipEmptyLines: true
        });
    }
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
        if (selectedColumn && data.length > 0) {
            const columnData = data
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
            const mean = columnData.reduce((acc, val) => acc + val, 0) / columnData.length;
            const sortedColumnData = [...columnData].sort((a, b) => a - b);
            const mid = Math.floor(sortedColumnData.length / 2);
            const median = sortedColumnData.length % 2 !== 0
                ? sortedColumnData[mid]
                : (sortedColumnData[mid - 1] + sortedColumnData[mid]) / 2;
            const std = Math.sqrt(columnData
                .map(val => (val - mean) ** 2)
                .reduce((acc, val) => acc + val, 0) / columnData.length);
            setStatistics({ mean, median, std });
            const newHistogramData = calculateHistogramData(data, selectedColumn);
            setHistogramData(newHistogramData);
        }
    }, [selectedColumn, data]);
    const handleChange = (event) => {
        setSelectedColumn(event.target.value);
    };
    function calculateHistogramData(data, selectedColumn, bins = 10) {
        if (!data.length || !selectedColumn) {
            return [];
        }
        // Extract column values and filter out non-numeric data
        const columnData = data
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
    const handleCodeBlockReadyToSend = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(() => {
        // Logic to handle sending or preparing to send the message
        handleSend('');
    }, [handleSend]);
    const CodeEditorWithBlanks = ({ id, initialCode, code, onCodeChange, videoId, currentSegmentIndex, onReadyToSend }) => {
        var _a;
        const [commonChoices, setCommonChoices] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);
        // Open menu state: which blank's button is currently anchoring the menu.
        // `el` is used as the MUI Menu's anchorEl so the menu sits right under
        // the clicked button.
        const [menuAnchor, setMenuAnchor] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);
        const videoIdRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(videoId);
        const currentSegmentIndexRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(currentSegmentIndex);
        (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
            videoIdRef.current = videoId;
            currentSegmentIndexRef.current = currentSegmentIndex;
        }, [videoId, currentSegmentIndex]);
        (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
            // Only run the check if this code block's ID hasn't been checked yet
            if (!checkedCode.includes(id)) {
                // Only run the check if all blanks haven't been confirmed as filled
                const blanksRemaining = code.includes('___');
                if (!blanksRemaining) {
                    setCheckedCode(prevIds => [...prevIds, id]);
                    (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('update_bkt', {
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
                        console.error(`Error on POST /jlab_ext_example/update_bkt .\n${reason}`);
                    });
                    // setAllBlanksFilled(true); // Set this to true to prevent future checks
                    onReadyToSend(); // Call the parent callback instead of directly setting state
                }
            }
        }, [code, onReadyToSend, id, checkedCode]);
        (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
            if (videoId && currentSegmentIndex >= 0) {
                (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('fill_blank', {
                    body: JSON.stringify({
                        videoId: videoIdRef.current,
                        segmentIndex: currentSegmentIndexRef.current
                    }),
                    method: 'POST'
                })
                    .then(response => {
                    if (response && Array.isArray(response)) {
                        setCommonChoices(response);
                    }
                    else {
                        // Handle unexpected response structure
                        console.error('Unexpected response structure:', response);
                    }
                })
                    .catch(reason => {
                    console.error(`Error on POST /fill_blank.\n${reason}`);
                });
            }
        }, [videoId, currentSegmentIndex]); // Dependencies on videoId and currentSegmentIndex to refetch when they change
        const handleSelectChoice = (choice) => {
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
        return (react__WEBPACK_IMPORTED_MODULE_1___default().createElement((react__WEBPACK_IMPORTED_MODULE_1___default().Fragment), null,
            react__WEBPACK_IMPORTED_MODULE_1___default().createElement("pre", { style: {
                    margin: 0,
                    padding: '12px 14px',
                    background: '#f6f8fa',
                    border: '1px solid #e1e4e8',
                    borderRadius: '6px',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#24292f'
                } }, parts.map((part, i) => {
                if (part === '___') {
                    blankCounter += 1;
                    const myIdx = blankCounter;
                    return (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Button, { key: `b-${i}`, size: "small", variant: "outlined", onClick: e => setMenuAnchor({
                            el: e.currentTarget,
                            blankIdx: myIdx
                        }), sx: {
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
                        } }, "___"));
                }
                return react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", { key: `t-${i}` }, part);
            })),
            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material_Menu__WEBPACK_IMPORTED_MODULE_11__["default"], { anchorEl: (_a = menuAnchor === null || menuAnchor === void 0 ? void 0 : menuAnchor.el) !== null && _a !== void 0 ? _a : null, open: menuAnchor !== null, onClose: () => setMenuAnchor(null), MenuListProps: { dense: true } }, commonChoices.length === 0 ? (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material_MenuItem__WEBPACK_IMPORTED_MODULE_12__["default"], { disabled: true }, "(loading choices\u2026)")) : (commonChoices.map((choice, index) => (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material_MenuItem__WEBPACK_IMPORTED_MODULE_12__["default"], { key: index, onClick: () => handleSelectChoice(choice), sx: {
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                    fontSize: '0.85rem'
                } }, choice)))))));
    };
    const StructuredTextInput = ({ intro, slots, onSubmit, isSubmitted, submittedValue }) => {
        const [values, setValues] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(() => slots.map(() => ''));
        const allEmpty = values.every(v => !v.trim());
        return (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                width: '85%',
                padding: '14px 16px',
                marginBottom: '10px',
                boxSizing: 'border-box',
                backgroundColor: '#f7f9fc',
                border: '1px solid #e1e4e8',
                borderRadius: '10px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            } },
            intro && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Typography, { sx: {
                    fontWeight: 600,
                    color: '#24292f',
                    marginBottom: '10px',
                    fontSize: '0.9rem'
                } }, intro)),
            slots.map((slot, idx) => (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { key: idx, sx: { marginBottom: '8px' } },
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Typography, { sx: {
                        fontSize: '0.78rem',
                        color: '#57606a',
                        marginBottom: '2px',
                        fontWeight: 500
                    } }, slot),
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("textarea", { value: isSubmitted ? '' : values[idx], onChange: e => setValues(v => v.map((x, i) => (i === idx ? e.target.value : x))), disabled: isSubmitted, placeholder: "Write your thoughts here\u2026", rows: 2, style: {
                        width: '100%',
                        resize: 'vertical',
                        padding: '6px 8px',
                        fontFamily: 'inherit',
                        fontSize: '0.85rem',
                        border: '1px solid #d0d7de',
                        borderRadius: '6px',
                        background: isSubmitted ? '#f6f8fa' : 'white',
                        boxSizing: 'border-box'
                    } })))),
            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Button, { variant: "contained", color: "primary", onClick: () => {
                    if (isSubmitted || allEmpty) {
                        return;
                    }
                    const combined = slots
                        .map((s, i) => `${s}: ${values[i].trim()}`)
                        .filter((line, i) => values[i].trim() !== '')
                        .join('\n\n');
                    onSubmit(combined);
                }, disabled: isSubmitted || allEmpty, sx: { ...cardPrimaryBtnSx, marginTop: '6px' } }, isSubmitted ? 'Submitted' : 'Submit'),
            isSubmitted && submittedValue && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                    marginTop: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#eef2f7',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap'
                } }, submittedValue))));
    };
    const CompareWithExpert = ({ expertAnswer, feedback, similarity, difference, suggestion }) => {
        const hasLegacyFields = !!(similarity || difference || suggestion);
        return (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                width: '85%',
                padding: '14px 16px',
                marginBottom: '10px',
                boxSizing: 'border-box',
                backgroundColor: '#f7f9fc',
                border: '1px solid #e1e4e8',
                borderRadius: '10px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            } },
            react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: {
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#e6f4ea',
                    border: '1px solid #b7e1c1',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.4
                } },
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: {
                        fontWeight: 600,
                        marginBottom: '4px',
                        color: '#2f6a3b'
                    } }, "Expert interpretation"),
                expertAnswer || '(unavailable)'),
            feedback && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                    marginTop: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: '#fff8e1',
                    border: '1px solid #ffe3a3',
                    fontSize: '0.85rem',
                    color: '#24292f',
                    lineHeight: 1.4
                } },
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("strong", null, "Feedback:"),
                " ",
                feedback)),
            !feedback && hasLegacyFields && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: { marginTop: '10px', fontSize: '0.85rem' } },
                similarity && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: { marginBottom: '4px' } },
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("strong", null, "What you got right:"),
                    " ",
                    similarity)),
                difference && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: { marginBottom: '4px' } },
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("strong", null, "What to refine:"),
                    " ",
                    difference)),
                suggestion && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", null,
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("strong", null, "Try next:"),
                    " ",
                    suggestion))))));
    };
    const ExpertReading = ({ whereToLook, whatToCompare, whatToNotice }) => {
        const [revealed, setRevealed] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
        const rowStyle = {
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            marginBottom: '10px'
        };
        const iconStyle = {
            fontSize: '1rem',
            lineHeight: '1.2',
            flex: '0 0 auto',
            width: '20px',
            textAlign: 'center'
        };
        const labelStyle = {
            fontSize: '0.72rem',
            color: '#57606a',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '2px'
        };
        const bodyStyle = {
            fontSize: '0.85rem',
            color: '#24292f',
            lineHeight: 1.4
        };
        return (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                width: '85%',
                padding: '14px 16px',
                marginBottom: '10px',
                boxSizing: 'border-box',
                backgroundColor: '#f7f9fc',
                border: '1px solid #e1e4e8',
                borderRadius: '10px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            } },
            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Typography, { sx: {
                    fontWeight: 600,
                    color: '#24292f',
                    marginBottom: '12px',
                    fontSize: '0.9rem'
                } }, "How the expert reads this"),
            react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: rowStyle },
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", { style: iconStyle }, "\uD83D\uDC41"),
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: { flex: 1 } },
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: labelStyle }, "Where to look"),
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: bodyStyle }, whereToLook || '(unavailable)'))),
            react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: rowStyle },
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", { style: iconStyle }, "\u2696"),
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: { flex: 1 } },
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: labelStyle }, "What to compare"),
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: bodyStyle }, whatToCompare || '(unavailable)'))),
            react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: { ...rowStyle, marginBottom: 0 } },
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", { style: iconStyle }, "\uD83D\uDCA1"),
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: { flex: 1 } },
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: labelStyle }, "What this tells us"),
                    revealed ? (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: {
                            ...bodyStyle,
                            padding: '8px 10px',
                            background: '#e6f4ea',
                            border: '1px solid #b7e1c1',
                            borderRadius: '6px'
                        } }, whatToNotice || '(unavailable)')) : (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Button, { variant: "outlined", size: "small", onClick: () => setRevealed(true), sx: cardOutlinedBtnSx }, "Reveal"))))));
    };
    const TaskIntent = ({ taskGoal, approach, rationale }) => {
        const rowStyle = {
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            marginBottom: '10px'
        };
        const iconStyle = {
            fontSize: '1rem',
            lineHeight: '1.2',
            flex: '0 0 auto',
            width: '20px',
            textAlign: 'center'
        };
        const labelStyle = {
            fontSize: '0.72rem',
            color: '#57606a',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '2px'
        };
        const bodyStyle = {
            fontSize: '0.85rem',
            color: '#24292f',
            lineHeight: 1.4
        };
        return (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                width: '85%',
                padding: '14px 16px',
                marginBottom: '10px',
                boxSizing: 'border-box',
                backgroundColor: '#f7f9fc',
                border: '1px solid #e1e4e8',
                borderRadius: '10px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            } },
            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Typography, { sx: {
                    fontWeight: 600,
                    color: '#24292f',
                    marginBottom: '12px',
                    fontSize: '0.9rem'
                } }, "What we\u2019re doing in this clip"),
            react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: rowStyle },
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", { style: iconStyle }, "\uD83C\uDFAF"),
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: { flex: 1 } },
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: labelStyle }, "The task"),
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: bodyStyle }, taskGoal || '(unavailable)'))),
            react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: rowStyle },
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", { style: iconStyle }, "\uD83D\uDEE0"),
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: { flex: 1 } },
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: labelStyle }, "The approach"),
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: bodyStyle }, approach || '(unavailable)'))),
            react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: { ...rowStyle, marginBottom: 0 } },
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", { style: iconStyle }, "\uD83D\uDCA1"),
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: { flex: 1 } },
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: labelStyle }, "Why this approach"),
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: bodyStyle }, rationale || '(unavailable)')))));
    };
    function MessageComponent({ message }) {
        // The hover-only "continue" and "explain more" buttons used to live
        // here. They've moved to a single docked action bar next to "Go on"
        // at the bottom of the chat panel, so MessageComponent just renders
        // the bubble with no overlay chrome.
        if (message.direction === 'incoming') {
            return (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_chatscope_chat_ui_kit_react__WEBPACK_IMPORTED_MODULE_2__.Message, { key: message.sentTime, model: {
                    message: message.message,
                    direction: message.direction,
                    sender: message.sender,
                    sentTime: message.sentTime,
                    position: 'single'
                } }));
        }
        else {
            return (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_chatscope_chat_ui_kit_react__WEBPACK_IMPORTED_MODULE_2__.Message, { key: message.sentTime, model: {
                    message: message.message,
                    direction: message.direction,
                    sender: message.sender,
                    sentTime: message.sentTime,
                    position: 'single'
                } }));
        }
    }
    const handleUserIDSubmit = async (submittedUserId, selectedVideoId) => {
        let finalVideoId = selectedVideoId;
        if (USE_RANDOM_VIDEO_ASSIGNMENT) {
            try {
                const assignment = await (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('get_assigned_video', {
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
                            message: 'You have completed all assigned video sessions and post-tests. Thank you for participating!',
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
            }
            catch (err) {
                console.error('Failed to get assigned video from backend:', err);
                return;
            }
        }
        setUserId(submittedUserId);
        setVideoId(finalVideoId);
        setVideoFinished(false);
        setShowUserIDDialog(false);
        console.log(`User ID set: ${submittedUserId}, Session ID: ${sessionId}`);
        // Fetch user's experimental condition
        (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('get_condition', {
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
        console.log(`User ID set: ${submittedUserId}, Video ID: ${finalVideoId}, Condition: ${userCondition}, Session ID: ${sessionId}`);
    };
    const handleMarkPretestComplete = async (submittedUserId, completionCode) => {
        const response = await (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('mark_pretest_complete', {
            body: JSON.stringify({
                userId: submittedUserId,
                sessionId: sessionId,
                code: completionCode
            }),
            method: 'POST'
        });
        return {
            verified: !!response.verified,
            message: response.message || ''
        };
    };
    const handleGetStudyProgress = async (submittedUserId) => {
        return (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('get_study_progress', {
            body: JSON.stringify({ userId: submittedUserId }),
            method: 'POST'
        });
    };
    const handleMarkPendingPosttestComplete = async (submittedUserId, completedVideoId, completionCode) => {
        const response = await (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('mark_posttest_complete', {
            body: JSON.stringify({
                userId: submittedUserId,
                videoId: completedVideoId,
                sessionId: sessionId,
                code: completionCode
            }),
            method: 'POST'
        });
        return {
            verified: !!response.verified,
            message: response.message || ''
        };
    };
    const handleMarkPosttestComplete = async (submittedUserId, completedVideoId, messageId, completionCode) => {
        const response = await (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('mark_posttest_complete', {
            body: JSON.stringify({
                userId: submittedUserId,
                videoId: completedVideoId,
                sessionId: sessionId,
                code: completionCode
            }),
            method: 'POST'
        });
        if (!response.verified) {
            setPosttestCodeErrors(prev => ({
                ...prev,
                [messageId]: response.message || 'That code doesn’t match. Please try again.'
            }));
            return;
        }
        setPosttestCodeErrors(prev => ({ ...prev, [messageId]: '' }));
        setMessages(prevMessages => prevMessages.map(msg => msg.id === messageId ? { ...msg, posttestConfirmed: true } : msg));
        setMessages(prevMessages => [
            ...prevMessages,
            {
                id: `msg-${Date.now()}`,
                message: 'Thanks! Your post-test completion has been recorded. You can continue with your next assigned video session when ready.',
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
    const maybePromptPosttest = async (completedVideoId) => {
        if (!userId ||
            !completedVideoId ||
            posttestPromptedVideos[completedVideoId]) {
            return;
        }
        try {
            const response = await (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('get_next_posttest', {
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
                console.error(`No post-test URL configured for questionnaire ${questionnaireId}`);
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
        }
        catch (error) {
            console.error('Failed to retrieve post-test assignment:', error);
        }
    };
    return (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: { position: 'relative', height: '100%', width: '100%' } },
        react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_UserIDDialog__WEBPACK_IMPORTED_MODULE_13__.UserIDDialog, { open: showUserIDDialog, pretestUrl: PRETEST_QUALTRICS_URL, posttestUrls: POSTTEST_QUALTRICS_URLS, videoLabels: VIDEO_LABELS, videoSelectionMode: USE_RANDOM_VIDEO_ASSIGNMENT ? 'assigned' : 'manual', onSubmit: handleUserIDSubmit, onMarkPretestComplete: handleMarkPretestComplete, onGetStudyProgress: handleGetStudyProgress, onMarkPendingPosttestComplete: handleMarkPendingPosttestComplete }),
        react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_chatscope_chat_ui_kit_react__WEBPACK_IMPORTED_MODULE_2__.MainContainer, { style: { height: '100%', width: '100%' } },
            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_chatscope_chat_ui_kit_react__WEBPACK_IMPORTED_MODULE_2__.ChatContainer, { id: "chatContainerId", style: { height: '100%', width: '100%' } },
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_chatscope_chat_ui_kit_react__WEBPACK_IMPORTED_MODULE_2__.MessageList, { scrollBehavior: "auto", typingIndicator: isTyping ? react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_chatscope_chat_ui_kit_react__WEBPACK_IMPORTED_MODULE_2__.TypingIndicator, { content: "Tutorly is typing" }) : null, style: {
                        height: 'calc(100% - 45px)',
                        width: '100%',
                        paddingBottom: '30px' // Add bottom padding to account for the typing indicator
                    } }, messages
                    .filter(message => message.message && message.message.trim() !== '')
                    .map((message, i) => {
                    // Parse JSON-bearing messages safely
                    const isMultipleChoice = message.interaction === 'multiple-choice';
                    const isStructuredText = message.interaction === 'structured-text';
                    const isCompareWithExpert = message.interaction === 'compare-with-expert';
                    const isExpertReading = message.interaction === 'expert-reading';
                    const isTaskIntent = message.interaction === 'task-intent';
                    const needsJsonParse = isMultipleChoice ||
                        isStructuredText ||
                        isCompareWithExpert ||
                        isExpertReading ||
                        isTaskIntent;
                    let parsedMessage = null;
                    if (needsJsonParse) {
                        try {
                            parsedMessage = JSON.parse(message.message);
                        }
                        catch (err) {
                            parsedMessage = null;
                        }
                    }
                    return (react__WEBPACK_IMPORTED_MODULE_1___default().createElement((react__WEBPACK_IMPORTED_MODULE_1___default().Fragment), null,
                        message.category && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_chatscope_chat_ui_kit_react__WEBPACK_IMPORTED_MODULE_2__.MessageSeparator, null, message.category)),
                        isMultipleChoice && parsedMessage ? (
                        // Render the multiple-choice question
                        (() => {
                            const answered = answeredQuestions[message.id];
                            const isAnswered = !!answered;
                            const correctAnswer = parsedMessage['correct answer'] ||
                                parsedMessage.correctAnswer;
                            const rationale = parsedMessage.rationale;
                            const isCorrect = isAnswered &&
                                !!correctAnswer &&
                                answered === correctAnswer;
                            return (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                                    width: '85%',
                                    padding: '14px 16px',
                                    marginBottom: '10px',
                                    boxSizing: 'border-box',
                                    backgroundColor: '#f7f9fc',
                                    border: '1px solid #e1e4e8',
                                    borderRadius: '10px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                                } },
                                react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material_FormControl__WEBPACK_IMPORTED_MODULE_14__["default"], { component: "fieldset", variant: "standard", disabled: isAnswered, sx: { width: '100%' } },
                                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material_FormLabel__WEBPACK_IMPORTED_MODULE_15__["default"], { component: "legend", sx: {
                                            fontWeight: 600,
                                            color: '#24292f',
                                            marginBottom: '8px',
                                            '&.Mui-disabled': { color: '#24292f' }
                                        } }, parsedMessage.question),
                                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material_RadioGroup__WEBPACK_IMPORTED_MODULE_16__["default"], { "aria-label": "multiple-choice-question", name: `multiple-choice-${i}`, value: isAnswered ? answered : selectedChoice, onChange: handleRadioChange }, parsedMessage.choices.map((choice, index) => (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material_FormControlLabel__WEBPACK_IMPORTED_MODULE_17__["default"], { key: index, value: choice, control: react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material_Radio__WEBPACK_IMPORTED_MODULE_18__["default"], { size: "small" }), label: choice, sx: {
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
                                        } })))),
                                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Button, { variant: "contained", color: "primary", onClick: () => {
                                            if (!selectedChoice || isAnswered) {
                                                return;
                                            }
                                            setAnsweredQuestions(prev => ({
                                                ...prev,
                                                [message.id]: selectedChoice
                                            }));
                                            handleSend('');
                                        }, disabled: !selectedChoice || isAnswered, sx: {
                                            ...cardPrimaryBtnSx,
                                            marginTop: '10px',
                                            alignSelf: 'flex-start'
                                        } }, isAnswered ? 'Submitted' : 'Submit'),
                                    isAnswered && (correctAnswer || rationale) && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                                            marginTop: '10px',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            backgroundColor: isCorrect
                                                ? '#e6f4ea'
                                                : '#fff4e5',
                                            border: `1px solid ${isCorrect ? '#b7e1c1' : '#ffd9a8'}`,
                                            fontSize: '0.85rem',
                                            color: '#24292f'
                                        } },
                                        correctAnswer && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: {
                                                fontWeight: 600,
                                                marginBottom: rationale ? '4px' : 0
                                            } }, isCorrect
                                            ? 'Correct!'
                                            : `Correct answer: ${correctAnswer}`)),
                                        rationale && react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", null, rationale))))));
                        })()) : isStructuredText && parsedMessage ? (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(StructuredTextInput, { messageId: message.id, intro: parsedMessage.intro || '', slots: Array.isArray(parsedMessage.slots)
                                ? parsedMessage.slots
                                : [], isSubmitted: !!answeredQuestions[message.id], submittedValue: answeredQuestions[message.id], onSubmit: combined => {
                                setAnsweredQuestions(prev => ({
                                    ...prev,
                                    [message.id]: combined
                                }));
                                // Keep the answer visible only inside the locked
                                // input box. Do not echo it as a chat bubble; the
                                // Reflection that follows will reference it.
                                handleSend('', { articulationAnswer: combined });
                            } })) : isCompareWithExpert && parsedMessage ? (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(CompareWithExpert, { studentAnswer: parsedMessage.studentAnswer || '', expertAnswer: parsedMessage.expertAnswer || '', feedback: parsedMessage.feedback, similarity: parsedMessage.similarity, difference: parsedMessage.difference, suggestion: parsedMessage.suggestion })) : isExpertReading && parsedMessage ? (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(ExpertReading, { whereToLook: parsedMessage.where_to_look || '', whatToCompare: parsedMessage.what_to_compare || '', whatToNotice: parsedMessage.what_to_notice || '' })) : isTaskIntent && parsedMessage ? (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(TaskIntent, { taskGoal: parsedMessage.task_goal || '', approach: parsedMessage.approach || '', rationale: parsedMessage.rationale || '' })) : (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(MessageComponent, { key: message.id, message: message, handleSend: handleSend })),
                        message.interaction === 'post-test' &&
                            message.posttestUrl && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                                width: '85%',
                                padding: 2,
                                marginBottom: '10px',
                                boxSizing: 'border-box',
                                border: '1px solid #d8d8d8',
                                borderRadius: 1,
                                backgroundColor: '#fafafa'
                            } },
                            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Typography, { variant: "body2", sx: { mb: 1.5 } }, "Open the assigned questionnaire and submit it. At the end you will receive a completion code \u2014 enter it below to record your post-test."),
                            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Button, { variant: "outlined", size: "small", sx: { ...cardOutlinedBtnSx, mb: 1.5 }, onClick: () => {
                                    // Append the participant's ID so the Qualtrics
                                    // response can be linked back to this user.
                                    const base = message.posttestUrl || '';
                                    const sep = base.includes('?') ? '&' : '?';
                                    const url = `${base}${sep}userId=${encodeURIComponent(userId)}`;
                                    window.open(url, '_blank');
                                } }, "Open Post-test"),
                            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1
                                } },
                                react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.TextField, { size: "small", label: "Completion code", value: posttestCodeInputs[message.id] || '', disabled: !!message.posttestConfirmed, error: !!posttestCodeErrors[message.id], helperText: posttestCodeErrors[message.id] || '', onChange: e => {
                                        setPosttestCodeInputs(prev => ({
                                            ...prev,
                                            [message.id]: e.target.value
                                        }));
                                        setPosttestCodeErrors(prev => ({
                                            ...prev,
                                            [message.id]: ''
                                        }));
                                    } }),
                                react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Button, { variant: "contained", size: "small", disabled: !!message.posttestConfirmed ||
                                        !(posttestCodeInputs[message.id] || '').trim(), sx: { ...cardPrimaryBtnSx, mt: 0.4 }, onClick: () => {
                                        void handleMarkPosttestComplete(userId, videoId, message.id, (posttestCodeInputs[message.id] || '').trim());
                                    } }, message.posttestConfirmed
                                    ? 'Post-test Recorded'
                                    : 'Submit Code')))),
                        message.code && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: { width: '61.8%', marginBottom: '8px' } }, message.interaction === 'fill-in-blanks' ? (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(CodeEditorWithBlanks, { id: message.id, initialCode: message.code, code: codes[message.id] || message.code, onCodeChange: newCode => setCodes(prev => ({
                                ...prev,
                                [message.id]: newCode
                            })), videoId: videoId, currentSegmentIndex: currentSegmentIndex, onReadyToSend: handleCodeBlockReadyToSend })) : (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("pre", { style: {
                                margin: 0,
                                padding: '12px 14px',
                                background: '#f6f8fa',
                                border: '1px solid #e1e4e8',
                                borderRadius: '6px',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                                fontSize: '0.85rem',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                color: '#24292f'
                            } }, (message.code || '')
                            .split('\n')
                            .map((line, lineIdx, arr) => (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { key: lineIdx, style: {
                                display: 'flex',
                                alignItems: 'flex-start'
                            } },
                            react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", { style: {
                                    flex: 1,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                } }, line || ' '),
                            line.trim() !== '' && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", { onClick: () => handleSend(line), title: "Ask about this line", style: {
                                    cursor: 'pointer',
                                    marginLeft: '8px',
                                    opacity: 0.55,
                                    userSelect: 'none'
                                }, onMouseEnter: e => (e.currentTarget.style.opacity = '1'), onMouseLeave: e => (e.currentTarget.style.opacity = '0.55') }, "\u2753"))))))))),
                        message.interaction === 'drop-down' && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                                width: '85%',
                                padding: '14px 16px',
                                marginBottom: '10px',
                                boxSizing: 'border-box',
                                backgroundColor: '#f7f9fc',
                                border: '1px solid #e1e4e8',
                                borderRadius: '10px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                            } },
                            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Typography, { sx: {
                                    fontWeight: 600,
                                    color: '#24292f',
                                    marginBottom: '8px',
                                    fontSize: '0.9rem'
                                } }, "Explore the dataset"),
                            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Typography, { sx: {
                                    color: '#57606a',
                                    fontSize: '0.8rem',
                                    marginBottom: '10px'
                                } }, "Pick a numeric column to see its description, summary statistics, and distribution."),
                            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material_FormControl__WEBPACK_IMPORTED_MODULE_14__["default"], { sx: { minWidth: 200, mb: selectedColumn ? 2 : 0 }, size: "small", fullWidth: true },
                                react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material_InputLabel__WEBPACK_IMPORTED_MODULE_19__["default"], { id: "column-select-label" }, "Column"),
                                react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material_Select__WEBPACK_IMPORTED_MODULE_20__["default"], { labelId: "column-select-label", id: "column-select", value: selectedColumn, label: "Column", onChange: handleChange, sx: {
                                        backgroundColor: 'white',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem'
                                    } }, columnNames.map(columnName => (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material_MenuItem__WEBPACK_IMPORTED_MODULE_12__["default"], { key: columnName, value: columnName, sx: { fontSize: '0.85rem' } }, columnName))))),
                            selectedColumn && !statistics && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: '#fff4e5',
                                    border: '1px solid #ffd9a8',
                                    fontSize: '0.85rem',
                                    color: '#24292f',
                                    marginTop: '4px'
                                } },
                                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("strong", null, selectedColumn),
                                " looks like a categorical / text column, so numeric statistics and a histogram aren\u2019t available. Try a numeric column (e.g., counts or revenues) to see the summary and distribution.")),
                            statistics && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                                    padding: '12px 14px',
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    border: '1px solid #e1e4e8',
                                    marginTop: '4px'
                                } },
                                react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Typography, { sx: {
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        color: '#24292f',
                                        marginBottom: '8px'
                                    } }, selectedColumn),
                                description && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Typography, { sx: {
                                        fontSize: '0.8rem',
                                        color: '#57606a',
                                        marginBottom: '10px',
                                        lineHeight: 1.4
                                    } }, description)),
                                react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '8px',
                                        marginBottom: '12px'
                                    } }, [
                                    { label: 'Mean', value: statistics.mean },
                                    { label: 'Median', value: statistics.median },
                                    { label: 'Std Dev', value: statistics.std }
                                ].map(stat => (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { key: stat.label, sx: {
                                        flex: '1 1 80px',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        backgroundColor: '#f7f9fc',
                                        border: '1px solid #e1e4e8'
                                    } },
                                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Typography, { sx: {
                                            fontSize: '0.7rem',
                                            color: '#57606a',
                                            fontWeight: 500,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.03em'
                                        } }, stat.label),
                                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Typography, { sx: {
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            color: '#24292f',
                                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
                                        } }, stat.value.toFixed(2)))))),
                                react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
                                        width: '100%',
                                        overflow: 'hidden'
                                    } },
                                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Typography, { sx: {
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: '#57606a',
                                            marginBottom: '4px'
                                        } }, "Distribution"),
                                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement(recharts__WEBPACK_IMPORTED_MODULE_9__.BarChart, { width: 340, height: 150, data: histogramData, margin: {
                                            top: 4,
                                            right: 8,
                                            bottom: 4,
                                            left: 0
                                        } },
                                        react__WEBPACK_IMPORTED_MODULE_1___default().createElement(recharts__WEBPACK_IMPORTED_MODULE_9__.CartesianGrid, { strokeDasharray: "3 3", stroke: "#e1e4e8" }),
                                        react__WEBPACK_IMPORTED_MODULE_1___default().createElement(recharts__WEBPACK_IMPORTED_MODULE_9__.XAxis, { dataKey: "name", tick: { fontSize: 10, fill: '#57606a' } }),
                                        react__WEBPACK_IMPORTED_MODULE_1___default().createElement(recharts__WEBPACK_IMPORTED_MODULE_9__.YAxis, { tick: { fontSize: 10, fill: '#57606a' } }),
                                        react__WEBPACK_IMPORTED_MODULE_1___default().createElement(recharts__WEBPACK_IMPORTED_MODULE_9__.Tooltip, null),
                                        react__WEBPACK_IMPORTED_MODULE_1___default().createElement(recharts__WEBPACK_IMPORTED_MODULE_9__.Bar, { dataKey: "value", fill: "#0969da", radius: [4, 4, 0, 0] }))))))),
                        message.videoId && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: {
                                marginTop: '8px',
                                paddingBottom: isTyping ? '20px' : '10px'
                            } },
                            popupStates[i] ? (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: backdropStyle, onClick: () => closePopup(i) })) : null,
                            react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: {
                                    ...(popupStates[i]
                                        ? openerAboveStyle
                                        : openerBelowStyle),
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    cursor: 'pointer',
                                    width: 'fit-content'
                                }, onClick: () => openPopup(i) },
                                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: {
                                        position: 'relative',
                                        width: '260px',
                                        height: '146px',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        flex: '0 0 auto',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                    } },
                                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("img", { src: `https://img.youtube.com/vi/${message.videoId}/0.jpg`, alt: "Video segment thumbnail", style: {
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block'
                                        } }),
                                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: {
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)'
                                        } }),
                                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: {
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
                                        } },
                                        react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: {
                                                width: 0,
                                                height: 0,
                                                borderTop: '10px solid transparent',
                                                borderBottom: '10px solid transparent',
                                                borderLeft: '16px solid white',
                                                marginLeft: '4px'
                                            } }))),
                                react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                    } },
                                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", { style: {
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            color: '#24292f'
                                        } }, (() => {
                                        const idx = segments.findIndex(s => s.start === message.start &&
                                            s.end === message.end);
                                        return idx >= 0
                                            ? `Video segment ${idx + 1}`
                                            : 'Video segment';
                                    })()),
                                    formatSegmentDuration(message.start, message.end) && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", { style: {
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            fontSize: '0.8rem',
                                            color: '#57606a'
                                        } },
                                        react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", { "aria-hidden": "true" }, "\u23F1"),
                                        formatSegmentDuration(message.start, message.end))),
                                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement("span", { style: {
                                            fontSize: '0.75rem',
                                            color: '#0969da',
                                            fontWeight: 500
                                        } }, "Click to play"))),
                            popupStates[i] && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: popupStyle },
                                react__WEBPACK_IMPORTED_MODULE_1___default().createElement((react_youtube__WEBPACK_IMPORTED_MODULE_4___default()), { key: i, videoId: message.videoId, opts: {
                                        height: '540',
                                        width: '960',
                                        playerVars: {
                                            start: message.start || undefined,
                                            end: message.end || undefined,
                                            controls: 0,
                                            rel: 0
                                        }
                                    }, onReady: handleReady, onEnd: event => {
                                        if (message.category !== 'Introduction' &&
                                            !isAlredaySend) {
                                            setIsAlredaySend(true);
                                            handleSend('');
                                        }
                                    } })))))));
                })),
                react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_chatscope_chat_ui_kit_react__WEBPACK_IMPORTED_MODULE_2__.MessageInput, { placeholder: "Type message here", attachButton: false, onSend: text => handleSend(text), style: {
                        maxHeight: '100px',
                        overflowY: 'auto'
                    }, disabled: isTyping })),
            (() => {
                const isOnLastSegment = segments.length > 0 && currentSegmentIndex === segments.length - 1;
                // Single morphing button. While the segment still has pending
                // teaching messages (canGoOn=false), it acts as "Next message"
                // and is enabled only when the latest message was read-only
                // (need_response=false). When the segment's CUR_SEQ is empty
                // (canGoOn=true), it becomes the "Go on to next clip" button
                // (or the "I have finished this video" final-segment variant).
                const inSegment = !canGoOn;
                const nextEnabled = inSegment &&
                    lastNeedResponse === false &&
                    !isTyping &&
                    videoId !== '';
                const goOnEnabled = !isOnLastSegment
                    ? canGoOn && !isTyping && videoId !== ''
                    : (() => {
                        // "I have finished this video" enables once the LAST segment's
                        // teaching is exhausted (canGoOn) — the same gate as "Go on to
                        // next clip". We intentionally do NOT require lastSegmentWatched
                        // (the video playing to its end): that blocked the button when
                        // the student skipped/scrubbed the video or when test-mode
                        // bypasses the video entirely, even though all teaching was done.
                        const dslReady = userCondition === 'control' ? true : canGoOn;
                        return (dslReady &&
                            !isTyping &&
                            videoId !== '' &&
                            !videoFinished);
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
                    }
                    else {
                        setIsAlredaySend(false);
                        if (isOnLastSegment) {
                            handleFinishVideo();
                        }
                        else {
                            handleGoOn();
                        }
                    }
                };
                return (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Box, { sx: {
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
                    } },
                    react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Button, { variant: "contained", onClick: onClick, disabled: !enabled, size: "small", endIcon: react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_icons_material_ArrowForwardIos__WEBPACK_IMPORTED_MODULE_21__["default"], { style: { fontSize: 12 } }), sx: {
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
                        } }, label)));
            })())));
};
// Create a new JupyterLab widget for the Chat
class ChatWidget extends _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_0__.ReactWidget {
    constructor(notebookTracker) {
        super();
        this.notebookTracker = notebookTracker;
        this._videoIdChanged = new _lumino_signaling__WEBPACK_IMPORTED_MODULE_6__.Signal(this);
        this.addClass('jp-Chat-widget');
    }
    get videoIdChanged() {
        return this._videoIdChanged;
    }
    _getCurrentNotebookContent() {
        // Check if a notebook is currently active
        if (this.notebookTracker.currentWidget) {
            const notebook = this.notebookTracker.currentWidget.content;
            const cells = notebook.widgets.map(cellWidget => {
                const cellModel = cellWidget.model;
                const cell_json = cellModel.toJSON();
                let output_type = null;
                if (Array.isArray(cell_json.outputs) && cell_json.outputs.length > 0) {
                    const firstOutput = cell_json.outputs[0];
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
    _getCurrentNotebook() {
        var _a;
        return (_a = this.notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
    }
    _getCurrentNotebookKernel() {
        var _a, _b;
        return (_b = (_a = this.notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.sessionContext.session) === null || _b === void 0 ? void 0 : _b.kernel;
    }
    render() {
        return (react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { style: { height: '100%', width: '100%' } },
            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(ChatComponent, { getCurrentNotebookContent: this._getCurrentNotebookContent.bind(this), onVideoIdChange: (videoId) => this._videoIdChanged.emit(videoId), getCurrentNotebook: this._getCurrentNotebook.bind(this), getCurrentNotebookKernel: this._getCurrentNotebookKernel.bind(this) })));
    }
}


/***/ }),

/***/ "./lib/UserIDDialog.js":
/*!*****************************!*\
  !*** ./lib/UserIDDialog.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   UserIDDialog: () => (/* binding */ UserIDDialog)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @mui/material */ "webpack/sharing/consume/default/@mui/material/@mui/material");
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_mui_material__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _mui_material_Radio__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @mui/material/Radio */ "./node_modules/@mui/material/Radio/Radio.js");
/* harmony import */ var _mui_material_RadioGroup__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @mui/material/RadioGroup */ "./node_modules/@mui/material/RadioGroup/RadioGroup.js");
/* harmony import */ var _mui_material_FormControlLabel__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @mui/material/FormControlLabel */ "./node_modules/@mui/material/FormControlLabel/FormControlLabel.js");





// Append the participant's user ID to a Qualtrics URL as a query parameter
// so each survey response can be linked back to this participant. Qualtrics
// captures it via an Embedded Data field named `userId` (see the survey-flow
// setup in the deploy notes). Handles URLs that already have a query string.
const appendUserId = (url, userId) => {
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
};
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
};
const UserIDDialog = ({ open, pretestUrl, videoSelectionMode = 'manual', videoLabels, posttestUrls, onSubmit, onMarkPretestComplete, onGetStudyProgress, onMarkPendingPosttestComplete }) => {
    // Two-step flow: the participant first submits their ID ("id" step), and
    // only then sees their learning progress and the continue gate ("progress"
    // step). Progress is fetched once on the step transition, never while the
    // participant is still typing their ID.
    const [step, setStep] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('id');
    const [userId, setUserId] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
    const [videoId, setVideoId] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
    const [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
    const [isLoading, setIsLoading] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [studyProgress, setStudyProgress] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
    const [pretestCode, setPretestCode] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
    const [pretestCodeError, setPretestCodeError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
    const [posttestCode, setPosttestCode] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
    const [posttestCodeError, setPosttestCodeError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
    const [isVerifyingPosttest, setIsVerifyingPosttest] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const isAssignedMode = videoSelectionMode === 'assigned';
    const assignedVideoId = (studyProgress === null || studyProgress === void 0 ? void 0 : studyProgress.videoOrder.find(id => !studyProgress.completedVideos.includes(id))) || '';
    const effectiveVideoId = isAssignedMode ? assignedVideoId || '' : videoId;
    const pretestCompleted = !!(studyProgress === null || studyProgress === void 0 ? void 0 : studyProgress.pretestCompleted);
    const isValidUserId = (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return false;
        }
        const userIdPattern = /^[a-zA-Z0-9_-]+$/;
        return userIdPattern.test(trimmed);
    };
    const handleNextStep = async () => {
        const trimmed = userId.trim();
        if (!trimmed) {
            setError('Please enter a user ID');
            return;
        }
        if (!isValidUserId(trimmed)) {
            setError('User ID can only contain letters, numbers, hyphens, and underscores');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const progress = await onGetStudyProgress(trimmed);
            setStudyProgress(progress);
            setStep('progress');
        }
        catch (err) {
            console.error('Failed to load study progress:', err);
            setError('Failed to load your progress. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleChangeUserId = () => {
        setStep('id');
        setStudyProgress(null);
        setError('');
        setPretestCode('');
        setPretestCodeError('');
        setPosttestCode('');
        setPosttestCodeError('');
    };
    const handleContinue = async () => {
        if (!isAssignedMode && !effectiveVideoId) {
            setError('Please select a video topic');
            return;
        }
        setIsLoading(true);
        setError('');
        setPretestCodeError('');
        try {
            if (!pretestCompleted) {
                const result = await onMarkPretestComplete(userId.trim(), pretestCode.trim());
                if (!result.verified) {
                    setPretestCodeError(result.message || 'That code doesn’t match. Please try again.');
                    return;
                }
            }
            await onSubmit(userId.trim(), effectiveVideoId || '');
        }
        catch (err) {
            console.error('Failed to continue to videos:', err);
            setError('Something went wrong. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleNextStep();
        }
    };
    const renderStatusBadge = (label, tone) => {
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
        };
        const color = palette[tone];
        return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, { component: "span", sx: {
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
            } }, label));
    };
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Dialog, { open: open, disableEscapeKeyDown: true, maxWidth: "sm", fullWidth: true, "aria-labelledby": "user-id-dialog-title", PaperProps: {
            sx: {
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0,0,0,0.18)'
            }
        } },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, { sx: {
                background: 'linear-gradient(135deg, #0969da 0%, #2a7de1 100%)',
                color: 'white',
                px: 4,
                py: 3
            } },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { id: "user-id-dialog-title", sx: { fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.2 } }, "Welcome to Tutorly"),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { sx: { fontSize: '0.9rem', opacity: 0.92, mt: 0.5 } }, "Your personal AI tutor for exploratory data analysis")),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.DialogContent, { sx: { px: 4, py: 3 } }, step === 'id' ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, null,
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", sx: { color: '#57606a', lineHeight: 1.5, mb: 2 } }, "To get started, enter the participant ID we provided. We use it to track your learning progress and personalize the session."),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.TextField, { autoFocus: true, fullWidth: true, label: "User ID", variant: "outlined", value: userId, onChange: e => {
                    setUserId(e.target.value);
                    setError('');
                }, onKeyPress: handleKeyPress, error: !!error, helperText: error || 'Example: john_doe, student_123, or jsmith', placeholder: "Enter your user ID" }))) : (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, null,
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, { sx: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2
                } },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", sx: { color: '#57606a' } },
                    "Participant ID:",
                    ' ',
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, { component: "span", sx: { fontWeight: 700, color: '#24292f' } }, userId.trim())),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Button, { size: "small", sx: {
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        color: '#0969da'
                    }, onClick: handleChangeUserId }, "Change")),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, { sx: {
                    p: 2,
                    mb: 2,
                    border: '1px solid #d8d8d8',
                    borderRadius: 1,
                    backgroundColor: '#fafafa'
                } },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "subtitle2", sx: { mb: 1 } }, "Study Progress"),
                studyProgress && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null,
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", sx: { mb: 0.5 } },
                        "Pre-test:",
                        studyProgress.pretestCompleted
                            ? renderStatusBadge('Completed', 'success')
                            : renderStatusBadge('Pending', 'warning')),
                    studyProgress.videoOrder.map((id, index) => {
                        const videoDone = studyProgress.finishedVideos.includes(id);
                        const postDone = studyProgress.completedVideos.includes(id);
                        const videoLabel = videoLabels[id] || id;
                        const statusLabel = videoDone
                            ? postDone
                                ? 'Video + Post-test Completed'
                                : 'Video Completed, Post-test Pending'
                            : 'Not Started';
                        const statusTone = videoDone
                            ? postDone
                                ? 'success'
                                : 'warning'
                            : 'neutral';
                        return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { key: id, variant: "body2", sx: { mb: 0.5 } },
                            "Video ",
                            index + 1,
                            " (",
                            videoLabel,
                            "):",
                            renderStatusBadge(statusLabel, statusTone)));
                    }),
                    studyProgress.pendingPosttest.available &&
                        studyProgress.pendingPosttest.questionnaireId &&
                        studyProgress.pendingPosttest.videoId && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, { sx: { mt: 1.5 } },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", sx: { mb: 1 } }, "Pending post-test available now. After submitting it, enter the completion code shown at the end of the survey."),
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Button, { variant: "outlined", size: "small", sx: { ...secondaryBtnSx, mb: 1.5 }, onClick: () => window.open(appendUserId(posttestUrls[studyProgress.pendingPosttest.questionnaireId], userId.trim()), '_blank') }, "Open Pending Post-test"),
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, { sx: {
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1
                            } },
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.TextField, { size: "small", label: "Completion code", value: posttestCode, error: !!posttestCodeError, helperText: posttestCodeError || '', onChange: e => {
                                    setPosttestCode(e.target.value);
                                    setPosttestCodeError('');
                                } }),
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Button, { variant: "contained", size: "small", sx: { ...primaryBtnSx, mt: 0.4 }, disabled: !posttestCode.trim() || isVerifyingPosttest, onClick: async () => {
                                    setIsVerifyingPosttest(true);
                                    setPosttestCodeError('');
                                    try {
                                        const result = await onMarkPendingPosttestComplete(userId.trim(), studyProgress.pendingPosttest.videoId, posttestCode.trim());
                                        if (!result.verified) {
                                            setPosttestCodeError(result.message ||
                                                'That code doesn’t match. Please try again.');
                                            return;
                                        }
                                        setPosttestCode('');
                                        const updated = await onGetStudyProgress(userId.trim());
                                        setStudyProgress(updated);
                                    }
                                    catch (err) {
                                        console.error('Failed to verify post-test code:', err);
                                        setPosttestCodeError('Failed to verify the code. Please try again.');
                                    }
                                    finally {
                                        setIsVerifyingPosttest(false);
                                    }
                                } }, "Submit Code")))),
                    studyProgress.studyCompleted && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", sx: { mt: 1 } }, "All study tasks are completed."))))),
            !pretestCompleted && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, { sx: {
                    p: 2,
                    mb: 2,
                    border: '1px solid #d32f2f',
                    borderRadius: 1,
                    backgroundColor: '#fff8f8'
                } },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "subtitle2", sx: { mb: 1 } }, "Pre-test required before video access"),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", sx: { mb: 1.5 } }, "Please finish the Qualtrics pre-test first. After submitting it, you will receive a completion code \u2014 enter it below to continue."),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Button, { variant: "outlined", size: "small", onClick: () => window.open(appendUserId(pretestUrl, userId.trim()), '_blank'), sx: { ...secondaryBtnSx, mb: 1.5 } }, "Open Pre-test"),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.TextField, { fullWidth: true, size: "small", label: "Pre-test completion code", value: pretestCode, error: !!pretestCodeError, helperText: pretestCodeError || '', onChange: e => {
                        setPretestCode(e.target.value);
                        setPretestCodeError('');
                    } }))),
            !isAssignedMode ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null,
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", sx: { mb: 1 } }, "Please select a video topic:"),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_RadioGroup__WEBPACK_IMPORTED_MODULE_2__["default"], { value: videoId, onChange: e => setVideoId(e.target.value), sx: { mb: 1 } },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_FormControlLabel__WEBPACK_IMPORTED_MODULE_3__["default"], { value: "EF4A4OtQprg", control: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_Radio__WEBPACK_IMPORTED_MODULE_4__["default"], null), label: "Seattle Pet Names" }),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_FormControlLabel__WEBPACK_IMPORTED_MODULE_3__["default"], { value: "1xsbTs9-a50", control: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_Radio__WEBPACK_IMPORTED_MODULE_4__["default"], null), label: "Franchise Revenue" }),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_FormControlLabel__WEBPACK_IMPORTED_MODULE_3__["default"], { value: "-1x8Kpyndss", control: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_Radio__WEBPACK_IMPORTED_MODULE_4__["default"], null), label: "Coffee Ratings" })))) : (assignedVideoId && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", sx: { fontWeight: 600 } },
                "Next video: ",
                (videoLabels === null || videoLabels === void 0 ? void 0 : videoLabels[assignedVideoId]) || assignedVideoId))),
            error && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", color: "error", sx: { mt: 1 } }, error))))),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.DialogActions, { sx: { px: 4, pb: 3, pt: 1 } }, step === 'id' ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Button, { onClick: handleNextStep, variant: "contained", sx: primaryBtnSx, disabled: !userId.trim() || isLoading }, isLoading ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.CircularProgress, { size: 18, sx: { color: 'white' } })) : ('Next Step'))) : (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Button, { onClick: handleContinue, variant: "contained", sx: primaryBtnSx, disabled: isLoading ||
                (!isAssignedMode && !effectiveVideoId) ||
                (!pretestCompleted && !pretestCode.trim()) }, isLoading ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.CircularProgress, { size: 18, sx: { color: 'white' } })) : ('Continue to Videos'))))));
};


/***/ }),

/***/ "./lib/handler.js":
/*!************************!*\
  !*** ./lib/handler.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   beaconAPI: () => (/* binding */ beaconAPI),
/* harmony export */   requestAPI: () => (/* binding */ requestAPI)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
async function requestAPI(endPoint = '', init = {}) {
    // Make request to Jupyter API
    const settings = _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeSettings();
    const requestUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(settings.baseUrl, 'jlab_ext_example', // API Namespace
    endPoint);
    let response;
    try {
        response = await _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeRequest(requestUrl, init, settings);
    }
    catch (error) {
        throw new _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.NetworkError(error);
    }
    let data = await response.text();
    if (data.length > 0) {
        try {
            data = JSON.parse(data);
        }
        catch (error) {
            console.log('Not a JSON response body.', response);
        }
    }
    if (!response.ok) {
        throw new _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.ResponseError(response, data.message || data);
    }
    return data;
}
/**
 * Best-effort POST that survives page unload, via navigator.sendBeacon.
 *
 * A normal fetch started in a `pagehide`/`beforeunload` handler is usually
 * cancelled by the browser, so it can't be used to log session end on close.
 * sendBeacon queues the request outside the page lifecycle. It can't set
 * headers, so the XSRF token is passed as the `_xsrf` query argument (Jupyter
 * accepts it there); the auth cookie is sent automatically for same-origin.
 * Returns false if the beacon could not be queued.
 */
function beaconAPI(endPoint, body) {
    var _a;
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
        return false;
    }
    const settings = _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeSettings();
    let requestUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(settings.baseUrl, 'jlab_ext_example', endPoint);
    const xsrf = (_a = document.cookie
        .split('; ')
        .find(row => row.startsWith('_xsrf='))) === null || _a === void 0 ? void 0 : _a.split('=')[1];
    if (xsrf) {
        requestUrl += `?_xsrf=${encodeURIComponent(xsrf)}`;
    }
    try {
        // text/plain avoids a CORS preflight and matches the other handlers,
        // which read the raw JSON body.
        const blob = new Blob([JSON.stringify(body)], { type: 'text/plain' });
        return navigator.sendBeacon(requestUrl, blob);
    }
    catch (error) {
        return false;
    }
}


/***/ }),

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_launcher__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/launcher */ "webpack/sharing/consume/default/@jupyterlab/launcher");
/* harmony import */ var _jupyterlab_launcher__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_launcher__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _Chat__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Chat */ "./lib/Chat.js");





/**
 * Tutorly launcher icon (a graduation cap). Defined inline as an SVG string so
 * it needs no webpack svg-loader configuration. Uses the app's blue accent.
 */
const tutorlyIconSvg = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 3 1 9l11 6 11-6-11-6z" fill="#0969da"/>
  <path d="M5 12.2V16c0 .4.2.7.5.9C7 17.7 9.4 19 12 19s5-1.3 6.5-2.1c.3-.2.5-.5.5-.9v-3.8l-7 3.8-7-3.8z" fill="#2a7de1"/>
  <path d="M21 9v5.5" stroke="#0969da" stroke-width="1.4" stroke-linecap="round"/>
</svg>
`;
const tutorlyIcon = new _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_2__.LabIcon({
    name: 'tutorly:icon',
    svgstr: tutorlyIconSvg
});
/**
 * The command IDs used by the react-widget plugin.
 */
var CommandIDs;
(function (CommandIDs) {
    CommandIDs.createChat = 'create-chat-widget';
})(CommandIDs || (CommandIDs = {}));
/**
 * Initialization data for the react-widget extension.
 */
const plugin = {
    id: '@jupyterlab-examples/server-extension:plugin',
    description: 'A minimal JupyterLab extension with backend and frontend parts.',
    autoStart: true,
    optional: [_jupyterlab_launcher__WEBPACK_IMPORTED_MODULE_1__.ILauncher, _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_3__.INotebookTracker],
    activate: (app, launcher, notebookTracker) => {
        const { commands } = app;
        // Create shared instance
        const sharedChatWidget = new _Chat__WEBPACK_IMPORTED_MODULE_4__.ChatWidget(notebookTracker);
        const createChatCommand = CommandIDs.createChat;
        commands.addCommand(createChatCommand, {
            caption: 'Open Tutorly',
            label: 'Tutorly',
            icon: args => (args['isPalette'] ? undefined : tutorlyIcon),
            execute: () => {
                // Use the shared instance when creating the ChatWidget
                const widget = new _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__.MainAreaWidget({
                    content: sharedChatWidget
                });
                widget.title.label = 'Tutorly';
                widget.title.icon = tutorlyIcon;
                app.shell.add(widget, 'main');
            }
        });
        if (launcher) {
            launcher.add({
                command: createChatCommand
            });
        }
    }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugin);


/***/ }),

/***/ "./node_modules/@mui/icons-material/ArrowForwardIos.js":
/*!*************************************************************!*\
  !*** ./node_modules/@mui/icons-material/ArrowForwardIos.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


"use client";

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ "./node_modules/@babel/runtime/helpers/interopRequireDefault.js");
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _createSvgIcon = _interopRequireDefault(__webpack_require__(/*! ./utils/createSvgIcon */ "./node_modules/@mui/icons-material/utils/createSvgIcon.js"));
var _jsxRuntime = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
var _default = exports["default"] = (0, _createSvgIcon.default)( /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
  d: "M6.23 20.23 8 22l10-10L8 2 6.23 3.77 14.46 12z"
}), 'ArrowForwardIos');

/***/ }),

/***/ "./node_modules/@mui/icons-material/utils/createSvgIcon.js":
/*!*****************************************************************!*\
  !*** ./node_modules/@mui/icons-material/utils/createSvgIcon.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


'use client';

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
Object.defineProperty(exports, "default", ({
  enumerable: true,
  get: function () {
    return _utils.createSvgIcon;
  }
}));
var _utils = __webpack_require__(/*! @mui/material/utils */ "./node_modules/@mui/material/utils/index.js");

/***/ })

}]);
//# sourceMappingURL=lib_index_js.cbe0197cd227c76a5672.js.map