$(function(){
  function get2digits (num){
    return ('0' + num).slice(-2);
  }
  
  function getDate(dateObj){
    if(dateObj instanceof Date)
      return dateObj.getFullYear() + '-' + get2digits(dateObj.getMonth()+1)+ '-' + get2digits(dateObj.getDate());
  }
  
  function getTime(dateObj){
    if(dateObj instanceof Date)
      return get2digits(dateObj.getHours()) + ':' + get2digits(dateObj.getMinutes())+ ':' + get2digits(dateObj.getSeconds());
  }
  
  function convertDate(){
    $('[data-date]').each(function(index,element){
      var dateString = $(element).data('date');
      if(dateString){
        var date = new Date(dateString);
        $(element).html(getDate(date));
      }
    });
  }
  
  function convertDateTime(){
    $('[data-date-time]').each(function(index,element){
      var dateString = $(element).data('date-time');
      if(dateString){
        var date = new Date(dateString);
        $(element).html(getDate(date)+' '+getTime(date));
      }
    });
  }
  
  convertDate();
  convertDateTime();
});

$(function(){
  var search = window.location.search; // query string 정보가 들어있어. ?searchType=title&searchText=text형태
  var params = {};
  
  if(search){ // query string를 object로 변경.
    $.each(search.slice(1).split('&'),function(index,param){
      var index = param.indexOf('=');
      if(index>0){
        var key = param.slice(0,index);
        var value = param.slice(index+1);
        
        if(!params[key]) params[key] = value;
      }
    });
  }
  
  if(params.searchText && params.searchText.length>=3){ // data-search-highlight 의 값을 searchType과 비교하여 , 일치하는 경우  searchText를 regex로 찾아 해당 텍스트에 highlighted css class를 추가하는 코드
    $('[data-search-highlight]').each(function(index,element){
      var $element = $(element);
      var searchHighlight = $element.data('search-highlight');
      var index = params.searchType.indexOf(searchHighlight);
      
      if(index>=0){
        var decodedSearchText = params.searchText.replace(/\+/g, ' '); // search text에 띄어쓰기가 + 인데 ''fh qusrud. 옵션g는 일치하는 여러개의 값을 모두 찾는다.
        decodedSearchText = decodeURI(decodedSearchText);
        
        var regex = new RegExp(`(${decodedSearchText})`,'ig'); // 3-2
        $element.html($element.html().replace(regex,'<span class="highlighted">$1</span>'));
      }
    });
  }
});
