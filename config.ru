require 'searchdropbox'
require 'logger'

logfile = 'logs/requests.log'

require 'logger'
class ::Logger; alias_method :write, :<<; end
logger  = ::Logger.new(logfile,'weekly')

use Rack::CommonLogger, logger

run Sinatra::Application 
