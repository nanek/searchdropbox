require File.dirname(__FILE__) + '/spec_helper'

describe 'Search Dropbox App Functions' do
  include Rack::Test::Methods

  def app
    Sinatra::Application
  end

  it "should return proper mimetype" do 
    mime = mimetype File.join(File.dirname(__FILE__),'dummydropbox','Getting Started.pdf')
    mime.should == 'application/pdf' 
  end

  it "should return sanitized filename" do
    filename = "../test.pdf"
    sanitize_filename(filename).should == ".._test.pdf"
  end
end
