/** ***************************************************************************/
/* GetStripeEvent: Event Handlers */
/** ***************************************************************************/
Template.CreateUserIfStripeButNotLocalExists.events({
  'submit form': function(e) {
    e.preventDefault();
    console.log("Form Submitted");
    console.log($('#customer-id').val());
    console.log($('#customer-email').val());

    Meteor.call("run_if_no_user_was_created_but_donation_was_processed_with_stripe", $('#customer-id').val(), $('#customer-email').val(), function(err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
        $('#fix_no_local')[0].reset();
        Bert.alert("Got it", "success");
        Session.set("showFixNoUser", false);
      }
    });
  }
});
