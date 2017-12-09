# mal-watching-list

A simple lambda function for fetching the currently watching anime list from your MAL.

### Running

First you need to install the dependencies:

```sh
$ npm install
```

To test it locally you need to install the serverless framework. Like this:

```sh
$ npm install -g serverless
```

After you log in with `$ serverless login`, you can test it by using

```sh
$ serverless offline start
```

Then just open the endpoint that the cli provides you (usually `https://localhost:3000/animelist`).

### Usage

To request a user's list just specify the username using the `user` param. Like
this:

```http
GET https://localhost:3000/animelist?user=aoitsu
```

## TODO:

* [ ] Allow to fetch different status (completed, dropped, etc)
* [ ] Allow to fetch more data fore each anime outside the default properties (like start time, genre, studio, etc...).
* [ ] Improve fetching endpoint / catching
