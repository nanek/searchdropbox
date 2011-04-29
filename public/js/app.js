$(document).ready(function(){
  $('#loading')
    .ajaxStart(function() {
        $(this).show();
    })
    .ajaxStop(function() {
        $(this).hide();
    });

  $('.selected_content_type').click(function() {
    $('input[name="content_type"]').val('');
    $('#search_form').submit();
  });

  $('.facet_term').click(function() {
    $('input[name="content_type"]').val($(this).text());
    $('#search_form').submit();
  });

  $('#search_form')
    .bind("ajax:beforeSend", function(evt, xhr, settings){
    })
    .bind("ajax:success", function(evt, data, status, xhr){
      //$('#content').html(xhr.responseText);
      response = $.parseJSON(xhr.responseText);
      numFound = response["response"]["numFound"];
      docs = response["response"]["docs"];
      highlighting = response["highlighting"];
      facets = response["facet_counts"]["facet_fields"];

      DocApp.removeAll();
     
      _.each(docs, function(doc){ 
        Docs.add({doc_id: doc.id, 
                  snippet: highlighting[doc.id]['attr_content'], //"test",
                  content_type:doc.content_type, 
                  attr_created:doc.attr_created}); 
      });
      _.each(facets, function(facet){
        //Facets.add({name:"test"});
      });
       
    })
    .bind('ajax:complete', function(evt, xhr, status){
    })
    .bind("ajax:error", function(evt, xhr, status, error){
      $('#message').html("An error has occured.  Please try again later.").show();
    });

  $('#index_form')
    .bind("ajax:success", function(evt, data, status, xhr){
      $('#message').html(xhr.responseText).show();
    })
    .bind('ajax:complete', function(evt, xhr, status){
      $('#search_results').remove();
    })
    .bind("ajax:error", function(evt, xhr, status, error){
      $('#message').html("An error has occured.  Please try again later.").show();
    });

  $('#delete_form')
    .bind("ajax:success", function(evt, data, status, xhr){
      $('#message').html(xhr.responseText).show();
    })
    .bind('ajax:complete', function(evt, xhr, status){
      $('#search_results').remove();
    })
    .bind("ajax:error", function(evt, xhr, status, error){
      $('#message').html("An error has occured.  Please try again later.").show();
    });
});
