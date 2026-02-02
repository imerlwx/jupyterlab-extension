# Testing Guide for Experimental Conditions

This guide explains how to test the four experimental conditions during development.

---

## 🎯 Overview

You have **TWO ways** to test conditions:

1. **Method 1: Test User IDs** (Quick - uses hash assignment)
2. **Method 2: Testing Panel** (Easy - dropdown menu in UI)

---

## 📱 Visual Indicators

When you're logged in, you'll see at the top of the chat:

```
Condition: [CONTROL] | User: your_user_id | [Show Testing Panel]
```

**Color coding:**
- `CONTROL` - Gray chip
- `QUIZ` - Blue chip
- `FIXED COGAPP` - Purple chip
- `FULL COGGEN` - Green chip

---

## 🔧 Method 1: Test User IDs (Automatic Assignment)

The system uses **deterministic hash-based assignment**. These specific user IDs always map to specific conditions:

### Test User IDs for Each Condition:

```
control:       test_control_001
quiz:          test_quiz_002
fixed_cogapp:  test_fixed_003
full_coggen:   test_full_004
```

**How it works:**
```python
hash("test_control_001") % 4 = 0 → "control"
hash("test_quiz_002") % 4 = 1 → "quiz"
hash("test_fixed_003") % 4 = 2 → "fixed_cogapp"
hash("test_full_004") % 4 = 3 → "full_coggen"
```

### Steps to Test:

1. **Open JupyterLab**
   ```bash
   jupyter lab
   ```

2. **Open the extension**
   - Click on "Chat" in the launcher

3. **Enter a test user ID**
   - Use one of the test IDs above
   - Example: `test_control_001`

4. **Check the condition indicator**
   - You should see: `Condition: CONTROL`

5. **Test the behavior**
   - For Control: No teaching sequences, just Q&A
   - For Full CogGen: Full system with all features

6. **To test another condition:**
   - Close the extension
   - Reopen and enter a different test user ID

---

## 🎨 Method 2: Testing Panel (UI Dropdown)

The **easiest way** to switch between conditions without restarting.

### Steps:

1. **Login with any user ID**
   - Example: `developer_test`

2. **Click "Show Testing Panel"**
   - Located at the top of the chat interface
   - Next to your condition indicator

3. **Select a condition from dropdown**
   - Control (No Guidance)
   - Quiz-Directed (Coming Soon)
   - Fixed CogApp Order (Coming Soon)
   - Full CogGen (Current System)

4. **Click to change**
   - An alert will appear confirming the change
   - **Important:** Reload the page or restart the session for full effect

5. **Verify the change**
   - Check the condition chip updates
   - Check browser console for confirmation log

### Example Flow:

```
1. Login as: "my_test_user"
   → Auto-assigned to: "quiz" (based on hash)

2. Click "Show Testing Panel"

3. Select "Control (No Guidance)" from dropdown

4. Alert appears: "Condition changed to: control"

5. Reload the page (Ctrl+R / Cmd+R)

6. Now you're in control condition!
```

---

## 🧪 Method 3: API Endpoint (Advanced)

For automated testing or scripts.

### Set Condition Manually:

```bash
curl -X POST http://localhost:8888/jlab_ext_example/set_condition \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "condition": "control"
  }'
```

### Get Current Condition:

```bash
curl -X POST http://localhost:8888/jlab_ext_example/get_condition \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user"
  }'

# Response:
# {"userId": "test_user", "condition": "control"}
```

### Using Python:

```python
import requests

# Set condition
response = requests.post(
    'http://localhost:8888/jlab_ext_example/set_condition',
    json={'userId': 'test_user', 'condition': 'control'}
)
print(response.json())

# Get condition
response = requests.post(
    'http://localhost:8888/jlab_ext_example/get_condition',
    json={'userId': 'test_user'}
)
print(response.json())
```

---

## ✅ Testing Checklist per Condition

### Testing Control Condition

**What to verify:**
- [ ] Condition indicator shows: `CONTROL`
- [ ] Chat works (you can ask questions)
- [ ] Responses are simple Q&A (no exercises)
- [ ] NO fill-in-the-blanks appear
- [ ] NO multiple-choice questions appear
- [ ] NO "Go On" button with teaching sequence
- [ ] Code execution still works in notebook
- [ ] Video segments still visible

**Test flow:**
1. Enter user ID: `test_control_001`
2. Select video: `nx5yhXAQLxw`
3. Watch first segment
4. Ask question: "What is ggplot?"
5. Verify: Simple text response (no exercises)

---

### Testing Full CogGen Condition

**What to verify:**
- [ ] Condition indicator shows: `FULL COGGEN`
- [ ] Teaching sequences appear
- [ ] Fill-in-the-blanks exercises work
- [ ] Multiple-choice questions work
- [ ] "Go On" button appears
- [ ] Adaptive teaching based on responses
- [ ] BKT model updates (check console logs)

**Test flow:**
1. Enter user ID: `test_full_004`
2. Select video: `nx5yhXAQLxw`
3. Progress through segments
4. Verify: Structured teaching with exercises

---

### Testing Quiz Condition (When Implemented)

**What to verify:**
- [ ] Condition indicator shows: `QUIZ`
- [ ] Quiz questions appear after each segment
- [ ] Answer checking works
- [ ] Feedback provided
- [ ] NO other teaching methods (scaffolding, etc.)

---

### Testing Fixed CogApp Condition (When Implemented)

**What to verify:**
- [ ] Condition indicator shows: `FIXED COGAPP`
- [ ] All 6 teaching methods used
- [ ] Always same order: Modeling → Scaffolding → Coaching → Articulation → Reflection → Exploration
- [ ] NO adaptation based on student responses
- [ ] Same sequence for everyone

---

## 🗂️ Database Testing

### Check User Assignments in Database:

```python
import sqlite3

conn = sqlite3.connect('cache.db')
cursor = conn.cursor()

# View all user conditions
cursor.execute("SELECT * FROM user_conditions")
for row in cursor.fetchall():
    print(f"User: {row[0]}, Condition: {row[1]}, Assigned: {row[2]}")

# Count users per condition
cursor.execute("""
    SELECT condition, COUNT(*) as count
    FROM user_conditions
    GROUP BY condition
""")
print("\nUsers per condition:")
for row in cursor.fetchall():
    print(f"{row[0]}: {row[1]} users")

conn.close()
```

### Manually Insert Test Users:

```python
import sqlite3

conn = sqlite3.connect('cache.db')
cursor = conn.cursor()

# Assign specific conditions to test users
test_users = [
    ("test_control_001", "control"),
    ("test_quiz_002", "quiz"),
    ("test_fixed_003", "fixed_cogapp"),
    ("test_full_004", "full_coggen")
]

for user_id, condition in test_users:
    cursor.execute("""
        INSERT OR REPLACE INTO user_conditions (user_id, condition)
        VALUES (?, ?)
    """, (user_id, condition))

conn.commit()
conn.close()
print("Test users configured!")
```

---

## 🔍 Debugging Tips

### Check Browser Console:

When you login, you should see:
```
User ID set: test_control_001, Session ID: session_1234567890_abc123
User assigned to condition: control
```

When you change condition:
```
Condition manually set to: full_coggen
```

### Check Backend Logs:

In JupyterLab terminal:
```
Assigned condition 'control' to user 'test_control_001'
```

### Verify Condition in Firebase:

All logs should include `condition` field:
```json
{
  "user_id": "test_control_001",
  "condition": "control",
  "chat_logs": [...]
}
```

---

## 🎬 Quick Testing Workflow

### Option A: Test All Conditions Quickly

```bash
# Terminal 1: Start JupyterLab
jupyter lab

# Browser:
1. Login as: test_control_001 → Test Control
2. Close tab, reopen
3. Login as: test_full_004 → Test Full CogGen
4. Compare behaviors
```

### Option B: Test One Condition Thoroughly

```bash
1. Login as: my_test_user
2. Click "Show Testing Panel"
3. Select condition from dropdown
4. Reload page
5. Test extensively
6. Switch to another condition
7. Repeat
```

---

## 📊 Expected Behaviors per Condition

### Control:
```
User: "How do I make a boxplot?"
AI: "You can create a boxplot using ggplot2 with geom_boxplot()..."
(No follow-up exercises)
```

### Full CogGen:
```
User: [Watches segment on boxplots]
AI: "Let's practice! Fill in the blank: ggplot(data, aes(x, y)) + ___"
(Interactive exercise follows)
```

### Quiz (Coming):
```
User: [Finishes segment]
AI: "Quiz time! Which function creates a boxplot?"
   A) geom_point()
   B) geom_boxplot()  ✓
   C) geom_line()
```

### Fixed CogApp (Coming):
```
User: [Watches segment]
AI: [Always follows same sequence]
   1. Modeling: Shows code
   2. Scaffolding: Explains concept
   3. Coaching: Practice exercise
   4. Articulation: Ask to explain
   5. Reflection: Compare approaches
   6. Exploration: Free exploration
```

---

## ⚠️ Important Notes

### For Production:
1. **HIDE the testing panel** - remove or disable in production
2. **Remove test user IDs** - use real Prolific IDs
3. **Disable manual condition changes** - lock assignments
4. **Log condition changes** - track if anyone switches

### For Development:
1. **Keep testing panel visible**
2. **Use test user IDs for consistency**
3. **Check console logs frequently**
4. **Verify Firebase logging**

---

## 🐛 Troubleshooting

### Condition not changing:
- **Solution:** Reload the page after changing condition
- Check browser console for errors
- Verify backend is running

### Test user ID not working:
- **Solution:** Check hash assignment
  ```python
  hash("your_user_id") % 4
  # 0 = control, 1 = quiz, 2 = fixed_cogapp, 3 = full_coggen
  ```

### Testing panel not showing:
- **Solution:** Make sure you're logged in
- Check `userCondition` state is set
- Verify imports for MUI components

### Condition changes but behavior doesn't:
- **Solution:** Some state is cached in memory
- Fully reload the page (hard refresh)
- Or restart JupyterLab

---

## 📝 Testing Checklist

Before deploying to production:

- [ ] Test all 4 conditions with test user IDs
- [ ] Verify condition indicator displays correctly
- [ ] Test condition switching via dropdown
- [ ] Verify backend logs show correct condition
- [ ] Check Firebase logs include condition field
- [ ] Test with real Prolific-format user IDs
- [ ] Verify hash distribution is balanced (25% each)
- [ ] Remove or hide testing panel for production
- [ ] Document which features work per condition

---

## 🎓 Summary

**Easiest way to test:**
1. Use **Method 2: Testing Panel**
2. Click "Show Testing Panel"
3. Select condition from dropdown
4. Reload page
5. Test behavior

**For automated testing:**
1. Use **Method 1: Test User IDs**
2. Create test scripts with specific IDs
3. No manual switching needed

**For production:**
1. Remove testing panel
2. Use automatic hash assignment
3. Monitor via Firebase logs

Happy testing! 🧪
