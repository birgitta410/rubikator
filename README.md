Rubikator
=======

[![Build Status CircleCI](https://circleci.com/gh/birgitta410/rubikator.png?circle-token=e449bef47a235a4236277f300c8dce836408ea14)](https://circleci.com/gh/birgitta410/rubikator/)

Information radiator for software build and environment status.

Currently supports displaying information from:

- [Go CD](http://go.cd) (featuring random animated gifs for success/failure/building)
- Kibana
- Health checks for a configurable set of environments

Tested in Chrome.

![Sample 1](docs/screenshot.jpg?raw=true)

![Sample 2](docs/screenshot2.jpg?raw=true)

## SETUP PROJECT
```
npm install
```

Configure access to your Go CD server (see below)

Start server
```
npm start
```

You may run this application with Docker instead

    docker build -t rubikator .
    docker run -it -d -p 5555:5555 --name rubikator rubikator

Local application URL
```
http://localhost:5555
```

## Configure
Create file `config.yml` in the root of the project and configure as described below.

You can find an example [here](example-config.yml)

If you do not configure one of the areas, it will just be ignored, so you do not have to use all of these tools.

### Team message
(This does not require configuration)

Team members can send a message to be displayed at the top of the dashboard, e.g. "I broke the build, looking into it (bb)". It will only ever show the latest message it received.

This is currently in progress and done very crudely with an unauthenticated GET request:

```
https://localhost:5555/messenger?message=Broke the build, sorry (bb)
```

Syncing up the message might take a few seconds.

### Build status

The dashboard will only show build stages that are either active (building, scheduled, ...) or failed. It will NOT show successful stages!

Animated gifs powered by [Giphy](https://github.com/Giphy/GiphyAPI). Change search terms [here](server/giphyReader.js). From experience, these are usually quite "safe for work", I have never had something REALLY inappropriate. No guarantees of course, as these come back from the giphy search. If a gif comes up that you don't want to see, you would have to restart the rubikator, as it caches the gifs to show for a while.

Currently supports GoCD and TeamCity, either or.

#### Go CD

```
default:
  gocd:
    url: https://the-go-host:8154
    user: xxx
    password: xxxx
```

For the security of your build server, please use Go.CD's SSL endpoint and a Go.CD user without operate or admin rights. This password will be in clear text in this config file...

[This Go.CD documentation page](https://www.go.cd/documentation/user/current/configuration/dev_authorization.html) describes how to restrict a user's rights.

#### TeamCity
```
teamcity:
  host: 'http://the-teamcity-host/guestAuth/app/rest/'
  ccTrayUrl: 'http://the-teamcity-host/guestAuth/app/rest/cctray/projects.xml'
  projects:
    -
      id: 'Test'
      name: 'test'
```

For this to work, you have to enable guest access in TeamCity as described [here](https://confluence.jetbrains.com/display/TCD10/REST+API#RESTAPI-RESTAuthentication).

### Environment health checks
For each environment you want to monitor you can set multiple health checks. For each check, provide an identifier, a url, and a pattern to parse for a specific piece of information in that endpoint (e.g. the deployed build number). Be sure to put one grouping `()` into the regex, that value will be displayed on the monitor.

```
default:
  gocd:
    ...
  environments:
      dev:
        -
          id: 'service-x'
          url: 'http://.../health'
          pattern: 'buildVersion":"([0-9a-zA-Z]{1,})"'
        -
          id: 'client'
          url: 'http://.../build.js'
          pattern: 'buildVersion = "([0-9a-zA-Z]{1,})";'
      qa:
        -
          id: 'service-x'
          url: 'http://.../health'
          pattern: 'buildVersion":"([0-9a-zA-Z]{1,})"'
        -
          id: 'client'
          url: 'http://.../build.js'
          pattern: 'buildVersion = "([0-9a-zA-Z]{1,})";'
```

### Logs from ELK (ElasticSearch-Logstash-Kibana)

A list of queries will be sent to each ElasticSearch URL. Coloring will be done based on the type (ERROR vs. INFO).


```
default:
  ...
  logs:
    environments:
      -
        id: 'dev'
        url: 'http://...:9200/_search'
      -
        id: 'qa'
        url: 'http://...:9200/_search'
        queries:
          - 'errors'
    queries:
      -
        id: 'errors'
        description: 'Errors'
        query: 'level:ERROR'
        type: 'ERROR'
      -
        id: 'warnings'
        description: 'Warnings'
        query: 'level:WARNING'
        type: 'INFO'

```
By default, the count will always be based on the last one hour. You can overwrite that default with attribute `timeSpan`, filled with a time value that ElasticSearch will understand in a "gte" query (e.g. 'now-12h').

If you need specific additions to your queries based on the environment, specify an additional `queryAddition` value for the environment as well.

You can also limit the queries for one environment to a specific set by providing `queries`.

See [example config file](example-config.yml) for examples.

### Run with SSL
You can run the server with SSL support. The server will look for these two files and use them if they exist:
```
rubikator-csr.pem
rubikator-key.pem
```
Here is one resource to help you get started with a self-signed certificate:
[https://nodejs.org/api/tls.html#tls_tls_ssl](https://nodejs.org/api/tls.html#tls_tls_ssl)

...and then check it out at `https://localhost:5555`.

## Build a new data source

You need to steps for this:

- Create a data source in the `server` directory, to regularly send data over websockets to the clients
- Create a visualisation in the `app` directory that can receive the data and update the visualisation

[server/sampleReader.js](server/sampleReader.js) and [app/sampleVisualiser.js](app/sampleVisualiser.js) show a minimum example how to do this.
