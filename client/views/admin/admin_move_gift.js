import parsley from 'parsleyjs';

Template.AdminMoveGift.onRendered(function() {
  // Setup parsley form validation
  $('#quick_move').parsley();
});

Template.AdminMoveGift.events({
  'submit form': function(e) {
    // prevent the default reaction to submitting this form
    e.preventDefault();
    // Stop propagation prevents the form from being submitted more than once.
    e.stopPropagation();

    $("[name='submit_move_gift']").button("moving...");

    // Start the method for moving this gift
    Meteor.call("move_donation_to_other_person", $('#donation-id').val(), $('#move-to-id').val(), function(error, result) {
      if (result) {
        console.log(result);
        $("#donation-id").val("");
        $("#move-to-id").val("");
        Bert.alert({
          message: "Successfully moved that donation.",
          type: 'success',
          icon: 'fa-smile-o'
        });
        $("[name='submit_move_gift']").button("reset");
      } else {
        console.log(error);
        Bert.alert( {
          message: "Hmmm...that didn't work, please check the IDs you used.",
          type: 'danger',
          icon: 'fa-frown-o',
          style: 'growl-bottom-right'
        });
        $("[name='submit_move_gift']").button("reset");
      }
    });
  }
});
