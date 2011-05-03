$(function() {
  window.SearchQuery = Backbone.Model.extend({
  });
  window.SearchView = Backbone.View.extend({
    el: $('#search-view'),

    events: {
      "submit #search_form":  "updateQuery",
    },
    initialize: function() {
      _.bindAll(this, "search", "processQueryResult");
      this.model.bind("change:q", this.search);
      this.model.bind("change:fq", this.search);
    },

    updateQuery: function(e) {
      e.preventDefault();
      this.model.set({q:$('#q').val()});
    },

    search: function() {
      var q = this.model.get("q");
      var fq = this.model.get("fq");
      //validate params
      var jqxhr = $.ajax({ url: "/search",
        type: "GET",
        data: ({q: q, content_type: fq}),
        });
      jqxhr.success(this.processQueryResult);
    },

    processQueryResult: function(data) {
      this.model.set({qr:data});
      response = data;
      numFound = response["response"]["numFound"];
      docs = response["response"]["docs"];
      highlighting = response["highlighting"];
      facets = response["facet_counts"]["facet_fields"];

      this.model.set({qr_count:numFound});

      Docs.each(function(doc) { doc.clear() });
      Filters.each(function(filter) { filter.clear() });

      _.each(docs, function(doc){
        Docs.add({doc_id: doc.id,
                  snippet: highlighting[doc.id]['attr_content'], //"test",
                  content_type:doc.content_type,
                  attr_created:doc.attr_created});
      });
      if (facets.hasOwnProperty("content_type")) {
        Filters.add({name:"Content Type", terms:facets.content_type});
      }
    },
  });
  window.IndexedDocumentView = Backbone.View.extend({
    el: $('#index-view'),
    events: {
      "submit #index_form":   "indexPath",
      "submit #delete_form":  "deleteIndex"
    },
    indexPath: function(e) {
      e.preventDefault();
      var folder = $('#f').val();
      var jqxhr = $.ajax({ url: "/index",
        type: "POST",
        data: ({f: folder}),
        });
      jqxhr.success(this.processIndexPath);
      jqxhr.complete(this.processComplete);
      jqxhr.error(this.processError);
    },
    deleteIndex: function(e) {
      e.preventDefault();
      var folder = $('#f').val();
      var jqxhr = $.ajax({ url: "/delete",
        type: "POST",
        });
      jqxhr.success(this.processDeleteIndex);
      jqxhr.complete(this.processComplete);
      jqxhr.error(this.processError);
    },
    processIndexPath: function(data) {
      $('#message').text(data).show();
    },
    processDeleteIndex: function(data) {
      $('#message').text(data).show();
    },
    processError: function(data) {
      $('#message').text("An error has occured, please try again later.").show();
    },
    processComplete: function(data) {
    }
  });
  window.FilterView = Backbone.View.extend({
    el: $('#left'),
    events: {
      "click .facet_term":    "addFilter",
      "click .selected_content_type":    "removeFilter",
    },
    initialize: function() {
    },
    addFilter: function(e) {
      this.model.set({fq:$(e.toElement).text()});
    },
    removeFilter: function() {
      this.model.set({fq:""});
    },
  });
  window.FilterSelectedView = Backbone.View.extend({
    template: _.template($('#filter-selected-template').html()),
    el: $('#filter-selected-view'),
    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change:fq', this.render);
    },
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },
  });
  query = new SearchQuery;
  window.AppSearchView = new SearchView({model: query});
  window.AppFilterView = new FilterView({model: query});
  window.AppFilterSelectedView = new FilterSelectedView({model: query});
  window.AppIndexedDocumentView = new IndexedDocumentView;

  window.FilterTerm = Backbone.Model.extend({});
  window.FilterTerms = Backbone.Collection.extend({
    model: FilterTerm,
  });
  window.FilterCategory = Backbone.Model.extend({
    initialize: function() {
      list = new FilterTerms;
      values = this.get('terms');
      var len=values.length;
      for(var i=0; i<len; i++) {
        if (i%2==0) {
          ft = new FilterTerm({name:values[i], count:values[i+1]});
          if (values[i+1] > 0) {
            list.add(ft);
          }
        }
      }
      this.set({filterTerms: list});
    },
    clear: function() {
      this.view.remove();
    }
  });
  window.FilterCategoryList = Backbone.Collection.extend({ model: FilterCategory });
  window.Filters = new FilterCategoryList;

  window.Doc = Backbone.Model.extend({
    EMPTY: "empty",

    initialize: function() {
      _.bindAll(this, 'clear');
      if (!this.get("doc_id")) {
        this.set({"doc_id": this.EMPTY});
      }
    },

    clear: function() {
      this.view.remove();
    }
  });

  window.DocList = Backbone.Collection.extend({ model: Doc });
  window.Docs = new DocList;

  var FilterCategoryView = Backbone.View.extend({
    template: _.template($('#filter-template').html()),

    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.model.view = this;
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },
    remove: function() {
      $(this.el).remove();
    }
  });

  var DocView = Backbone.View.extend({
    template: _.template($('#doc-template').html()),

    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.model.view = this;
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },

    remove: function() {
      $(this.el).remove();
    }

  });

  window.DocListView = Backbone.View.extend({
    el: $("#content"),
    initialize: function() {
      _.bindAll(this, 'addDoc', 'addFilter', 'updateResultCount');
      Docs.bind('add', this.addDoc);
      Filters.bind('add', this.addFilter);
      this.model.bind('change:qr_count', this.updateResultCount);
    },
    
    addDoc: function(doc) {
      var view = new DocView({model: doc});
      this.$("#doc-list-view").append(view.render().el);
    },

    addFilter: function(filter) {
      var view = new FilterCategoryView({model: filter});
      this.$('#filter-view').append(view.render().el);
    },

    updateResultCount: function() {
      this.$('#result-count').html(this.model.get('qr_count'));
    },
  });

  window.AppDocListView = new DocListView({model: query});
});

