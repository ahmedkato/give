import { cancelRecurringGift} from '/imports/api/miscFunctions.js';

const subscriptionsTutorialSteps = function() {
  let return_tutorials = [];
  return_tutorials = [
    {
      template: Template.tutorial_subscriptions_step1,
      onLoad: function() {
        console.log("The tutorial has started!");
      },
      spot: ".billing-module-title, .billing-module"
    },
    {
      template: Template.tutorial_subscriptions_step2,
      spot: ".cancel-subscription," +
                  " .edit-subscription," +
                  " .update-subscription," +
                  " .btn_modal_for_add_new_bank_account, " +
                  " .past-due-subscription," +
                  " .activate-subscription"
    },
    {
      template: Template.tutorial_subscriptions_step3,
      spot: "#nav-give"
    }
  ];
  return return_tutorials;
};

Template.SubscriptionsOverview.helpers({
  subscriptions: function() {
    const subscription_page = Session.get('subscription_cursor');
    const subscriptions = Subscriptions.find();
    Session.set("number_of_subscriptions", subscriptions.count());
    if (Session.get("number_of_subscriptions", subscriptions.count())) {
      return Subscriptions.find({}, {
        sort: {
          status: 1, start: -1
        },
        limit: 3,
        skip: subscription_page
      });
    } else {
      return;
    }
  },
  lastFour: function() {
    const device = Devices.findOne({customer: this.customer});
    if (device) {
      return " - " + device.last4;
    } else {
      return;
    }
  },
  type: function() {
    const device = Devices.findOne({customer: this.customer});
    if (device) {
      if (device.brand) {
        return ": " + device.brand;
      } else {
        return ": Bank Acct";
      }
    } else {
      return;
    }
  },
  planInterval: function() {
    return this.plan.interval;
  },
  number_of_subscriptions: function() {
    if (Session.get("number_of_subscriptions") > 3) {
      return true;
    } else {
      return false;
    }
  },
  card_subscription: function() {
    const customer = this.customer;
    const customer_cursor = Customers.findOne({_id: customer});
    const default_source_type = customer_cursor.default_source_type;
    if (default_source_type === 'bank_account') {
      return false;
    } else if (default_source_type === 'card') {
      return true;
    } else {
      return false;
    }
  },
  show_donate_with: function() {
    if (this.metadata && this.metadata.donateWith === 'Check' || this.metadata && this.metadata.donateWith && this.metadata.donateWith.slice(0, 2) === 'ba') {
      return 'Bank Account';
    } else if (this.metadata && this.metadata.donateWith === 'Card' || this.metadata && this.metadata.donateWith && this.metadata.donateWith.slice(0, 2) === 'ca') {
      return 'Card';
    }
  },
  canceled_reason: function() {
    return this.metadata && this.metadata.canceled_reason;
  },
  donateTo: function() {
    if (this.metadata && this.metadata.donateTo) {
      if (! isNaN(this.metadata.donateTo)) {
        if (DT_funds.findOne({_id: this.metadata.donateTo}) && DT_funds.findOne({_id: this.metadata.donateTo}).name) {
          return DT_funds.findOne({_id: this.metadata.donateTo}).name;
        } else {
          return;
        }
      } else {
        return this.metadata.donateTo;
      }
    }
    return "Click edit or activate to see the details";
  },
  donations() {
    return Donations.find({}, { sort: { created_at: 1} });
  },
  options: {
    id: "subscriptionsTutorial",
    steps: subscriptionsTutorialSteps(),
    onFinish: function() {
      console.log("Finish clicked!");
      Meteor.setTimeout( function() {
        // Test debouncing
        Session.set('tutorialEnabled', false);
      }, 1000);
    }
  },
  resubscribeLinkParams() {
    const returnThis = {};
    if (this.status && this.status === 'canceled') {
      returnThis.resubscribe = "true";
    }
    returnThis.s = this.id;
    returnThis.c = this.customer;
    return returnThis;
  }
});

Template.SubscriptionsOverview.events({
  'click .cancel-subscription': function(e) {
    e.preventDefault();
    console.log("Clicked stop button");

    cancelRecurringGift(e, this.id);


    /* e.preventDefault();
    const subscription_id = this.id;
    const customer_id = Subscriptions.findOne({_id: subscription_id}).customer;
    console.log("Got to cancel subscription call");
    console.log("subscription id: " + subscription_id);
    console.log("Customer id: " + customer_id);
    $(e.currentTarget).button('loading');

    swal({
      title: "Are you sure?",
      text: "Please let us know why you are stopping your gift. (optional)",
      type: "input",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, stop it!",
      cancelButtonText: "No",
      closeOnConfirm: false,
      closeOnCancel: false
    }, function(inputValue) {
      if (inputValue === "") {
        inputValue = "Not specified";
      }

      if (inputValue === false) {
        swal("Ok, we didn't do anything.", "Your recurring gift is still active :)",
            "success");
        $(e.currentTarget).button('reset');
      } else if (inputValue) {
        Session.set("loading", true);
        $(".confirm").button("loading");
        console.log("Got to before method call with input of " + inputValue);
        Meteor.call("stripeCancelSubscription", customer_id, subscription_id, inputValue, function(error, response) {
          if (error) {
            confirm.button("reset");
            $(".confirm").button("reset");

            Session.set("loading", false);
            Bert.alert(error.message, "danger");
            $(e.currentTarget).button('reset');
          } else {
            // If we're resubscribed, go ahead and confirm by returning to the
            // subscriptions page and show the alert
            console.log(response);
            Session.set("loading", false);
            swal("Cancelled", "Your recurring gift has been stopped.", "error");
          }
        });
      }
    });*/
  },
  'click .previous': function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    if (Number(Session.get('subscription_cursor') >= 3)) {
      Session.set('subscription_cursor', Number(Session.get('subscription_cursor') - 3));
    }
  },
  'click .next': function(evt, tmpl) {
    evt.preventDefault();
    evt.stopPropagation();
    Session.set('subscription_cursor', Number(Session.get('subscription_cursor') + 3));
  },
  'click .btn_modal_for_add_new_bank_account': function() {
    $("#modal_for_add_new_bank_account").modal('show');
    Session.set('updateSubscription', this.id);
  },
  'click .edit-subscription': function(e) {
    e.preventDefault();
    console.log("Clicked edit");

    const query = {subscription: this._id, customer: this.customer};
    Session.set("change_subscription_id", this._id);
    if (this.metadata.donateTo) {
      Session.set("params.donateTo", this.metadata.donateTo);
      Session.get("change_donateTo", this.metadata.donateTo);
      query.donateTo = this.metadata.donateTo;
      query.amount = this.quantity;
      query.date = this.current_period_end;
    }
    Router.go('UpdateSubscription', {}, {query});
  }
});

Template.SubscriptionsOverview.onRendered(function() {
  if (Roles.userIsInRole(Meteor.userId(), 'no-dt-person')) {
    Router.go("Dashboard");
  }
  Session.setDefault('paymentMethod', 'default');
  Session.setDefault('subscription_cursor', 0);
  Session.delete("params.donateTo");
});

Template.SubscriptionsOverview.onCreated(function() {
  this.autorun(()=>{
    this.subscribe("userDTFunds");
    this.subscribe('subscriptions');
    this.subscribe('userDoc');
  });
});
