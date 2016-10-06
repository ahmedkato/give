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

function clearImage(type) {
  if (!confirm( "Are you sure you want to delete the " + type + " ?" )) {
    return;
  }
  console.log(type);
  let uploadId = Images.findOne({meta: {[type]: "_true"}})._id;
  Meteor.call("imageRemove", uploadId, function ( err, res ) {
    if(err) {
      Bert.alert({
        message: err.message,
        type: 'danger',
        icon: 'fa-frown-o',
        style: 'growl-bottom-right'
      });
      console.error(err);
    } else {
      Bert.alert( {
        message: "Removed",
        type:    'success',
        icon:    'fa-smile-o',
        style:   'growl-bottom-right'
      } );
    }
  });
}

export { setDocHeight, updateSearchVal, clearImage };