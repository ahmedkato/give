// TODO: change ACH to use only nextDonationDate for the date listed on the ACH page. Use the start_date only for recording the date
// the recurring gift was first setup (stop using 'today')
// When the donation is inserted for the next gift, add 1 month, but make sure this always gets added from the nextDonationDate

function updateSearchVal() {
  console.log("Got to updateSearchVal function");
  let searchValue = $(".search").val();
  if (searchValue) {
    // Remove punctuation and make it into an array of words
    searchValue = searchValue
      .replace( /[^\w\s]|_/g, "" )
      .replace( /\s+/g, " " );

    Session.set( "searchValue", searchValue );
  }
}

Template.ACH.onCreated(function() {
  this.autorun(() => {
    this.subscribe("ach");
    this.subscribe("userDTFunds");
  });
});

Template.ACH.onRendered(function() {
  Session.set("ach_page", true);
});

Template.ACH.helpers({
  donations() {
    const searchValue = Session.get("searchValue");
    if (!searchValue) {
      return Donations.find({}, { sort: { nextDonationDate: 1} });
    }
    const customers = Customers.find({
      $or: [
        { 'metadata.fname': { $regex: searchValue, $options: 'i' } },
        { 'metadata.lname': { $regex: searchValue, $options: 'i' } },
        { 'metadata.business_name': { $regex: searchValue, $options: 'i' } },
        { 'emails': { $regex: searchValue, $options: 'i' } }
      ]
    }, { sort: { createdAt: 1} });
    if (customers.count()) {
      return Donations.find({'customer_id': {$in: customers.map(function( item ) {
        return item._id;
      })} });
    }
    return false;
  },
  donationFrequency() {
    if (this.frequency && !(this.frequency === 'one_time')) {
      return 'recurring';
    }
    return 'one-time';
  },
  pendingSetupTitle() {
    if (!this.iterationCount) {
      return {
        title: "Send new gift to Donor Tools"
      };
    }
    return {
      title: "Send new instance of recurring gift to Donor Tools"
    };
  },
  donorName() {
    const customer = Customers.findOne({_id: this.customer_id});
    let name;
    if (customer) {
      if (customer.metadata.business_name) {
        name = customer.metadata.business_name + " ";
      }
      name = name ? name : '' + customer.metadata.fname + " " + customer.metadata.lname;
      return name;
    }
  },
  donationAmount() {
    return (this.total_amount / 100).toFixed(2);
  },
  donationDate() {
    if (this.nextDonationDate) {
      return moment.unix(this.nextDonationDate).format("MM/DD/YYYY");
    }
    if (this.start_date === 'today') {
      return moment.unix(this.created_at).format("MM/DD/YYYY");
    }
    return moment.unix(this.start_date).format("MM/DD/YYYY");


    //return moment.unix(this.nextDonationDate).format("MM/DD/YYYY");
    /*return this.start_date > this.created_at ?
      moment.unix(this.start_date).format("MM/DD/YYYY") :
      moment.unix(this.created_at).format("MM/DD/YYYY");*/

    //return moment.unix(this.start_date).format("MM/DD/YYYY");
  },
  disableSendIfNotReady() {
    /*if (this.start_date === 'today') {
      return;
    }*/
    //const dateToUse = this.start_date > this.created_at ? this.start_date : this.created_at;
    const dateToUse = this.nextDonationDate;
    return (dateToUse > (new Date().getTime() / 1000 | 0)) ? 'disabled' : '';
  },
  routingNumber() {
    const bankInfo = BankAccounts.findOne({_id: this.source_id});
    if (bankInfo) {
      return bankInfo.routing_number;
    }
  },
  accountType() {
    const bankInfo = BankAccounts.findOne({_id: this.source_id});
    if (bankInfo) {
      return bankInfo.account_type;
    }
  },
  personaId() {
    const customer = Customers.findOne({_id: this.customer_id});
    if (customer) {
      if (customer.metadata.dt_persona_id) {
        return customer.metadata.dt_persona_id;
      } else {
        Meteor.call( "addDTPersonaIDToCustomer",
          customer.metadata.email,
          this.customer_id,
          function( err, res ) {
            if ( err ) console.error( err );
            else console.log( res );
          } );
      }
    }
  },
  showSingleRecord() {
    return false;
  }
});

Template.ACH.events({
  'click .pending-setup'() {
    const self = this;

    swal({
      title: "Have you manually setup this ACH?",
      type: "info",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      closeOnConfirm: false,
      closeOnCancel: true,
      showLoaderOnConfirm: true
    }, function(isConfirm) {
      if (isConfirm) {
        Meteor.call( 'manual_gift_processed', self._id, function( error, response ) {
          if ( error ) {
            console.log(error);
            swal("Error", "Something went wrong", "error");
          } else {
            console.log(response);
            swal({
              title: "Done",
              text: "Ok, I've added this gift to Donor Tools",
              type: 'success'
            });
          }
        });
      }
    });
  },
  'click .stop-recurring'(e) {
    console.log("stop recurring clicked ", $(e.currentTarget).attr("data-id"));
    swal({
      title: "Are you sure?",
      text: "Do you really want to stop this recurring gift?",
      type: "info",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      closeOnConfirm: false,
      closeOnCancel: true
    }, function(isConfirm) {
      if (isConfirm) {
        Donations.remove({_id: $(e.currentTarget).attr("data-id")});
        swal({
          title: "Done",
          text: "This recurring gift has been stopped.",
          type: 'success'
        });
      }
    });
  },
  'click .edit-ach'(e) {
    e.preventDefault();
    Router.go('UpdateDonation', {}, {query: {donation: this._id, customer: this.customer_id}});
  },
  'keyup, change .search': _.debounce(function() {
    updateSearchVal();
  }, 300),
  'submit form'( e ) {
    e.preventDefault();
  },
  'click .clear-button'() {
    $(".search").val("").change();
  },
  'click .show-account-number'(e) {
    console.log("show account number clicked");
    const bankInfo = BankAccounts.findOne({_id: this.source_id});
    $(e.currentTarget).html(bankInfo.account_number);
    $(e.currentTarget).removeClass('show-account-number');
  }
});

Template.ACH.onDestroyed(function() {
  Session.delete("searchValue");
  Session.delete("change_donation_id");
  Session.delete("change_customer_id");
  Session.delete('change_donateTo');
  Session.delete('change_note');
  Session.delete('change_amount');
  Session.delete('change_date');
  Session.delete("ach_page");
});
