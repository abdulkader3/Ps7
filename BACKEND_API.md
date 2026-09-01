# Backend API Documentation — "UP" (YouTube Clone + Tweets)

> **Base URL:** `/api/v1`
>
> **Content-Type:** `application/json` (unless uploading files, then `multipart/form-data`)
>
> **Auth:** Most protected routes require a `refreshToken` sent as an **httpOnly cookie** OR as a Bearer token in the `Authorization` header.

---

## Table of Contents

1. [Response Format](#response-format)
2. [Auth Mechanism](#auth-mechanism)
3. [User APIs](#1-user-apis)
4. [Channel APIs](#2-channel-apis)
5. [Video APIs](#3-video-apis)
6. [Subscription APIs](#4-subscription-apis)
7. [Playlist APIs](#5-playlist-apis)
8. [Comment APIs](#6-comment-apis)
9. [Tweet APIs](#7-tweet-apis)
10. [Data Models Reference](#data-models-reference)

---

## Response Format

### Success Response

```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success message",
  "success": true
}
```

### Error Response

```json
{
  "statusCode": 401,
  "message": "Error description",
  "errors": [],
  "data": null,
  "success": false
}
```

---

## Auth Mechanism

- **Login** sets two httpOnly cookies: `accessToken` and `refreshToken`.
- **Protected routes** are verified using the **`refreshToken`** (sent via cookie or `Authorization: Bearer <token>` header).
- `JWTverify` — required, returns 401 if not logged in.
- `JWTverifyOptional` — if the user is logged in, `req.user` is populated; if not, `req.user` is `null` and the request continues.

**Frontend should:**
- Always send cookies (`credentials: true` with CORS).
- For SPA/mobile: send `Authorization: Bearer <refreshToken>` header.
- On 401, redirect to login or call the `/refreshed-token` endpoint.

---

## 1. User APIs

### 1.1 Register

```
POST /api/v1/users/register
Content-Type: multipart/form-data
```

**Fields (form-data):**

| Field        | Type   | Required | Notes                                                    |
|--------------|--------|----------|----------------------------------------------------------|
| `userName`   | String | YES      | Must be unique, will be lowercased                       |
| `fullName`   | String | YES      | Display name                                              |
| `email`      | String | YES      | Must be a valid email, must be unique                     |
| `password`   | String | YES      | Min length not enforced by backend, but should be strong  |
| `avatar`     | File   | YES      | Profile picture. **At least one file is required.**       |
| `coverImage` | File   | NO       | Banner/cover image. Optional, can be added later.         |

**Response (201):**

```json
{
  "statusCode": 201,
  "data": {
    "_id": "...",
    "userName": "johndoe",
    "fullName": "John Doe",
    "email": "john@example.com",
    "avatar": "https://res.cloudinary.com/...",
    "avatar_public_id": "...",
    "coverImage": "https://res.cloudinary.com/...",
    "coverImag_public_id": "...",
    "watchHistory": [],
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "user registered successfully",
  "success": true
}
```

**Frontend Notes:**
- `avatar` and `coverImage` URLs are Cloudinary URLs — use them directly as `src` in `<img>` tags.
- Password and refreshToken are stripped from the response.
- After registration, user is NOT auto-logged-in. Frontend should call `/login` next.

---

### 1.2 Login

```
POST /api/v1/users/login
Content-Type: application/json
```

**Body:**

```json
{
  "userName": "johndoe",   // either userName OR email is required
  "email": "john@example.com",
  "password": "secret123"
}
```

- At least one of `userName` or `email` is required.
- `password` is always required.

**Response (200):** Same user object as register (no password/refreshToken). Sets `accessToken` and `refreshToken` as httpOnly cookies.

**Frontend Notes:**
- Store the cookies. All subsequent protected requests will auto-send them.
- Also store the `accessToken` in memory or a non-httpOnly place if you want to use it for API calls (the backend primarily uses `refreshToken` for auth verification).

---

### 1.3 Logout

```
POST /api/v1/users/logout
Auth: Required (JWTverify)
```

**Body:** None

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {},
  "message": "user logged out successfully",
  "success": true
}
```

**Frontend Notes:**
- Clears both `accessToken` and `refreshToken` cookies.
- Frontend should clear any local user state and redirect to login/home.

---

### 1.4 Get Current User Data

```
POST /api/v1/users/get-user-data
Auth: Required (JWTverify)
```

**Body:** None

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "...",
    "watchHistory": ["videoId1", "videoId2"],
    "userName": "johndoe",
    "fullName": "John Doe",
    "email": "john@example.com",
    "avatar": "https://res.cloudinary.com/...",
    "avatar_public_id": "...",
    "coverImage": "https://res.cloudinary.com/...",
    "coverImag_public_id": "...",
    "refreshToken": "...",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "User data fetched successfully",
  "success": true
}
```

**Frontend Notes:**
- Call this on app load (if cookies exist) to hydrate the user state.
- `watchHistory` contains video IDs (call video APIs to get full video details).

---

### 1.5 Refresh Token

```
POST /api/v1/users/refreshed-token
Auth: Required (JWTverify)
```

**Body:** None

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "user": { "...user object without password..." },
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token"
  },
  "message": "User's token has been refreshed successfully",
  "success": true
}
```

**Frontend Notes:**
- New tokens are also set as cookies.
- Call this periodically or when token is about to expire.

---

### 1.6 Change Password

```
POST /api/v1/users/change-password
Auth: Required (JWTverify)
Content-Type: application/json
```

**Body:**

```json
{
  "oldPassword": "currentPassword",
  "newPassword": "newStrongPassword"
}
```

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {},
  "message": "User password changed successfully",
  "success": true
}
```

---

### 1.7 Change Full Name

```
POST /api/v1/users/change-fullName
Auth: Required (JWTverify)
Content-Type: application/json
```

**Body:**

```json
{
  "fullNameNew": "New Full Name"
}
```

**Response (200):** Updated user object (without password/refreshToken).

---

### 1.8 Change Email

```
POST /api/v1/users/change-email
Auth: Required (JWTverify)
Content-Type: application/json
```

**Body:**

```json
{
  "emailNew": "newemail@example.com"
}
```

**Response (200):** Updated user object (without password/refreshToken).

---

### 1.9 Change Avatar

```
POST /api/v1/users/change-avatar
Auth: Required (JWTverify)
Content-Type: multipart/form-data
```

**Fields (form-data):**

| Field    | Type | Required | Notes                                    |
|----------|------|----------|------------------------------------------|
| `avatar` | File | YES      | Single file. Old avatar is auto-deleted. |

**Response (200):** Updated user object with new `avatar` URL.

**Frontend Notes:**
- Use a file input with `accept="image/*"`.
- Old avatar is automatically deleted from Cloudinary.

---

### 1.10 Change Cover Image

```
POST /api/v1/users/change-coverImage
Auth: Required (JWTverify)
Content-Type: multipart/form-data
```

**Fields (form-data):**

| Field        | Type | Required | Notes                                          |
|--------------|------|----------|------------------------------------------------|
| `coverImage` | File | YES      | Single file. Old cover image is auto-deleted.  |

**Response (200):** Updated user object with new `coverImage` URL.

---

## 2. Channel APIs

### 2.1 Get Channel Details

```
POST /api/v1/channel/user-channel/:username
Auth: Required (JWTverify)
```

**Params:**

| Param      | Description                    |
|------------|--------------------------------|
| `username` | The channel's username (lowercase) |

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "...",
    "userName": "johndoe",
    "fullName": "John Doe",
    "email": "john@example.com",
    "avatar": "https://res.cloudinary.com/...",
    "coverImage": "https://res.cloudinary.com/...",
    "channels_subscriber_count": 150,
    "channels_user_subscribed_to_count": 30,
    "is_logged_in_user_subscribed": true
  },
  "message": "Channel fetched successfully",
  "success": true
}
```

**Frontend Notes:**
- Use this to render a channel/profile page.
- `is_logged_in_user_subscribed` — use this to show "Subscribed" vs "Subscribe" button.
- `channels_subscriber_count` — display subscriber count.
- `channels_user_subscribed_to_count` — how many channels this user subscribes to.

---

### 2.2 Get User Watch History

```
POST /api/v1/channel/get-user-watchHistory
Auth: Required (JWTverify)
```

**Body:** None

**Response (200):**

```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "videoId",
      "videFile": "https://res.cloudinary.com/.../video.mp4",
      "videFile_public_id": "...",
      "thumbnail": "https://res.cloudinary.com/.../thumb.jpg",
      "thumbnail_public_id": "...",
      "owner": {
        "_id": "userId",
        "userName": "uploader",
        "email": "uploader@example.com",
        "avatar": "https://res.cloudinary.com/..."
      },
      "title": "My Video Title",
      "description": "Video description",
      "duration": 120.5,
      "views": 1024,
      "isPublished": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "message": "user watch history fetched successfully",
  "success": true
}
```

**Frontend Notes:**
- Each video in the array has a populated `owner` with `userName`, `email`, and `avatar`.
- Display as a horizontal scrollable list or a grid of video thumbnails.

---

## 3. Video APIs

### 3.1 Upload Video

```
POST /api/v1/videos/upload
Auth: Required (JWTverify)
Content-Type: multipart/form-data
```

**Fields (form-data):**

| Field       | Type   | Required | Notes                          |
|-------------|--------|----------|--------------------------------|
| `video`     | File   | YES      | The video file                 |
| `thumbnail` | File   | YES      | Thumbnail image for the video  |
| `title`     | String | YES      | Video title                    |
| `description` | String | YES   | Video description              |

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "...",
    "videFile": "https://res.cloudinary.com/.../video.mp4",
    "videFile_public_id": "...",
    "thumbnail": "https://res.cloudinary.com/.../thumb.jpg",
    "thumbnail_public_id": "...",
    "owner": "...userId...",
    "title": "My Video",
    "description": "Video description",
    "duration": 120.5,
    "views": 0,
    "isPublished": true,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "...'s video upload was successful",
  "success": true
}
```

**Frontend Notes:**
- Use `enctype="multipart/form-data"` on the form.
- `duration` is auto-extracted from the video file by Cloudinary.
- Display upload progress using XHR instead of fetch for progress events.

---

### 3.2 Play Video (Get Video + Increment Views)

```
POST /api/v1/videos/:video_id
Auth: Optional (JWTverifyOptional)
```

**Params:**

| Param      | Description |
|------------|-------------|
| `video_id` | The video's `_id` |

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "...",
    "videFile": "https://res.cloudinary.com/.../video.mp4",
    "videFile_public_id": "...",
    "thumbnail": "https://res.cloudinary.com/.../thumb.jpg",
    "thumbnail_public_id": "...",
    "owner": "...userId...",
    "title": "My Video",
    "description": "Video description",
    "duration": 120.5,
    "views": 1025,
    "isPublished": true,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Your video is ready to watch",
  "success": true
}
```

**Frontend Notes:**
- This increments the view count by 1 each time it is called.
- If the user is logged in, the video ID is added to their `watchHistory`.
- Use the `videFile` URL as the `src` for the `<video>` element.
- Use the `thumbnail` URL as the poster/thumbnail before the video loads.
- Auth is optional — unauthenticated users can still watch videos.

---

## 4. Subscription APIs

### 4.1 Subscribe to Channel

```
POST /api/v1/subscription/subscribe/:channel_id
Auth: Required (JWTverify)
```

**Params:**

| Param        | Description             |
|--------------|-------------------------|
| `channel_id` | The channel's user `_id` |

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "...",
    "channel": "...channelUserId...",
    "subscriber": "...loggedInUserId...",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "... is subscribed to this channel's",
  "success": true
}
```

**Frontend Notes:**
- After subscribing, toggle the button to "Subscribed" state.
- Update the subscriber count on the channel page.

---

### 4.2 Unsubscribe from Channel

```
POST /api/v1/subscription/unsubscribe/:channel_id
Auth: Required (JWTverify)
```

**Params:**

| Param        | Description             |
|--------------|-------------------------|
| `channel_id` | The channel's user `_id` |

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {},
  "message": "... is unsubscribe to this channel's",
  "success": true
}
```

**Frontend Notes:**
- After unsubscribing, toggle the button to "Subscribe" state.
- Update the subscriber count on the channel page.

---

## 5. Playlist APIs

### 5.1 Get All Playlists (Current User)

```
GET /api/v1/playlist/
Auth: Required (JWTverify)
```

**Response (200):**

```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "...",
      "playlistName": "My Favorites",
      "description": "Best videos",
      "videos": ["videoId1", "videoId2"],
      "owner": "...userId...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "message": "...'s playlist fetched from database",
  "success": true
}
```

**Frontend Notes:**
- `videos` contains an array of video `_id` strings.
- To display video details in a playlist, call the video API for each ID or batch-fetch.
- Show playlist name, description, and video count.

---

### 5.2 Create Playlist

```
POST /api/v1/playlist/create-playlist
Auth: Required (JWTverify)
Content-Type: application/json
```

**Body:**

```json
{
  "playlistName": "My Favorites",
  "description": "Best videos I found",
  "videos": ["videoId1", "videoId2"]
}
```

| Field          | Type     | Required | Notes                                    |
|----------------|----------|----------|------------------------------------------|
| `playlistName` | String   | YES      | Name of the playlist                     |
| `description`  | String   | NO       | Defaults to empty string                 |
| `videos`       | String[] | NO       | Array of video `_id`s. Defaults to `[]`  |

**Response (201):** Created playlist object.

---

### 5.3 Add Video to Playlist

```
POST /api/v1/playlist/add-video-in-playlist/:playlist/:video
Auth: Required (JWTverify)
```

**Params:**

| Param      | Description          |
|------------|----------------------|
| `playlist` | The playlist's `_id` |
| `video`    | The video's `_id`    |

**Response (200):** Updated playlist object with the new video added.

**Frontend Notes:**
- Duplicate videos are automatically prevented (uses `$addToSet`).
- Show a dropdown/modal of user's playlists when "Save to Playlist" is clicked.

---

## 6. Comment APIs

### 6.1 Get Comments for a Video

```
GET /api/v1/comment/:video
```

**Params:**

| Param   | Description |
|---------|-------------|
| `video` | The video's `_id` |

**Auth:** NOT required.

**Response (200):**

```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "...",
      content: "Great video!",
      "video": "...videoId...",
      "owner": "...userId...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "message": "all the comment for this video fetched from database",
  "success": true
}
```

**Frontend Notes:**
- `owner` is just the user `_id` — to display the commenter's name/avatar, you need to fetch user data separately or populate on the backend later.
- Display comments in a list below the video player.
- Show comment text, timestamp, and user info.

---

### 6.2 Create Comment

```
POST /api/v1/comment/:video
Auth: Required (JWTverify)
Content-Type: application/json
```

**Params:**

| Param   | Description |
|---------|-------------|
| `video` | The video's `_id` |

**Body:**

```json
{
  "content": "This is my comment"
}
```

**Response (201):** Created comment object.

**Frontend Notes:**
- Show a text input/textarea below the video.
- After posting, append the new comment to the list without a page reload.

---

### 6.3 Delete Comment

```
POST /api/v1/comment/delete/:comment
Auth: Required (JWTverify)
```

**Params:**

| Param     | Description        |
|-----------|--------------------|
| `comment` | The comment's `_id` |

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {},
  "message": "comment is deleted successfully",
  "success": true
}
```

**Frontend Notes:**
- Only show the delete button if `comment.owner === currentUser._id`.
- After deletion, remove the comment from the UI.

---

## 7. Tweet APIs

> Tweets are short text posts tied to a specific video. Think of them as "video replies" or "video reactions."

### 7.1 Get Tweets for a Video

```
GET /api/v1/tweets/:video
```

**Params:**

| Param   | Description |
|---------|-------------|
| `video` | The video's `_id` |

**Auth:** NOT required.

**Response (200):**

```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "...",
      "content": "This video is amazing!",
      "video": "...videoId...",
      "owner": "...userId...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "message": "all the tweets for this video fetched from database",
  "success": true
}
```

**Frontend Notes:**
- `owner` is just the user `_id`. Fetch user details to show avatar/name.
- Display tweets in a section below the video (separate from comments, or as a tab).

---

### 7.2 Create Tweet

```
POST /api/v1/tweets/:video
Auth: Required (JWTverify)
Content-Type: application/json
```

**Params:**

| Param   | Description |
|---------|-------------|
| `video` | The video's `_id` |

**Body:**

```json
{
  "content": "My tweet about this video!"
}
```

**Response (201):** Created tweet object.

---

### 7.3 Delete Tweet

```
POST /api/v1/tweets/delete/:tweet
Auth: Required (JWTverify)
```

**Params:**

| Param   | Description       |
|---------|-------------------|
| `tweet` | The tweet's `_id` |

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Tweet is deleted successfully",
  "success": true
}
```

**Frontend Notes:**
- Only show delete button if `tweet.owner === currentUser._id`.
- Only the tweet owner can delete their own tweet.

---

## Data Models Reference

### User

```
{
  _id:              ObjectId (auto)
  watchHistory:     [ObjectId → Video]
  userName:         String (unique, lowercase, trimmed)
  email:            String (unique, lowercase, trimmed)
  fullName:         String (trimmed)
  avatar:           String (Cloudinary URL) — REQUIRED
  avatar_public_id: String — REQUIRED
  coverImage:       String (Cloudinary URL) — optional
  coverImag_public_id: String — optional
  password:         String (hashed with bcrypt) — never sent to frontend
  refreshToken:     String — never sent to frontend in normal responses
  createdAt:        Date (auto)
  updatedAt:        Date (auto)
}
```

### Video

```
{
  _id:                ObjectId (auto)
  videFile:           String (Cloudinary URL) — REQUIRED
  videFile_public_id: String — REQUIRED
  thumbnail:          String (Cloudinary URL) — REQUIRED
  thumbnail_public_id: String — REQUIRED
  owner:              ObjectId → User
  title:              String — REQUIRED
  description:        String — REQUIRED
  duration:           Number (default: 0) — auto-set from Cloudinary
  views:              Number (default: 0)
  isPublished:        Boolean (default: true)
  createdAt:          Date (auto)
  updatedAt:          Date (auto)
}
```

### Comment

```
{
  _id:       ObjectId (auto)
  content:   String
  video:     ObjectId → Video
  owner:     ObjectId → User
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

### Tweet

```
{
  _id:       ObjectId (auto)
  content:   String
  video:     ObjectId → Video
  owner:     ObjectId → User
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

### Subscription

```
{
  _id:        ObjectId (auto)
  channel:    ObjectId → User  (the channel being subscribed to)
  subscriber: ObjectId → User  (the user who subscribed)
  createdAt:  Date (auto)
  updatedAt:  Date (auto)
}
```

### Playlist

```
{
  _id:          ObjectId (auto)
  playlistName: String — REQUIRED
  description:  String
  videos:       [ObjectId → Video]
  owner:        ObjectId → User
  createdAt:    Date (auto)
  updatedAt:    Date (auto)
}
```

---

## Frontend Development Guide

### Auth Flow

1. **Register** → upload avatar (required) + cover image (optional) → redirect to login
2. **Login** → cookies set automatically → call `get-user-data` to hydrate state
3. **Logout** → cookies cleared → redirect to home
4. **On app load** → if cookies exist, call `get-user-data` to check session

### File Upload Notes

All file uploads use `multipart/form-data`:

- **Register:** `avatar` (required) + `coverImage` (optional)
- **Upload Video:** `video` (required) + `thumbnail` (required)
- **Change Avatar:** `avatar` (single file)
- **Change Cover Image:** `coverImage` (single file)

### Display Guidelines

| Feature              | What to show                                                        |
|----------------------|---------------------------------------------------------------------|
| **Video card**       | `thumbnail` as image, `title`, `owner.userName`, `views`, `duration`|
| **Video player**     | `<video>` with `videFile` as `src`, `thumbnail` as poster           |
| **User avatar**      | `avatar` URL as `<img>` src                                         |
| **Channel page**     | `coverImage` as banner, `avatar`, `fullName`, subscriber count      |
| **Subscribe button** | Toggle based on `is_logged_in_user_subscribed` from channel API     |
| **Comments section** | List of comments with user info + create/delete for logged-in users |
| **Tweets section**   | List of tweets with user info + create/delete for logged-in users   |
| **Watch history**    | Grid of video cards with owner info populated                       |
| **Playlist**         | Playlist name + video count; expand to show video list               |

### CORS

The backend uses:
```js
cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
})
```

Frontend must send `credentials: true` (or `withCredentials: true` in Axios) with every request.

---

## API Route Summary

| Method | Route                                        | Auth     | Description               |
|--------|----------------------------------------------|----------|---------------------------|
| POST   | `/api/v1/users/register`                     | No       | Register new user         |
| POST   | `/api/v1/users/login`                        | No       | Login                     |
| POST   | `/api/v1/users/logout`                       | Required | Logout                    |
| POST   | `/api/v1/users/get-user-data`                | Required | Get current user          |
| POST   | `/api/v1/users/refreshed-token`              | Required | Refresh tokens            |
| POST   | `/api/v1/users/change-password`              | Required | Change password           |
| POST   | `/api/v1/users/change-fullName`              | Required | Change full name          |
| POST   | `/api/v1/users/change-email`                 | Required | Change email              |
| POST   | `/api/v1/users/change-avatar`                | Required | Change avatar             |
| POST   | `/api/v1/users/change-coverImage`            | Required | Change cover image        |
| POST   | `/api/v1/channel/user-channel/:username`     | Required | Get channel details       |
| POST   | `/api/v1/channel/get-user-watchHistory`      | Required | Get watch history         |
| POST   | `/api/v1/videos/upload`                      | Required | Upload video              |
| POST   | `/api/v1/videos/:video_id`                   | Optional | Play video (increment views) |
| POST   | `/api/v1/subscription/subscribe/:channel_id` | Required | Subscribe to channel      |
| POST   | `/api/v1/subscription/unsubscribe/:channel_id` | Required | Unsubscribe from channel |
| GET    | `/api/v1/playlist/`                          | Required | Get user playlists        |
| POST   | `/api/v1/playlist/create-playlist`           | Required | Create playlist           |
| POST   | `/api/v1/playlist/add-video-in-playlist/:playlist/:video` | Required | Add video to playlist |
| GET    | `/api/v1/comment/:video`                     | No       | Get comments for video    |
| POST   | `/api/v1/comment/:video`                     | Required | Create comment            |
| POST   | `/api/v1/comment/delete/:comment`            | Required | Delete comment            |
| GET    | `/api/v1/tweets/:video`                      | No       | Get tweets for video      |
| POST   | `/api/v1/tweets/:video`                      | Required | Create tweet              |
| POST   | `/api/v1/tweets/delete/:tweet`               | Required | Delete tweet              |
