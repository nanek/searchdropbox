require 'rubygems'
require 'bundler/setup'
require 'sinatra'
require 'dropbox'
require 'rsolr'
require 'haml'
require 'pathname'

configure do   
  yaml = YAML.load_file("config.yml")[settings.environment.to_s]
  yaml.each_pair do |key, value|
    set(key.to_sym, value)
  end
end 

FILE_DIR = File.expand_path(File.join(File.dirname(__FILE__), "files"))

enable :sessions
enable :logging

get '/' do
  session.clear
  haml :index
end

get '/file' do
  return redirect to('authorize') unless session[:dropbox_session]
  dropbox_session = Dropbox::Session.deserialize(session[:dropbox_session])
  return redirect to('authorize') unless dropbox_session.authorized?

  uid = dropbox_session.account["uid"].to_s
  
  content_type :pdf #TODO

  filename = File.expand_path(File.join(FILE_DIR, uid, sanitize_filename(params[:n])))
  raise if FILE_DIR != File.expand_path(File.join(File.dirname(filename), '../'))
  File.read(filename)
end

get '/authorize' do
  if params[:oauth_token] then
    dropbox_session = Dropbox::Session.deserialize(session[:dropbox_session])
    dropbox_session.authorize(params)
    session[:dropbox_session] = dropbox_session.serialize # re-serialize the authenticated session

    return_url = params[:r] || 'search'
    redirect to return_url 
  elsif session[:dropbox_session] then
    dropbox_session = Dropbox::Session.deserialize(session[:dropbox_session])
    if dropbox_session.authorized? then
      redirect to('search')
    else
      session.clear
      redirect to '/authorize'
    end
  else
    dropbox_session = Dropbox::Session.new(settings.DROPBOX_API_KEY, settings.DROPBOX_API_SECRET)
    dropbox_session.mode = :dropbox
    session.clear
    session[:dropbox_session] = dropbox_session.serialize
    redirect to dropbox_session.authorize_url(:oauth_callback => settings.DROPBOX_API_CALLBACK)
  end
end

get '/index' do
  return redirect to('authorize?r=index') unless session[:dropbox_session]
  dropbox_session = Dropbox::Session.deserialize(session[:dropbox_session])
  return redirect to('authorize?r=index') unless dropbox_session.authorized?

  uid = dropbox_session.account["uid"].to_s
  folder = params[:f] || '/'

  solr = RSolr.connect :url => settings.SOLR_URL
  paths = []
  files = dropbox_session.metadata(folder, { :mode => :dropbox }).contents
  files.each { |file| if !file.directory? then paths << file.path end }
  FileUtils.mkdir_p(File.join(FILE_DIR, uid))
  for path in paths
    contents = dropbox_session.download(path, { :mode => :dropbox })
    file_path = File.join(FILE_DIR, uid, sanitize_filename(path))
    File.open(file_path, 'w') {|f| f.write(contents) }
  end
  files.each do |doc|
    if !doc.directory? then
      request = solr.post('update/extract', :data=>'myfile', :params => {'literal.id' => doc.path,
      'stream.file' => File.join(FILE_DIR, uid, sanitize_filename(doc.path)),
      'stream.contentType' => 'application/pdf',
      'uprefix' => 'attr_',
      'fmap.content' => 'attr_content',
      'literal.uid' => uid,
      'literal.db_size' => doc.size,
      'literal.db_bytes' => doc.bytes,
      'literal.db_icon' => doc.icon,
      'literal.db_modified' => doc.modified })
    end 
  end
  #solr.update :data => '<commit/>'
  solr.commit
  redirect to('search')
end

get '/search' do
  return redirect to('authorize?r=search') unless session[:dropbox_session]
  dropbox_session = Dropbox::Session.deserialize(session[:dropbox_session])
  return redirect to('authorize?r=search') unless dropbox_session.authorized?

  uid = dropbox_session.account["uid"].to_s

  search_term = params[:q]
  @results = []
  @facets = []
  @highlighting = []
  if !search_term.nil? then
    solr = RSolr.connect :url => settings.SOLR_URL
    response = solr.get 'select', :params => {:q => 'attr_content:' + search_term,
       :hl => "true",
       "hl.fl" => "attr_content",
       #"fl" => TODO,
       "hl.fragsize" => "300",
       :facet => "true",
       "facet.field" => "content_type",
       "fq.uid" => uid }
    @numFound = response["response"]["numFound"]
    @results = response["response"]["docs"]
    @highlighting = response["highlighting"]
    @facets = response["facet_counts"]["facet_fields"]
  end
  haml :search
end

get '/delete' do
  return redirect to('authorize?r=delete') unless session[:dropbox_session]
  dropbox_session = Dropbox::Session.deserialize(session[:dropbox_session])
  return redirect to('authorize?r=delete') unless dropbox_session.authorized?

  uid = dropbox_session.account["uid"].to_s

  user_dir = File.join(FILE_DIR, uid)
  if File.exists?(user_dir) then
    user_dir.each { |x| File.delete(File.join(user_dir, x)) unless x=='.' || x=='..' }
    Dir.rmdir(user_dir.path)
  end
  
  solr = RSolr.connect :url => settings.SOLR_URL
  solr.delete_by_query 'attr_uid:' + uid
  solr.commit
  
  haml :delete
end

def sanitize_filename(filename)
  filename.strip.tap do |name|
    # NOTE: File.basename doesn't work right with Windows paths on Unix
    # get only the filename, not the whole path
    #name.sub! /\A.*(\\|\/)/, ''
    # Finally, replace all non alphanumeric, underscore
    # or periods with underscore
    name.gsub! /[^\w\.\-]/, '_'
  end
end
