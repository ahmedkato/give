import { setDocHeight, updateSearchVal } from '/imports/api/miscFunctions.js';

Template.Gifts.onCreated(function() {
  Session.set("documentLimit", 25);
  this.autorun(()=> {
    this.subscribe("userDTFunds");
    this.subscribe("charges_and_customers",
      Session.get("searchValue"),
      Session.get("documentLimit"),
      Session.get("refunded"));
  });
});

Template.Gifts.onDestroyed(function() {
  Session.delete("searchValue");
  Session.delete("documentLimit");
  $(window).unbind('scroll');
});

Template.Gifts.onRendered(function() {
  setDocHeight();
  const refunded = Iron.Location.get().queryObject && Iron.Location.get().queryObject.refunded;
  if (refunded === "_true") {
    $("#filter-refunded").prop( "checked", true );
  } else {
    $("#filter-refunded").prop( "checked", false );
  }
  $( "[data-toggle='popover']" ).popover({html: true});
});

Template.Gifts.events({
  'change #filter-refunded'(e) {
    console.log("Changes");
    const checked = $(e.currentTarget).is(':checked');
    if (checked) {
      Session.set("refunded", "_true");
    } else {
      Session.set("refunded", "_false");
    }
  },
  'keyup, change .search': _.debounce(function() {
    updateSearchVal();
  }, 300),
  'click .clear-button'() {
    $(".search").val("").change();
    Session.set("searchValue", "");
    Session.set("documentLimit", 25);
    Session.set("refunded", "_false");
  },
  'click .go_to_subscription_link'(e) {
    const invoice = Invoices.findOne({_id: $(e.currentTarget).data('invoice-id')});
    Router.go('/dashboard/subscriptions?sub=' + invoice.subscription);
  },
  'click .refund-button': function(e) {
    console.log("Clicked refund");
    const charge_id = this._id;

    $(e.currentTarget).button('Working');

    swal({
      title: "Are you sure?",
      text: "Please let us know why you are refunding this gift.",
      type: "input",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, refund it",
      cancelButtonText: "No",
      closeOnConfirm: false,
      closeOnCancel: false
    }, function(inputValue) {
      if (inputValue === "") {
        inputValue = "Not specified, but refunded by an admin";
      }

      if (inputValue === false) {
        swal("Ok, we didn't do anything.",
          "success");
        $(e.currentTarget).button('reset');
      } else if (inputValue) {
        console.log("Got to before method call with input of " + inputValue);
        Session.set("loading", true);
        Meteor.call("stripeRefundGift", charge_id, inputValue, function(error, response) {
          if (error) {
            Bert.alert(error.message, "danger");
            Session.set("loading", false);
            $(e.currentTarget).button('reset');
          } else {
            console.log(response);
            Session.set("loading", false);
            swal("Refunded", "That gift has been refunded.", "error");
          }
        });
      }
    });
  }
});

Template.Gifts.helpers({
  charges() {
    return Charges.find({}, {sort: {created: -1}});
  },
  status() {
    if (this.refunded) {
      return 'refunded';
    } else if (this.status === 'failed') {
      return 'failed';
    }
    return;
  },
  refunded() {
    if (this.refunded) {
      return 'refunded';
    }
    return;
  },
  failureMessage() {
    if (this.status === 'failed') {
      return this.failure_message;
    }
    return;
  },
  thisCustomer() {
    const customer = Customers.findOne({_id: this.customer});
    return customer;
  },
  name() {
    let name = this.metadata && this.metadata.fname;
    if (name) {
      name = name + " " + this.metadata.lname;
      return name;
    }
    return;
  },
  recurring() {
    if (this.invoice) {
      return true;
    }
    return;
  },
  refundAmount() {
    return Session.get("refundAmount");
  },
  isChecked() {
    const checked = Session.equals( "refunded", "_true" );
    if ( checked === true ) {
      return 'checked';
    }
    return;
  },
  refundUnixDate() {
    return this.refunds.data[0].created;
  },
  dt_donation() {
    return DT_donations.findOne( { 'transaction_id': this._id } ) && DT_donations.findOne( { 'transaction_id': this._id } );
  }
});
