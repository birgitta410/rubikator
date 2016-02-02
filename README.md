Rubikator
=======

Information radiator for software build and environment status.

Currently supports displaying information from:

- [Go CD](http://go.cd)
- Kibana
- Health checks for a configurable set of environments

Tested in Chrome.

![Sample](docs/screenshot.png?raw=true)

## SETUP PROJECT
```
npm install
```

Configure access to your Go CD server (see below)

Start server
```
node server
```

Local application URL
```
http://localhost:5555
```

## Configure
Create file `config.yml` in the root of the project and configure as described below.

### Access to Go CD
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

The count will always be based on the last one hour.

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

### Run with SSL
You can run the server with SSL support. The server will look for these two files and use them if they exist:
```
rubikator-csr.pem
rubikator-key.pem
```
Here is one resource to help you get started with a self-signed certificate:
[https://nodejs.org/api/tls.html#tls_tls_ssl](https://nodejs.org/api/tls.html#tls_tls_ssl)

...and then check it out at `https://localhost:5555`.
