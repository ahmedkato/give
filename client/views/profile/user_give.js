var giveTutorialSteps = [
  {
    template: Template.tutorial_give_step1,
    onLoad: function() {
      console.log("The tutorial has started!");
    },
    spot: ".quick-give-form"
  },
  {
    template: Template.tutorial_give_step2,
    spot: "#save_payment, #save_payment_question"
  },
  {
    template: Template.tutorial_give_step3,
    spot: ".donateWithDiv"
  },
  {
    template: Template.tutorial_give_step4
  }
];

Template.UserGive.helpers({
  notDTUser() {
    if(Meteor.user() && Meteor.user().profile && Meteor.user().profile.address) {
      return Session.get("NotDTUser");
    } else {
      return true;
    }
  },
  paymentWithCard: function() {
    let userPaymentMethod = Session.get("UserPaymentMethod");
    if (userPaymentMethod) {
      return userPaymentMethod === 'Card';
    }
    return;
  },
  paymentWithCheck: function() {
    let userPaymentMethod = Session.get("UserPaymentMethod");
    if (userPaymentMethod) {
      return userPaymentMethod === 'Check';
    }
    return;
  },
  amountWidth: function() {
    if (Session.equals("paymentMethod", "Card") || Session.get("paymentMethod") && Session.get("paymentMethod").slice(0,3) === 'car'){
      return 'form-group col-md-4 col-sm-4 col-xs-12';
    } else if (Session.equals("paymentMethod", "Check")) {
      return 'form-group';
    }
    return 'form-group';
  },
  savedDevice: function() {
    return Session.equals("savedDevice", "Card");
  },
  amount: function() {
    return Session.get('params.amount');
  },
  options: {
    id: "giveTutorial",
    steps: giveTutorialSteps,
    onFinish: function() {
      Meteor.setTimeout( function() {
        Session.set('tutorialEnabled', false);
      }, 1000);
    }
  }
});

Template.UserGive.events({
  'submit form': function(e) {
    // prevent the default reaction to submitting this form
    e.preventDefault();
    // Stop propagation prevents the form from being submitted more than once.
    e.stopPropagation();

    $("[name='submitQuickGive']").button('loading');
    Session.set("loading", true);

    $(window).off('beforeunload');

    Give.updateTotal();

    if (Session.get("savedDevice", "Check") || Session.get("savedDevice", "Card")) {
      let usingDevice = Devices.findOne({_id: Session.get("paymentMethod")});
      let customer = Customers.findOne({_id: usingDevice.customer});
      Give.process_give_form(true, customer._id);
    } else {
      Give.process_give_form(true);
    }
  },
  'change [name=donateWith]': function() {
    var selectedValue = $("#donateWith").val();
    Session.set("paymentMethod", selectedValue);
    if (selectedValue === 'Check') {
      Session.set("savedDevice", false);
      Give.updateTotal();
      $("#show_total").hide();
    } else if (selectedValue === 'Card') {
      Session.set("savedDevice", false);
      Give.updateTotal();
    } else if (selectedValue.slice(0,3) === 'car') {
      Session.set("savedDevice", 'Card');
    } else {
      Session.set("savedDevice", 'Check');
    }
  },
  // keypress input detection for autofilling form with test data
  'keypress input': function(e) {
    if (e.which === 17) { //17 is ctrl + q
      Give.fillForm();
    }
  }
});

Template.UserGive.onRendered(function () {
  $('[data-toggle="popover"]').popover();

  let selectedUser = Meteor.user();

  let selectedPersonaInfo = selectedUser && selectedUser.persona_info;
  let selectedPersonaIds = selectedUser && selectedUser.persona_ids;
  if (!selectedPersonaInfo ||
    ( selectedPersonaInfo && selectedPersonaInfo.length < 1 ) ||
    ( selectedPersonaInfo && selectedPersonaInfo.length <
    ( selectedPersonaIds && selectedPersonaIds.length ) ) ||
    ( selectedPersonaInfo && selectedPersonaInfo.length <
    ( selectedUser && selectedUser.persona_id && selectedUser.persona_id.length ) ) ) {
    Meteor.call( 'update_user_document_by_adding_persona_details_for_each_persona_id', function ( error, result ) {
      if( result ) {
        if(result === 'Not a DT user'){
          Session.set("NotDTUser", true);
          return;
        }
      } else {
        console.error(error);
        throw new Meteor.Error("400", "Couldn't retrieve any Donor Tools information for this user.");
      }
    } );
  }

  $('#donateWith').change();
});

Template.UserGive.onCreated( function() {
  DonationFormItems = new Mongo.Collection(null);
  if(Session.get("params.note")){
    DonationFormItems.insert( {name: 'first', memo: Session.get("params.note")} );
  } else {
    DonationFormItems.insert( {name: 'first'} );
  }
});

Template.UserGive.onDestroyed( function() {
  $(window).unbind('beforeunload');
  Session.delete("NotDTUser");
});
