import parsley from 'parsleyjs';

Template.GiveDropdownGroup.onRendered(function() {
  $('select').select2({dropdownCssClass: 'dropdown-inverse'});

  // show the datepicker if the frequency is monthly when the page loads
  if (Session.equals('params.recurring', 'monthly')) {
    $('#calendarSection').show();
  }

  var datepickerSelector = $('#start_date');
  datepickerSelector.datepicker( {
    format: 'd MM, yyyy',
    startDate: '+0d',
    endDate: '+40d',
    autoclose: true
  });

  if($('#donateWith option').length > 2){
    $('#donateWith').val($('#donateWith option').eq(2).val());
    if($('#donateWith').val().slice(0,3) === 'car'){
      Session.set("savedDevice", "Card");
      Session.set("paymentMethod", $('#donateWith option').eq(2).val());
    } else if($('#donateWith').val().slice(0,3) === 'ban'){
      Session.set("savedDevice", "Check");
      Session.set("paymentMethod", $('#donateWith option').eq(2).val());
    }
  } else if (Session.get('params.donateWith')) {
    Session.set("paymentMethod", Session.get('params.donateWith'));
    $('#donateWith').val(Session.get('paymentMethod'));
  }
  if ($('#donateWith').val() === 'Card') {
    Session.set("paymentMethod", "Card");
  } else if($('#donateWith').val() === 'Check'){
    Session.set("paymentMethod", "Check");
  }
  // Setup parsley form validation
  $('#quick_give').parsley();

  _.each(_.uniq(_.pluck($("select[name='donateWith'] > option")
    .get(), 'text')), function(name) { $("select[name='donateWith'] > option:contains(" + name + ")")
    .not(":first").remove(); });
});

Template.GiveDropdownGroup.helpers({
  give_home: function() {
    return true;
  },
  today: function() {
    return moment().format('D MMM, YYYY');
  },
  device: function(){
    if(!Devices.find()){
      Session.set("UserPaymentMethod", "Check");
    } else {
      return Devices.find();
    }
  },
  selected: function() {
    var customer = Customers.find({_id: this.customer});
    if (this.id === customer.default_source) {
      return 'selected';
    }
  },
  brand: function() {
    if (this.brand) {
      return this.brand;
    }
    return 'Bank Acct';
  }
});

Template.GiveDropdownGroup.events({
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
  'change #donateWith': function() {
    var selectedValue = $("#donateWith").val();
    Session.set("UserPaymentMethod", selectedValue);
  },
  'click #start_date_button'(){
    $("#start_date").select();
  }
});