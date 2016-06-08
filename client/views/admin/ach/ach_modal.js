import parsley from 'parsleyjs';

var init_calendar = function(){
  let datepickerSelector = $('#start_date');
  datepickerSelector.datepicker( {
    format: 'd MM, yyyy',
    startDate: '+1d',
    endDate: '+60d',
    autoclose: true
  });
};

Template.ACHModal.helpers({
  amount: function () {
    return Session.get("change_amount");
  },
  currentDate: function () {
    if(Session.equals("yes_change_date", true)){
      let currentDate = moment.unix(Session.get("change_date")).format('D MMM, YYYY');
      return currentDate;
    } else {
      return;
    }
  },
  changeDate: function () {
    return Session.get("yes_change_date");
  },
  changeNote: function () {
    return Session.get("yes_change_note");
  },
  changeDesignation: function () {
    return Session.get("yes_change_designation");
  },
  note: function () {
    return Session.get('change_not');
  }
});

Template.ACHModal.events({
  'submit form': function(e) {
    e.preventDefault();
    console.log("Submitted event started for AdminACHModal form");
    let donation_id = Session.get("change_donation_id");
    let customer_id = Session.get("change_customer_id");
    let amount = parseInt(((Give.getCleanValue('#amount').replace(/[^\d\.\-\ ]/g, '')) * 100).toFixed(0));
    let note = $("#note").val();
    let donationDate = $("#start_date").val() ? moment(new Date(Give.getCleanValue('#start_date'))).format('X'): '';
    let donateToText = $("#designationSection").is(":visible") ? $('#donateTo option:selected').text() : Session.get("change_donateTo");

    if(Session.get("change_donateTo") === donateToText && Session.get("change_amount") === amount &&
      (Session.equals("yes_change_date", false) || !Session.get("yes_change_date"))){
      alert("You haven't made any changes.");
      return "No changes";
    }

    $(':submit').button('loading');

    console.log(customer_id, amount, donationDate, donateToText, note);
    Donations.update({_id: donation_id}, {$set: {
      customer_id: customer_id,
      total_amount: amount,
      amount: amount,
      created_at: (Number(donationDate) + 14400),
      donateTo: donateToText,
      note: note
    }});
    Bert.alert( "Updated", "success" );
    $(':submit').button('reset');

    Session.set("yes_change_date", false);
    Session.set("yes_change_designation", false);
    $('#calendarSection').hide();
    $('#designationSection').hide();
    $('#modal_for_admin_ach_change_form').modal('hide');
  },
  'click #showCalendar': function (e) {
    e.preventDefault();
    Session.set("yes_change_date", true);
    $('#calendarSection').show();
    //init_calendar();
  },
  'click #hideCalendar': function (e) {
    e.preventDefault();
    Session.set("yes_change_date", false);
    $('#calendarSection').hide();
  },
  'click #showNote': function (e) {
    e.preventDefault();
    Session.set("yes_change_note", true);
    $('#noteSection').show();
  },
  'click #hideNote': function (e) {
    e.preventDefault();
    Session.set("yes_change_note", false);
    $('#noteSection').hide();
  },
  'click #showDesignation': function (e) {
    e.preventDefault();
    Session.set("yes_change_designation", true);
    $('#designationSection').show();
  },
  'click #hideDesignation': function (e) {
    e.preventDefault();
    Session.set("yes_change_designation", false);
    $('#designationSection').hide();
  },
  'click .close': function () {
    Session.set("yes_change_date", false);
    Session.set("yes_change_designation", false);
    $('#calendarSection').hide();
    $('#designationSection').hide();
  }
});

Template.ACHModal.onRendered(function () {

  Session.set("yes_change_date", false);

  // Setup parsley form validation
  $('#subscription_change').parsley();

  $('select').select2({dropdownCssClass: 'dropdown-inverse'});

  init_calendar();

});
