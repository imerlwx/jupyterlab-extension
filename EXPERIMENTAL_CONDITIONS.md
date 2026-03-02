# Experimental Conditions Implementation Guide

This document describes the four experimental conditions implemented in the JupyterLab extension for studying the effectiveness of AI-powered cognitive apprenticeship tutoring.

---

## 🎯 Overview of Conditions

### Condition Assignment
Users are automatically assigned to conditions using **deterministic hash-based assignment**:
- User ID is hashed using `hashlib.md5` (deterministic across restarts)
- Hash modulo 4 determines condition (0=control, 1=quiz, 2=fixed_cogapp, 3=full_coggen)
- Same user ID always gets same condition
- Automatic balancing across conditions
- **Test user override:** IDs starting with `test_control`, `test_quiz`, `test_fixed`, or `test_full` automatically get respective conditions

### Four Conditions:

1. **`control`** - Control (No Directed Learning)
2. **`quiz`** - Quiz-Directed Learning
3. **`fixed_cogapp`** - CogApp with Fixed Order (No Student Model)
4. **`full_coggen`** - Full CogGen (Current System)

---

## ✅ Condition 1: Control (IMPLEMENTED)

### Description
- Watch videos and see segments
- Chat with AI tutor available
- Write code in Jupyter notebook
- **NO cognitive apprenticeship framework**
- **NO teaching sequences** (Scaffolding, Coaching, etc.)
- **NO BKT student model**
- **NO structured exercises** (fill-in-blanks, multiple-choice)
- Just plain conversational Q&A with LLM

### Implementation Details

#### Backend (`handlers.py`):

**1. Database Table: `user_conditions`**
```sql
CREATE TABLE user_conditions (
    user_id TEXT PRIMARY KEY,
    condition TEXT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**2. Helper Function: `get_user_condition(user_id)`**
- Checks database for existing assignment
- If not found, assigns based on hash: `hash(user_id) % 4`
- Returns: `"control"`, `"quiz"`, `"fixed_cogapp"`, or `"full_coggen"`

**3. New Handlers:**
- `GetConditionHandler` (`/get_condition`) - Fetch user's condition
- `SetConditionHandler` (`/set_condition`) - Manually set condition (for testing)

**4. Modified Handlers:**

**ChatHandler:**
- Checks `user_condition = get_user_condition(user_id)`
- If `user_condition == "control"`:
  - Bypasses teaching sequence logic
  - Provides simple conversational Q&A
  - Uses context from notebook and video
  - No pedagogical structure
  - Returns plain-text responses only

**UpdateSeqHandler:**
- Checks user's condition
- If `control`: skips teaching sequence generation
- Returns immediately with `{"status": "skipped", "condition": "control"}`

**LogSessionStartHandler:**
- Logs user's condition in session metadata
- Stored in Firebase for analytics

#### Frontend (`Chat.tsx`):

**1. State Management:**
```typescript
const [userCondition, setUserCondition] = useState<string>('');
```

**2. Condition Fetching:**
```typescript
// After user submits ID
requestAPI('get_condition', {
  body: JSON.stringify({ userId: submittedUserId }),
  method: 'POST'
})
  .then(response => {
    setUserCondition(response.condition);
  });
```

**3. Behavior Changes:**
- Condition is fetched automatically
- Stored in component state
- Can be used to conditionally render UI elements
- All API requests include userId, backend handles routing

### User Experience (Condition 1)

1. **User enters ID** → System assigns "control" condition
2. **User selects video** → Video plays with segments
3. **User can chat** → LLM responds helpfully but without structure
4. **User writes code** → Code execution logged
5. **NO exercises** → No fill-in-blanks, no multiple-choice
6. **NO guided sequence** → Just watch, code, and ask questions

### What's Logged (Firebase)

All interactions logged with `condition: "control"`:
- Chat messages (questions and responses)
- Code executions
- Session data
- Video segments viewed

### Testing Condition 1

**Manual Assignment (for testing):**
```bash
# In Python or via API call
curl -X POST http://localhost:8888/jlab_ext_example/set_condition \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_control", "condition": "control"}'
```

**Check Assignment:**
```bash
curl -X POST http://localhost:8888/jlab_ext_example/get_condition \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_control"}'

# Returns: {"userId": "test_user_control", "condition": "control"}
```

---

## ✅ Condition 2: Quiz-Directed Learning (IMPLEMENTED)

### Description
- Watch videos and see segments
- After each segment, system presents a quiz question
- Uses **Coaching** action from Cognitive Apprenticeship framework
- Multiple-choice questions only
- **NO BKT student model** - questions are not adaptive
- **NO other teaching methods** (Scaffolding, Articulation, etc.)
- Tests whether quiz-based learning is sufficient vs full framework

### Implementation Details

#### Backend (`handlers.py`):

**1. ChatHandler - Quiz Condition Branch:**
- Checks `user_condition = get_user_condition(user_id)`
- If `user_condition == "quiz"`:
  - When `question == ""` (after video segment ends):
    - Loads segment information and knowledge
    - Uses `concept_action["Coaching"]` template
    - Generates multiple-choice quiz using LLM
    - Returns quiz as `interaction: "multiple-choice"`
  - When user answers quiz (`selected_choice != ""`):
    - Logs answer to Firebase
    - Provides simple feedback
    - Allows user to proceed to next segment
  - When user asks a question:
    - Provides simple Q&A (similar to control)

**2. UpdateSeqHandler:**
- Checks user's condition
- If `quiz`: skips teaching sequence generation
- Returns immediately with `{"status": "skipped", "condition": "quiz"}`

**3. UpdateBKTHandler:**
- Checks user's condition
- If `quiz`: skips BKT parameter updates
- Returns immediately with `{"status": "skipped", "condition": "quiz"}`

#### Quiz Generation Process:

1. Extract knowledge from current segment using `get_knowledge()`
2. Use Coaching template: `"Propose a multiple-choice question for the student to understand the {knowledge}"`
3. Generate question using LLM with JSON structure:
   ```json
   {
     "question": "What is the main purpose of...?",
     "choices": ["Option A", "Option B", "Option C", "Option D"],
     "correct answer": "Option A"
   }
   ```
4. Present to user as multiple-choice interaction
5. Log answer when submitted

### User Experience (Condition 2)

1. **User enters ID** → System assigns "quiz" condition
2. **User selects video** → Video plays with segments
3. **User watches segment** → Segment ends
4. **System presents quiz** → Multiple-choice question about segment concepts
5. **User selects answer** → System logs answer and provides feedback
6. **User clicks "Go on"** → Next segment starts
7. **Repeat** for all segments

### What's Logged (Firebase)

All interactions logged with `condition: "quiz"`:
- Quiz questions (type: `quiz_question`)
- Quiz answers (type: `quiz_answer`)
- Code executions
- Session data
- Video segments viewed
- Optional chat messages if user asks questions

### Testing Condition 2

**Test User IDs (Prefix-based Assignment):**
```bash
# Users with IDs starting with "test_quiz" automatically get quiz condition
test_quiz_001
test_quiz_002
test_quiz_participant_1
```

**Manual Assignment (for testing):**
```bash
curl -X POST http://localhost:8888/jlab_ext_example/set_condition \
  -H "Content-Type: application/json" \
  -d '{"userId": "my_test_user", "condition": "quiz"}'
```

**Expected Behavior:**
- Video segments play normally
- After each segment, a quiz question appears
- User must select an answer before proceeding
- No fill-in-blanks, no code scaffolding
- Just quiz questions after each segment

---

## 🔲 Condition 3: Fixed CogApp Order (TO BE IMPLEMENTED)

### Planned Description
- Uses all six cognitive apprenticeship methods
- **Fixed order:** Modeling → Scaffolding → Coaching → Articulation → Reflection → Exploration
- **NO student model** (no BKT)
- Same sequence for all users regardless of mastery
- Tests whether adaptive student model improves performance

### Implementation Plan
1. Modify UpdateSeqHandler to detect `condition == "fixed_cogapp"`
2. Use predetermined sequence from predefined JSON
3. Skip BKT mastery checks
4. Skip get_methods() GPT-4 call
5. Always use same order of teaching moves

---

## ✅ Condition 4: Full CogGen (CURRENT SYSTEM)

### Description
- Complete implementation with all features
- All six teaching methods: Modeling, Scaffolding, Coaching, Articulation, Reflection, Exploration
- **Adaptive student model** (BKT)
- GPT-4 selects teaching methods based on mastery
- Fill-in-blanks, multiple-choice, code display, exploration
- This is the baseline/current implementation

### No Changes Needed
- Default condition
- All existing code paths apply
- Most complex and feature-complete

---

## 📊 Condition Comparison Table

| Feature | Control | Quiz | Fixed CogApp | Full CogGen |
|---------|---------|------|--------------|-------------|
| **Video watching** | ✅ | ✅ | ✅ | ✅ |
| **Chat available** | ✅ (simple Q&A) | ✅ (limited Q&A) | ✅ (structured) | ✅ (adaptive) |
| **Teaching methods** | ❌ None | ✅ Coaching only | ✅ All 6 (fixed) | ✅ All 6 (adaptive) |
| **Student model (BKT)** | ❌ | ❌ | ❌ | ✅ |
| **Fill-in-blanks** | ❌ | ❌ | ✅ | ✅ |
| **Multiple-choice** | ❌ | ✅ (quiz only) | ✅ | ✅ |
| **Adaptive sequencing** | ❌ | ❌ | ❌ | ✅ |
| **Code execution logging** | ✅ | ✅ | ✅ | ✅ |

---

## 🧪 Research Questions per Condition

### Control vs Others:
- Does AI tutoring improve learning vs just video + chat?

### Quiz vs Full CogGen:
- Is one well-implemented move (quiz) sufficient?
- Or does variety of methods matter?

### Fixed CogApp vs Full CogGen:
- Does adaptive student model improve outcomes?
- Or is fixed sequence equally effective?

### All Conditions:
- Which condition produces best learning outcomes?
- Which has highest engagement?
- Which transfers better to new problems?

---

## 💾 Database Schema

### `user_conditions` Table
```sql
user_id          | condition      | assigned_at
-----------------|----------------|----------------------------
prolific_001     | control        | 2025-10-22 14:30:15
prolific_002     | quiz           | 2025-10-22 14:31:22
prolific_003     | fixed_cogapp   | 2025-10-22 14:32:01
prolific_004     | full_coggen    | 2025-10-22 14:33:45
```

---

## 🔧 Condition Assignment Logic

### Automatic Assignment (Default)
```python
import hashlib

def get_user_condition(user_id):
    conditions = ["control", "quiz", "fixed_cogapp", "full_coggen"]

    # Special prefix handling for test users
    test_prefixes = {
        "test_control": "control",
        "test_quiz": "quiz",
        "test_fixed": "fixed_cogapp",
        "test_full": "full_coggen"
    }
    for prefix, cond in test_prefixes.items():
        if user_id.startswith(prefix):
            return cond

    # Deterministic hash using hashlib (not Python's built-in hash())
    hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    condition_index = hash_val % 4
    return conditions[condition_index]
```

**Note:** Uses `hashlib.md5` for deterministic hashing across Python restarts (Python's built-in `hash()` is randomized per process since Python 3.3).

### Manual Assignment (Testing/Override)
```python
# Use SetConditionHandler
POST /jlab_ext_example/set_condition
{
  "userId": "specific_user",
  "condition": "control"  # or quiz, fixed_cogapp, full_coggen
}
```

---

## 📱 Frontend Condition Handling

### Current Implementation
```typescript
const [userCondition, setUserCondition] = useState<string>('');

// Fetch on user ID submission
requestAPI('get_condition', { body: JSON.stringify({ userId }) })
  .then(response => setUserCondition(response.condition));
```

### Conditional UI (Optional - To Be Implemented)
```typescript
// Example: Show condition indicator for debugging
{userCondition && (
  <Box sx={{ p: 1, bgcolor: 'info.main', color: 'white' }}>
    Condition: {userCondition}
  </Box>
)}
```

**Note:** In actual study, you may NOT want to show condition to users (blinding).

---

## 🚀 Next Steps

1. ✅ **Condition 1 (Control)** - COMPLETE
2. ✅ **Condition 2 (Quiz)** - COMPLETE
3. ⏳ **Condition 3 (Fixed CogApp)** - TO IMPLEMENT
4. ✅ **Condition 4 (Full CogGen)** - ALREADY EXISTS
5. ⏳ **Testing Framework** - Create test users for each condition
6. ⏳ **Analytics Dashboard** - Visualize condition differences

---

## 📖 For Developers

### Adding a New Condition

1. **Update `get_user_condition()` function:**
   ```python
   conditions = ["control", "quiz", "fixed_cogapp", "full_coggen", "new_condition"]
   ```

2. **Add condition logic in handlers:**
   ```python
   if user_condition == "new_condition":
       # Custom logic here
   ```

3. **Update documentation**

### Testing Conditions Locally

```python
# Test each condition with specific users
test_users = {
    "test_control": "control",
    "test_quiz": "quiz",
    "test_fixed": "fixed_cogapp",
    "test_full": "full_coggen"
}

# Assign conditions
for user_id, condition in test_users.items():
    set_user_condition(user_id, condition)
```

---

## 📊 Analytics Queries

### Count users per condition:
```sql
SELECT condition, COUNT(*) as count
FROM user_conditions
GROUP BY condition;
```

### Get all control group users:
```sql
SELECT user_id, assigned_at
FROM user_conditions
WHERE condition = 'control'
ORDER BY assigned_at DESC;
```

---

This document will be updated as Conditions 2, 3, and 4 are refined/implemented.
