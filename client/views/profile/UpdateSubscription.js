function getSubscriptionPeriodEnd() {
  const subscriptionDoc = Subscriptions.findOne();
  if (subscriptionDoc) {
    const currentDate = moment.unix(subscriptionDoc.current_period_end).format('MMMM D, YYYY');
    return currentDate;
  }
}

Template.UpdateSubscription.onCreated(function() {
  DonationFormItems = new Mongo.Collection(null);
  this.autorun(()=>{
    this.subscribe("userDTFunds");
    this.subscribe('customer', Session.get("customer"));
    this.subscribe('subscription_with_donation_splits', Session.get("subscription"));
    this.subscribe('userDoc');
  });
});

Template.UpdateSubscription.onRendered(function() {
  Session.delete("params.amount");
  Meteor.setTimeout(function() {
    const datepickerSelector = $('#start_date');
    datepickerSelector.datepicker( {
      format: 'MM d, yyyy',
      startDate: '+1d',
      endDate: '+61d',
      autoclose: true
    });
    Session.set("yes_change_date", false);
  }, 1000);
  this.autorun(()=>{
    const DonationSplitsData = DonationSplits && DonationSplits.findOne();
    if (DonationSplitsData) {
      DonationFormItems.remove({});
      DonationSplitsData.splits.forEach(function( item ) {
        DonationFormItems.upsert({_id: item._id}, item);
      });
    } else {
      DonationFormItems.remove({});
      const subscription = Subscriptions.findOne();
      if (subscription && subscription.metadata && subscription.metadata.donateTo) {
        DonationFormItems.upsert({name: 'first'}, {name: 'first', donateTo: subscription.metadata.donateTo, amount: subscription.quantity });
      }
    }
    const customer = Customers.findOne();
    if (customer && customer.default_source_type === "bank_account") {
      Session.set("paymentMethod", "Check");
    }
    if (customer && customer.default_source_type === "card") {
      Session.set("paymentMethod", "Card");
    }
  });
});

Template.UpdateSubscription.helpers({
  endSubscriptionPeriodDate() {
    const subscriptionDoc = Subscriptions.findOne();
    if (subscriptionDoc) {
      const currentDate = moment.unix(subscriptionDoc.current_period_end).format('MMMM D, YYYY');
      Session.set("date", currentDate);
    } else {
      Session.set("date", "");
    }
    return Session.get("date");
  },
  subscribersName() {
    const subscription = Subscriptions.findOne();
    if (subscription) {
      const fname = subscription && subscription.metadata && subscription.metadata.fname;
      const lname = subscription && subscription.metadata && subscription.metadata.lname;
      const email = subscription && subscription.metadata && subscription.metadata.email;
      return fname + " " + lname + " - " + email;
    }
  },
  changeEndSubscriptionPeriodDate() {
    return Session.get("changeEndSubscriptionPeriodDate") || false;
  }
});

Template.UpdateSubscription.events({
  'click #changeDateButton'() {
    Session.set("changeEndSubscriptionPeriodDate", true);
    Meteor.setTimeout(function() {
      $('#start_date').datepicker( {
        format: 'MM d, yyyy',
        startDate: '+1d',
        endDate: '+61d',
        autoclose: true
      });
      Session.set("yes_change_date", false);
    }, 0);
  },
  'click #start_date_button'() {
    $("#start_date").select();
  },
  'submit form': function(e) {
    // TODO: when a user changes their selection on 'cover the fees' what are we doing?
    // Looks like nothing right now, need to fix that

    e.preventDefault();
    console.log("Submitted event started for UpdateSubscription form");
    const subscriptionId = Session.get("subscription");
    const subscriptionDoc = Subscriptions.findOne({_id: subscriptionId});
    const totalAmount = parseInt( (Give.getCleanValue( '#total_amount' ) * 100).toFixed( 0 ), 10 );
    const coverTheFees = $( '#coverTheFees' ).is( ":checked" );
    const fees = parseInt( ( Give.getCleanValue( "#fee" ) * 100).toFixed( 0 ), 10 );
    let trialEnd = $("#start_date").val() ? moment(new Date(Give.getCleanValue('#start_date'))).format('X') : '';
    Session.get("yes_change_date") ? trialEnd : trialEnd = null;
    const DonationSplitId = DonationSplits.findOne()._id;
    let dateAndAmountChanged = true;
    if (!DonationSplitId) {
      return;
    }
    if ((!Session.get("yes_change_date") || Session.equals("yes_change_date", false)) && totalAmount === subscriptionDoc.quantity ) {
      dateAndAmountChanged = false;
    }
    $(':submit').button('loading');

    console.log(subscriptionId, totalAmount, trialEnd);
    if (dateAndAmountChanged) {
      Meteor.call( "edit_subscription", subscriptionId, totalAmount, trialEnd, coverTheFees, fees, function( error, response ) {
        if ( error ) {
          console.error( error, error.message);
          Bert.alert( error.message, "danger" );
          $(':submit').button( 'reset' );
        } else {
          console.log( response );
          Bert.alert( response, "success" );
        }
      } );
    }
    Meteor.call( "editDonationSplits", DonationSplitId, DonationFormItems.find().fetch(), coverTheFees, fees, function( error, response ) {
      if ( error ) {
        console.error( error, error.message);
      } else {
        console.log( response );
        if (!dateAndAmountChanged) {
          Bert.alert( response, "success" );
        }
        if (Roles.userIsInRole(Meteor.userId(), ['admin', 'super-admin'])) {
          Router.go("AdminSubscriptions");
        } else {
          Router.go("subscriptions");
        }
      }
    } );
  },
  'change #start_date'() {
    Session.set("yes_change_date", false);
    const subscriptionEnds = getSubscriptionPeriodEnd();
    if (subscriptionEnds) {
      const changedDate = $("#start_date").val();
      if (changedDate !== subscriptionEnds) {
        Session.set("yes_change_date", true);
      }
    }
  }
});

Template.UpdateSubscription.onDestroyed(function() {
  DonationFormItems.remove({});
  Session.delete("subscription");
  Session.delete("params.donateTo");
  Session.delete("paymentMethod");
  Session.delete("coverTheFees");
  Session.delete("showWriteIn");
  Session.delete("yes_change_date");
  Session.delete("change_amount");
  Session.delete("change_donateTo");
  Session.delete("change_date");
  Session.delete("customer");
  Session.delete("change_subscription");
  Session.delete("change_subscription_id");
  Session.delete("changeEndSubscriptionPeriodDate");
});
