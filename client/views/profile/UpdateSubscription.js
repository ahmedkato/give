function getSubscriptionPeriodEnd() {
  let subscriptionDoc = Subscriptions.findOne();
  if(subscriptionDoc){
    let currentDate = moment.unix(subscriptionDoc.current_period_end).format('MMMM D, YYYY');
    return currentDate;
  }
}

Template.UpdateSubscription.onCreated(function () {
  DonationFormItems = new Mongo.Collection(null);

  this.autorun(()=>{
    this.subscribe("userDTFunds");
    this.subscribe('subscription_with_donation_splits', Session.get("subscription"));
    this.subscribe('userDoc');
  });

});

Template.UpdateSubscription.onRendered(function () {
  Session.delete("params.amount");

  Meteor.setTimeout(function () {
    var datepickerSelector = $('#start_date');
    datepickerSelector.datepicker( {
      format: 'MM d, yyyy',
      startDate: '+1d',
      endDate: '+61d',
      autoclose: true
    });
    Session.set("yes_change_date", false);
  }, 500);
  this.autorun(()=>{
    let DonationSplitsData = DonationSplits && DonationSplits.findOne();
    if(DonationSplitsData){
      DonationFormItems.remove({});
      DonationSplitsData.splits.forEach(function ( item ) {
        DonationFormItems.upsert({_id: item._id}, item);
      });
    }
  });
});

Template.UpdateSubscription.helpers({
  endSubscriptionPeriodDate: function () {
    return getSubscriptionPeriodEnd();
  },
});

Template.UpdateSubscription.events({
  'click #start_date_button'(){
    $("#start_date").select();
  },
  'submit form': function(e) {
    e.preventDefault();
    console.log("Submitted event started for UpdateSubscription form");
    let subscription_id = Session.get("subscription");
    let subscriptionDoc = Subscriptions.findOne({_id: subscription_id});
    let totalAmount = parseInt( (Give.getCleanValue( '#total_amount' ) * 100).toFixed( 0 ), 10 );
    let trial_end = $("#start_date").val() ? moment(new Date(Give.getCleanValue('#start_date'))).format('X'): '';
    Session.get("yes_change_date") ? trial_end : trial_end = null;
    let DonationSplitId = DonationSplits.findOne()._id;
    let dateAndAmountChanged = true;
    if(!DonationSplitId){
      return;
    }

    if((!Session.get("yes_change_date") || Session.equals("yes_change_date", false)) && totalAmount === subscriptionDoc.quantity ){
      dateAndAmountChanged = false;
    }

    $(':submit').button('loading');

    console.log(subscription_id, totalAmount, trial_end);
    if(dateAndAmountChanged){
      Meteor.call( "edit_subscription", subscription_id, totalAmount, trial_end, function ( error, response ) {
        if( error ) {
          console.error( error, error.message);
          Bert.alert( error.message, "danger" );
          $(':submit').button( 'reset' );
        } else {
          console.log( response );
          Bert.alert( response, "success" );
        }
      } );
    }
    Meteor.call( "editDonationSplits", DonationSplitId, DonationFormItems.find().fetch(), function ( error, response ) {
      if( error ) {
        console.error( error, error.message);
      } else {
        console.log( response );
        if(!dateAndAmountChanged){
          Bert.alert( response, "success" );
        }
        Router.go("subscriptions");
      }
    } );
  },
  'change #start_date'(){
    Session.set("yes_change_date", false);
    let subscriptionEnds = getSubscriptionPeriodEnd();
    if(subscriptionEnds){
      let changedDate = $("#start_date").val();
      if(changedDate !== subscriptionEnds){
        Session.set("yes_change_date", true);
      }
    }
  }
});

Template.UpdateSubscription.onDestroyed(function () {
  DonationFormItems.remove({});
  Session.delete("subscription");
});