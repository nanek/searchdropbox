$(document).ready(function(){
  $('#loading')
    .ajaxStart(function() {
        $(this).show();
    })
    .ajaxStop(function() {
        $(this).hide();
    });
  //$('#message').html("An error has occured.  Please try again later.").show();

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
