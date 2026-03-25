# Priority Todo List (React + Express)

A simple TODO application where every item must have a positive integer priority.

- Lower integer = higher priority (for example, 2 is higher priority than 5).
- The app shows which priority numbers are missing from 1 up to the current highest priority.
- Data is stored in memory only (no database, no persistence across restarts).

## Features

- Create todo items with:
  - Task title
  - Priority (positive integer)
- Delete todo items
- List todos sorted by:
  - Priority ascending
  - ID ascending for ties
- Show missing priorities dynamically

Example:

If priorities are: 1, 3, 5, 5, 7, 12
Missing priorities shown are: 2, 4, 6, 8, 9, 10, 11

If the item with priority 12 is deleted, missing priorities become: 2, 4, 6

## Tech Stack

- Frontend: React + Vite
- Backend: Express
- Runtime: Node.js
- Storage: In-memory arrays in the API process

## Project Structure

- src: React frontend
- server: Express backend API and static file serving
- dist: Built frontend output (generated)
- vite.config.js: Vite config and API proxy for development

## Prerequisites

- Node.js 18+
- npm

## Install

Run:

npm install

## Running the App

### Development mode (recommended)

Runs both:
- Express API on port 4000
- Vite dev server on port 5173 (default)

Command:

npm run dev

Open:

http://localhost:5173

In dev mode, requests to /api are proxied to the Express server.

### Production-style local run

1) Build frontend:

npm run build

2) Start Express server:

npm start

Open:

http://localhost:4000

Express serves the built frontend from dist in this mode.

## API Reference

Base URL (default): http://localhost:4000

### GET /api/todos

Returns all todos sorted by priority, then id.

Response 200:

[
  {
    "id": 1,
    "title": "Prepare sprint report",
    "priority": 2,
    "createdAt": "2026-03-25T12:00:00.000Z"
  }
]

### POST /api/todos

Creates a todo.

Request body:

{
  "title": "Prepare sprint report",
  "priority": 2
}

Validation:
- title must be a non-empty string
- priority must be a positive integer

Responses:
- 201 created
- 400 bad request for validation errors

### DELETE /api/todos/:id

Deletes a todo by id.

Responses:
- 204 no content on success
- 404 if item not found

### GET /api/priorities/missing

Returns missing integers from 1..maxPriority in the current todo list.

Examples:
- With priorities [1, 3, 5, 5, 7, 12] => [2, 4, 6, 8, 9, 10, 11]
- After deleting priority 12 from that set => [2, 4, 6]

## Data Persistence

The app intentionally does not persist data.
All items are held in memory and are reset when the server restarts.

## Docker

A Dockerfile is present in this repository.

Build image:

docker build -t priority-todo:latest .

Run container:

docker run --rm -p 4000:4000 priority-todo

Then open:

http://localhost:4000

## Scripts

- npm run dev: run Express and Vite together for development
- npm run dev:server: run backend with nodemon
- npm run dev:client: run Vite dev server
- npm run build: build frontend assets to dist
- npm run preview: preview built frontend with Vite
- npm start: run Express server
