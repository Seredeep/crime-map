# DSPy Setup Guide

This guide explains how to configure the DSPy (Ax for TypeScript) system for intelligent message processing in the crime map application.

## Overview

The DSPy system analyzes incoming messages to determine:
- Sentiment (positive/negative/neutral/fear/concerned)
- Intent (emergency/report/general/support)
- Priority level (high/medium/low)
- Categories (safety, neighborhood, personal, etc.)
- Whether action is required
- Risk assessment level
- Message summary

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# DSPy Configuration
# Choose your LLM provider: "google-vertex/{model}" or "openai/{model}"
MESSAGE_PROCESSOR_MODEL="google-vertex/gemini-1.5-flash"

# Google Cloud Configuration (for Vertex AI)
GCLOUD_PROJECT="your-gcp-project-id"
VERTEX_LOCATION="us-central1"

# OpenAI Configuration (if using OpenAI)
OPENAI_API_KEY="your-openai-api-key"
```

## Provider Options

### Google Vertex AI (Recommended)
- `MESSAGE_PROCESSOR_MODEL="google-vertex/gemini-1.5-flash"`
- `MESSAGE_PROCESSOR_MODEL="google-vertex/gemini-1.5-pro"`
- Requires: `GCLOUD_PROJECT` and optionally `VERTEX_LOCATION`

### OpenAI
- `MESSAGE_PROCESSOR_MODEL="openai/gpt-4"`
- `MESSAGE_PROCESSOR_MODEL="openai/gpt-3.5-turbo"`
- Requires: `OPENAI_API_KEY`

## Admin API Endpoints

### Get DSPy Status
```bash
GET /api/admin/dspy
```

Response:
```json
{
  "success": true,
  "data": {
    "isCompiled": true,
    "lastCompilationTime": "2024-01-15T10:30:00.000Z",
    "cacheExpired": false,
    "programCount": 1
  }
}
```

### Trigger DSPy Compilation
```bash
POST /api/admin/dspy/compile
```

Optional body:
```json
{
  "force": true  // Force compilation even if cache is valid
}
```

Response:
```json
{
  "success": true,
  "message": "DSPy compilation completed successfully",
  "data": {
    "timestamp": "2024-01-15T10:35:00.000Z"
  }
}
```

## Compilation Triggers

DSPy compilation happens automatically under these conditions:

1. **First run**: When the service starts and no compiled program exists
2. **Cache expiry**: Every 24 hours to maintain optimal performance
3. **Manual trigger**: Via the admin API endpoint

**Important**: Compilation does NOT happen on every message to maintain performance.

## Message Processing Flow

1. Message is received → `handleNewMessage()` is called
2. Check if DSPy program needs compilation
3. If needed, compile using training examples
4. Execute analysis using compiled prompt
5. Parse LLM response into structured data
6. Process results (logging, notifications, database storage)

## Training Examples

The system uses these example patterns for optimization:

- **Emergency messages**: "Help! Someone is following me" → High priority, immediate action
- **Reports**: "Suspicious activity in neighborhood" → Medium priority, monitoring
- **General chat**: Regular conversation → Low priority, normal processing

## Error Handling

- If DSPy analysis fails, the message is still processed normally
- Errors are logged but don't break the message sending flow
- Fallback to basic processing if LLM is unavailable

## Monitoring

Monitor DSPy performance through:
- Admin API status endpoint
- Application logs for analysis results
- Message processing metrics

## Future Enhancements

- JSON mode for more reliable structured output
- Dynamic compilation based on accuracy metrics
- Multi-language support
- Custom training data from user feedback
