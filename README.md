Rubikator
=======

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
node rubikator
```

Local application URL
```
http://localhost:5555
```

## Configure
Create file `config.yml` in the root of the project and configure as described below.

You can find an example [here](example-config.yml)

### Team message
(This does not require configuration)

Team members can send a message to be displayed at the top of the dashboard, e.g. "I broke the build, looking into it (bb)". It will only ever show the latest message it received.

This is currently in progress and done very crudely with an unauthenticated GET request:

```
https://localhost:5555/messenger?message=Broke the build, sorry (bb)
```

Syncing up the message might take a few seconds.

### Access to Go CD

The dashboard will only show the Go.CD stages that are either active (building, scheduled, ...) or failed. It will NOT show successful stages!

Animated gifs powered by [Giphy](https://github.com/Giphy/GiphyAPI). Change search terms [here](server/giphyReader.js).

```
default:
  gocd:
    url: https://the-go-host:8154
    user: xxx
    password: xxxx
```

For the security of your build server, please use Go.CD's SSL endpoint and a Go.CD user without operate or admin rights. This password will be in clear text in this config file...

[This Go.CD documentation page](https://www.go.cd/documentation/user/current/configuration/dev_authorization.html) describes how to restrict a user's rights.

### Environment health checks
For each environment you want to monitor you can set multiple health checks. For each check, provide an identifier, a url, and a pattern to parse for a specific piece of information in that endpoint (e.g. the deployed build number).

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
By default, the count will always be based on the last one hour. You can overwrite that default with attribute `timeSpan`, filled with a time value that ElasticSearch will understand in a "gte" query.

```
-
  id: '12h-imports'
  description: 'Imports'
  query: 'message:"successful import" AND ...'
  type: 'INFO'
  timeSpan: 'now-12h'
```

### Run with SSL
You can run the server with SSL support. The server will look for these two files and use them if they exist:
```
rubikator-csr.pem
rubikator-key.pem
```
Here is one resource to help you get started with a self-signed certificate:
[https://nodejs.org/api/tls.html#tls_tls_ssl](https://nodejs.org/api/tls.html#tls_tls_ssl)

...and then check it out at `https://localhost:5555`.
