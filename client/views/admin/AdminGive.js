import parsley from 'parsleyjs';

Template.AdminGive.onCreated(function() {
  DonationFormItems = new Mongo.Collection(null);
  if (Session.get("params.note")) {
    DonationFormItems.insert( {name: 'first', memo: Session.get("params.note")} );
  } else {
    DonationFormItems.insert( {name: 'first'} );
  }
  this.autorun(()=>{
    this.subscribe('publish_for_admin_give_form', Session.get("params.userID"));
    this.subscribe('all_users', Session.get("params.userID"));
  });
});

Template.AdminGive.onRendered(function() {
  if ($('#donateWith option').length > 2) {
    $('#donateWith').val($('#donateWith option').eq(2).val());
    if ($('#donateWith').val().slice(0, 3) === 'car') {
      Session.set("savedDevice", "Card");
      Session.set("paymentMethod", $('#donateWith option').eq(2).val());
    } else if ($('#donateWith').val().slice(0, 3) === 'ban') {
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
      .get(), 'text')), function(name) {
    $("select[name='donateWith'] > option:contains(" + name + ")")
      .not(":first").remove();
  });

  $('#donateWith').change();
});

Template.AdminGive.helpers({
  paymentWithCard: function() {
    return Session.equals("UserPaymentMethod", "Card");
  },
  paymentWithCheck: function() {
    return Session.equals("UserPaymentMethod", "Check");
  },
  savedDevice: function() {
    return Session.equals("savedDevice", "Card");
  },
  userIDParam() {
    return Session.get("params.userID");
  },
  user(userId) {
    return Meteor.users.findOne({_id: userId});
  }
});

Template.AdminGive.events({
  'submit form': function(e) {
    // prevent the default reaction to submitting this form
    e.preventDefault();
    // Stop propagation prevents the form from being submitted more than once.
    e.stopPropagation();

    $("[name='submitQuickGive']").button('loading');
    Session.set("loading", true);
    $(window).off('beforeunload');
    const donateWith = $("#donateWith").val();
    const gift_user_id = Session.get("params.userID");
    let customer;
    if (donateWith && donateWith !== 'Card' && donateWith !== 'Check') {
      customer = Devices.findOne({_id: $('#donateWith').val()}) &&
        Devices.findOne({_id: $('#donateWith').val()}).customer;
    } else {
      customer = Meteor.users.findOne({_id: gift_user_id}).primary_customer_id;
    }
    Give.updateTotal();

    Give.process_give_form(true, customer, gift_user_id);
  }
});
