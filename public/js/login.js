function doLogin () {
  var data = {};
  data.id = $(".card-body .id").val();
  data.Password = $(".card-body .password").val();
  console.log('서버요청: ' + JSON.stringify(data));
  
  $.ajax({
    url:'/login',
    type: "POST",
    data: data,
    dataType: 'json',
    success: function(anasData, textStatus, jqXHR) {
      if(anasData.success){
        window.location.href = '/login';
      }
      else{
        var strHtml = '<div class="alert alert-danger" id="wrong-login" role="alert">' + anasData.msg + '</div>';
        $('#div-message').html(strHtml);
        $('.id').focus();
      }
    },
    error: function(jqXHR, textStatus, errorThrow) {
    }
  });
}

$('.btnlogin').click(function() {
  doLogin();
})
