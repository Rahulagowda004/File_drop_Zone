# File Drop Zone

A secure, cloud-based temporary file sharing platform. Share files with others using simple keywords!

## Features

- **Simple Keyword System**: Upload files to a custom keyword and share with anyone
- **Automated File Expiration**: All files automatically delete after 24 hours
- **Secure Cloud Storage**: Files stored securely in Azure Blob Storage
- **Database Integration**: File metadata stored in MongoDB
- **Modern UI**: Responsive design with clean, card-based interface

## Tech Stack

- **Frontend**: React.js, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Storage**: Azure Blob Storage
- **Database**: MongoDB
- **Deployment**: Vercel compatible

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm/yarn
- MongoDB Atlas account
- Azure account with Blob Storage

### Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```
# MongoDB Connection
MONGO_URI=your_mongodb_connection_string
MONGO_DB=fdz

# Azure Blob Storage
AZURE_CONNECTION_STRING=your_azure_connection_string
AZURE_CONTAINER_NAME=files

# Application settings
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:9002](http://localhost:9002) in your browser

## File Cleanup

Files automatically expire after 24 hours. This is handled by:

1. Expiration timestamp stored with each file in MongoDB
2. API endpoint at `/api/cron/cleanup` that deletes expired files
3. For production, set up a cron job to call this endpoint hourly:
   ```
   curl -X POST https://your-domain.com/api/cron/cleanup
   ```

## Security Considerations

- Files are public by default - anyone with the keyword can access files
- For production use, implement proper authentication
- Consider storing files with restricted access in production environment

## License

MIT
