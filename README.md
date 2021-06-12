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

| Method   | Path            | Notes                     |
| -------- | --------------- | ------------------------- |
| `POST`   | /auth/register/ | Register user             |
| `POST`   | /auth/sign-in   | Sign in user              |
| `PUT`    | /link           | Add a new link            |
| `GET`    | /link/:hash     | Get link information      |
| `PATCH`  | /link/:hash     | Update a link with a hash |
| `DELETE` | /link/:hash     | Delete a link with a hash |

## Setting up development environment

Make sure you have `docker` installed.

### Start the mongodb container

```sh
./bin/start-db.sh
```

### Start server

```sh
yarn dev
```
