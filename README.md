# LLM Code Reviewer

A self-hosted GitHub bot that automatically reviews pull requests using local Large Language Models. Built with TypeScript, Express, BullMQ, and the GitHub API.

## Overview

This LLM Code Reviewer monitors GitHub repositories where a given bot is assigned for PR review requests and provides intelligent, contextual code reviews using locally hosted LLMs.

**[Screenshot: Example PR review with inline comments - Placeholder]**

## Key Features

- **Local LLM Integration** - Uses locally-hosted language models (via OpenAI-compatible APIs) for complete data privacy
- **Intelligent Code Analysis** - Reviews focus on security vulnerabilities, code quality, performance issues, and best practices
- **Line-Specific Comments** - Posts detailed feedback directly on changed lines in the PR
- **Queue-Based Processing** - Uses Redis + BullMQ for reliable queued review processing
- **Severity Classification** - Categorizes issues as critical, high, medium, or low priority
- **Constructive Feedback** - Generates collaborative, actionable suggestions rather than prescriptive criticism
- **Comment Throttling** - Limits to 12 most impactful comments per review to avoid overwhelming developers

**[Screenshot: Bot review comment with severity indicators - Placeholder]**

## Architecture

```
Polling Timer → GitHub API (Fetch PRs) → BullMQ Queue → Worker
                                                          ↓
                                                   Fetch PR Diffs
                                                          ↓
                                                     LLM Service reviews diffs
                                                          ↓
                                              GitHub API (Post Review)
```

### Tech Stack

- **Runtime**: Node.js + TypeScript
- **Web Framework**: Express
- **Queue**: BullMQ + Redis
- **GitHub Integration**: Octokit
- **LLM Client**: OpenAI SDK (configured for local endpoints)
- **Logging**: Winston

## How It Works

1. **Poll for Reviews**: The bot regularly checks for open PRs where it's assigned as a reviewer
2. **Queue Processing**: Each PR is added to a Redis-backed queue for sequential processing
3. **Fetch Diffs**: Downloads the unified diff for the PR via GitHub API
4. **LLM Analysis**: Sends the diff to a local LLM with a specialized code review prompt
5. **Parse & Post**: Extracts structured feedback (JSON) and posts comments + review status to GitHub

## Installation

### Prerequisites

- Node.js 18+ and npm
- Redis server
- Local LLM server with OpenAI-compatible API (e.g., LM Studio, Ollama, llama.cpp)
- GitHub account with repository access

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/llm-code-reviewer.git
   cd llm-code-reviewer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Redis**
   ```bash
   redis-server
   ```

4. **Configure your local LLM**
   - Ensure your LLM server is running with an OpenAI-compatible endpoint
   - Note the server URL (e.g., `http://localhost:1234/v1`)
   - Note your model name(s)

5. **Set up GitHub Bot**
   - Create a GitHub Personal Access Token or GitHub App
   - Required permissions: `repo`, `pull_requests` (read/write)
   - Add the bot as a reviewer to your repositories

6. **Configure environment variables**
   
   Create a `.env` file in the project root:
   ```env
   # GitHub Configuration
   GITHUB_REVIEW_BOT_TOKEN=your_github_token_here
   GITHUB_OWNER=your_github_username

   # LLM Configuration
   LM_STUDIO_URL=http://localhost:1234/v1
   REVIEW_MODELS=model-name-1,model-name-2

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

7. **Build and run**
   ```bash
   # Development mode with hot reload
   npm run dev

   # Production build
   npm run build
   npm run prod
   ```

## Usage

1. Assign the bot as a reviewer on a pull request
2. The bot will automatically detect the assignment and queue a review
3. Within minutes, the bot will post a comprehensive review with:
   - Overall summary and recommendation (Approve/Comment/Request Changes)
   - Line-specific comments with severity indicators
   - Positive observations about good practices

**[Screenshot: Full PR review example - Placeholder]**

## Configuration

### Review Prompt Customization

Modify `/prompts/code-review-prompt.md` to customize:
- Review focus areas
- Severity thresholds
- Comment tone and style
- Maximum comment limits

### Queue Settings

Adjust concurrency and processing behavior in `/review-queue/worker.ts`:
```typescript
concurrency: 1, // Process one PR at a time
```

## Project Structure

```
├── app.ts                     # Application logic and orchestration
├── server.ts                  # Express server entry point
├── config.ts                  # Environment configuration
├── events.ts                  # Event emitter for polling
├── github/
│   ├── github.api.ts          # GitHub API integration
│   └── types.ts               # GitHub type definitions
├── review-queue/
│   ├── queue.ts               # BullMQ queue setup
│   ├── worker.ts              # Review job processor
│   └── config.ts              # Redis connection
├── review-service/
│   ├── llm-service.ts         # LLM client and review logic
│   └── types.ts               # Review result types
├── prompts/
│   └── code-review-prompt.md  # System prompt for LLM
└── logs/                      # Application logs
```

## Technical Highlights

- **Type Safety**: Full TypeScript coverage with strict mode enabled
- **Error Handling**: Comprehensive try-catch with Winston logging
- **Async Processing**: Non-blocking queue-based architecture prevents timeouts
- **Diff Parsing**: Intelligent extraction of file paths and line numbers from unified diffs
- **JSON Extraction**: Robust parsing handles LLM responses in various formats (code blocks, raw JSON)
- **Pagination**: Handles large-scale GitHub API responses efficiently
- **Model Failover**: Automatically selects first available model from configured list

## Future Enhancements

- Webhook support for real-time PR notifications (vs polling)
- Web dashboard for review history and statistics
- Multi-model comparison reviews
- Configurable review templates per repository
- Support for incremental reviews (only new commits)


**Author**: Calum Bradbury
