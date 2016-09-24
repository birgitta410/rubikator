#!/usr/bin/env ruby
require 'webrick'

class SimulateElkStats < WEBrick::HTTPServlet::AbstractServlet
  def do_GET request, response
    response.status = 200
    response['Content-Type'] = 'application/json'
    response.body = '{"hits": { "total": 2 } }'
  end
end

server = WEBrick::HTTPServer.new :Port => 1234
server.mount('/simulate/elk', SimulateElkStats)

trap('INT') {
  server.stop
}

server.start
