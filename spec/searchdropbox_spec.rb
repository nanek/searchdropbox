require File.dirname(__FILE__) + '/spec_helper'
require 'dummy_dropbox'

describe 'Search Dropbox App' do
  include Rack::Test::Methods

  before(:all) do 
    app.send(:set, :sessions, false)
    DummyDropbox.root_path = File.join(File.dirname(__FILE__), 'dummydropbox')
    dropbox_session = Dropbox::Session.new(settings.DROPBOX_API_KEY, settings.DROPBOX_API_SECRET)
    @session = { :dropbox_session => dropbox_session.serialize }
  end

  def app
    Sinatra::Application
  end

  it "should display landing page" do
    get '/'
    last_response.should be_ok
  end

  it "should display search page" do
    get '/search', '', 'rack.session' => @session 
    last_response.should be_ok
  end
  
  it "should display index page" do
    get '/index', '', 'rack.session' => @session 
    last_response.should be_redirect
  end
  
  it "should display valid page after delete" do
    get '/delete', '', 'rack.session' => @session 
    last_response.should be_ok
  end
end
