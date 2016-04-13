Template.Receipt.events({
  'click #printLink': function() {
    window.print();
  }
});
Template.Receipt.helpers({
  customer_data: function() {
    return Customers.findOne().metadata;
  },
  charges: function() {
    return Charges.findOne();
  },
  frequency: function() {
    if (Charges.findOne() && Charges.findOne().metadata && !Charges.findOne().metadata.frequency) {
      return 'Retrieving...';
    } else if (Charges.findOne() && Charges.findOne().metadata && Charges.findOne().metadata.frequency !== 'one_time') {
      return Charges.findOne().metadata.frequency;
    } else if (Charges.findOne() && Charges.findOne().metadata && Charges.findOne().metadata.frequency === 'one_time') {
      return 'One-time';
    }
  },
  date: function() {
    return moment(this.created * 1000).format('MM/DD/YYYY');
  },
  business_name: function() {
    if (this.business_name) {
      return this.business_name + "<br>";
    }
  },
  address_line2: function() {
    if (this.address_line2) {
      return "<br>" + this.address_line2;
    }
    return false;
  },
  country_code: function() {
    if (this.country === 'US' || this.country === null) {
      return;
    }
    return this.country;
  },
  email: function() {
    return this.email;
  },
  phone: function() {
    if (this.phone !== '') {
      return this.phone;
    }
    return false;
  },
  donateTo: function() {
    if (this.metadata && this.metadata.donateTo) {
      if (! isNaN(this.metadata.donateTo)) {
        if(DT_funds.findOne({_id: this.metadata.donateTo}) && DT_funds.findOne({_id: this.metadata.donateTo}).name) {
          return DT_funds.findOne({_id: this.metadata.donateTo}).name;
        } else {
          return;
        }
      } else {
        return this.metadata.donateTo;
      }
    }
    return 'Other';
  },
  donateWith: function() {
    var source;
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
  },
  amount: function() {
    if (this.amount && this.metadata.fees) {
      return ((this.amount - this.metadata.fees) / 100).toFixed(2);
    } else if (this.amount) {
      return (this.amount / 100).toFixed(2);
    }
    return '';
  },
  total_amount: function() {
    if (this.amount) {
      return (this.amount / 100).toFixed(2);
    }
    return '';
  },
  fees: function() {
    if (this.metadata.fees) {
      return '<tr>\
          <th>Covered fees:</th>\
          <td></td>\
          <td>$' + (this.metadata.fees / 100).toFixed(2) + '</td>\
      </tr>\
      <tr>\
          <th>Total:</th>\
          <td></td>\
          <td>$' + (this.amount / 100).toFixed(2) + '</td>\
      </tr>';
    }
    return '';
  }
});

Template.Receipt.onRendered(function() {
  $("html, body").animate({ scrollTop: 0 }, "slow");

  $('#invoice').scrollView();

  // Look for print url param and if it is set to yes, send the js command to show the print dialog
  if (Session.equals('print', 'yes')) {
    return window.print();
  }
});

Template.Receipt.onCreated(function() {
  this.autorun(()=>{
    this.subscribe("userDTFunds");
  });
});
