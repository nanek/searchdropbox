require 'rubygems'
require 'bundler/setup'
require 'sinatra'
require 'dropbox'
require 'rsolr'
require 'haml'

configure do   
  yaml = YAML.load_file("config.yaml")[settings.environment.to_s]
  yaml.each_pair do |key, value|
    set(key.to_sym, value)
  end
end 

enable :sessions

get '/' do
  session.clear
  haml :index
end

get '/file/:name' do
  return redirect to('authorize') unless session[:dropbox_session]
  dropbox_session = Dropbox::Session.deserialize(session[:dropbox_session])
  return redirect to('authorize') unless dropbox_session.authorized?

  uid = dropbox_session.account["uid"].to_s
  
  content_type :pdf
  File.read(File.join(settings.INDEX_DIR, uid,  params[:name]))
end

get '/authorize' do
     if params[:oauth_token] then
       dropbox_session = Dropbox::Session.deserialize(session[:dropbox_session])
       dropbox_session.authorize(params)
       session[:dropbox_session] = dropbox_session.serialize # re-serialize the authenticated session

       redirect to 'indexing'
     else
       dropbox_session = Dropbox::Session.new(settings.DROPBOX_API_KEY, settings.DROPBOX_API_SECRET)
       dropbox_session.mode = :dropbox
       session.clear
       session[:dropbox_session] = dropbox_session.serialize
       redirect to dropbox_session.authorize_url(:oauth_callback => settings.DROPBOX_API_CALLBACK)
     end
end

get '/indexing' do
     return redirect to('authorize') unless session[:dropbox_session]
     dropbox_session = Dropbox::Session.deserialize(session[:dropbox_session])
     return redirect to('authorize') unless dropbox_session.authorized?

     uid = dropbox_session.account["uid"].to_s
  
     solr = RSolr.connect :url => settings.SOLR_URL
     paths = []
     files = dropbox_session.metadata('/', { :mode => :dropbox }).contents
     files.each { |file| if !file.directory? then paths << file.path end }
     FileUtils.mkdir_p(File.join(settings.INDEX_DIR, uid))
     for path in paths
       contents = dropbox_session.download(path, { :mode => :dropbox })
       File.open(File.join(settings.INDEX_DIR, uid, path), 'w') {|f| f.write(contents) }
     end
     files.each do |doc|
       if !doc.directory? then
         request = solr.post('update/extract', :data=>'myfile', :params => {'literal.id' => doc.path,
         'stream.file' => File.join(settings.INDEX_DIR, uid, doc.path),
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
     solr.update :data => '<commit/>'
     redirect to('search')
end

get '/search' do
  return redirect to('authorize') unless session[:dropbox_session]
  dropbox_session = Dropbox::Session.deserialize(session[:dropbox_session])
  return redirect to('authorize') unless dropbox_session.authorized?

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
