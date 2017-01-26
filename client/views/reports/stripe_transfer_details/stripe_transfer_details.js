Template.StripeTransferDetails.events({
  'click .previous'() {
    const loadButton = $("#previous-button").button("loading");
    Meteor.call("get_next_or_previous_transfer", this.id, 'starting_after', function(err, result) {
      if (err) {
        console.error(err);
        Bert.alert({
          message: "Nothing older",
          type: 'warning',
          icon: 'fa-ban',
          style: 'growl-bottom-right'
        });
        loadButton.button("reset");
      } else {
        loadButton.button("reset");
        Router.go("/transfers/" + result);
      }
    });
  },
  'click .next'() {
    const loadButton = $("#next-button").button("loading");
    Meteor.call("get_next_or_previous_transfer", this.id, 'ending_before', function(err, result) {
      if (err) {
        console.error(err);
        Bert.alert({
          message: "Nothing newer",
          type: 'warning',
          icon: 'fa-ban',
          style: 'growl-bottom-right'
        });
        loadButton.button("reset");
      } else {
        loadButton.button("reset");
        Router.go("/transfers/" + result);
      }
    });
  },
  'click .posted'(e) {
    let checkbox_state;

    if ($(e.currentTarget).hasClass('disabled')) {
      return;
    }
    $(e.currentTarget).addClass('disabled');

    const transfer_id = this.id;
    const status = $(e.currentTarget).children('em').html();
    if (status === 'posted') {
      checkbox_state = 'false';
    } else {
      checkbox_state = 'true';
    }


    Meteor.call("toggle_post_transfer_metadata_state", transfer_id,
      checkbox_state, function(err) {
        if (err) {
          console.dir(err);
          $(e.currentTarget).removeClass('disabled');
          Bert.alert({
            message: err.message,
            type: 'danger',
            icon: 'fa-frown-o',
            style: 'growl-bottom-right'
          });
        } else {
          $(e.currentTarget).removeClass('disabled');
        }
      });
  },
  'click .not-posted'(e) {
    let checkbox_state;

    if ($(e.currentTarget).hasClass('disabled')) {
      return;
    }
    $(e.currentTarget).addClass('disabled');

    const transfer_id = this.id;
    const status = $(e.currentTarget).children('em').html();
    if (status === 'posted') {
      checkbox_state = 'false';
    } else {
      checkbox_state = 'true';
    }


    Meteor.call("toggle_post_transfer_metadata_state", transfer_id,
      checkbox_state, function(err) {
        if (err) {
          console.dir(err);
          $(e.currentTarget).removeClass('disabled');
          Bert.alert({
            message: err.message,
            type: 'danger',
            icon: 'fa-frown-o',
            style: 'growl-bottom-right'
          });
        } else {
          $(e.currentTarget).removeClass('disabled');
        }
      });
  }
});
Template.StripeTransferDetails.helpers({
  transfer() {
    return Transfers.findOne();
  },
  transactions() {
    return Transactions.find();
  },
  customers() {
    let charge;

    if (this.source.slice(0, 3) === 'pyr' || this.source.slice(0, 3) === 're_') {
      charge = Refunds.findOne({_id: this.source});
      if (charge && charge.charge && charge.charge.customer) {
        return Customers.findOne({_id: charge.charge.customer});
      }
      return;
    } else {
      charge = Charges.findOne({_id: this.source});
      if (charge && charge.customer) {
        return Customers.findOne({_id: charge.customer});
      }
      return;
    }
  },
  charges() {
    return Charges.findOne({_id: this.source});
  },
  refunds() {
    return Refunds.findOne({_id: this.source});
  },
  name() {
    if (this.metadata && this.metadata.business_name) {
      return this.metadata.business_name;
    } else if (this.metadata && this.metadata.fname && this.metadata.lname) {
      return this.metadata.fname + " " + this.metadata.lname;
    } else if (this.customer) {
      const customer = Customers.findOne({_id: this.customer});
      return customer.metadata.fname + " " + customer.metadata.lname;
    }
  },
  ach_or_card() {
    if (this.object && this.object === 'refund') {
      if (this.charge &&
        this.charge.source &&
        this.charge.source.object === 'bank_account') {
        return "ACH";
      } else if (this.charge &&
        this.charge.payment_source &&
        this.charge.payment_source.object === 'bank_account') {
        return "ACH";
      }
      return "Card";
    } else if (this.source && this.source.object === 'bank_account') {
      return "ACH";
    } else if (this.payment_source && this.payment_source.object === 'bank_account') {
      return "ACH";
    }
    return "Card";
  },
  fees_covered() {
    if (this.object && this.object === 'refund') {
      if (this.charge &&
        this.charge.metadata &&
        this.charge.metadata.coveredTheFees &&
        this.charge.metadata.coveredTheFees === 'true') {
        return 'checked';
      }
      return;
    } else if (this.object && this.object === 'charge') {
      if (this.metadata &&
        this.metadata.coveredTheFees &&
        this.metadata.coveredTheFees === 'true') {
        return 'checked';
      }
      return;
    }
  },
  total_fees() {
    const transactions = Transactions.find().fetch();
    let total = 0;
    transactions.forEach(function(each_transactions) {
      total += each_transactions.fee;
    });
    return total;
  },
  dt_source() {
    if (this.metadata && this.metadata.dt_source) {
      return DT_sources.findOne( { _id: this.metadata.dt_source } ) && DT_sources.findOne( { _id: this.metadata.dt_source } ).name;
    } else if (this.charge && this.charge.metadata && this.charge.metadata.dt_source) {
      return DT_sources.findOne( { _id: this.charge.metadata.dt_source } ) && DT_sources.findOne( { _id: this.metadata.dt_source } ).name;
    }
    return false;
  },
  retrieve_dt_names() {
    if (this.object === 'charge') {
      const dt_donation = DT_donations.findOne({'transaction_id': this._id});
      if (dt_donation && dt_donation.persona_id) {
        if (!Session.get(dt_donation.persona_id)) {
          Meteor.call( "get_dt_name", dt_donation.persona_id,
            (this.metadata && this.metadata.dt_donation_id ? this.metadata.dt_donation_id : ''),
            function( err, result ) {
              if ( err ) {
                console.error( err );
              // TODO: need to query DT for the latest version of this dt_donation record
              // it may be that the person was merged and their persona_id in this dt_donation
              // doesn't match any longer
              } else {
                Session.set( dt_donation.persona_id, result.recognition_name );
              }
            } );
        } else {
          return;
        }
      } else if (!Session.equals(this.metadata && this.metadata.dt_donation_id, true)) {
        Meteor.call( "get_dt_donation",
          this.metadata &&
          this.metadata.dt_donation_id ?
            this.metadata.dt_donation_id :
            '',
          function( err, result ) {
            if ( err ) {
              console.error( err );
              // TODO: need to query DT for the latest version of this dt_donation record
              // it may be that the person was merged and their persona_id in this dt_donation
              // doesn't match any longer
            } else {
              Session.set( result, true );
            }
          }
        );
      }
    } else {
      const dt_donation = DT_donations.findOne({'transaction_id': this.charge.id});
      if (dt_donation && dt_donation.persona_id) {
        if (!Session.get(dt_donation.persona_id)) {
          Meteor.call( "get_dt_name",
            dt_donation.persona_id, (this.charge &&
            this.charge.metadata && this.charge.metadata.dt_donation_id ?
              this.charge.metadata.dt_donation_id :
              ''),
            function( err, result ) {
              if ( err ) {
                console.error( err );
              // TODO: need to query DT for the latest version of this dt_donation record
              // it may be that the person was merged and their persona_id in this dt_donation
              // doesn't match any longer
              } else {
                Session.set( dt_donation.persona_id, result.recognition_name );
              }
            } );
        } else {
          return;
        }
      }
    }
  },
  dt_names() {
    const donationId = this.object === 'charge' ? this._id : (this.charge && this.charge.id ? this.charge.id : null);
    if (!donationId) return;
    const dt_donations = DT_donations.find( { 'transaction_id': donationId } );
    const dt_donation = DT_donations.findOne( { 'transaction_id': donationId } );
    if (dt_donations.count() > 1) {
      alert("There are more than one records for the same transaction found in the local database. " +
        "Please ask the admin to resolve this for the DT Person with persona id of: " + dt_donation.persona_id);
    }
    if ( dt_donation && dt_donation.persona_id ) {
      const persona_name = Session.get(dt_donation.persona_id);
      if (persona_name) {
        return persona_name;
      }
      return;
    }
    return;
  },
  transfer_date() {
    const timestamp = this.date;
    return moment.utc(timestamp, 'X').format("MMMM Do, YYYY");
  },
  posted() {
    if (this.metadata && this.metadata.posted && this.metadata.posted === "true") {
      return 'posted';
    }
    return 'not-posted';
  },
  refunded() {
    if (this.refunded) {
      return 'refunded';
    } else if (this.description === "REFUND FOR FAILED PAYMENT") {
      return 'failed';
    } else if (this.status === 'failed') {
      return 'failed';
    }
    return null;
  },
  refund_type() {
    if (this.type === "payment_failure_refund") {
      return 'refunded';
    } else if (this.description && (this.description === "Payment failure refund")) {
      return 'failed';
    } else if (this.type === "refund") {
      return 'refunded';
    }
    return 'refunded';
  },
  failed() {
    if (this.status === 'failed') {
      return 'failed';
    }
    return;
  },
  getFundName(fundId) {
    if (isNaN(fundId)) {
      return fundId;
    }
    const dTFund = DT_funds.findOne({_id: fundId.toString()});
    if (dTFund && dTFund.name) {
      return dTFund.name;
    }
    return "Fund id: " + fundId;
  },
  dt_donation() {
    if (this.object === 'charge') {
      return DT_donations.findOne( { 'transaction_id': this._id } );
    } else if (this.object === 'refund') {
      return DT_donations.findOne( { 'transaction_id': this.charge.id } );
    }
  }
});

Template.StripeTransferDetails.onCreated(function() {
  this.autorun(()=>{
    this.subscribe("fundNames");
    this.subscribe('transfers', Session.get("transferId"));
    this.subscribe('transactions', Session.get("transferId"));
    this.subscribe('DTSources');
  });
});
