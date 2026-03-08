# Post Management Server

Backend server for post management using Node.js, Express.js, and MongoDB.

## Setup

1. Install dependencies:
   - `npm install`
2. Create env file:
   - Copy `.env.example` to `.env`
3. Update MongoDB connection string in `.env`.
4. Run development server:
   - `npm run dev`

## API Endpoints

- `GET /health` - Health check.
- `POST /api/posts` - Create post.
- `GET /api/posts` - List posts with pagination/filter.
- `GET /api/posts/:id` - Get post detail.
- `PUT /api/posts/:id` - Update post.
- `DELETE /api/posts/:id` - Delete post.

## Example Post Payload

```json
{
  "title": "Tin khuyen mai thang 3",
  "content": "Noi dung tin dang...",
  "author": "Admin",
  "status": "draft",
  "tags": ["khuyen-mai", "su-kien"]
}
```
