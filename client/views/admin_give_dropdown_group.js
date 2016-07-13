Template.AdminGiveDropdownGroup.onRendered(function() {
  $('select').select2({dropdownCssClass: 'dropdown-inverse', DropdownAdapter: 'DropdownSearch'});

  // show the datepicker if the frequency is monthly when the page loads
  if(Session.equals('params.recurring', 'monthly')){
    $('#calendarSection').show();
  }

  var datepickerSelector = $('#start_date');
  datepickerSelector.datepicker( {
    format: 'd MM, yyyy',
    startDate: '+0d',
    endDate: '+40d',
    autoclose: true
  });

  Session.set("admin_give_dropdown", true);
});

Template.AdminGiveDropdownGroup.helpers({
  today: function() {
    return moment().format('D MMM, YYYY');
  },
  device: function(){
    if(!Devices.find()){
      Session.set("UserPaymentMethod", "Check");
    }
    return Devices.find();
  },
  selected: function() {
    var customer = Customers.find({_id: this.customer});
    if(this.id === customer.default_source){
      return 'selected';
    } else{
      return;
    }
  },
  brand: function(){
    if(this.brand){
      return this.brand;
    } else{
      return 'Bank Acct';
    }
  },
  customer: function() {
    let customer = Customers.findOne({_id: this.customer});
    if (customer) {
      return " - " + customer.metadata.fname +  " " + customer.metadata.lname;
    }
  }
});

Template.AdminGiveDropdownGroup.events({
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
    let selectedValue = $("#donateWith").val();
    Session.set("UserPaymentMethod", selectedValue);
    if (selectedValue) {
      if(selectedValue === 'Check'){
        Session.set("savedDevice", false);
        Give.updateTotal();
        $("#show_total").hide();
      } else if(selectedValue === 'Card'){
        Session.set("savedDevice", false);
        Give.updateTotal();
      } else if(selectedValue.slice(0,3) === 'car'){
        Session.set("savedDevice", 'Card');
      } else{
        Session.set("savedDevice", 'Check');
      }
    }
  },
  'click #start_date_button'(){
    $("#start_date").select();
  }
});

Template.AdminGiveDropdownGroup.onDestroyed(function() {
  Session.delete("admin_give_dropdown");
});