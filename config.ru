require 'rubygems'
require 'bundler'

Bundler.require

require './searchdropbox'

run Sinatra::Application 
