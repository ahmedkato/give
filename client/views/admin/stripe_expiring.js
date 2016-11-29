Template.StripeExpiring.helpers({
    customers: function () {
      let customers =  Customers.find();

      var returnThisValue = [];
      // TODO: fix this so that it maps the devices and only shows the one with the index that matches the default_source (might not be index 0)
      // See the fix_bank_subscription.js file

      customers.forEach(function(entry) {
        if( entry.sources.data[0].object === 'card' ) {
          var today = new Date();
          var future_date = new Date( new Date( today ).setMonth( today.getMonth() + 3 ) );
          let expires = moment( new Date( entry.sources.data[0].exp_month + '/01/' + entry.sources.data[0].exp_year ) );
          if( expires <= future_date ) {
            returnThisValue.push( entry );
          }
        }
      });
      return returnThisValue;
    }
});

Template.StripeExpiring.events({
  'click .expiring': function (e) {
    e.preventDefault();
    // TODO: right now this doesn't always work right since [0] might not be
    // the right subscription id
    // also, looks like in some cases the customer object isn't being updated with the new subscriptions that
    // fall under this same customer since the customer 'cus_7F10SyAOabRN38' only shows one subscription
    // https://dashboard.stripe.com/test/customers/cus_7F10SyAOabRN38
    console.log('/user/subscriptions/card/change?s=' +
    this.subscriptions.data[0].id + '&c=' +
    this._id);
  }
})

Template.StripeExpiring.onRendered(function () {
    /*$('.datatable').dataTable( {
        "columnDefs": [
            { className: "details-control", "targets": [ 0 ] }
        ],
        "bFilter": false
    });

    //order by the date field
    $('#mainTable').dataTable().api().order(2, 'asc').draw();*/
});
