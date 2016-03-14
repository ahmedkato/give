Template.AddNewBankAccount.events({
  'submit form': function (e) {
    //prevent the default reaction to submitting this form
    e.preventDefault();
    // Stop propagation prevents the form from being submitted more than once.
    e.stopPropagation();

    let savePayment = $("#save_payment").is(':checked');

    let opts = {color: '#FFF', length: 60, width: 10, lines: 8};
    let target = document.getElementById('spinContainer');
    spinnerObject = new Spinner(opts).spin(target);

    // TODO: Set this as the new primary payment method for this customer's subscription.

    let name;
    if(Meteor.user().profile.business_name) {
      name = Meteor.user().profile.business_name;
    } else {
      name = Meteor.user().profile.fname + " " + Meteor.user().profile.lname;
    }
    Stripe.bankAccount.createToken({
      country: Meteor.user().profile.address.country,
      routing_number: $('#routing_number').val(),
      account_number: $('#account_number').val(),
      name: name
    }, function(status, response) {
      if( response.error ) {
        //error logic here
        App.handleErrors( response.error );
      } else {
        // Call your backend
        console.log(Session.get("updateSubscription"));
        let subscription_id = Session.get("updateSubscription");
        if(!subscription_id) {
          subscription_id = Session.get("sub");
        }
        Meteor.call('stripeUpdateBank', response.id, subscription_id, savePayment, function (error, result) {
          if (error) {
            console.log(error);
            //App.handleErrors is used to check the returned error and the display a user friendly message about what happened that caused
            //the error.
            Bert.alert({
              message: error.reason,
              type: 'danger',
              icon: 'fa-frown-o'
            });
          } else {
            if ( result.error ) {
              console.log( result.error );
              var send_error = {code: result.error, message: result.message};

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

  },
  'click #go-to-card': function (e) {
    e.preventDefault();
    e.stopPropagation();

    var self = this;
    if(Router.current().route.getName() === "FixCardSubscription"){
      $('#modal_for_add_new_bank_account').modal('hide');
      return;
    }
    Meteor.setTimeout(function() {
      Router.go("/user/subscriptions/card/resubscribe" + "?s=" + self.id + "&c=" + self.customer);
    }, 500);
    $('#modal_for_add_new_bank_account').modal('hide');
  }
});

Template.AddNewBankAccount.onRendered( function (){
  $('#add-bank-form').parsley();
});