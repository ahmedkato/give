import parsley from 'parsleyjs';

Template.AdminGive.onRendered(function() {
  if ($('#donateWith option').length > 2) {
    $('#donateWith').val($('#donateWith option').eq(2).val());
    if ($('#donateWith').val().slice(0,3) === 'car') {
      Session.set("savedDevice", "Card");
      Session.set("paymentMethod", $('#donateWith option').eq(2).val());
    } else if ($('#donateWith').val().slice(0,3) === 'ban') {
      Session.set("savedDevice", "Check");
      Session.set("paymentMethod", $('#donateWith option').eq(2).val());
    }
  } else if (Session.get('params.donateWith')) {
    Session.set("paymentMethod", Session.get('params.donateWith'));
  }

  if ($('#donateWith').val() === 'Card') {
    Session.set("paymentMethod", "Card");
  } else if ($('#donateWith').val() === 'Check') {
    Session.set("paymentMethod", "Check");
  }
  // Setup parsley form validation
  $('#quick_give').parsley();
  
  _.each(_.uniq(_.pluck($("select[name='donateWith'] > option")
      .get(), 'text')), function(name) { $("select[name='donateWith'] > option:contains(" + name + ")")
      .not(":first").remove(); });

  $('#donateWith').change();

});

Template.AdminGive.helpers({
  paymentWithCard: function() {
    return Session.equals("UserPaymentMethod", "Card");
  },
  paymentWithCheck: function() {
    return Session.equals("UserPaymentMethod", "Check");
  },
  attributes_Input_Amount: function() {
    return {
      name: "amount",
      id: "amount",
      type: "digits",
      min: 1,
      required: true
    };
  },
  amountWidth: function() {
    if(Session.equals("paymentMethod", "Card") || Session.get("paymentMethod") && Session.get("paymentMethod").slice(0,3) === 'car'){
      return 'form-group col-md-4 col-sm-4 col-xs-12';
    } else if(Session.equals("paymentMethod", "Check")){
      return 'form-group';
    } else{
      return 'form-group';
    }
  },
  savedDevice: function() {
    return Session.equals("savedDevice", "Card");
  },
  amount: function() {
    return Session.get('params.amount');
  }
});

Template.AdminGive.events({
  'click .close'(){
    $('#donateWith').val("");
    $('#donateWith').change();
    Meteor.setTimeout(()=>{
      Session.set("gift_user_id", "");
    },300);
  },
  'submit form': function(e) {
    //prevent the default reaction to submitting this form
    e.preventDefault();
    // Stop propagation prevents the form from being submitted more than once.
    e.stopPropagation();

    $("[name='submitQuickGive']").button('loading');
    Session.set("loading", true);
    $(window).off('beforeunload');
    let donateWith = $("#donateWith").val();
    let gift_user_id = Session.get("gift_user_id");
    let customer;
    if (donateWith && donateWith !== 'Card' && donateWith !== 'Check') {
      customer = Devices.findOne({_id: $('#donateWith').val()}) &&
        Devices.findOne({_id: $('#donateWith').val()}).customer;
    } else {
      customer = Meteor.users.findOne({_id: gift_user_id}).primary_customer_id;
    }
    Give.updateTotal();

    Give.process_give_form(true, customer, gift_user_id);
  },
  'keyup, change #amount': function() {
    return Give.updateTotal();
  },
  // disable mousewheel on a input number field when in focus
  // (to prevent Chromium browsers change of the value when scrolling)
  'focus #amount': function() {
    $('#amount').on('mousewheel.disableScroll', function(e) {
      e.preventDefault();
    });
  },
  'blur #amount': function() {
    $('#amount').on('mousewheel.disableScroll', function(e) {
      e.preventDefault();
    });
    return Give.updateTotal();
  },
  'change #coverTheFees': function() {
    return Give.updateTotal();
  },
  // keypress input detection for autofilling form with test data
  'keypress input': function(e) {
    if (e.which === 17) { //17 is ctrl + q
      Give.fillForm();
    }
  }
});

Template.AdminGive.onCreated(function () {
  this.autorun(()=>{
    this.subscribe('publish_for_admin_give_form', Session.get("gift_user_id"));
  });
});