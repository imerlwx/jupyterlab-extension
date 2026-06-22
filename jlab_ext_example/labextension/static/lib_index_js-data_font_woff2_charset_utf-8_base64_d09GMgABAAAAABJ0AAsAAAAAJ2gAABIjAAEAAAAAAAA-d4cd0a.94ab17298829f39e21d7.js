"use strict";
(self["webpackChunkjlab_ext_example"] = self["webpackChunkjlab_ext_example"] || []).push([["lib_index_js-data_font_woff2_charset_utf-8_base64_d09GMgABAAAAABJ0AAsAAAAAJ2gAABIjAAEAAAAAAAA-d4cd0a"],{

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
    const [lastSegmentWatched, setLastSegmentWatched] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
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
                }, disabled: isSubmitted || allEmpty, sx: {
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    marginTop: '6px',
                    textTransform: 'none',
                    borderRadius: '6px'
                } }, isSubmitted ? 'Submitted' : 'Submit'),
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
                        } }, whatToNotice || '(unavailable)')) : (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Button, { variant: "outlined", size: "small", onClick: () => setRevealed(true), sx: {
                            textTransform: 'none',
                            fontSize: '0.78rem',
                            padding: '2px 12px',
                            borderRadius: '6px',
                            color: '#0969da',
                            borderColor: '#0969da',
                            '&:hover': { background: '#ddf4ff' }
                        } }, "Reveal"))))));
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
        setLastSegmentWatched(false);
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
    const handleCheckPretestStatus = async (submittedUserId) => {
        const response = await (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('get_pretest_status', {
            body: JSON.stringify({ userId: submittedUserId }),
            method: 'POST'
        });
        return !!response.pretestCompleted;
    };
    const handleMarkPretestComplete = async (submittedUserId) => {
        await (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('mark_pretest_complete', {
            body: JSON.stringify({ userId: submittedUserId }),
            method: 'POST'
        });
    };
    const handleGetStudyProgress = async (submittedUserId) => {
        return (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('get_study_progress', {
            body: JSON.stringify({ userId: submittedUserId }),
            method: 'POST'
        });
    };
    const handleMarkPendingPosttestComplete = async (submittedUserId, completedVideoId) => {
        await (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('mark_posttest_complete', {
            body: JSON.stringify({
                userId: submittedUserId,
                videoId: completedVideoId
            }),
            method: 'POST'
        });
    };
    const handleMarkPosttestComplete = async (submittedUserId, completedVideoId, messageId) => {
        await (0,_handler__WEBPACK_IMPORTED_MODULE_10__.requestAPI)('mark_posttest_complete', {
            body: JSON.stringify({
                userId: submittedUserId,
                videoId: completedVideoId
            }),
            method: 'POST'
        });
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
        react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_UserIDDialog__WEBPACK_IMPORTED_MODULE_13__.UserIDDialog, { open: showUserIDDialog, pretestUrl: PRETEST_QUALTRICS_URL, posttestUrls: POSTTEST_QUALTRICS_URLS, videoLabels: VIDEO_LABELS, videoSelectionMode: USE_RANDOM_VIDEO_ASSIGNMENT ? 'assigned' : 'manual', onSubmit: handleUserIDSubmit, onCheckPretestStatus: handleCheckPretestStatus, onMarkPretestComplete: handleMarkPretestComplete, onGetStudyProgress: handleGetStudyProgress, onMarkPendingPosttestComplete: handleMarkPendingPosttestComplete }),
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
                                            padding: '6px 14px',
                                            fontSize: '0.8rem',
                                            marginTop: '10px',
                                            alignSelf: 'flex-start',
                                            textTransform: 'none',
                                            borderRadius: '6px'
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
                            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Typography, { variant: "body2", sx: { mb: 1.5 } }, "Open the assigned questionnaire and submit it before starting your next video."),
                            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Button, { variant: "outlined", size: "small", sx: { mr: 1 }, onClick: () => {
                                    // Append the participant's ID so the Qualtrics
                                    // response can be linked back to this user.
                                    const base = message.posttestUrl || '';
                                    const sep = base.includes('?') ? '&' : '?';
                                    const url = `${base}${sep}userId=${encodeURIComponent(userId)}`;
                                    window.open(url, '_blank');
                                } }, "Open Post-test"),
                            react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_5__.Button, { variant: "contained", size: "small", disabled: !!message.posttestConfirmed, onClick: () => {
                                    void handleMarkPosttestComplete(userId, videoId, message.id);
                                } }, message.posttestConfirmed
                                ? 'Post-test Recorded'
                                : 'I Completed the Post-test'))),
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
                                        const lastSegment = segments.length > 0
                                            ? segments[segments.length - 1]
                                            : null;
                                        const isLastSegmentVideo = !!lastSegment &&
                                            message.start === lastSegment.start &&
                                            message.end === lastSegment.end;
                                        if (isLastSegmentVideo) {
                                            setLastSegmentWatched(true);
                                        }
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
                        const dslReady = userCondition === 'control' ? true : canGoOn;
                        return (lastSegmentWatched &&
                            dslReady &&
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

/***/ "./lib/DataTable.js":
/*!**************************!*\
  !*** ./lib/DataTable.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DataTableWidget: () => (/* binding */ DataTableWidget)
/* harmony export */ });
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! axios */ "webpack/sharing/consume/default/axios/axios");
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(axios__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var ag_grid_react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ag-grid-react */ "webpack/sharing/consume/default/ag-grid-react/ag-grid-react");
/* harmony import */ var ag_grid_react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(ag_grid_react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var ag_grid_community_styles_ag_grid_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ag-grid-community/styles/ag-grid.css */ "./node_modules/ag-grid-community/styles/ag-grid.css");
/* harmony import */ var ag_grid_community_styles_ag_theme_alpine_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ag-grid-community/styles/ag-theme-alpine.css */ "./node_modules/ag-grid-community/styles/ag-theme-alpine.css");
/* harmony import */ var papaparse__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! papaparse */ "webpack/sharing/consume/default/papaparse/papaparse");
/* harmony import */ var papaparse__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(papaparse__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _handler__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./handler */ "./lib/handler.js");
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @mui/material */ "webpack/sharing/consume/default/@mui/material/@mui/material");
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_mui_material__WEBPACK_IMPORTED_MODULE_7__);









const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    editable: true
};
function parseCsv(csvData) {
    let parsedData = [];
    papaparse__WEBPACK_IMPORTED_MODULE_5___default().parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            parsedData = results.data;
        }
    });
    return parsedData;
}
const DataTableComponent = (props) => {
    const [csvData, setCsvData] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);
    const [tabValue, setTabValue] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(0);
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
        (0,_handler__WEBPACK_IMPORTED_MODULE_8__.requestAPI)('data', {
            body: JSON.stringify({ videoId: props.videoId }),
            method: 'POST'
        })
            .then(response => {
            Promise.all(response.map((csvFile) => axios__WEBPACK_IMPORTED_MODULE_0___default().get(csvFile.download_url).then(res => {
                const data = parseCsv(res.data);
                const columns = Object.keys(data[0]).map(key => ({
                    headerName: key,
                    field: key
                }));
                return { name: csvFile.name, data: data, columns: columns };
            })))
                .then(data => {
                console.log(data);
                setCsvData(data);
            })
                .catch(error => console.log(error));
        })
            .catch(reason => {
            console.error(`Error on POST /jlab_ext_example/data ${props.videoId}.\n${reason}`);
        });
    }, [props.videoId]);
    const handleChange = (event, newValue) => {
        setTabValue(newValue);
    };
    return (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_7__.Paper, { elevation: 3, sx: { borderRadius: 2, backgroundColor: '#e0e0e0' } },
        react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_7__.Tabs, { value: tabValue, onChange: handleChange, variant: "scrollable", scrollButtons: "auto" }, csvData.map((data, index) => (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_7__.Tab, { label: data.name, key: index })))),
        react__WEBPACK_IMPORTED_MODULE_1___default().createElement("div", { className: "ag-theme-alpine", style: { height: 400, width: '100%', overflow: 'auto' } }, csvData.map((data, index) => tabValue === index && (react__WEBPACK_IMPORTED_MODULE_1___default().createElement(ag_grid_react__WEBPACK_IMPORTED_MODULE_2__.AgGridReact, { columnDefs: data.columns, rowData: data.data, defaultColDef: defaultColDef, animateRows: true, rowSelection: "multiple", onGridReady: params => params.api.sizeColumnsToFit(), onCellValueChanged: event => console.log('Cell Value Changed', event), onSelectionChanged: event => console.log('Row Selected', event), key: index }))))));
};
class DataTableWidget extends _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_6__.ReactWidget {
    constructor(ChatWidget) {
        super();
        this._videoId = '';
        this._onVideoIdChanged = (emitter, videoId) => {
            this._videoId = videoId.videoId;
            this.update();
        };
        this.addClass('jp-react-widget');
        ChatWidget.videoIdChanged.connect(this._onVideoIdChanged, this);
    }
    render() {
        return react__WEBPACK_IMPORTED_MODULE_1___default().createElement(DataTableComponent, { videoId: this._videoId });
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
const UserIDDialog = ({ open, pretestUrl, videoSelectionMode = 'manual', videoLabels, posttestUrls, onSubmit, onCheckPretestStatus, onMarkPretestComplete, onGetStudyProgress, onMarkPendingPosttestComplete }) => {
    const [userId, setUserId] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
    const [videoId, setVideoId] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
    const [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
    const [isLoading, setIsLoading] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [needsPretest, setNeedsPretest] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [hasConfirmedPretest, setHasConfirmedPretest] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [studyProgress, setStudyProgress] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
    const [isLoadingProgress, setIsLoadingProgress] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [progressError, setProgressError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
    const isAssignedMode = videoSelectionMode === 'assigned';
    const assignedVideoId = (studyProgress === null || studyProgress === void 0 ? void 0 : studyProgress.videoOrder.find(id => !studyProgress.completedVideos.includes(id))) || '';
    const effectiveVideoId = isAssignedMode ? assignedVideoId || '' : videoId;
    const isValidUserId = (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return false;
        }
        const userIdPattern = /^[a-zA-Z0-9_-]+$/;
        return userIdPattern.test(trimmed);
    };
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        const trimmed = userId.trim();
        if (!isValidUserId(trimmed)) {
            setStudyProgress(null);
            setProgressError('');
            return;
        }
        const timer = setTimeout(async () => {
            try {
                setIsLoadingProgress(true);
                setProgressError('');
                const progress = await onGetStudyProgress(trimmed);
                setStudyProgress(progress);
            }
            catch (err) {
                console.error('Failed to load study progress:', err);
                setProgressError('Failed to load progress.');
            }
            finally {
                setIsLoadingProgress(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [userId, onGetStudyProgress]);
    const validateUserInput = () => {
        if (!userId.trim()) {
            setError('Please enter a user ID');
            return false;
        }
        // Validate user ID format (alphanumeric, hyphens, underscores)
        const userIdPattern = /^[a-zA-Z0-9_-]+$/;
        if (!userIdPattern.test(userId.trim())) {
            setError('User ID can only contain letters, numbers, hyphens, and underscores');
            return false;
        }
        if (!isAssignedMode && !effectiveVideoId) {
            setError('Please select a video topic');
            return false;
        }
        return true;
    };
    const handleSubmit = async () => {
        if (!validateUserInput()) {
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const pretestCompleted = await onCheckPretestStatus(userId.trim());
            if (pretestCompleted) {
                await onSubmit(userId.trim(), effectiveVideoId || '');
                return;
            }
            setNeedsPretest(true);
        }
        catch (err) {
            console.error('Failed to check pre-test status:', err);
            setError('Failed to check pre-test status. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleConfirmPretest = async () => {
        setIsLoading(true);
        setError('');
        try {
            await onMarkPretestComplete(userId.trim());
            await onSubmit(userId.trim(), effectiveVideoId || '');
        }
        catch (err) {
            console.error('Failed to mark pre-test as completed:', err);
            setError('Failed to save pre-test completion. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSubmit();
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
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.DialogContent, { sx: { px: 4, py: 3 } },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, null,
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", sx: { color: '#57606a', lineHeight: 1.5, mb: 1 } }, "To get started, enter the participant ID we provided. We use it to track your learning progress and personalize the session."),
                !isAssignedMode ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null,
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", sx: { mt: 2, mb: 2 } }, "Please select a video topic:"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_RadioGroup__WEBPACK_IMPORTED_MODULE_2__["default"], { value: videoId, onChange: e => setVideoId(e.target.value), sx: { mb: 3 } },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_FormControlLabel__WEBPACK_IMPORTED_MODULE_3__["default"], { value: "EF4A4OtQprg", control: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_Radio__WEBPACK_IMPORTED_MODULE_4__["default"], null), label: "Seattle Pet Names" }),
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_FormControlLabel__WEBPACK_IMPORTED_MODULE_3__["default"], { value: "1xsbTs9-a50", control: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_Radio__WEBPACK_IMPORTED_MODULE_4__["default"], null), label: "Franchise Revenue" }),
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_FormControlLabel__WEBPACK_IMPORTED_MODULE_3__["default"], { value: "-1x8Kpyndss", control: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_Radio__WEBPACK_IMPORTED_MODULE_4__["default"], null), label: "Coffee Ratings" })))) : (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, { sx: { mt: 2, mb: 2 } }, assignedVideoId && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", sx: { mt: 1, fontWeight: 600 } },
                    "Next video:",
                    ' ',
                    (videoLabels === null || videoLabels === void 0 ? void 0 : videoLabels[assignedVideoId]) || assignedVideoId)))),
                isValidUserId(userId) && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, { sx: {
                        p: 2,
                        mb: 2,
                        border: '1px solid #d8d8d8',
                        borderRadius: 1,
                        backgroundColor: '#fafafa'
                    } },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "subtitle2", sx: { mb: 1 } }, "Study Progress"),
                    isLoadingProgress && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2" }, "Loading progress...")),
                    progressError && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", color: "error" }, progressError)),
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
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", sx: { mb: 1 } }, "Pending post-test available now."),
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Button, { variant: "outlined", size: "small", sx: { ...secondaryBtnSx, mr: 1 }, onClick: () => window.open(appendUserId(posttestUrls[studyProgress.pendingPosttest.questionnaireId], userId.trim()), '_blank') }, "Open Pending Post-test"),
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Button, { variant: "contained", size: "small", sx: primaryBtnSx, onClick: async () => {
                                    await onMarkPendingPosttestComplete(userId.trim(), studyProgress.pendingPosttest.videoId);
                                    const updated = await onGetStudyProgress(userId.trim());
                                    setStudyProgress(updated);
                                } }, "I Completed This Post-test"))),
                        studyProgress.studyCompleted && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", sx: { mt: 1 } }, "All study tasks are completed.")))))),
                needsPretest && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, { sx: {
                        p: 2,
                        mb: 2,
                        border: '1px solid #d32f2f',
                        borderRadius: 1,
                        backgroundColor: '#fff8f8'
                    } },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "subtitle2", sx: { mb: 1 } }, "Pre-test required before video access"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Typography, { variant: "body2", sx: { mb: 1.5 } }, "Please finish the Qualtrics pre-test first. After submitting it, click \"I Completed the Pre-test\" to continue."),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Button, { variant: "outlined", size: "small", onClick: () => window.open(appendUserId(pretestUrl, userId.trim()), '_blank'), sx: { ...secondaryBtnSx, mr: 1 } }, "Open Pre-test"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Button, { variant: hasConfirmedPretest ? 'contained' : 'outlined', size: "small", onClick: () => setHasConfirmedPretest(true), sx: hasConfirmedPretest ? primaryBtnSx : secondaryBtnSx }, "I Completed the Pre-test"))),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.TextField, { autoFocus: true, fullWidth: true, label: "User ID", variant: "outlined", value: userId, onChange: e => {
                        setUserId(e.target.value);
                        setError('');
                    }, onKeyPress: handleKeyPress, error: !!error, helperText: error || 'Example: john_doe, student_123, or jsmith', placeholder: "Enter your user ID" }))),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.DialogActions, { sx: { px: 4, pb: 3, pt: 1 } }, !needsPretest ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Button, { onClick: handleSubmit, variant: "contained", sx: primaryBtnSx, disabled: !userId.trim() ||
                (!isAssignedMode && !effectiveVideoId) ||
                isLoading }, isLoading ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.CircularProgress, { size: 18, sx: { color: 'white' } })) : ('Start Learning'))) : (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Button, { onClick: handleConfirmPretest, variant: "contained", sx: primaryBtnSx, disabled: !hasConfirmedPretest || isLoading }, isLoading ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.CircularProgress, { size: 18, sx: { color: 'white' } })) : ('Continue to Videos'))))));
};


/***/ }),

/***/ "./lib/handler.js":
/*!************************!*\
  !*** ./lib/handler.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
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
/* harmony import */ var _DataTable__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./DataTable */ "./lib/DataTable.js");
/* harmony import */ var _Chat__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Chat */ "./lib/Chat.js");






/**
 * The command IDs used by the react-widget plugin.
 */
var CommandIDs;
(function (CommandIDs) {
    CommandIDs.createDataTable = 'create-datatable-widget';
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
        // Create shared instances
        const sharedChatWidget = new _Chat__WEBPACK_IMPORTED_MODULE_4__.ChatWidget(notebookTracker);
        const createDataTableCommand = CommandIDs.createDataTable;
        commands.addCommand(createDataTableCommand, {
            caption: 'Create a new Data Table Widget',
            label: 'Data Table Widget',
            icon: args => (args['isPalette'] ? undefined : _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_2__.reactIcon),
            execute: () => {
                // Use the shared instance when creating the DataTableWidget
                const content = new _DataTable__WEBPACK_IMPORTED_MODULE_5__.DataTableWidget(sharedChatWidget);
                const widget = new _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__.MainAreaWidget({ content });
                widget.title.label = 'Data Table Widget';
                widget.title.icon = _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_2__.reactIcon;
                app.shell.add(widget, 'main');
            }
        });
        const createChatCommand = CommandIDs.createChat;
        commands.addCommand(createChatCommand, {
            caption: 'Create a new Chat Widget',
            label: 'Chat Widget',
            icon: args => (args['isPalette'] ? undefined : _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_2__.reactIcon),
            execute: () => {
                // Use the shared instance when creating the ChatWidget
                const widget = new _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__.MainAreaWidget({
                    content: sharedChatWidget
                });
                widget.title.label = 'Chat Widget';
                widget.title.icon = _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_2__.reactIcon;
                app.shell.add(widget, 'main');
            }
        });
        if (launcher) {
            launcher.add({
                command: createDataTableCommand
            });
            launcher.add({
                command: createChatCommand
            });
        }
    }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugin);


/***/ }),

/***/ "data:font/woff2;charset=utf-8;base64,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":
/*!*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** data:font/woff2;charset=utf-8;base64,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 ***!
  \*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = "data:font/woff2;charset=utf-8;base64,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";

/***/ }),

/***/ "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDIzNSA0MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxuczpzZXJpZj0iaHR0cDovL3d3dy5zZXJpZi5jb20vIiBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjI7Ij4KICAgIDxnIHRyYW5zZm9ybT0ibWF0cml4KDAuNjM1NzIzLDAsMCwwLjYzNTcyMywtNDkyLjkyMSwtMzIzLjYwOCkiPgogICAgICAgIDxwYXRoIGQ9Ik0xMDk5LjQsNTQ5LjRMMTA5OS40LDUzNi45TDEwNzguMSw1MzYuOUwxMDY1LjYsNTQ5LjRMMTA5OS40LDU0OS40WiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNMTEyMy40LDUxOC40TDEwOTYuNyw1MTguNEwxMDg0LjEsNTMwLjlMMTEyMy40LDUzMC45TDExMjMuNCw1MTguNFoiIHN0eWxlPSJmaWxsOnJnYigyNCwyOSwzMSk7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICAgICAgPHBhdGggZD0iTTEwNTMuMiw1NjEuOUwxMDU5LjYsNTU1LjVMMTA4MS4yLDU1NS41TDEwODEuMiw1NjhMMTA1My4yLDU2OEwxMDUzLjIsNTYxLjlaIiBzdHlsZT0iZmlsbDpyZ2IoMjQsMjksMzEpO2ZpbGwtcnVsZTpub256ZXJvOyIvPgogICAgICAgIDxwYXRoIGQ9Ik0xMDU3LjksNTQzLjNMMTA3MS43LDU0My4zTDEwODQuMyw1MzAuOEwxMDU3LjksNTMwLjhMMTA1Ny45LDU0My4zWiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNMTA0Mi44LDU2MS45TDEwNTMuMiw1NjEuOUwxMDY1LjYsNTQ5LjRMMTA0Mi44LDU0OS40TDEwNDIuOCw1NjEuOVoiIHN0eWxlPSJmaWxsOnJnYigyNCwyOSwzMSk7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICAgICAgPHBhdGggZD0iTTEwOTYuNyw1MTguNEwxMDkwLjMsNTI0LjhMMTA0OS41LDUyNC44TDEwNDkuNSw1MTIuM0wxMDk2LjcsNTEyLjNMMTA5Ni43LDUxOC40WiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNODI4LjYsNTU5LjdMODA5LDU1OS43TDgwNS42LDU2OC4xTDc5Nyw1NjguMUw4MTUuMSw1MjUuN0w4MjIuNiw1MjUuN0w4NDAuNyw1NjguMUw4MzIsNTY4LjFMODI4LjYsNTU5LjdaTTgyNS45LDU1M0w4MTguOCw1MzUuN0w4MTEuNyw1NTNMODI1LjksNTUzWiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNOTYwLjEsNTQxLjNDOTYyLjYsNTM3LjYgOTY4LjksNTM3LjIgOTcxLjUsNTM3LjJMOTcxLjUsNTQ0LjRDOTY4LjMsNTQ0LjQgOTY1LjEsNTQ0LjUgOTYzLjIsNTQ1LjlDOTYxLjMsNTQ3LjMgOTYwLjMsNTQ5LjIgOTYwLjMsNTUxLjVMOTYwLjMsNTY4LjFMOTUyLjUsNTY4LjFMOTUyLjUsNTM3LjJMOTYwLDUzNy4yTDk2MC4xLDU0MS4zWiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cmVjdCB4PSI5NzUuOCIgeT0iNTM3LjIiIHdpZHRoPSI3LjgiIGhlaWdodD0iMzAuOSIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTsiLz4KICAgICAgICA8cmVjdCB4PSI5NzUuOCIgeT0iNTIzLjQiIHdpZHRoPSI3LjgiIGhlaWdodD0iOS4yIiBzdHlsZT0iZmlsbDpyZ2IoMjQsMjksMzEpOyIvPgogICAgICAgIDxwYXRoIGQ9Ik0xMDIyLjMsNTIzLjRMMTAyMi4zLDU2OC4xTDEwMTQuOCw1NjguMUwxMDE0LjYsNTYzLjRDMTAxMy41LDU2NSAxMDEyLjEsNTY2LjMgMTAxMC40LDU2Ny4zQzEwMDguNyw1NjguMiAxMDA2LjYsNTY4LjcgMTAwNC4yLDU2OC43QzEwMDIuMSw1NjguNyAxMDAwLjEsNTY4LjMgOTk4LjQsNTY3LjZDOTk2LjYsNTY2LjggOTk1LDU2NS44IDk5My43LDU2NC40Qzk5Mi40LDU2MyA5OTEuMyw1NjEuMyA5OTAuNiw1NTkuNEM5ODkuOCw1NTcuNSA5ODkuNSw1NTUuMyA5ODkuNSw1NTIuOUM5ODkuNSw1NTAuNSA5ODkuOSw1NDguMyA5OTAuNiw1NDYuM0M5OTEuNCw1NDQuMyA5OTIuNCw1NDIuNiA5OTMuNyw1NDEuMkM5OTUsNTM5LjggOTk2LjYsNTM4LjcgOTk4LjQsNTM3LjlDMTAwMC4yLDUzNy4xIDEwMDIuMSw1MzYuNyAxMDA0LjIsNTM2LjdDMTAwNi42LDUzNi43IDEwMDguNiw1MzcuMSAxMDEwLjMsNTM4QzEwMTIsNTM4LjkgMTAxMy40LDU0MC4xIDEwMTQuNSw1NDEuOEwxMDE0LjUsNTIzLjVMMTAyMi4zLDUyMy41TDEwMjIuMyw1MjMuNFpNMTAwNS45LDU2MkMxMDA4LjUsNTYyIDEwMTAuNSw1NjEuMSAxMDEyLjEsNTU5LjRDMTAxMy43LDU1Ny43IDEwMTQuNSw1NTUuNCAxMDE0LjUsNTUyLjZDMTAxNC41LDU0OS44IDEwMTMuNyw1NDcuNiAxMDEyLjEsNTQ1LjhDMTAxMC41LDU0NC4xIDEwMDguNSw1NDMuMiAxMDA1LjksNTQzLjJDMTAwMy40LDU0My4yIDEwMDEuMyw1NDQuMSA5OTkuOCw1NDUuOEM5OTguMiw1NDcuNSA5OTcuNCw1NDkuOCA5OTcuNCw1NTIuNkM5OTcuNCw1NTUuNCA5OTguMiw1NTcuNiA5OTkuOCw1NTkuM0MxMDAxLjQsNTYxLjEgMTAwMy40LDU2MiAxMDA1LjksNTYyIiBzdHlsZT0iZmlsbDpyZ2IoMjQsMjksMzEpO2ZpbGwtcnVsZTpub256ZXJvOyIvPgogICAgICAgIDxwYXRoIGQ9Ik04ODUuOCw1NDQuMkw4NjYuNSw1NDQuMkw4NjYuNSw1NTAuOUw4NzcuNSw1NTAuOUM4NzcuMiw1NTQuMyA4NzUuOSw1NTYuOSA4NzMuNyw1NTlDODcxLjUsNTYxIDg2OC43LDU2MiA4NjUuMSw1NjJDODYzLjEsNTYyIDg2MS4yLDU2MS42IDg1OS42LDU2MC45Qzg1Ny45LDU2MC4yIDg1Ni41LDU1OS4yIDg1NS4zLDU1Ny44Qzg1NC4xLDU1Ni41IDg1My4yLDU1NC45IDg1Mi41LDU1M0M4NTEuOCw1NTEuMSA4NTEuNSw1NDkuMSA4NTEuNSw1NDYuOEM4NTEuNSw1NDQuNSA4NTEuOCw1NDIuNSA4NTIuNSw1NDAuNkM4NTMuMSw1MzguNyA4NTQuMSw1MzcuMiA4NTUuMyw1MzUuOEM4NTYuNSw1MzQuNSA4NTcuOSw1MzMuNSA4NTkuNiw1MzIuN0M4NjEuMyw1MzIgODYzLjEsNTMxLjYgODY1LjIsNTMxLjZDODY5LjQsNTMxLjYgODcyLjYsNTMyLjYgODc0LjgsNTM0LjZMODgwLDUyOS40Qzg3Ni4xLDUyNi40IDg3MS4xLDUyNC44IDg2NS4yLDUyNC44Qzg2MS45LDUyNC44IDg1OC45LDUyNS4zIDg1Ni4yLDUyNi40Qzg1My41LDUyNy41IDg1MS4yLDUyOC45IDg0OS4zLDUzMC44Qzg0Ny40LDUzMi43IDg0NS45LDUzNSA4NDQuOSw1MzcuN0M4NDMuOSw1NDAuNCA4NDMuNCw1NDMuNCA4NDMuNCw1NDYuNkM4NDMuNCw1NDkuOCA4NDMuOSw1NTIuOCA4NDUsNTU1LjVDODQ2LjEsNTU4LjIgODQ3LjUsNTYwLjUgODQ5LjQsNTYyLjRDODUxLjMsNTY0LjMgODUzLjYsNTY1LjggODU2LjMsNTY2LjhDODU5LDU2Ny45IDg2Miw1NjguNCA4NjUuMiw1NjguNEM4NjguNCw1NjguNCA4NzEuMyw1NjcuOSA4NzMuOSw1NjYuOEM4NzYuNSw1NjUuNyA4NzguNyw1NjQuMyA4ODAuNSw1NjIuNEM4ODIuMyw1NjAuNSA4ODMuNyw1NTguMiA4ODQuNyw1NTUuNUM4ODUuNyw1NTIuOCA4ODYuMiw1NDkuOCA4ODYuMiw1NDYuNkw4ODYuMiw1NDUuM0M4ODUuOSw1NDUuMSA4ODUuOCw1NDQuNiA4ODUuOCw1NDQuMiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNOTQ2LjgsNTQ0LjJMOTI3LjUsNTQ0LjJMOTI3LjUsNTUwLjlMOTM4LjUsNTUwLjlDOTM4LjIsNTU0LjMgOTM2LjksNTU2LjkgOTM0LjcsNTU5QzkzMi41LDU2MSA5MjkuNyw1NjIgOTI2LjEsNTYyQzkyNC4xLDU2MiA5MjIuMiw1NjEuNiA5MjAuNiw1NjAuOUM5MTguOSw1NjAuMiA5MTcuNSw1NTkuMiA5MTYuMyw1NTcuOEM5MTUuMSw1NTYuNSA5MTQuMiw1NTQuOSA5MTMuNSw1NTNDOTEyLjgsNTUxLjEgOTEyLjUsNTQ5LjEgOTEyLjUsNTQ2LjhDOTEyLjUsNTQ0LjUgOTEyLjgsNTQyLjUgOTEzLjUsNTQwLjZDOTE0LjEsNTM4LjcgOTE1LjEsNTM3LjIgOTE2LjMsNTM1LjhDOTE3LjUsNTM0LjUgOTE4LjksNTMzLjUgOTIwLjYsNTMyLjdDOTIyLjMsNTMyIDkyNC4xLDUzMS42IDkyNi4yLDUzMS42QzkzMC40LDUzMS42IDkzMy42LDUzMi42IDkzNS44LDUzNC42TDk0MSw1MjkuNEM5MzcuMSw1MjYuNCA5MzIuMSw1MjQuOCA5MjYuMiw1MjQuOEM5MjIuOSw1MjQuOCA5MTkuOSw1MjUuMyA5MTcuMiw1MjYuNEM5MTQuNSw1MjcuNSA5MTIuMiw1MjguOSA5MTAuMyw1MzAuOEM5MDguNCw1MzIuNyA5MDYuOSw1MzUgOTA1LjksNTM3LjdDOTA0LjksNTQwLjQgOTA0LjQsNTQzLjQgOTA0LjQsNTQ2LjZDOTA0LjQsNTQ5LjggOTA0LjksNTUyLjggOTA2LDU1NS41QzkwNy4xLDU1OC4yIDkwOC41LDU2MC41IDkxMC40LDU2Mi40QzkxMi4zLDU2NC4zIDkxNC42LDU2NS44IDkxNy4zLDU2Ni44QzkyMCw1NjcuOSA5MjMsNTY4LjQgOTI2LjIsNTY4LjRDOTI5LjQsNTY4LjQgOTMyLjMsNTY3LjkgOTM0LjksNTY2LjhDOTM3LjUsNTY1LjcgOTM5LjcsNTY0LjMgOTQxLjUsNTYyLjRDOTQzLjMsNTYwLjUgOTQ0LjcsNTU4LjIgOTQ1LjcsNTU1LjVDOTQ2LjcsNTUyLjggOTQ3LjIsNTQ5LjggOTQ3LjIsNTQ2LjZMOTQ3LjIsNTQ1LjNDOTQ2LjksNTQ1LjEgOTQ2LjgsNTQ0LjYgOTQ2LjgsNTQ0LjIiIHN0eWxlPSJmaWxsOnJnYigyNCwyOSwzMSk7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICA8L2c+Cjwvc3ZnPgo=":
/*!**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDIzNSA0MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxuczpzZXJpZj0iaHR0cDovL3d3dy5zZXJpZi5jb20vIiBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjI7Ij4KICAgIDxnIHRyYW5zZm9ybT0ibWF0cml4KDAuNjM1NzIzLDAsMCwwLjYzNTcyMywtNDkyLjkyMSwtMzIzLjYwOCkiPgogICAgICAgIDxwYXRoIGQ9Ik0xMDk5LjQsNTQ5LjRMMTA5OS40LDUzNi45TDEwNzguMSw1MzYuOUwxMDY1LjYsNTQ5LjRMMTA5OS40LDU0OS40WiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNMTEyMy40LDUxOC40TDEwOTYuNyw1MTguNEwxMDg0LjEsNTMwLjlMMTEyMy40LDUzMC45TDExMjMuNCw1MTguNFoiIHN0eWxlPSJmaWxsOnJnYigyNCwyOSwzMSk7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICAgICAgPHBhdGggZD0iTTEwNTMuMiw1NjEuOUwxMDU5LjYsNTU1LjVMMTA4MS4yLDU1NS41TDEwODEuMiw1NjhMMTA1My4yLDU2OEwxMDUzLjIsNTYxLjlaIiBzdHlsZT0iZmlsbDpyZ2IoMjQsMjksMzEpO2ZpbGwtcnVsZTpub256ZXJvOyIvPgogICAgICAgIDxwYXRoIGQ9Ik0xMDU3LjksNTQzLjNMMTA3MS43LDU0My4zTDEwODQuMyw1MzAuOEwxMDU3LjksNTMwLjhMMTA1Ny45LDU0My4zWiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNMTA0Mi44LDU2MS45TDEwNTMuMiw1NjEuOUwxMDY1LjYsNTQ5LjRMMTA0Mi44LDU0OS40TDEwNDIuOCw1NjEuOVoiIHN0eWxlPSJmaWxsOnJnYigyNCwyOSwzMSk7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICAgICAgPHBhdGggZD0iTTEwOTYuNyw1MTguNEwxMDkwLjMsNTI0LjhMMTA0OS41LDUyNC44TDEwNDkuNSw1MTIuM0wxMDk2LjcsNTEyLjNMMTA5Ni43LDUxOC40WiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNODI4LjYsNTU5LjdMODA5LDU1OS43TDgwNS42LDU2OC4xTDc5Nyw1NjguMUw4MTUuMSw1MjUuN0w4MjIuNiw1MjUuN0w4NDAuNyw1NjguMUw4MzIsNTY4LjFMODI4LjYsNTU5LjdaTTgyNS45LDU1M0w4MTguOCw1MzUuN0w4MTEuNyw1NTNMODI1LjksNTUzWiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNOTYwLjEsNTQxLjNDOTYyLjYsNTM3LjYgOTY4LjksNTM3LjIgOTcxLjUsNTM3LjJMOTcxLjUsNTQ0LjRDOTY4LjMsNTQ0LjQgOTY1LjEsNTQ0LjUgOTYzLjIsNTQ1LjlDOTYxLjMsNTQ3LjMgOTYwLjMsNTQ5LjIgOTYwLjMsNTUxLjVMOTYwLjMsNTY4LjFMOTUyLjUsNTY4LjFMOTUyLjUsNTM3LjJMOTYwLDUzNy4yTDk2MC4xLDU0MS4zWiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cmVjdCB4PSI5NzUuOCIgeT0iNTM3LjIiIHdpZHRoPSI3LjgiIGhlaWdodD0iMzAuOSIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTsiLz4KICAgICAgICA8cmVjdCB4PSI5NzUuOCIgeT0iNTIzLjQiIHdpZHRoPSI3LjgiIGhlaWdodD0iOS4yIiBzdHlsZT0iZmlsbDpyZ2IoMjQsMjksMzEpOyIvPgogICAgICAgIDxwYXRoIGQ9Ik0xMDIyLjMsNTIzLjRMMTAyMi4zLDU2OC4xTDEwMTQuOCw1NjguMUwxMDE0LjYsNTYzLjRDMTAxMy41LDU2NSAxMDEyLjEsNTY2LjMgMTAxMC40LDU2Ny4zQzEwMDguNyw1NjguMiAxMDA2LjYsNTY4LjcgMTAwNC4yLDU2OC43QzEwMDIuMSw1NjguNyAxMDAwLjEsNTY4LjMgOTk4LjQsNTY3LjZDOTk2LjYsNTY2LjggOTk1LDU2NS44IDk5My43LDU2NC40Qzk5Mi40LDU2MyA5OTEuMyw1NjEuMyA5OTAuNiw1NTkuNEM5ODkuOCw1NTcuNSA5ODkuNSw1NTUuMyA5ODkuNSw1NTIuOUM5ODkuNSw1NTAuNSA5ODkuOSw1NDguMyA5OTAuNiw1NDYuM0M5OTEuNCw1NDQuMyA5OTIuNCw1NDIuNiA5OTMuNyw1NDEuMkM5OTUsNTM5LjggOTk2LjYsNTM4LjcgOTk4LjQsNTM3LjlDMTAwMC4yLDUzNy4xIDEwMDIuMSw1MzYuNyAxMDA0LjIsNTM2LjdDMTAwNi42LDUzNi43IDEwMDguNiw1MzcuMSAxMDEwLjMsNTM4QzEwMTIsNTM4LjkgMTAxMy40LDU0MC4xIDEwMTQuNSw1NDEuOEwxMDE0LjUsNTIzLjVMMTAyMi4zLDUyMy41TDEwMjIuMyw1MjMuNFpNMTAwNS45LDU2MkMxMDA4LjUsNTYyIDEwMTAuNSw1NjEuMSAxMDEyLjEsNTU5LjRDMTAxMy43LDU1Ny43IDEwMTQuNSw1NTUuNCAxMDE0LjUsNTUyLjZDMTAxNC41LDU0OS44IDEwMTMuNyw1NDcuNiAxMDEyLjEsNTQ1LjhDMTAxMC41LDU0NC4xIDEwMDguNSw1NDMuMiAxMDA1LjksNTQzLjJDMTAwMy40LDU0My4yIDEwMDEuMyw1NDQuMSA5OTkuOCw1NDUuOEM5OTguMiw1NDcuNSA5OTcuNCw1NDkuOCA5OTcuNCw1NTIuNkM5OTcuNCw1NTUuNCA5OTguMiw1NTcuNiA5OTkuOCw1NTkuM0MxMDAxLjQsNTYxLjEgMTAwMy40LDU2MiAxMDA1LjksNTYyIiBzdHlsZT0iZmlsbDpyZ2IoMjQsMjksMzEpO2ZpbGwtcnVsZTpub256ZXJvOyIvPgogICAgICAgIDxwYXRoIGQ9Ik04ODUuOCw1NDQuMkw4NjYuNSw1NDQuMkw4NjYuNSw1NTAuOUw4NzcuNSw1NTAuOUM4NzcuMiw1NTQuMyA4NzUuOSw1NTYuOSA4NzMuNyw1NTlDODcxLjUsNTYxIDg2OC43LDU2MiA4NjUuMSw1NjJDODYzLjEsNTYyIDg2MS4yLDU2MS42IDg1OS42LDU2MC45Qzg1Ny45LDU2MC4yIDg1Ni41LDU1OS4yIDg1NS4zLDU1Ny44Qzg1NC4xLDU1Ni41IDg1My4yLDU1NC45IDg1Mi41LDU1M0M4NTEuOCw1NTEuMSA4NTEuNSw1NDkuMSA4NTEuNSw1NDYuOEM4NTEuNSw1NDQuNSA4NTEuOCw1NDIuNSA4NTIuNSw1NDAuNkM4NTMuMSw1MzguNyA4NTQuMSw1MzcuMiA4NTUuMyw1MzUuOEM4NTYuNSw1MzQuNSA4NTcuOSw1MzMuNSA4NTkuNiw1MzIuN0M4NjEuMyw1MzIgODYzLjEsNTMxLjYgODY1LjIsNTMxLjZDODY5LjQsNTMxLjYgODcyLjYsNTMyLjYgODc0LjgsNTM0LjZMODgwLDUyOS40Qzg3Ni4xLDUyNi40IDg3MS4xLDUyNC44IDg2NS4yLDUyNC44Qzg2MS45LDUyNC44IDg1OC45LDUyNS4zIDg1Ni4yLDUyNi40Qzg1My41LDUyNy41IDg1MS4yLDUyOC45IDg0OS4zLDUzMC44Qzg0Ny40LDUzMi43IDg0NS45LDUzNSA4NDQuOSw1MzcuN0M4NDMuOSw1NDAuNCA4NDMuNCw1NDMuNCA4NDMuNCw1NDYuNkM4NDMuNCw1NDkuOCA4NDMuOSw1NTIuOCA4NDUsNTU1LjVDODQ2LjEsNTU4LjIgODQ3LjUsNTYwLjUgODQ5LjQsNTYyLjRDODUxLjMsNTY0LjMgODUzLjYsNTY1LjggODU2LjMsNTY2LjhDODU5LDU2Ny45IDg2Miw1NjguNCA4NjUuMiw1NjguNEM4NjguNCw1NjguNCA4NzEuMyw1NjcuOSA4NzMuOSw1NjYuOEM4NzYuNSw1NjUuNyA4NzguNyw1NjQuMyA4ODAuNSw1NjIuNEM4ODIuMyw1NjAuNSA4ODMuNyw1NTguMiA4ODQuNyw1NTUuNUM4ODUuNyw1NTIuOCA4ODYuMiw1NDkuOCA4ODYuMiw1NDYuNkw4ODYuMiw1NDUuM0M4ODUuOSw1NDUuMSA4ODUuOCw1NDQuNiA4ODUuOCw1NDQuMiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNOTQ2LjgsNTQ0LjJMOTI3LjUsNTQ0LjJMOTI3LjUsNTUwLjlMOTM4LjUsNTUwLjlDOTM4LjIsNTU0LjMgOTM2LjksNTU2LjkgOTM0LjcsNTU5QzkzMi41LDU2MSA5MjkuNyw1NjIgOTI2LjEsNTYyQzkyNC4xLDU2MiA5MjIuMiw1NjEuNiA5MjAuNiw1NjAuOUM5MTguOSw1NjAuMiA5MTcuNSw1NTkuMiA5MTYuMyw1NTcuOEM5MTUuMSw1NTYuNSA5MTQuMiw1NTQuOSA5MTMuNSw1NTNDOTEyLjgsNTUxLjEgOTEyLjUsNTQ5LjEgOTEyLjUsNTQ2LjhDOTEyLjUsNTQ0LjUgOTEyLjgsNTQyLjUgOTEzLjUsNTQwLjZDOTE0LjEsNTM4LjcgOTE1LjEsNTM3LjIgOTE2LjMsNTM1LjhDOTE3LjUsNTM0LjUgOTE4LjksNTMzLjUgOTIwLjYsNTMyLjdDOTIyLjMsNTMyIDkyNC4xLDUzMS42IDkyNi4yLDUzMS42QzkzMC40LDUzMS42IDkzMy42LDUzMi42IDkzNS44LDUzNC42TDk0MSw1MjkuNEM5MzcuMSw1MjYuNCA5MzIuMSw1MjQuOCA5MjYuMiw1MjQuOEM5MjIuOSw1MjQuOCA5MTkuOSw1MjUuMyA5MTcuMiw1MjYuNEM5MTQuNSw1MjcuNSA5MTIuMiw1MjguOSA5MTAuMyw1MzAuOEM5MDguNCw1MzIuNyA5MDYuOSw1MzUgOTA1LjksNTM3LjdDOTA0LjksNTQwLjQgOTA0LjQsNTQzLjQgOTA0LjQsNTQ2LjZDOTA0LjQsNTQ5LjggOTA0LjksNTUyLjggOTA2LDU1NS41QzkwNy4xLDU1OC4yIDkwOC41LDU2MC41IDkxMC40LDU2Mi40QzkxMi4zLDU2NC4zIDkxNC42LDU2NS44IDkxNy4zLDU2Ni44QzkyMCw1NjcuOSA5MjMsNTY4LjQgOTI2LjIsNTY4LjRDOTI5LjQsNTY4LjQgOTMyLjMsNTY3LjkgOTM0LjksNTY2LjhDOTM3LjUsNTY1LjcgOTM5LjcsNTY0LjMgOTQxLjUsNTYyLjRDOTQzLjMsNTYwLjUgOTQ0LjcsNTU4LjIgOTQ1LjcsNTU1LjVDOTQ2LjcsNTUyLjggOTQ3LjIsNTQ5LjggOTQ3LjIsNTQ2LjZMOTQ3LjIsNTQ1LjNDOTQ2LjksNTQ1LjEgOTQ2LjgsNTQ0LjYgOTQ2LjgsNTQ0LjIiIHN0eWxlPSJmaWxsOnJnYigyNCwyOSwzMSk7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICA8L2c+Cjwvc3ZnPgo= ***!
  \**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDIzNSA0MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxuczpzZXJpZj0iaHR0cDovL3d3dy5zZXJpZi5jb20vIiBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjI7Ij4KICAgIDxnIHRyYW5zZm9ybT0ibWF0cml4KDAuNjM1NzIzLDAsMCwwLjYzNTcyMywtNDkyLjkyMSwtMzIzLjYwOCkiPgogICAgICAgIDxwYXRoIGQ9Ik0xMDk5LjQsNTQ5LjRMMTA5OS40LDUzNi45TDEwNzguMSw1MzYuOUwxMDY1LjYsNTQ5LjRMMTA5OS40LDU0OS40WiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNMTEyMy40LDUxOC40TDEwOTYuNyw1MTguNEwxMDg0LjEsNTMwLjlMMTEyMy40LDUzMC45TDExMjMuNCw1MTguNFoiIHN0eWxlPSJmaWxsOnJnYigyNCwyOSwzMSk7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICAgICAgPHBhdGggZD0iTTEwNTMuMiw1NjEuOUwxMDU5LjYsNTU1LjVMMTA4MS4yLDU1NS41TDEwODEuMiw1NjhMMTA1My4yLDU2OEwxMDUzLjIsNTYxLjlaIiBzdHlsZT0iZmlsbDpyZ2IoMjQsMjksMzEpO2ZpbGwtcnVsZTpub256ZXJvOyIvPgogICAgICAgIDxwYXRoIGQ9Ik0xMDU3LjksNTQzLjNMMTA3MS43LDU0My4zTDEwODQuMyw1MzAuOEwxMDU3LjksNTMwLjhMMTA1Ny45LDU0My4zWiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNMTA0Mi44LDU2MS45TDEwNTMuMiw1NjEuOUwxMDY1LjYsNTQ5LjRMMTA0Mi44LDU0OS40TDEwNDIuOCw1NjEuOVoiIHN0eWxlPSJmaWxsOnJnYigyNCwyOSwzMSk7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICAgICAgPHBhdGggZD0iTTEwOTYuNyw1MTguNEwxMDkwLjMsNTI0LjhMMTA0OS41LDUyNC44TDEwNDkuNSw1MTIuM0wxMDk2LjcsNTEyLjNMMTA5Ni43LDUxOC40WiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNODI4LjYsNTU5LjdMODA5LDU1OS43TDgwNS42LDU2OC4xTDc5Nyw1NjguMUw4MTUuMSw1MjUuN0w4MjIuNiw1MjUuN0w4NDAuNyw1NjguMUw4MzIsNTY4LjFMODI4LjYsNTU5LjdaTTgyNS45LDU1M0w4MTguOCw1MzUuN0w4MTEuNyw1NTNMODI1LjksNTUzWiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNOTYwLjEsNTQxLjNDOTYyLjYsNTM3LjYgOTY4LjksNTM3LjIgOTcxLjUsNTM3LjJMOTcxLjUsNTQ0LjRDOTY4LjMsNTQ0LjQgOTY1LjEsNTQ0LjUgOTYzLjIsNTQ1LjlDOTYxLjMsNTQ3LjMgOTYwLjMsNTQ5LjIgOTYwLjMsNTUxLjVMOTYwLjMsNTY4LjFMOTUyLjUsNTY4LjFMOTUyLjUsNTM3LjJMOTYwLDUzNy4yTDk2MC4xLDU0MS4zWiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cmVjdCB4PSI5NzUuOCIgeT0iNTM3LjIiIHdpZHRoPSI3LjgiIGhlaWdodD0iMzAuOSIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTsiLz4KICAgICAgICA8cmVjdCB4PSI5NzUuOCIgeT0iNTIzLjQiIHdpZHRoPSI3LjgiIGhlaWdodD0iOS4yIiBzdHlsZT0iZmlsbDpyZ2IoMjQsMjksMzEpOyIvPgogICAgICAgIDxwYXRoIGQ9Ik0xMDIyLjMsNTIzLjRMMTAyMi4zLDU2OC4xTDEwMTQuOCw1NjguMUwxMDE0LjYsNTYzLjRDMTAxMy41LDU2NSAxMDEyLjEsNTY2LjMgMTAxMC40LDU2Ny4zQzEwMDguNyw1NjguMiAxMDA2LjYsNTY4LjcgMTAwNC4yLDU2OC43QzEwMDIuMSw1NjguNyAxMDAwLjEsNTY4LjMgOTk4LjQsNTY3LjZDOTk2LjYsNTY2LjggOTk1LDU2NS44IDk5My43LDU2NC40Qzk5Mi40LDU2MyA5OTEuMyw1NjEuMyA5OTAuNiw1NTkuNEM5ODkuOCw1NTcuNSA5ODkuNSw1NTUuMyA5ODkuNSw1NTIuOUM5ODkuNSw1NTAuNSA5ODkuOSw1NDguMyA5OTAuNiw1NDYuM0M5OTEuNCw1NDQuMyA5OTIuNCw1NDIuNiA5OTMuNyw1NDEuMkM5OTUsNTM5LjggOTk2LjYsNTM4LjcgOTk4LjQsNTM3LjlDMTAwMC4yLDUzNy4xIDEwMDIuMSw1MzYuNyAxMDA0LjIsNTM2LjdDMTAwNi42LDUzNi43IDEwMDguNiw1MzcuMSAxMDEwLjMsNTM4QzEwMTIsNTM4LjkgMTAxMy40LDU0MC4xIDEwMTQuNSw1NDEuOEwxMDE0LjUsNTIzLjVMMTAyMi4zLDUyMy41TDEwMjIuMyw1MjMuNFpNMTAwNS45LDU2MkMxMDA4LjUsNTYyIDEwMTAuNSw1NjEuMSAxMDEyLjEsNTU5LjRDMTAxMy43LDU1Ny43IDEwMTQuNSw1NTUuNCAxMDE0LjUsNTUyLjZDMTAxNC41LDU0OS44IDEwMTMuNyw1NDcuNiAxMDEyLjEsNTQ1LjhDMTAxMC41LDU0NC4xIDEwMDguNSw1NDMuMiAxMDA1LjksNTQzLjJDMTAwMy40LDU0My4yIDEwMDEuMyw1NDQuMSA5OTkuOCw1NDUuOEM5OTguMiw1NDcuNSA5OTcuNCw1NDkuOCA5OTcuNCw1NTIuNkM5OTcuNCw1NTUuNCA5OTguMiw1NTcuNiA5OTkuOCw1NTkuM0MxMDAxLjQsNTYxLjEgMTAwMy40LDU2MiAxMDA1LjksNTYyIiBzdHlsZT0iZmlsbDpyZ2IoMjQsMjksMzEpO2ZpbGwtcnVsZTpub256ZXJvOyIvPgogICAgICAgIDxwYXRoIGQ9Ik04ODUuOCw1NDQuMkw4NjYuNSw1NDQuMkw4NjYuNSw1NTAuOUw4NzcuNSw1NTAuOUM4NzcuMiw1NTQuMyA4NzUuOSw1NTYuOSA4NzMuNyw1NTlDODcxLjUsNTYxIDg2OC43LDU2MiA4NjUuMSw1NjJDODYzLjEsNTYyIDg2MS4yLDU2MS42IDg1OS42LDU2MC45Qzg1Ny45LDU2MC4yIDg1Ni41LDU1OS4yIDg1NS4zLDU1Ny44Qzg1NC4xLDU1Ni41IDg1My4yLDU1NC45IDg1Mi41LDU1M0M4NTEuOCw1NTEuMSA4NTEuNSw1NDkuMSA4NTEuNSw1NDYuOEM4NTEuNSw1NDQuNSA4NTEuOCw1NDIuNSA4NTIuNSw1NDAuNkM4NTMuMSw1MzguNyA4NTQuMSw1MzcuMiA4NTUuMyw1MzUuOEM4NTYuNSw1MzQuNSA4NTcuOSw1MzMuNSA4NTkuNiw1MzIuN0M4NjEuMyw1MzIgODYzLjEsNTMxLjYgODY1LjIsNTMxLjZDODY5LjQsNTMxLjYgODcyLjYsNTMyLjYgODc0LjgsNTM0LjZMODgwLDUyOS40Qzg3Ni4xLDUyNi40IDg3MS4xLDUyNC44IDg2NS4yLDUyNC44Qzg2MS45LDUyNC44IDg1OC45LDUyNS4zIDg1Ni4yLDUyNi40Qzg1My41LDUyNy41IDg1MS4yLDUyOC45IDg0OS4zLDUzMC44Qzg0Ny40LDUzMi43IDg0NS45LDUzNSA4NDQuOSw1MzcuN0M4NDMuOSw1NDAuNCA4NDMuNCw1NDMuNCA4NDMuNCw1NDYuNkM4NDMuNCw1NDkuOCA4NDMuOSw1NTIuOCA4NDUsNTU1LjVDODQ2LjEsNTU4LjIgODQ3LjUsNTYwLjUgODQ5LjQsNTYyLjRDODUxLjMsNTY0LjMgODUzLjYsNTY1LjggODU2LjMsNTY2LjhDODU5LDU2Ny45IDg2Miw1NjguNCA4NjUuMiw1NjguNEM4NjguNCw1NjguNCA4NzEuMyw1NjcuOSA4NzMuOSw1NjYuOEM4NzYuNSw1NjUuNyA4NzguNyw1NjQuMyA4ODAuNSw1NjIuNEM4ODIuMyw1NjAuNSA4ODMuNyw1NTguMiA4ODQuNyw1NTUuNUM4ODUuNyw1NTIuOCA4ODYuMiw1NDkuOCA4ODYuMiw1NDYuNkw4ODYuMiw1NDUuM0M4ODUuOSw1NDUuMSA4ODUuOCw1NDQuNiA4ODUuOCw1NDQuMiIgc3R5bGU9ImZpbGw6cmdiKDI0LDI5LDMxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICA8cGF0aCBkPSJNOTQ2LjgsNTQ0LjJMOTI3LjUsNTQ0LjJMOTI3LjUsNTUwLjlMOTM4LjUsNTUwLjlDOTM4LjIsNTU0LjMgOTM2LjksNTU2LjkgOTM0LjcsNTU5QzkzMi41LDU2MSA5MjkuNyw1NjIgOTI2LjEsNTYyQzkyNC4xLDU2MiA5MjIuMiw1NjEuNiA5MjAuNiw1NjAuOUM5MTguOSw1NjAuMiA5MTcuNSw1NTkuMiA5MTYuMyw1NTcuOEM5MTUuMSw1NTYuNSA5MTQuMiw1NTQuOSA5MTMuNSw1NTNDOTEyLjgsNTUxLjEgOTEyLjUsNTQ5LjEgOTEyLjUsNTQ2LjhDOTEyLjUsNTQ0LjUgOTEyLjgsNTQyLjUgOTEzLjUsNTQwLjZDOTE0LjEsNTM4LjcgOTE1LjEsNTM3LjIgOTE2LjMsNTM1LjhDOTE3LjUsNTM0LjUgOTE4LjksNTMzLjUgOTIwLjYsNTMyLjdDOTIyLjMsNTMyIDkyNC4xLDUzMS42IDkyNi4yLDUzMS42QzkzMC40LDUzMS42IDkzMy42LDUzMi42IDkzNS44LDUzNC42TDk0MSw1MjkuNEM5MzcuMSw1MjYuNCA5MzIuMSw1MjQuOCA5MjYuMiw1MjQuOEM5MjIuOSw1MjQuOCA5MTkuOSw1MjUuMyA5MTcuMiw1MjYuNEM5MTQuNSw1MjcuNSA5MTIuMiw1MjguOSA5MTAuMyw1MzAuOEM5MDguNCw1MzIuNyA5MDYuOSw1MzUgOTA1LjksNTM3LjdDOTA0LjksNTQwLjQgOTA0LjQsNTQzLjQgOTA0LjQsNTQ2LjZDOTA0LjQsNTQ5LjggOTA0LjksNTUyLjggOTA2LDU1NS41QzkwNy4xLDU1OC4yIDkwOC41LDU2MC41IDkxMC40LDU2Mi40QzkxMi4zLDU2NC4zIDkxNC42LDU2NS44IDkxNy4zLDU2Ni44QzkyMCw1NjcuOSA5MjMsNTY4LjQgOTI2LjIsNTY4LjRDOTI5LjQsNTY4LjQgOTMyLjMsNTY3LjkgOTM0LjksNTY2LjhDOTM3LjUsNTY1LjcgOTM5LjcsNTY0LjMgOTQxLjUsNTYyLjRDOTQzLjMsNTYwLjUgOTQ0LjcsNTU4LjIgOTQ1LjcsNTU1LjVDOTQ2LjcsNTUyLjggOTQ3LjIsNTQ5LjggOTQ3LjIsNTQ2LjZMOTQ3LjIsNTQ1LjNDOTQ2LjksNTQ1LjEgOTQ2LjgsNTQ0LjYgOTQ2LjgsNTQ0LjIiIHN0eWxlPSJmaWxsOnJnYigyNCwyOSwzMSk7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICA8L2c+Cjwvc3ZnPgo=";

/***/ })

}]);
//# sourceMappingURL=lib_index_js-data_font_woff2_charset_utf-8_base64_d09GMgABAAAAABJ0AAsAAAAAJ2gAABIjAAEAAAAAAAA-d4cd0a.94ab17298829f39e21d7.js.map