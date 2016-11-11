import parsley from 'parsleyjs';

Template.FixCardSubscription.onRendered(function(){

  Session.setDefault('isRepair', true);
  Session.set('update_this_card', Customers.findOne().sources.data[0].id);

  if(Subscriptions.findOne().status === 'past_due' || Subscriptions.findOne().status === 'canceled'){
      Session.set('addingNewCreditCard', true);
  } else{
      Session.set('addingNewCreditCard', false);
  }

  $('#resubscribe').parsley();

});

Template.FixCardSubscription.events({
  'click [name=submitCardForm]'(e){
    e.preventDefault();

    var update_this = {
      customer_id: Customers.findOne()._id,
      subscription_id: Subscriptions.findOne()._id,
      status: Subscriptions.findOne().status,
      card: Customers.findOne().sources.data[0].id,
      exp_month: $('[name="cardExpirationMonth"]').val(),
      exp_year: $('[name="cardExpirationYear"]').val()
    };
    var addingNewCreditCard = Session.get('addingNewCreditCard');
    var resubscribeButton   = $(".resubscribe").button('loading');

    if (addingNewCreditCard){
      // If we're adding a new card, grab our card data from the template.
      var card = {
        number: $('[name="cc-num"]').val(),
        exp_month: $('[name="cardExpirationMonth"]').val(),
        exp_year: $('[name="cardExpirationYear"]').val(),
        cvc: $('[name="cvc2"]').val()
      };


      Stripe.card.createToken(card, function(status, response){
        if (response.error) {
          //error logic here
          Give.handleErrors(response.error);
        } else {
          // Call your backend
          var subscription_id = Subscriptions.findOne()._id;
          var subscription_status = Subscriptions.findOne().status;
          var customer_id = Customers.findOne()._id;

          // Call our stripeSwipeCard method to replace our customer's existing
          // card with the new card they've specified.
          Meteor.call("stripeUpdateSubscription", customer_id, subscription_id,
            response.id, subscription_status, 'Card', function(error){
            if (error){
              console.dir(error);
              resubscribeButton.button("reset");
              Bert.alert(error.message, "danger");
            } else {
              // If we're resubscribed, go ahead and confirm by returning to the
              // billing overview page and showing an alert message.
              resubscribeButton.button("reset");
              const queryParams = Router.current().params.query;

              if(queryParams && queryParams.admin && queryParams.admin === 'yes'){
                Bert.alert("Successfully updated that recurring gift.", "success");
                Router.go('AdminSubscriptions');
              } else {
                Bert.alert("If you were fixing a failed gift, it might take a " +
                  "couple of days for the gift status to change. We have updated " +
                  "your payment method.", "success");
                Router.go('subscriptions');
              }
            }
          });
        }
      });

    } else {
      Meteor.call("stripeUpdateCard", update_this, function(error, response){
        if (error){
          console.dir(error);
          resubscribeButton.button("reset");
          Bert.alert(error.message, "danger");
        } else {
          // If we're resubscribed, go ahead and confirm by returning to the
          // subscriptions page and show the alert
          resubscribeButton.button("reset");
          if(response === 'new'){
            Bert.alert("Successfully activated your recurring gift. Thank you!", "success");
            Router.go('subscriptions');
          } else {
            const queryParams = Router.current().params.query;

            if(queryParams && queryParams.admin && queryParams.admin === 'yes'){
              Bert.alert("Successfully updated that recurring gift.", "success");
              Router.go('AdminSubscriptions');
            } else {
              Bert.alert("You updated your card, good job!", "success");
              Router.go('subscriptions');
            }
          }
        }
      });
    }
    Session.set("loading", false);
  },
  'click .add-new-card': function(){
    Session.set('addingNewCreditCard', true);
  },
  'click .cancel-new-card': function(e){
    e.preventDefault();
    $('form#resubscribe').unbind('submit');
    Session.set('addingNewCreditCard', false);
  },
  'click .btn_modal_for_add_new_bank_account': function () {
    $("#modal_for_add_new_bank_account").modal('show');
    Session.set('updateSubscription', this.id);
  }
});

Template.FixCardSubscription.helpers({
    subscription: function () {
      return Subscriptions.find();
    },
    customer: function () {
      return Customers.findOne();
    },
    customer_device: function () {
      var return_these = {};
      if(Customers.findOne().sources.data[0].brand){
        return_these.brand = Customers.findOne().sources.data[0].brand;
        return_these.exp_month = Customers.findOne().sources.data[0].exp_month;
        return_these.exp_year = Customers.findOne().sources.data[0].exp_year;
      } else{
        return_these.brand = Customers.findOne().sources.data[0].bank_name;
      }
      return_these.last4 = Customers.findOne().sources.data[0].last4;
      return return_these;
    },
    isRepair: function () {
      return Session.get('isRepair');
    },
    addNewCard: function () {
      return Session.get('addingNewCreditCard');
    },
    expired_class: function () {
      if(Stripe.card.validateExpiry(Customers.findOne().sources.data[0].exp_month), Customers.findOne().sources.data[0].exp_year){
        return;
      } else {
        return 'redText';
      }
    },
    addNew: function () {
      if(Session.equals('addingNewCreditCard', true)){
        return true;
      } else {
        return false;
      }
    }
});