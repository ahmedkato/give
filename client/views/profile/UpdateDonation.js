function getSubscriptionPeriodEnd() {
  const donationDoc = Donations.findOne();
  let currentDate;
  if (donationDoc) {
    if (donationDoc.start_date === 'today') {
      console.log('today');
      currentDate = moment.unix(donationDoc.created_at).format('MMMM D, YYYY');
    } else {
      currentDate = moment.unix(donationDoc.start_date).format('MMMM D, YYYY');
    }
    return currentDate;
  }
}

Template.UpdateDonation.onCreated(function() {
  DonationFormItems = new Mongo.Collection(null);
  this.autorun(()=>{
    this.subscribe("userDTFunds");
    this.subscribe('donation_with_donation_splits', Session.get("donation"));
    this.subscribe('userDoc');
    this.subscribe('customer', Session.get("customer"));
  });
});

Template.UpdateDonation.onRendered(function() {
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
    Give.updateTotal();
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
  });
});

Template.UpdateDonation.helpers({
  endSubscriptionPeriodDate() {
    const donationDoc = Donations.findOne();
    if (donationDoc) {
      const currentDate = getSubscriptionPeriodEnd();
      Session.set("change_date", currentDate);
    } else {
      Session.set("change_date", "");
    }
    return Session.get("change_date");
  },
  subscribersName() {
    const customer = Customers.findOne();
    if (customer) {
      const fname = customer && customer.metadata && customer.metadata.fname;
      const lname = customer && customer.metadata && customer.metadata.lname;
      const email = customer && customer.metadata && customer.metadata.email;
      return fname + " " + lname + " - " + email;
    }
  },
  changeEndSubscriptionPeriodDate() {
    return Session.get("changeEndSubscriptionPeriodDate") || false;
  }
});

Template.UpdateDonation.events({
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
    e.preventDefault();
    console.log("Submitted event started for UpdateDonation form");
    const donationId = Session.get("donation");
    const donationDoc = Donations.findOne({_id: donationId});
    const totalAmount = parseInt( (Give.getCleanValue( '#total_amount' ) * 100).toFixed( 0 ), 10 );
    let trial_end = $("#start_date").val() ? moment(new Date(Give.getCleanValue('#start_date'))).format('X') : '';
    Session.get("yes_change_date") ? trial_end : trial_end = null;
    const DonationSplitId = DonationSplits.findOne()._id;
    let dateAndAmountChanged = true;
    if (!DonationSplitId) {
      return;
    }
    if ((!Session.get("yes_change_date") || Session.equals("yes_change_date", false)) && totalAmount === donationDoc.total_amount ) {
      dateAndAmountChanged = false;
    }
    $(':submit').button('loading');

    console.log(donationId, totalAmount, trial_end);
    if (dateAndAmountChanged) {
      Meteor.call( "edit_donation", donationId, totalAmount, trial_end, function( error, response ) {
        if ( error ) {
          console.error( error, error.message);
          Bert.alert( error.message, "danger" );
          $(':submit').button( 'reset' );
        } else {
          Meteor.call( "editDonationSplits", DonationSplitId, DonationFormItems.find().fetch(), function( err, res ) {
            if ( err ) {
              console.error( err, err.message);
            } else {
              console.log( res );
              if (!dateAndAmountChanged) {
                Bert.alert( res, "success" );
              }
              if (Roles.userIsInRole(Meteor.userId(), ['admin', 'super-admin'])) {
                Router.go("admin.ach");
              }
            }
          } );
          Bert.alert( response, "success" );
        }
      } );
    }
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

Template.UpdateDonation.onDestroyed(function() {
  DonationFormItems.remove({});
  Session.delete("params.donateTo");
  Session.delete("paymentMethod");
  Session.delete("coverTheFees");
  Session.delete("showWriteIn");
  Session.delete("yes_change_date");
  Session.delete("change_amount");
  Session.delete("change_donateTo");
  Session.delete("change_date");
  Session.delete("customer");
  Session.delete("donation");
  Session.delete("changeEndSubscriptionPeriodDate");
});
