require 'searchdropbox'  # <-- your sinatra app
require 'rspec'
require 'rack/test'
require 'dummy_dropbox'

set :environment, :test

describe 'Search Dropbox App' do
  include Rack::Test::Methods

  before(:all) do 
    app.send(:set, :sessions, false)
    DummyDropbox.root_path = File.dirname(__FILE__) + 'dummydropbox' 
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
end

