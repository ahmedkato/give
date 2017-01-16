import parsley from 'parsleyjs';

Template.AddNewBankAccount.events({
  'submit form': function(e) {
    // prevent the default reaction to submitting this form
    e.preventDefault();
    // Stop propagation prevents the form from being submitted more than once.
    e.stopPropagation();

    const savePayment = $("#save_payment").is(':checked');

    Session.set("loading", true);

    let name;
    if (Meteor.user().profile.business_name) {
      name = Meteor.user().profile.business_name;
    } else {
      name = Meteor.user().profile.fname + " " + Meteor.user().profile.lname;
    }
    Stripe.bankAccount.createToken({
      country: (Meteor.user() &&
      Meteor.user().profile &&
      Meteor.user().profile.address &&
      Meteor.user().profile.address.country) ?
                 Meteor.user().profile.address.country :
                 'US',
      routing_number: $('#routing_number').val(),
      account_number: $('#account_number').val(),
      name: name
    }, function(status, response) {
      if ( response.error ) {
        // error logic here
        Give.handleErrors( response.error );
      } else {
        // Call your backend
        let subscription_id = Session.get("updateSubscription");
        if (!subscription_id) {
          subscription_id = Session.get("sub");
        }
        Meteor.call('stripeUpdateBank', response.id, subscription_id, savePayment, function(error, result) {
          if (error) {
            console.log(error);
            // Give.handleErrors is used to check the returned error and the display a user friendly message about what happened that caused
            // the error.
            Bert.alert({
              message: error.reason,
              type: 'danger',
              icon: 'fa-frown-o'
            });
          } else {
            if ( result.error ) {
              console.log( result.error );
              const send_error = {code: result.error, message: result.message};

              Bert.alert({
                title: send_error.code,
                message: send_error.message,
                type: 'danger',
                icon: 'fa-frown-o'
              });
            } else {
              Bert.alert('Updated', 'success');

              // Make the form blank again
              $("#routing_number").val('');
              $("#account_number").val('');
              $('#save_payment').prop('checked', false);

              // Hide the modal and backdrop
              $('#modal_for_add_new_bank_account').modal('hide');
              $('body').removeClass('modal-open');
              $('.modal-backdrop').remove();

              // Remove the session variables associated with this udpate
              Session.delete("updateSubscription");
              Session.delete("sub");

              // Go back to showing all the subscriptions
              Router.go("/user/subscriptions");
            }
          }
        });
      }
    });
    Session.set("loading", false);
  },
  'click #go-to-card': function(e) {
    e.preventDefault();
    e.stopPropagation();

    if (Router.current().route.getName() === "FixCardSubscription") {
      $('#modal_for_add_new_bank_account').modal('hide');
      return;
    }
    Meteor.setTimeout(() => {
      Router.go("/user/subscriptions/card/change" + "?s=" + this.id + "&c=" +
        this.customer + "&newcard=true");
    }, 500);
    $('#modal_for_add_new_bank_account').modal('hide');
  }
});

Template.AddNewBankAccount.onRendered( function() {
  $('#add-bank-form').parsley();
});
