[![Build Status](https://travis-ci.org/GitGitBoom/hapi-mongoose-typescript-starter.svg?branch=main)](https://travis-ci.org/GitGitBoom/hapi-mongoose-typescript-starter)
[![Coverage Status](https://coveralls.io/repos/github/GitGitBoom/hapi-mongoose-typescript-starter/badge.svg?branch=coveralls)](https://coveralls.io/github/GitGitBoom/hapi-mongoose-typescript-starter?branch=coveralls)

# hapi-mongoose-typescript-starter
#### A boilerplate for Hapi.js
A strongly typed rest API with ready built user registration and authorization.

## Getting started
#### Installation
```
yarn install
```

Copy and configure .env from .env.example

#### Development
```
yarn dev
```

#### Production
For a daemonized process via PM2
```
yarn live
```
Stop a daemonized process
```
yarn die
```

#### Containerization
Create container
```
yarn docker
```
Run container
```
yarn run-docker
```

## Dependencies
#### Authorization
JsonWebToken
https://www.npmjs.com/package/jsonwebtoken


#### Documentation
Swagger-Hapi

Learn how to add documentation to your routes
https://github.com/glennjones/hapi-swagger#tagging-your-api-routes

View generated documentation at localhost:3000/documentation

#### Testing
 Jest, TravisCI, Mongo-Memory-Server
 
 Run tests
 ```
 yarn test
 ```
 Run coverage
 ```
 yarn test:coverage
 ```
Open detailed coverage reports
```
yarn test:coverage-report
```

 #### Logging
Logging via Winston with additional transport for MongoDB log storage

Error logging is done with one centralized hook into the Hapi server. There is no need to catch or log errors in contollers.
