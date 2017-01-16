import parsley from 'parsleyjs';

const init_calendar = function() {
  const datepickerSelector = $('#start_date');
  datepickerSelector.datepicker( {
    format: 'd MM, yyyy',
    startDate: '+1d',
    endDate: '+61d',
    autoclose: true
  });
};

Template.SubscriptionModal.helpers({
  attributes_Input_Amount: function() {
    return {
      name: "amount",
      id: "amount",
      min: 1,
      required: true
    };
  },
  amount: function() {
    return Session.get("change_amount");
  },
  currentDate: function() {
    if (Session.equals("yes_change_date", true)) {
      const currentDate = moment.unix(Session.get("change_date")).format('D MMM, YYYY');
      return currentDate;
    } else {
      return;
    }
  },
  changeDate: function() {
    return Session.get("yes_change_date");
  },
  changeNote: function() {
    return Session.get("yes_change_note");
  },
  changeDesignation: function() {
    return Session.get("yes_change_designation");
  },
  note: function() {
    return Session.get('change_not');
  },
  DonationSplits() {
    // TODO: take this subscription id and figure out which DonationSplits object we need to be looking at for this
    // then return it below, or return false
    return DonationSplits.find();
  },
  DonationSplitsData() {
    // TODO: take this subscription id and figure out which DonationSplits object we need to be looking at for this
    // then return it below
    return DonationSplits.find({});
  }
});

Template.SubscriptionModal.events({
  'submit form': function(e) {
    e.preventDefault();
    console.log("Submitted event started for AdminSubscriptionModal form");
    const subscription_id = Session.get("change_subscription_id");
    const customer_id = Session.get("change_customer_id");
    let amount = parseInt(((Give.getCleanValue('[name="amount"]').replace(/[^\d\.\-\ ]/g, '')) * 100).toFixed(0));
    const note = $("#note").val();
    const trial_end = $("#start_date").val() ? moment(new Date(Give.getCleanValue('#start_date'))).format('X') : '';
    const donateToValue = $("#designationSection").is(":visible") ? $('[name="donateTo"]').val() : Session.get("change_donateTo");

    if (Session.get("change_donateTo") === donateToValue && Session.get("change_amount") === amount &&
      (Session.equals("yes_change_date", false) || !Session.get("yes_change_date"))) {
      alert("You haven't made any changes.");
      return "No changes";
    }

    amount = Session.get("change_amount") === amount ? 0 : amount;

    $(':submit').button('loading');
    // TODO: add note into method call

    console.log(customer_id, subscription_id, amount, trial_end, donateToValue);
    Meteor.call( "edit_subscription", customer_id, subscription_id, amount, trial_end, donateToValue, function( error, response ) {
      if ( error ) {
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
  'click #showCalendar': function(e) {
    e.preventDefault();
    Session.set("yes_change_date", true);
    $('#calendarSection').show();
    // init_calendar();
  },
  'click #hideCalendar': function(e) {
    e.preventDefault();
    Session.set("yes_change_date", false);
    $('#calendarSection').hide();
  },
  'click #showNote': function(e) {
    e.preventDefault();
    Session.set("yes_change_note", true);
    $('#noteSection').show();
  },
  'click #hideNote': function(e) {
    e.preventDefault();
    Session.set("yes_change_note", false);
    $('#noteSection').hide();
  },
  'click #showDesignation': function(e) {
    e.preventDefault();
    Session.set("yes_change_designation", true);
    $('#designationSection').show();
  },
  'click #hideDesignation': function(e) {
    e.preventDefault();
    Session.set("yes_change_designation", false);
    $('#designationSection').hide();
  },
  'click .close': function() {
    $('#calendarSection').hide();
    $('#designationSection').hide();

    Session.delete("yes_change_date");
    Session.delete("yes_change_designation");
    Session.delete("yes_change_note");
    Session.delete("change_donateTo");
    Session.delete("change_customer_id");
    Session.delete("change_subscription_id");
  }
});

Template.SubscriptionModal.onRendered(function() {
  Session.set("yes_change_date", false);

  // Setup parsley form validation
  $('#subscription_change').parsley();

  init_calendar();
});

Template.SubscriptionModal.onDestroyed(function() {
  Session.delete("yes_change_date");
  Session.delete("yes_change_designation");
  Session.delete("yes_change_note");
  Session.delete("change_donateTo");
  Session.delete("change_customer_id");
  Session.delete("change_subscription_id");
});
