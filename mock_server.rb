#!/usr/bin/env ruby
require 'webrick'

class SimulateElkStats < WEBrick::HTTPServlet::AbstractServlet
  def do_GET request, response
    response.status = 200
    response['Content-Type'] = 'application/json'
    response.body = '{"hits": { "total": 5678 } }'
  end
end

class SimulateEnvironmentHealthy < WEBrick::HTTPServlet::AbstractServlet
  def do_GET request, response
    response.status = 200
    response['Content-Type'] = 'application/text'
    response.body = 'version:1234'
  end
end

class SimulateEnvironmentUnhealthy < WEBrick::HTTPServlet::AbstractServlet
  def do_GET request, response
    response.status = 200
    response['Content-Type'] = 'application/text'
    response.body = 'no version available'
  end
end

server = WEBrick::HTTPServer.new :Port => 1234
server.mount('/simulate/elk', SimulateElkStats)
server.mount('/simulate/healthy', SimulateEnvironmentHealthy)

trap('INT') {
  server.stop
}

server.start
