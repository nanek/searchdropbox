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
