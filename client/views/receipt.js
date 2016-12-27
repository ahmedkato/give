Template.Receipt.events({
  'click #printLink': function() {
    window.print();
  }
});

Template.Receipt.helpers({
  customer_data() {
    return Customers.findOne() && Customers.findOne().metadata;
  },
  charges() {
    return Charges.findOne();
  },
  frequency() {
    if (Charges.findOne() && Charges.findOne().metadata && !Charges.findOne().metadata.frequency) {
      return 'Retrieving...';
    } else if (Charges.findOne() && Charges.findOne().metadata && Charges.findOne().metadata.frequency !== 'one_time') {
      return Charges.findOne().metadata.frequency;
    } else if (Charges.findOne() && Charges.findOne().metadata && Charges.findOne().metadata.frequency === 'one_time') {
      return 'One-time';
    }
  },
  date() {
    return moment(this.created * 1000).format('MM/DD/YYYY');
  },
  business_name() {
    if (this.business_name) {
      return this.business_name + "<br>";
    }
  },
  address_line2() {
    if (this.address_line2) {
      return "<br>" + this.address_line2;
    }
    return false;
  },
  country_code() {
    if (this.country === 'US' || this.country === null) {
      return null;
    }
    return this.country;
  },
  email() {
    return this.email;
  },
  phone() {
    if (this.phone !== '') {
      return this.phone;
    }
    return false;
  },
  donateTo() {
    if (this.donateTo) {
      if (! isNaN(this.donateTo)) {
        if (DT_funds.findOne({_id: this.donateTo}) && DT_funds.findOne({_id: this.donateTo}).name) {
          return DT_funds.findOne({_id: this.donateTo}).name;
        }
        return "Other";
      }
      return this.donateTo;
    } else if (this.metadata && this.metadata.donateTo) {
      if (! isNaN(this.metadata.donateTo)) {
        if (DT_funds.findOne({_id: this.metadata.donateTo}) && DT_funds.findOne({_id: this.metadata.donateTo}).name) {
          return DT_funds.findOne({_id: this.metadata.donateTo}).name;
        }
        return "Other";
      }
      return this.metadata.donateTo;
    }
    return 'Other';
  },
  donateWith() {
    let source;
    if (this.source) {
      source = this.source;
      if (source.object.slice(0, 4) === 'card') {
        return source.brand + ", ending in " + source.last4;
      } else if (source.object.slice(0, 4) === 'bank') {
        return source.bank_name + ", ending in " + source.last4;
      }
    } else if (this.payment_source) {
      source = this.payment_source;
      return source.bank_name + ", ending in " + source.last4;
    }
    return null;
  },
  amount() {
    if (this.amount && this.metadata && this.metadata.fees) {
      return ((this.amount - this.metadata.fees) / 100).toFixed(2);
    } else if (this.amount) {
      return (this.amount / 100).toFixed(2);
    }
    return '';
  },
  total_amount() {
    if (this.amount) {
      return (this.amount / 100).toFixed(2);
    }
    return '';
  },
  DonationSplits() {
    const donationSplits = DonationSplits.findOne();
    return donationSplits && donationSplits.splits;
  }
});

Template.Receipt.onRendered(function() {
  $("html, body").animate({ scrollTop: 0 }, "slow");

  $('#invoice').scrollView();

  // Look for print url param and if it is set to yes, send the js command to show the print dialog
  if (Session.equals('print', 'yes')) {
    Meteor.setTimeout(function() {
      return window.print();
    }, 2000);
  }
  $("#donateWith").change();
});

Template.Receipt.onCreated(function() {
  this.autorun(()=>{
    this.subscribe("userDTFunds");
    this.subscribe("DonationSplits", Session.get("params.charge"));
  });
});

Template.Receipt.onDestroyed(function() {
  Session.delete("params.charge");
  Session.delete("params.campaign");
  Session.delete("params.dt_source");
  Session.delete("params.startdate");
  Session.delete("params.note");
  Session.delete("params.enteredCampaignValue");
  Session.delete("params.exp_month");
  Session.delete("params.exp_year");
  Session.delete("params.paymentMethod");
  Session.delete("paymentMethod");
  Session.delete("params.recurring");
  Session.delete("recurring");
  Session.delete("showWriteIn");
  Session.delete("print");
  Session.delete("coverTheFees");
});
