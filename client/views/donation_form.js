import parsley from 'parsleyjs';
import '/imports/ui/stylesheets/top.css';

$.fn.scrollView = function() {
  return this.each(function() {
    $('html, body').animate({
      scrollTop: $(this).offset().top
    }, 1000);
  });
};

Template.DonationForm.onCreated(function() {
  DonationFormItems = new Mongo.Collection(null);
  if (Session.get("params.note")) {
    DonationFormItems.insert( {name: 'first', memo: Session.get("params.note")} );
  } else {
    DonationFormItems.insert( {name: 'first'} );
  }
});

Template.DonationForm.events({
  'submit form': function(e) {
    // prevent the default reaction to submitting this form
    e.preventDefault();
    // Stop propagation prevents the form from being submitted more than once.
    e.stopPropagation();

    let newError;

    if ($("#is_recurring").val() === '') {
      $("html, body").animate({ scrollTop: 0 }, "slow");
      return;
    }
    if ($('[name="donateTo"]').val() === '') {
      $("html, body").animate({ scrollTop: 0 }, "slow");
      return;
    }
    $("html, body").animate({ scrollTop: 0 }, "slow");
    Session.set("loading", true);
    $('[name="submitThisForm"]').button('loading');

    if ($('#donateWith').val() === 'Card') {
      if (!Stripe.card.validateExpiry($('[name="cardExpirationMonth"]').val(), $('[name="cardExpirationYear"]').val())) {
        newError = {reason: "The card expiration date you gave is either today or a day in the past.", error: "Expiration Date"};
        Give.handleErrors(newError);
        return;
      } else if (!Stripe.card.validateCardNumber($('[name="cc-num"]').val())) {
        newError = {reason: "The card number doesn't look right, please double check the number.", error: "Card Number Problem"};
        Give.handleErrors(newError);
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
    } else {
      Session.set('recurring', false);
      $('#calendarSection').hide();
    }
  },
  'change [name=donateWith]': function() {
    const selectedValue = $("[name=donateWith]").val();
    Session.set("paymentMethod", selectedValue);
    if (Session.equals("paymentMethod", "Check")) {
      Give.updateTotal();
      $("#show_total").hide();
      $("#fee").val("");
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
  'focus, blur [name="cvc2"]': function() {
    $('[name="cvc2"]').on('mousewheel.disableScroll', function(e) {
      e.preventDefault();
    });
  },
  'focus, blur [name="cc-num"]': function() {
    $('[name="cc-num"]').on('mousewheel.disableScroll', function(e) {
      e.preventDefault();
    });
  },
  'blur #donation_form input': function() {
    if (window.location.pathname !== "/give/user") {
      $(window).on('beforeunload', function() {
        return "It looks like you have input you haven't submitted.";
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
  'click #start_date_button'() {
    $("#start_date").select();
  }
});

Template.DonationForm.helpers({
  paymentQuestionIcon: function() {
    if (Session.equals('paymentMethod', 'Check')) {
      return "<i class='makeRightOfInput fa fa-question-circle' data-toggle='popover' " +
        "data-trigger='hover focus' data-container='body' data-content='There are usually 3 sets of " +
        "numbers at the bottom of a check. The short check number, the 9 digit routing number and the " +
        "account number.'>" +
        "</i>";
    }
    return "<i class='makeRightOfInput fa fa-question-circle' data-toggle='popover' " +
      "data-trigger='hover focus' data-container='body' data-content='" +
      "Visa®, Mastercard®, and Discover® cardholders: " +
      "Turn your card over and look at the signature box. You should see either the entire 16-digit credit " +
      "card number or just the last four digits followed by a special 3-digit code. This 3-digit code is " +
      "your CVC number / Card Security Code.  " +
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
  errorCategory: function() {
    return 'Error Category';
  },
  errorDescription: function() {
    return 'Error Description';
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
  moreThanOneDesignation() {
    return DonationFormItems.findOne({$exists: {item: true}});
  }
});

Template.DonationForm.onRendered(function() {
  const config = ConfigDoc();
  const writeInDonationTypeId = config.Settings.DonorTools.writeInDonationTypeId;

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

  const datepickerSelector = $('#start_date');
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
  $('[name="amount"]').change();
  $('[name="splitAmount"]').change();
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
    $('[name="cardExpirationMonth"]').val(Session.get('params.exp_month'));
  }

  if (Session.get('params.exp_year')) {
    $('[name="cardExpirationYear"]').val(Session.get('params.exp_year'));
  }
});

Template.DonationForm.onDestroyed( function() {
  $(window).unbind('beforeunload');
  Session.delete("giftAmount");
  DonationFormItems.remove({});
});
