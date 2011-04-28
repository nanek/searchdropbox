$(document).ready(function(){
  $('#loading')
    .ajaxStart(function() {
        $(this).show();
    })
    .ajaxStop(function() {
        $(this).hide();
    });

  $('#search_form')
    .bind("ajax:beforeSend", function(evt, xhr, settings){
    })
    .bind("ajax:success", function(evt, data, status, xhr){
      $('#content').html(xhr.responseText);
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
    .bind("ajax:error", function(evt, xhr, status, error){
      $('#message').html("An error has occured.  Please try again later.").show();
    });

});
