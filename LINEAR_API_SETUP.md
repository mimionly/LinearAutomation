# Linear API Key Setup

The Linear API key should be set as an environment variable named `LINEAR_API_KEY`.

## For Development:
Create a `.env.local` file in the project root:

```
LINEAR_API_KEY=your_linear_api_key_here
```

## For Production:
Set the environment variable in your deployment platform:

- **Vercel**: Add `LINEAR_API_KEY` in Environment Variables
- **Netlify**: Add `LINEAR_API_KEY` in Build & Deploy settings
- **Railway**: Add `LINEAR_API_KEY` in Variables
- **Docker**: Pass as environment variable

## Getting Your API Key:
1. Go to [Linear Settings](https://linear.app/settings/api)
2. Generate a new API key
3. Copy the key and set it as `LINEAR_API_KEY`

The API key is used automatically by the backend - no frontend configuration needed.