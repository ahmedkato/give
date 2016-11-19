function getSubscriptionPeriodEnd() {
  let subscriptionDoc = Subscriptions.findOne();
  if(subscriptionDoc){
    let currentDate = moment.unix(subscriptionDoc.current_period_end).format('MMMM D, YYYY');
    return currentDate;
  }
}

Template.UpdateSubscription.onCreated(function () {
  this.autorun(()=>{
    this.subscribe("userDTFunds");
    this.subscribe('subscription_with_donation_splits', Router.current().params.query.subscription);
    this.subscribe('userDoc');
  });
  DonationFormItems = new Mongo.Collection(null);
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
  }, 500);
  Session.get("change_subscription_id");
});

Template.UpdateSubscription.helpers({
  updateDonationItems(){
    let DonationSplitsData = DonationSplits && DonationSplits.findOne();
    if(DonationSplitsData){
      DonationSplitsData.splits.forEach(function ( item ) {
        DonationFormItems.upsert({_id: item._id}, item);
      });
      return "";
    }
    return;
  },
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
    let subscription_id = Session.get("change_subscription_id");
    let customer_id = Session.get("change_customer_id");
    let amount = parseInt(((Give.getCleanValue('[name="amount"]').replace(/[^\d\.\-\ ]/g, '')) * 100).toFixed(0));
    let note = $("#note").val();
    let trial_end = $("#start_date").val() ? moment(new Date(Give.getCleanValue('#start_date'))).format('X'): '';
    let donateToValue = $("#designationSection").is(":visible") ? $('[name="donateTo"]').val() : Session.get("change_donateTo");

    if(Session.get("change_donateTo") === donateToValue && Session.get("change_amount") === amount &&
      (Session.equals("yes_change_date", false) || !Session.get("yes_change_date"))){
      alert("You haven't made any changes.");
      return "No changes";
    }

    amount = Session.get("change_amount") === amount ? 0 : amount;

    $(':submit').button('loading');
    // TODO: add note into method call

    console.log(customer_id, subscription_id, amount, trial_end, donateToValue);
    Meteor.call( "edit_subscription", customer_id, subscription_id, amount, trial_end, donateToValue, function ( error, response ) {
      if( error ) {
        console.error( error, error.message);
        Bert.alert( error.message, "danger" );
        $(':submit').button( 'reset' );
      } else {
        console.log( response );
        Bert.alert( response, "success" );
        $(':submit').button('reset');

        Session.set("yes_change_date", false);
        Session.set("yes_change_designation", false);
        $('#calendarSection').hide();
        $('#designationSection').hide();
        $('#modal_for_admin_subscription_change_form').modal('hide');
      }
    } );

  },
});