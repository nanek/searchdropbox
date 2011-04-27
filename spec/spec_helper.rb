require 'rubygems'
require 'bundler/setup'
require 'sinatra'
require 'rack/test'
require 'rspec'

# set test environment
Sinatra::Base.set :environment, :test
Sinatra::Base.set :run, false
Sinatra::Base.set :raise_errors, true
Sinatra::Base.set :logging, true

require File.join(File.dirname(__FILE__), '..', 'searchdropbox')
