configure :test do
  # rspec context looks for views relative to /spec dir unless specified
  set :views, File.dirname(__FILE__) + '/../views'
end
