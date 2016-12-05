/*****************************************************************************/
/* StripeTransferDetails: Event Handlers */
/*****************************************************************************/
Template.StripeTransferDetails.events({
  'click .previous': function () {
    console.log("clicked previous with: " + this.id);
    let loadButton = $("#previous-button").button("loading");
    Meteor.call("get_next_or_previous_transfer", this.id, 'starting_after', function (err, result) {
      if(err) {
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
  'click .next': function () {
    console.log("clicked next with: " + this.id);
    let loadButton = $("#next-button").button("loading");
    Meteor.call("get_next_or_previous_transfer", this.id, 'ending_before', function (err, result) {
      if(err) {
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
  'click .posted': function(e){
    let checkbox_state;

    if($(e.currentTarget).hasClass('disabled')){
      return;
    }
    $(e.currentTarget).addClass('disabled');

    let transfer_id = this.id;
    let status = $(e.currentTarget).children('em').html();
    if(status === 'posted') {
      checkbox_state = 'false';
    } else {
      checkbox_state = 'true';
    }


    Meteor.call("toggle_post_transfer_metadata_state", transfer_id,
      checkbox_state, function(err){
        if (err){
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
  'click .not-posted': function(e){
    let checkbox_state;

    if($(e.currentTarget).hasClass('disabled')){
      return;
    }
    $(e.currentTarget).addClass('disabled');

    let transfer_id = this.id;
    let status = $(e.currentTarget).children('em').html();
    if(status === 'posted') {
      checkbox_state = 'false';
    } else {
      checkbox_state = 'true';
    }


    Meteor.call("toggle_post_transfer_metadata_state", transfer_id,
      checkbox_state, function(err){
        if (err){
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

/*****************************************************************************/
/* StripeReports: Helpers */
/*****************************************************************************/
Template.StripeTransferDetails.helpers({
  transfer: function () {
    return Transfers.findOne();
  },
  transactions: function () {
    return Transactions.find();
  },
  customers: function () {
    let charge;

    if(this.source.slice(0,3) === 'pyr' || this.source.slice(0,3) === 're_'){
      charge = Refunds.findOne({_id: this.source});
      if(charge && charge.charge && charge.charge.customer){
        return Customers.findOne({_id: charge.charge.customer});
      } else {
        return;
      }
    } else {
      charge = Charges.findOne({_id: this.source});
      if(charge && charge.customer){
        return Customers.findOne({_id: charge.customer});
      } else {
        return;
      }
    }


  },
  charges: function () {
    return Charges.findOne({_id: this.source});
  },
  refunds: function () {
    return Refunds.findOne({_id: this.source});
  },
  name: function () {
    if(this.metadata && this.metadata.business_name){
      return this.metadata.business_name;
    } else if(this.metadata && this.metadata.fname && this.metadata.lname){
      return this.metadata.fname + " " + this.metadata.lname;
    } else if(this.customer){
      let customer = Customers.findOne({_id: this.customer});
      return customer.metadata.fname + " " + customer.metadata.lname;
    }
  },
  ach_or_card: function () {
    if(this.object && this.object === 'refund'){
      if(this.charge &&
        this.charge.source &&
        this.charge.source.object === 'bank_account'){
        return "ACH";
      } else if(this.charge &&
        this.charge.payment_source &&
        this.charge.payment_source.object === 'bank_account') {
        return "ACH";
      } else {
        return "Card"
      }
    } else if(this.source && this.source.object === 'bank_account'){
      return "ACH";
    } else if(this.payment_source && this.payment_source.object === 'bank_account') {
      return "ACH";
    } else {
      return "Card"
    }
  },
  fees_covered: function () {
    if(this.object && this.object === 'refund'){
      if(this.charge &&
        this.charge.metadata &&
        this.charge.metadata.coveredTheFees &&
        this.charge.metadata.coveredTheFees === 'true') {
        return 'checked';
      } else {
        return;
      }
    } else if(this.object && this.object === 'charge'){
      if(this.metadata &&
        this.metadata.coveredTheFees &&
        this.metadata.coveredTheFees === 'true'){
        return 'checked';
      } else {
        return;
      }
    }
  },
  total_fees: function () {
    let transactions = Transactions.find().fetch();
    let total = 0;
    transactions.forEach(function (each_transactions){
      total += each_transactions.fee;
    });
    return total;
  },
  dt_source: function () {
    if(this.metadata && this.metadata.dt_source) {
      return DT_sources.findOne( { _id: this.metadata.dt_source } ).name;
    } else if(this.charge && this.charge.metadata && this.charge.metadata.dt_source) {
      return DT_sources.findOne( { _id: this.charge.metadata.dt_source } ).name;
    } else {
      return;
    }
  },
  retrieve_dt_names: function () {
    if (this.object === 'charge') {
      let dt_donation = DT_donations.findOne({'transaction_id': this._id});
      if (dt_donation && dt_donation.persona_id) {
        if (!Session.get(dt_donation.persona_id)) {

          Meteor.call( "get_dt_name", dt_donation.persona_id,
            this.metadata && this.metadata.dt_donation_id ? this.metadata.dt_donation_id : '',
            function ( err, result ) {
            if( err ) {
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
          function ( err, result ) {
            if( err ) {
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
      let dt_donation = DT_donations.findOne({'transaction_id': this.charge.id});

      if(dt_donation && dt_donation.persona_id){
        if(!Session.get(dt_donation.persona_id)) {
          Meteor.call( "get_dt_name",
            dt_donation.persona_id, this.charge &&
            this.charge.metadata && this.charge.metadata.dt_donation_id ?
              this.charge.metadata.dt_donation_id :
              '',
            function ( err, result ) {
            if( err ) {
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
  dt_names: function () {
    if(this.type === 'charge' || this.type === 'payment') {
      let dt_donation = DT_donations.findOne( { 'transaction_id': this._id } );
      if( dt_donation && dt_donation.persona_id ) {
        let persona_name = Session.get( dt_donation.persona_id );
        if( persona_name ) {
          return persona_name;
        } else {
          return;
        }
      } else {
        return;
      }
    } else {
      let dt_donation = DT_donations.findOne( { 'transaction_id': this._id } );
      if( dt_donation && dt_donation.persona_id ) {
        let persona_name = Session.get( dt_donation.persona_id );
        if( persona_name ) {
          return persona_name;
        } else {
          return;
        }
      } else {
        return;
      }
    }

  },
  transfer_date: function () {
    let timestamp = this.date;
    return moment.utc(timestamp, 'X').format("MMMM Do, YYYY");
  },
  posted: function () {
    if(this.metadata && this.metadata.posted && this.metadata.posted === "true") {
      return 'posted'
    } else {
      return 'not-posted'
    }
  },
  refunded: function () {
    if(this.refunded) {
      return 'refunded'
    } else if (this.description === "REFUND FOR FAILED PAYMENT"){
      return 'failed';
    } else if(this.status === 'failed'){
      return 'failed';
    } else {
      return;
    }
  },
  refund_type: function () {
    if(this.type === "payment_failure_refund") {
      return 'refunded'
    } else if(this.description && this.description === "Payment failure refund"){
      return 'failed';
    } else if(this.type === "refund") {
      return 'refunded';
    }
  },
  failed: function () {
    if(this.status === 'failed') {
      return 'failed'
    } else {
      return;
    }
  },
  getFundName(fundId){
    if (isNaN(fundId)) {
      return fundId;
    }
    let dTFund = DT_funds.findOne({_id: fundId.toString()});
    if (dTFund && dTFund.name) {
      return dTFund.name;
    } else {
      return "Fund id: " + fundId;
    }
  }
});

Template.StripeTransferDetails.onCreated(function () {
  this.autorun(()=>{
    this.subscribe("fundNames");
  });
});
