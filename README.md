# Linker - Backend

## Features

- Authentication
- URLs
  - Add
  - Delete
  - Update
- Analytics
  - Number of unique visitors
  - Total number of page views
- Automated testing cases for APIs
  - Swagger (probably)

### Bonus Features

Extract browser and OS information from user agent of request.

- More info
  - Device
  - Location - City/Country
  - Browser
- Expiration time
  - If expired, return to 404 as usual
- Customizable shortened URLs

## API Endpoints

| Method   | Path            | Notes                    |
| -------- | --------------- | ------------------------ |
| `POST`   | /auth/register/ | Register user            |
| `POST`   | /auth/sign-in   | Sign in user             |
| `GET`    | /link/:id       | Get link information     |
| `PUT`    | /link           | Add a new link           |
| `PATCH`  | /link/:id       | Update a link with an id |
| `DELETE` | /link/:id       | Delete a link with an id |
