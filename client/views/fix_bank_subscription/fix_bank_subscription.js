import parsley from 'parsleyjs';

Template.FixBankSubscription.onCreated(function () {
  this.autorun(()=>{
    this.subscribe("userDTFunds");
  });
});

Template.FixBankSubscription.onRendered(function(){
  Session.setDefault('isRepair', true);

  Session.set('update_this_card', Customers.findOne().default_source);

  if(Subscriptions.findOne().status === 'past_due' || Subscriptions.findOne().status === 'canceled'){
    Session.set('addingNewCreditCard', true);
  } else{
    Session.set('addingNewCreditCard', false);
  }
  $('#resubscribe').parsley();
});

Template.FixBankSubscription.events({
  'submit form': function(e){
    e.preventDefault();
    Session.set("loading", true);

    var update_this = {
      customer_id: Customers.findOne()._id,
      subscription_id: Subscriptions.findOne()._id,
      status: Subscriptions.findOne().status,
      bank: Customers.findOne().default_source
    };
    var resubscribeButton = $(".resubscribe").button('loading');

    Meteor.call("stripeRestartBankSubscription", update_this, function(error, response){
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
        } else{
          Bert.alert("Successfully updated your card. Thank you!", "success");
        }
        Router.go('subscriptions');
      }
      Session.set("loading", false);
    });
  },
  'click .add-new-card': function(){
    Session.set('addingNewCreditCard', true);
  },
  'click .cancel-new-card': function(e){
    e.preventDefault();
    $('form#resubscribe').unbind('submit');
    Session.set('addingNewCreditCard', false);
  }
});

Template.FixBankSubscription.helpers({
  subscription: function () {
    return Subscriptions.findOne();
  },
  customer: function () {
    return Customers.findOne();
  },
  customer_device: function () {
    var return_these = {};
    if(this.sources && this.sources.data[0]){
      let default_index = this.sources.data.map(
        function(e) {
          return e.id;
        }).indexOf(this.default_source);
      return_these.brand = this.sources.data[default_index].bank_name;
      return_these.last4 = this.sources.data[default_index].last4;
      return return_these;
    }
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

Template.FixBankSubscription.onDestroyed(function(){
  Session.delete("isRepair");
  Session.delete("update_this_card");
  Session.delete("addingNewCreditCard");
  Session.delete("resubscribe");
  Session.delete("fix_it");
  Session.delete("sub");
  Session.delete("paymentMethod");
  Session.delete("updateSubscription");
});