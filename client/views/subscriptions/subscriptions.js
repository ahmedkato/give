import { setDocHeight, updateSearchVal } from '/imports/miscFunctions.js';

Template.AdminSubscriptions.events({
  'click .addingNewPerson': function ( e ){
    e.preventDefault();
    let addingNew = $(".addingNewPerson").data("add");
    Session.set("addingNew", addingNew);
  },
  'click .stop-button': function (e) {
    console.log("Clicked stop");
    let subscription_id = this._id;
    let customer_id = this.customer;

    $(e.currentTarget).button('Working');

    swal({
      title: "Are you sure?",
      text: "Please let us know why you are stopping this recurring gift.",
      type: "input",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, stop it!",
      cancelButtonText: "No",
      closeOnConfirm: false,
      closeOnCancel: false
    }, function(inputValue){

      if (inputValue === "") {
        inputValue = "Not specified, but cancelled by an admin";
      }

      if (inputValue === false){
        swal("Ok, we didn't do anything.",
          "success");
        $(e.currentTarget).button('reset');
      } else if (inputValue) {
        console.log("Got to before method call with input of " + inputValue);
        Session.set("loading", true);
        Meteor.call("stripeCancelSubscription", customer_id, subscription_id, inputValue, function(error, response){
          if (error){
            Bert.alert(error.message, "danger");
            Session.set("loading", false);
            $(e.currentTarget).button('reset');
          } else {
            // If we're resubscribed, go ahead and confirm by returning to the
            // subscriptions page and show the alert
            Session.set("loading", false);
            swal("Cancelled", "That recurring gift has been stopped.", "error");
          }
        });
      }
    });
  },
  'click .edit-button': function (e) {
    e.preventDefault();
    console.log("Clicked edit");
    Router.go('UpdateSubscription', {}, {query: {subscription: this._id}});
  },
  'keyup, change .search': _.debounce(function () {
    updateSearchVal();
  }, 300),
  'click .clear-button': function () {
    $(".search").val("").change();
    Session.set("searchValue", "");
    Session.set( "documentLimit", 10);
  },
  'click #btn_modal_for_add_new_bank_account': function () {
    $("#modal_for_add_new_bank_account").modal('show');
    Session.set('updateSubscription', this.id);
  },
  'click #go_to_resubscribe_link': function () {
    Router.go('/user/subscriptions/card/change?s=' +
      this.id + "&c=" + this.customer + "&admin=yes");
  }
});

Template.AdminSubscriptions.helpers({
  card_or_bank() {
    const customer = this.customer;
    const customer_cursor = Customers.findOne({_id: customer});
    if (customer_cursor) {
      console.log(customer_cursor);
      if(customer_cursor.default_source_type === 'bank_account') {
        return 'Bank';
      } else if(customer_cursor.default_source_type === 'card') {
        return 'Card';
      }
      return 'Other';
    }
  },
  card_subscription() {
    const customer = this.customer;
    const customer_cursor = Customers.findOne({_id: customer});
    if (customer_cursor) {
      const default_source_type =  customer_cursor.default_source_type;
      if(default_source_type === 'bank_account') {
        return false;
      } else if (default_source_type === 'card') {
        return true;
      }
      return false;
    }
  },
  subscriptions() {
    return Subscriptions.find({}, {sort: {created: -1}});
  },
  name() {
    let name = this.metadata && this.metadata.fname + " " +
    this.metadata.lname;

    if (this.metadata.business_name) {
      return this.metadata.business_name + " - " + name;
    }
    return name;

  },
  trialing() {
    if(this.status === 'trialing') {
      return "trialing-subscription";
    }
  },
});

Template.AdminSubscriptions.onCreated( function () {
  Session.set("documentLimit", 10);
  this.autorun(()=> {
    this.subscribe("subscriptions_and_customers", Session.get("searchValue"), Session.get("documentLimit"));
    this.subscribe("userDTFunds");
  });
});

Template.AdminSubscriptions.onRendered(function () {
  setDocHeight();
  Meteor.setTimeout(function(){
    $('[data-toggle="popover"]').popover();
  }, 500);
  Meteor.setTimeout(function(){
    $('[data-toggle="popover"]').popover();
  }, 5000);
});

Template.AdminSubscriptions.onDestroyed(function() {
  Session.delete("searchValue");
  Session.delete("documentLimit");
  $(window).unbind('scroll');
});
