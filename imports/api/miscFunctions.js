const getDocHeight = () => {
  const D = document;
  return Math.max(
    D.body.scrollHeight, D.documentElement.scrollHeight,
    D.body.offsetHeight, D.documentElement.offsetHeight,
    D.body.clientHeight, D.documentElement.clientHeight
  );
};

const updateSearchVal = () => {
  let searchValue = $(".search").val();

  if (searchValue || searchValue === "") {
    // Remove punctuation and make it into an array of words
    searchValue = searchValue
      .replace(/[,\/#!$%\^&\*;:{}=\`~()]/g, "")
      .replace(/\s/g, "");

    Session.set( "searchValue", searchValue );
    Session.set( "documentLimit", 0 );
  }
};

const setDocHeight = () => {
  $( window ).scroll( function() {
    if ( ($( window ).scrollTop() + $( window ).height() == getDocHeight()) ||
      ($( window ).scrollTop() + window.innerHeight == getDocHeight()) ) {
      console.log( "bottom!" );
      $('[data-toggle="popover"]').popover();
      let documentLimit = Session.get( "documentLimit" );
      Session.set( "documentLimit", documentLimit += 10 );
    }
  } );
};

const clearImage = (type) => {
  if (!confirm( "Are you sure you want to delete the " + type + " ?" )) {
    return;
  }
  console.log(type);
  const uploadId = Images.findOne({meta: {[type]: "_true"}})._id;
  Meteor.call("imageRemove", uploadId, function( err, res ) {
    if (err) {
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
        type: 'success',
        icon: 'fa-smile-o',
        style: 'growl-bottom-right'
      } );
    }
  });
};

const cancelRecurringGift = (e, subscriptionId) => {
  const customerId = Subscriptions.findOne({_id: subscriptionId}).customer;

  $(e.currentTarget).button('Working');

  swal({
    title: "Are you sure?",
    text: "Please let us know why you are stopping this recurring gift.",
    type: "input",
    showCancelButton: true,
    confirmButtonColor: "#DD6B55",
    confirmButtonText: "Yes, stop it!",
    cancelButtonText: "No",
    closeOnConfirm: false,
    closeOnCancel: false
  }, function(inputValue) {
    if (inputValue === "") {
      inputValue = "Not specified, but canceled by: " + (Meteor.user().emails[0].address);
    }

    if (inputValue === false) {
      swal("Ok, we didn't do anything.", "That recurring gift is still active :)",
        "success");
      $(e.currentTarget).button('reset');
    } else if (inputValue) {
      inputValue = inputValue + "'.\n Canceled by: " + (Meteor.user().emails[0].address);

      console.log("Got to before method call with input of " + inputValue);
      Session.set("loading", true);
      $(".confirm").button("reset");
      Meteor.call("stripeCancelSubscription", customerId, subscriptionId, inputValue, function(error, response) {
        if (error) {
          Bert.alert(error.message, "danger");
          Session.set("loading", false);
          $(e.currentTarget).button('reset');
        } else {
          // If we're resubscribed, go ahead and confirm by returning to the
          // subscriptions page and show the alert
          Session.set("loading", false);
          console.log(response);
          swal("Cancelled", "That recurring gift has been stopped.", "error");
        }
      });
    }
  });
};

export { setDocHeight, updateSearchVal, clearImage, cancelRecurringGift };
