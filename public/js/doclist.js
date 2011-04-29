$(function() {
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

  window.DocList = Backbone.Collection.extend({
    model: Doc,
    
    initialize: function() {
    },

  });

  window.Docs = new DocList;

  var DocView = Backbone.View.extend({
    //tagName: "li",
    template: _.template($('#doc-template').html()),

    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      this.model.view = this;
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.setContent();
      return this;
    },

    setContent: function() {
      //var content = this.model.get('doc_id');
      //this.$('.doc_id').text(content);
    },
    // Remove this view from the DOM.
    remove: function() {
      $(this.el).remove();
    }

  });

  window.DocListView = Backbone.View.extend({
    el: $("#right"),

    initialize: function() {
      _.bindAll(this, 'addOne', 'addAll', 'removeAll');
      Docs.bind('add', this.addOne);
      Docs.bind('removeAll', this.removeAll);
    },
    
    addOne: function(doc) {
      var view = new DocView({model: doc});
      this.$("#search_results").append(view.render().el);
    },

    addAll: function() {
      Docs.each(this.addOne);
    }, 

    removeOne: function(doc) {
      doc.clear();
    },

    removeAll: function() {
      Docs.each(this.removeOne);
      return false;
    },

  });

  window.DocApp = new DocListView;

});

