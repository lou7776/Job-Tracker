# Job Checklist Tracker

A one-day job tracker for tradespeople. When a tradesperson wins a job, they record what needs doing, check off finished work, and see what remains.

Built with Node, Express, EJS, Passport (local login), and MongoDB.



## Features

- Sign up and log in; each user only sees their own jobs
- Create a job (customer, title, description, quote, urgent flag) with starting checklist items
- Job list with search (customer or title) and filter by status (All / Active / Done)
- Job detail page: check items on and off and see "X of Y remaining"
- Mark a job done
- Delete a job (trash icon on the job list)

## Server-side rules (enforced in Express, not in the browser)

1. **Complete only when finished.** `PUT /jobs/:id/complete` succeeds only if the job has at least one item and every item is done. The check is part of the database query, so if it fails nothing is updated.
2. **Done jobs are locked.** Toggling an item on a done job is rejected (409).
3. **Ownership scoping.** Every query, including updates and deletes, includes `userId: req.user.id`, so a user can't read or change someone else's job, even with its id.

## Routes

| Method | Path | What it does |
|---|---|---|
| GET | `/profile` | Job list (supports `?q=` search and `?status=active\|done`) |
| GET | `/jobs/:id` | Job detail page |
| POST | `/jobs` | Create a job (items entered one per line) |
| PUT | `/jobs/:id/items/:itemId` | Check or uncheck one item |
| PUT | `/jobs/:id/complete` | Mark the job done (rules above) |
| DELETE | `/jobs/:id` | Delete a job |

## Run it

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in your own values:
   - `MONGO_URL`: your MongoDB connection string
   - `SESSION_SECRET`: any long random phrase
   - `PORT`: optional, defaults to 8088
3. Start the server: `node server.js`
4. Open `http://localhost:8088`

The `.env` file is listed in `.gitignore` and is never committed.

## Not built (on purpose)

To keep this to one day, these were left out:

- Separate clients (web only, no separate front-end app)
- Roles or permissions (every user just owns their own jobs)
- File uploads
- Notifications
- Charts
- Tests
- Docker
- CI/CD

## Known limitations

- Job details (customer, title, quote) can't be edited after creating a job; only items and status change.
- Text search runs in JavaScript after the status filter is applied in the database, which is fine for small lists but would move into the database query for large ones.
