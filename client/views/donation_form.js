import parsley from 'parsleyjs';

$.fn.scrollView = function() {
  return this.each(function() {
    $('html, body').animate({
      scrollTop: $(this).offset().top
    }, 1000);
  });
};

Template.DonationForm.onCreated(function () {
  DonationFormItems = new Mongo.Collection(null);
});

Template.DonationForm.events({
  'submit form': function(e) {
    // prevent the default reaction to submitting this form
    e.preventDefault();
    // Stop propagation prevents the form from being submitted more than once.
    e.stopPropagation();

    let new_error;

    if ($("#is_recurring").val() === '') {
      $("#s2id_is_recurring").children().addClass("redText");

      $("html, body").animate({ scrollTop: 0 }, "slow");
      return;
    }
    if ($('[name="donateTo"]').val() === '') {
      $("#s2id_donateTo").children().addClass("redText");

      $("html, body").animate({ scrollTop: 0 }, "slow");
      return;
    }
    $("html, body").animate({ scrollTop: 0 }, "slow");
    Session.set("loading", true);
    $('[name="submitThisForm"]').button('loading');

    if ($('#donateWith').val() === 'Card') {
      if (!Stripe.card.validateExpiry($('#expiry_month').val(), $('#expiry_year').val())) {
        new_error = {reason: "The card expiration date you gave is either today or a day in the past.", error: "Expiration Date"};
        Give.handleErrors(new_error);
        return;
      } else if (!Stripe.card.validateCardNumber($('#card_number').val())) {
        new_error = {reason: "The card number doesn't look right, please double check the number.", error: "Card Number Problem"};
        Give.handleErrors(new_error);
        return;
      }
    }

    $(window).off('beforeunload');

    Give.updateTotal();

    Give.process_give_form();
  },
  'change #is_recurring': function() {
    if ($("#is_recurring").val() !== 'one_time') {
      Session.set('recurring', true);
      $('#calendarSection').show();
      $("#s2id_is_recurring").children().removeClass("redText");
    } else {
      Session.set('recurring', false);
      $('#calendarSection').hide();
      $("#s2id_is_recurring").children().removeClass("redText");
    }
  },
  'keyup, change [name="amount"]': function() {
    return Give.updateTotal();
  },
  // disable mousewheel on a input number field when in focus
  // (to prevent Chromium browsers change of the value when scrolling)
  'focus [name="amount"]': function() {
    $('[name="amount"]').on('mousewheel.disableScroll', function(e) {
      e.preventDefault();
    });
  },
  'blur [name="amount"]': function() {
    $('[name="amount"]').on('mousewheel.disableScroll', function(e) {
      e.preventDefault();
    });
    return Give.updateTotal();
  },
  'change #coverTheFees': function() {
    return Give.updateTotal();
  },
  'change [name=donateWith]': function() {
    var selectedValue = $("[name=donateWith]").val();
    Session.set("paymentMethod", selectedValue);
    if (Session.equals("paymentMethod", "Check")) {
      Give.updateTotal();
      $("#show_total").hide();
    }
  },
  // keypress input detection for autofilling form with test data
  'keypress input': function(e) {
    if (Meteor.isDevelopment) {
      if (e.which === 17) { // 17 is ctrl + q
        Give.fillForm('main');
      }
    }
  },
  'focus, blur #cvv': function() {
    $('#cvv').on('mousewheel.disableScroll', function(e) {
      e.preventDefault();
    });
  },
  'focus, blur #card_number': function() {
    $('#card_number').on('mousewheel.disableScroll', function(e) {
      e.preventDefault();
    });
  },
  'blur #donation_form input': function() {
    if (window.location.pathname !== "/give/user") {
      $(window).on('beforeunload', function() {
        return "It looks like you have input you haven't submitted."
      });
    }
  },
  'click #userProfileButton': function(e) {
    // prevent the default reaction to submitting this form
    e.preventDefault();
    // Stop propagation prevents the form from being submitted more than once.
    e.stopPropagation();
    Router.go('user.profile');
  },
  'click #start_date_button'(){
    $("#start_date").select();
  },
  'click #cloneButton'(){
    DonationFormItems.insert({item: $(".clonedInput").length++});
    Meteor.setTimeout(()=>{
      $('#donation_form').parsley();
      $('[data-toggle="popover"]').popover({html: true});
    }, 500);
  },
  'click [name="remove-button"]'(e){
    DonationFormItems.remove({_id: this._id});
    $('.popover').popover('destroy');
    Meteor.setTimeout(()=>{
      $('[data-toggle="popover"]').popover({html: true});
      Give.updateTotal();
    },200);
  }
});

Template.DonationForm.helpers({
  DonationFormItems(){
    return DonationFormItems.find();
  },
  paymentQuestionIcon: function() {
    if (Session.equals('paymentMethod', 'Check')) {
      return "<i class='makeRightOfInput fa fa-question-circle' data-toggle='popover' " +
        "data-trigger='hover focus' data-container='body' data-content='There are usually 3 sets of "+
        "numbers at the bottom of a check. The short check number, the 9 digit routing number and the " +
        "account number.'>" +
        "</i>";
    }
    return "<i class='makeRightOfInput fa fa-question-circle' data-toggle='popover' " +
      "data-trigger='hover focus' data-container='body' data-content='" +
      "Visa®, Mastercard®, and Discover® cardholders: " +
      "Turn your card over and look at the signature box. You should see either the entire 16-digit credit " +
      "card number or just the last four digits followed by a special 3-digit code. This 3-digit code is " +
      "your CVV number / Card Security Code.  " +
      "American Express® cardholders: " +
      "Look for the 4-digit code printed on the front of your card just above and to the right of your " +
      "main credit card number. This 4-digit code is your Card Identification Number (CID). The CID is the " +
      "four-digit code printed just above the Account Number.'" +
      "</i>";
  },
  onlyOneTimeIcon: function() {
    return "<i class='makeRightOfInput fa fa-question-circle' data-toggle='popover' " +
      "data-trigger='hover focus' data-container='body' data-content='When giving by Check we can only accept monthly recurring gifts'>" +
      "</i>";
  },
  paymentWithCard: function() {
    return Session.equals("paymentMethod", "Card");
  },
  coverTheFeesChecked: function() {
    return this.coverTheFees ? 'checked' : '';
  },
  attributes_Input_Amount: function() {
    return {
      name: "amount",
      min: 1,
      required: true
    };
  },
  errorCategory: function() {
    return 'Error Category';
  },
  errorDescription: function() {
    return 'Error Description';
  },
  amount: function() {
    return Session.get('params.amount');
  },
  campaignValue: function() {
    return Session.get('params.enteredCampaignValueignValue');
  },
  campaignName: function() {
    return Session.get('campaignName');
  },
  campaign: function() {
    if (Session.equals('params.campaign', "Serve 1000")) {
      return true;
    }
    return false;
  },
  dt_source: function() {
    return Session.get('params.dt_source');
  },
  today: function() {
    return moment().format('D MMM, YYYY');
  },
  moreThanOneDesignation(){
    return DonationFormItems.findOne();
  }
});

Template.DonationForm.onRendered(function() {
  let config = ConfigDoc();
  let writeInDonationTypeId = config.Settings.DonorTools.writeInDonationTypeId;

  // Setup parsley form validation
  $('#donation_form').parsley();

  // Set the checkboxes to unchecked
  $(':checkbox').radiocheck('uncheck');

  $('[data-toggle="popover"]').popover({html: true});

  // show the datepicker if the frequency is monthly when the page loads
  if (Session.equals('params.recurring', 'monthly')) {
    $('#calendarSection').show();
  }
  // setup modal for entering give toward information
  if (writeInDonationTypeId.indexOf(Session.get('params.donateTo')) !== -1 && !(Session.equals('showWriteIn', 'no'))) {
    $('#modal_for_write_in').modal({
      show: true,
      backdrop: 'static'
    });
  }
  // setup modal for entering give toward information
  if (Session.equals('params.donateTo', 'trips')) {
    $('#modal_for_trips').modal({
      show: true,
      backdrop: 'static'
    });
  }

  var datepickerSelector = $('#start_date');
  datepickerSelector.datepicker( {
    format: 'd MM, yyyy',
    startDate: '+0d',
    endDate: '+40d',
    autoclose: true
  });

  if (Session.get('params.startdate')) {
    $("#start_date").val(Session.get('params.startdate'));
  }

  $('[name="donateTo"]').change();
});

Template.DonationForm.onDestroyed( function() {
  $(window).unbind('beforeunload');
  Session.delete('params.startdate')
});

Template.checkPaymentInformation.helpers({
  attributes_Input_AccountNumber: function() {
    return {
      type: "text",
      id: "account_number",
      placeholder: "Bank Account Number",
      required: true
    };
  },
  attributes_Input_RoutingNumber: function() {
    return {
      type: "text",
      id: "routing_number",
      placeholder: "Routing numbers are 9 digits long",
      required: true
    };
  }
});
// Check Payment Template mods
Template.checkPaymentInformation.onRendered(function() {
  $('[data-toggle="popover"]').popover();
  $("#routing_number").mask("999999999");

});

// Card Payment Template mods
Template.cardPaymentInformation.onRendered(function() {
  $('[data-toggle="popover"]').popover();

  if (Session.get('params.exp_month')) {
    $("#expiry_month").val(Session.get('params.exp_month'));
  }

  if (Session.get('params.exp_year')) {
    $("#expiry_year").val(Session.get('params.exp_year'));
  }
});
