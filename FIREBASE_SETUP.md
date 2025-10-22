# Firebase Setup Guide

This guide explains how to set up Firebase for logging user interactions, learning analytics, and student progress tracking in your JupyterLab extension.

## Why Firebase?

Firebase Realtime Database provides:
- ✅ **Cloud storage** - Access your data from anywhere
- ✅ **Real-time sync** - Data updates instantly across clients
- ✅ **Scalability** - Handles growing user bases automatically
- ✅ **Analytics ready** - Easy to query and analyze learning data
- ✅ **Free tier** - Generous free plan for most educational use cases

## What Data is Logged?

The extension logs the following to Firebase:

### 1. **Chat Messages**
- User questions
- AI responses
- Interaction types (multiple-choice, fill-in-blanks, etc.)
- Timestamps

### 2. **Code Execution**
- Code that students write and execute
- Execution status (success/error)
- Output or error messages
- Execution timestamps

### 3. **Student Model (BKT)**
- Skills being assessed
- Mastery probability changes
- Correctness of responses
- Skill progression over time

### 4. **User Interactions**
- Session start/end times
- Video segments viewed
- Navigation patterns
- Teaching methods applied

### 5. **Learning Analytics**
- Time spent per segment
- Number of attempts per question
- Error patterns
- Learning trajectory

## Firebase Data Structure

Your data in Firebase will be organized as follows:

```
/
├── chat_logs/
│   └── {user_id}/
│       └── {session_id}/
│           ├── {message_1}: { timestamp, type, content, video_id, segment_index }
│           ├── {message_2}: { ... }
│           └── ...
│
├── code_executions/
│   └── {user_id}/
│       └── {session_id}/
│           ├── {execution_1}: { timestamp, code, status, output, error }
│           ├── {execution_2}: { ... }
│           └── ...
│
├── bkt_updates/
│   └── {user_id}/
│       └── {session_id}/
│           ├── {update_1}: { timestamp, skill, old_mastery, new_mastery, is_correct }
│           ├── {update_2}: { ... }
│           └── ...
│
├── bkt_state/
│   └── {user_id}/
│       ├── {skill_1}: { mastery, last_updated, session_id }
│       ├── {skill_2}: { ... }
│       └── ...
│
├── interactions/
│   └── {user_id}/
│       └── {session_id}/
│           ├── {interaction_1}: { timestamp, type, data, video_id, segment_index }
│           └── ...
│
├── sessions/
│   └── {user_id}/
│       └── {session_id}:
│           ├── start_time
│           ├── end_time
│           ├── status
│           └── summary
│
└── teaching_methods/
    └── {user_id}/
        └── {session_id}/
            ├── {method_1}: { timestamp, method, video_id, segment_index, context }
            └── ...
```

---

## Setup Instructions

### Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "jupyterlab-extension-analytics")
4. (Optional) Enable Google Analytics if you want additional analytics
5. Click "Create project"

### Step 2: Set Up Realtime Database

1. In your Firebase project, click on "Realtime Database" in the left sidebar
2. Click "Create Database"
3. Choose a location (select the one closest to your users)
4. Start in **test mode** for now (we'll add security rules later)
5. Click "Enable"

You'll see your database URL, which looks like:
```
https://your-project-id.firebaseio.com
```
**Save this URL - you'll need it later!**

### Step 3: Generate Service Account Credentials

1. In Firebase Console, click the gear icon (⚙️) next to "Project Overview"
2. Click "Project settings"
3. Go to the "Service accounts" tab
4. Click "Generate new private key"
5. Click "Generate key" in the confirmation dialog
6. A JSON file will be downloaded - **keep this file secure!**

The downloaded file looks like:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### Step 4: Configure Your Server

#### For Local Development:

1. Place the downloaded JSON file somewhere secure (e.g., `~/firebase-credentials.json`)

2. Set environment variables:
   ```bash
   export FIREBASE_CREDENTIALS_PATH="/path/to/firebase-credentials.json"
   export FIREBASE_DATABASE_URL="https://your-project-id.firebaseio.com"
   ```

3. Or add to your shell profile (~/.bashrc, ~/.zshrc):
   ```bash
   echo 'export FIREBASE_CREDENTIALS_PATH="/path/to/firebase-credentials.json"' >> ~/.bashrc
   echo 'export FIREBASE_DATABASE_URL="https://your-project-id.firebaseio.com"' >> ~/.bashrc
   source ~/.bashrc
   ```

#### For JupyterHub Deployment:

1. Upload the JSON file to your server:
   ```bash
   scp firebase-credentials.json user@your-server:/etc/jupyterhub/
   ```

2. Set proper permissions:
   ```bash
   sudo chmod 600 /etc/jupyterhub/firebase-credentials.json
   sudo chown root:root /etc/jupyterhub/firebase-credentials.json
   ```

3. Update `/etc/jupyterhub/env`:
   ```bash
   export FIREBASE_CREDENTIALS_PATH="/etc/jupyterhub/firebase-credentials.json"
   export FIREBASE_DATABASE_URL="https://your-project-id.firebaseio.com"
   ```

4. Restart JupyterHub:
   ```bash
   sudo systemctl restart jupyterhub
   ```

### Step 5: Install Firebase Admin SDK

The Firebase Admin SDK is already included in `pyproject.toml` dependencies. When you install the extension, it will be installed automatically:

```bash
pip install -e .
```

Or if you need to install it separately:

```bash
pip install firebase-admin
```

### Step 6: Verify Setup

1. Start JupyterLab:
   ```bash
   jupyter lab
   ```

2. Check the console output for:
   ```
   ✅ Firebase initialized successfully
   ```

3. If you see this instead:
   ```
   ⚠️  Firebase credentials not configured. Logging to Firebase disabled.
   ```
   Then check:
   - Environment variables are set correctly
   - Firebase credentials file exists at the specified path
   - File has correct permissions (readable)

### Step 7: Test Firebase Logging

1. Open your JupyterLab extension
2. Enter a user ID when prompted
3. Select a video
4. Ask a question in the chat
5. Execute some code

6. Check Firebase Console:
   - Go to "Realtime Database" in Firebase Console
   - You should see data appearing under `chat_logs`, `code_executions`, etc.

---

## Firebase Security Rules

Once you've verified everything works, **update your security rules** to protect your data:

### Basic Rules (Authenticated Users Only)

Go to "Realtime Database" → "Rules" tab and replace with:

```json
{
  "rules": {
    "chat_logs": {
      "$user_id": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "code_executions": {
      "$user_id": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "bkt_updates": {
      "$user_id": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "bkt_state": {
      "$user_id": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "interactions": {
      "$user_id": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "sessions": {
      "$user_id": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "teaching_methods": {
      "$user_id": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

This allows only authenticated users (your server with service account credentials) to read/write data.

### Advanced Rules (User-Specific Access)

If you want to add user-level security where users can only access their own data:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "$collection": {
      "$user_id": {
        ".read": "auth.uid === $user_id || auth.token.admin === true",
        ".write": "auth.uid === $user_id || auth.token.admin === true"
      }
    }
  }
}
```

---

## Querying and Analyzing Data

### Using Firebase Console

1. Go to "Realtime Database" in Firebase Console
2. Browse the data tree
3. Click "⋮" menu on any node → "Export JSON" to download data

### Using Python Script

```python
import firebase_admin
from firebase_admin import credentials, db

# Initialize
cred = credentials.Certificate('/path/to/firebase-credentials.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://your-project-id.firebaseio.com'
})

# Get all chat logs for a user
ref = db.reference('chat_logs/student_001')
chat_data = ref.get()

# Get BKT state for a user
ref = db.reference('bkt_state/student_001')
bkt_state = ref.get()

# Get all sessions
ref = db.reference('sessions')
sessions = ref.get()

# Query with ordering
ref = db.reference('code_executions/student_001/session_123')
executions = ref.order_by_child('timestamp').limit_to_last(10).get()

print(chat_data)
```

### Export to Pandas DataFrame

```python
import pandas as pd

# Get data
ref = db.reference('bkt_updates/student_001')
bkt_data = ref.get()

# Convert to DataFrame
records = []
for session_id, updates in bkt_data.items():
    for update_id, update in updates.items():
        record = update.copy()
        record['session_id'] = session_id
        record['update_id'] = update_id
        records.append(record)

df = pd.DataFrame(records)
print(df.head())

# Analyze mastery progression
df['timestamp'] = pd.to_datetime(df['timestamp'])
df_sorted = df.sort_values('timestamp')
print(df_sorted[['skill', 'old_mastery', 'new_mastery', 'is_correct']])
```

---

## Troubleshooting

### Error: "Firebase credentials not configured"

**Solution:**
- Check environment variables are set: `echo $FIREBASE_CREDENTIALS_PATH`
- Verify file exists: `ls -la $FIREBASE_CREDENTIALS_PATH`
- Check file is readable: `cat $FIREBASE_CREDENTIALS_PATH | head -1`

### Error: "Permission denied"

**Solution:**
- Update Firebase security rules (see section above)
- Ensure service account has correct permissions

### Error: "Module 'firebase_admin' not found"

**Solution:**
```bash
pip install firebase-admin
```

### Data Not Appearing in Firebase

**Check:**
1. Is Firebase enabled? Look for initialization message in logs
2. Are environment variables set correctly?
3. Is the extension making requests? Check browser console for errors
4. Check JupyterHub logs: `sudo journalctl -u jupyterhub -f`

### Firebase Quota Exceeded

Firebase free tier includes:
- 1 GB storage
- 10 GB/month bandwidth

If exceeded:
- Upgrade to Blaze (pay-as-you-go) plan
- Or implement data retention policy (delete old data)

---

## Cost Estimates

### Firebase Spark Plan (Free):
- 1 GB stored data
- 10 GB/month bandwidth
- 100,000 simultaneous connections

**Suitable for:**
- ~50-100 active students
- ~1000 sessions/month
- Development and small courses

### Firebase Blaze Plan (Pay-as-you-go):
- $5/GB stored beyond 1 GB
- $1/GB bandwidth beyond 10 GB
- First 1 GB storage + 10 GB bandwidth free

**Estimated costs for 500 students:**
- ~$5-15/month

---

## Data Privacy and GDPR Compliance

If you're collecting student data, ensure compliance with:

1. **Obtain Consent**: Inform users data is being collected
2. **Data Minimization**: Only collect necessary data
3. **Anonymization**: Consider hashing or anonymizing user IDs
4. **Right to Deletion**: Provide mechanism to delete user data
5. **Data Security**: Use secure credentials and access controls

### Anonymizing User IDs

Instead of using real names, use hashed IDs:

```python
import hashlib

def anonymize_user_id(real_id):
    return hashlib.sha256(real_id.encode()).hexdigest()[:16]
```

---

## Next Steps

1. Set up Firebase project ✅
2. Configure credentials on your server ✅
3. Test data logging ✅
4. Set up security rules ✅
5. Create data analysis scripts
6. Set up automated backups
7. Create learning analytics dashboard

---

## Support

- Firebase Documentation: https://firebase.google.com/docs/database
- Firebase Admin Python SDK: https://firebase.google.com/docs/admin/setup

For issues with this extension's Firebase integration, check the logs:
```bash
# JupyterHub logs
sudo journalctl -u jupyterhub -f

# JupyterLab logs
jupyter lab --debug
```
