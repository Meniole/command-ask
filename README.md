# `@ubiquity-os/command-ask`

The ask command is a high context aware GitHub organization integrated bot that uses OpenRouter.ai to provide highly relevant answers to questions and queries in GitHub issues and pull requests.

## Usage

In any repository where your UbiquityOS app is installed, both issues and pull requests alike, you simply mention `@UbiquityOS` with your question or query and the bot will provide you with a highly relevant answer using OpenRouter.ai.

## How it works

With its huge context window, we are able to feed the entire conversational history to the model which we obtain by recursively fetching any referenced issues or pull requests from the chat history. This allows the model to have a very deep understanding of the current scope and provide highly relevant answers.

As it receives everything from discussions to pull request diffs and review comments, it is a highly versatile and capable bot that can assist in a wide range of scenarios.

## Technical Architecture

### System Overview

Command Ask is built as a Cloudflare Worker that integrates with GitHub's webhook system to process issue comments. The system leverages OpenRouter.ai and vector similarity search to provide intelligent responses:

|            | OpenRouter.ai | Voyage |
| ---------- | ------------- | ------ |
| Embeddings | ❌            | ✅     |
| Reranking  | ❌            | ✅     |
| LLM        | ✅            | ❌     |

```
┌─────────────────┐         ┌──────────────┐
│  GitHub Webhook │ ──────> │    Github    │
│    (Comments)   │         │    Action    │
└─────────────────┘         └──────┬───────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │                              │
              ┌─────┴─────┐                  ┌─────┴─────┐
              │OpenRouter.ai│                │  Voyage   │
              │    (LLM)   │                │   (AI)    │
              └───────────┘                  └─────┬─────┘
                                                  │
                                            ┌─────┴─────┐
                                            │ Supabase  │
                                            │ (Vector   │
                                            │   DB)     │
                                            └───────────┘
```

### Key Components

#### Adapters (`src/adapters/`)

- **OpenRouter.ai Adapter**: Handles interactions with OpenRouter.ai for generating responses using Claude 3.5 Sonnet
- **Voyage Adapter**: Generates embeddings using the voyage-large-2-instruct model
- **Supabase Adapter**: Manages vector similarity search and storage using pgvector

#### Vector Search System

- Uses Voyage AI to generate 1024-dimensional embeddings
- Stores embeddings in Supabase using pgvector extension
- Combines vector similarity with text similarity for optimal matching
- Implements efficient similarity search functions for both issues and comments

#### Handlers (`src/handlers/`)

- **Comment Handlers**: Process incoming GitHub webhook events
- **Ground Truth System**: Validates LLM responses against known correct answers
- **Ask LLM Handler**: Core logic for formulating queries and processing responses

#### Helpers (`src/helpers/`)

- **Token Utils**: Manages token counting and context window optimization
- **Issue/PR Fetching**: Recursively retrieves related GitHub conversations
- **Chat History Formatting**: Structures conversation history for LLM context
- **Callback Proxy**: Manages asynchronous webhook callbacks

### External Service Integration

#### GitHub Integration

- Processes webhook events for new comments
- Recursively fetches conversation history from referenced issues/PRs
- Supports both issues and pull request contexts

#### OpenRouter.ai Integration

- Uses Claude 3.5 Sonnet model for generating responses
- Optimizes context window usage for maximum relevance
- Supports configurable model settings via configuration

#### Voyage AI Integration

- Generates high-quality embeddings using voyage-large-2-instruct model
- 1024-dimensional vectors for precise similarity matching
- Optimized for technical and conversational content

#### Supabase Vector Database

- Uses pgvector extension for efficient vector similarity search
- Combines vector similarity with text-based search for better results
- Implements specialized functions for finding similar issues and comments
- Stores and indexes embeddings for fast retrieval

### Testing Infrastructure

The project uses Jest for testing with comprehensive mocks for:

- Database operations
- GitHub API responses
- Webhook handlers
- Issue and repository templates

Tests are organized to validate:

- Core business logic
- External service integrations
- Webhook processing
- Ground truth validation

## Installation

`ubiquity-os-config.yml`:

```yml
plugins:
  - uses:
      - plugin: http://localhost:4000
        with:
          model: ""
          openRouterBaseUrl: ""
```

`.dev.vars` (for local testing):

To use the OpenRouter API for fetching chat history, set the `OPENROUTER_API_KEY` in the `.dev.vars` file and specify the OpenRouterBase URL in the `ubiquity-os-config.yml` file.

```sh
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
VOYAGEAI_API_KEY=your_voyageai_api_key
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_API_KEY=your_openrouter_api_key
UBIQUITY_OS_APP_NAME="UbiquityOS"
```

## Testing

```sh
bun run test
```
