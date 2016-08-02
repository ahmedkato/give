function getDocHeight() {
  var D = document;
  return Math.max(
    D.body.scrollHeight, D.documentElement.scrollHeight,
    D.body.offsetHeight, D.documentElement.offsetHeight,
    D.body.clientHeight, D.documentElement.clientHeight
  );
}

function updateSearchVal(){
  let searchValue = $(".search").val();

  if (searchValue || searchValue === "") {
    // Remove punctuation and make it into an array of words
    searchValue = searchValue
      .replace(/[,\/#!$%\^&\*;:{}=\`~()]/g,"")
      .replace(/\s/g,"");

    Session.set( "searchValue", searchValue );
    Session.set( "documentLimit", 0 );
  }
};

function setDocHeight() {
  $( window ).scroll( function () {
    if( ($( window ).scrollTop() + $( window ).height() == getDocHeight()) ||
      ($( window ).scrollTop() + window.innerHeight == getDocHeight()) ) {
      console.log( "bottom!" );
      let documentLimit = Session.get( "documentLimit" );
      Session.set( "documentLimit", documentLimit += 10 );
    }
  } );
}

export { setDocHeight, updateSearchVal };