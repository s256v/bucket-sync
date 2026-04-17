# bucket-sync

A utility to synchronize all Bitbucket repositories the user has access to. It fetches repositories across all accessible workspaces and either clones them or pulls latest changes.

## Setup

1. Create a `.env` file in the root directory:
   ```env
   BITBUCKET_EMAIL=your-email@example.com
   BITBUCKET_API_TOKEN=your-api-token
   CLONE_DIR=./bitbucket_repos
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

Run the synchronizer:
```bash
node index.js
```

