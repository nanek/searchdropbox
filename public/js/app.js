$(document).ready(function(){
  App.init();
  $('#loading')
    .ajaxStart(function() {
        $(this).show();
    })
    .ajaxStop(function() {
        $(this).hide();
    });
});
