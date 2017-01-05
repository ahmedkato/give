import { setDocHeight, updateSearchVal, cancelRecurringGift} from '/imports/api/miscFunctions.js';

Template.AdminSubscriptions.events({
  'click .addingNewPerson': function( e ) {
    e.preventDefault();
    const addingNew = $(".addingNewPerson").data("add");
    Session.set("addingNew", addingNew);
  },
  'click .cancel-subscription': function(e) {
    e.preventDefault();
    console.log("Clicked stop button");
    cancelRecurringGift(e, this.id);
  },
  'click .edit-button': function(e) {
    e.preventDefault();
    console.log("Clicked edit");
    Router.go('UpdateSubscription', {}, {query: {subscription: this._id}});
  },
  'keyup, change .search': _.debounce(function() {
    updateSearchVal();
  }, 300),
  'click .clear-button': function() {
    $(".search").val("").change();
    Session.set("searchValue", "");
    Session.set( "documentLimit", 10);
  },
  'click #btn_modal_for_add_new_bank_account': function() {
    $("#modal_for_add_new_bank_account").modal('show');
    Session.set('updateSubscription', this.id);
  },
  'click #go_to_resubscribe_link': function() {
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
      if (customer_cursor.default_source_type === 'bank_account') {
        return 'Bank';
      } else if (customer_cursor.default_source_type === 'card') {
        return 'Card';
      }
      return 'Other';
    }
  },
  card_subscription() {
    const customer = this.customer;
    const customer_cursor = Customers.findOne({_id: customer});
    if (customer_cursor) {
      const default_source_type = customer_cursor.default_source_type;
      if (default_source_type === 'bank_account') {
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
    const name = this.metadata && this.metadata.fname + " " +
    this.metadata.lname;

    if (this.metadata.business_name) {
      return this.metadata.business_name + " - " + name;
    }
    return name;
  },
  trialing() {
    if (this.status === 'trialing') {
      return "trialing-subscription";
    }
  }
});

Template.AdminSubscriptions.onCreated( function() {
  Session.set("documentLimit", 10);
  this.autorun(()=> {
    this.subscribe("subscriptions_and_customers", Session.get("searchValue"), Session.get("documentLimit"));
    this.subscribe("userDTFunds");
  });
});

Template.AdminSubscriptions.onRendered(function() {
  setDocHeight();
  Meteor.setTimeout(function() {
    $('[data-toggle="popover"]').popover();
  }, 500);
  Meteor.setTimeout(function() {
    $('[data-toggle="popover"]').popover();
  }, 5000);
});

Template.AdminSubscriptions.onDestroyed(function() {
  Session.delete("searchValue");
  Session.delete("documentLimit");
  $(window).unbind('scroll');
});
