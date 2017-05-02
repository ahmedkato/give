import { setDocHeight, updateSearchVal } from '/imports/api/miscFunctions.js';

Template.StripeTransfers.onCreated(function() {
  Session.set("documentLimit", 25);

  // Setup the range for this month if no previous session is set for "transferRange"
  if (!Session.get("transferRange")) {
    Session.setDefault("transferRange", {start: moment().startOf('month').format("YYYY-MM-DD"), end: moment().endOf("month").format("YYYY-MM-DD")});
  }

  // Use self.subscribe with the data context reactively
  this.autorun(()=> {
    this.subscribe("transfersRange",
      Session.get("searchValue"),
      Session.get("documentLimit"),
      Session.get("posted"),
      Session.get("transferRange"));
  });
});

Template.StripeTransfers.onDestroyed(function() {
  Session.delete("searchValue");
  Session.delete("documentLimit");
  $(window).unbind('scroll');
});

Template.StripeTransfers.events({
  'change #filter-posted'(e) {
    console.log("Changes");
    const checked = $(e.currentTarget).is(':checked');
    if (checked) {
      Session.set("posted", "true");
    } else {
      Session.set("posted", "false");
    }
  },
  'keyup, change .search': _.debounce(function() {
    updateSearchVal();
  }, 300),
  'click .clear-button'() {
    $(".search").val("").change();
    Session.set("searchValue", "");
    Session.set("documentLimit", 25);
    Session.set("posted", "_false");
  },
  'click .clickable_row': function() {
    Router.go('/transfers/' + this.id);
  },
  'click .posted': function(e, tmpl) {
    const checkbox = $(e.currentTarget);
    const savePosted = $(e.currentTarget).button('loading');
    const transfer_id = this.id;
    let checkbox_state = $(e.currentTarget).is(':checked');
    console.log(checkbox_state);
    console.log($(e.currentTarget));
    if (checkbox_state === false) {
      checkbox_state = 'false';
    } else {
      checkbox_state = 'true';
    }

    Meteor.call("toggle_post_transfer_metadata_state", transfer_id,
      checkbox_state, function(err, res) {
        if (err) {
          console.dir(err);
          savePosted.button("reset");
          Bert.alert(err.message, "danger");
        } else {
          savePosted.button("reset");
        }
      });
  }
});

Template.StripeTransfers.helpers({
  transfer: function() {
    return Transfers.find() && Transfers.find( {}, {
      sort: { date: -1 }
    } );
  },
  transfer_date: function() {
    const timestamp = this.date;
    return moment.utc(timestamp, 'X').format("MMMM Do, YYYY");
  },
  monthRange: function() {
    if (Session.get("transferRange")) {
      const transferRange = Session.get( "transferRange" );
      let transferStart = transferRange.start;
      let transferEnd = transferRange.end;

      transferStart = moment( transferStart ).format( "MM/DD/YYYY" );
      transferEnd = moment( transferEnd ).format( "MM/DD/YYYY" );

      const today = transferStart + " - " + transferEnd;
      return today;
    }
  },
  orangeText: function() {
    if (this.status && this.status === 'in_transit') {
      return 'orange-text';
    }
  },
  posted: function() {
    if (this.metadata && this.metadata.posted && this.metadata.posted === "true") {
      return 'checked';
    } else {
      return '';
    }
  },
  isChecked() {
    const checked = Session.equals( "posted", "true" );
    if ( checked === true ) {
      return 'checked';
    }
    return;
  }
});


Template.StripeTransfers.onRendered(function() {
  setDocHeight();
  const posted = Iron.Location.get().queryObject && Iron.Location.get().queryObject.posted;
  if (posted === "_true") {
    $("#filter-posted").prop( "checked", true );
  } else {
    $("#filter-posted").prop( "checked", false );
  }
  $( "[data-toggle='popover']" ).popover({html: true});

  $('input[name="daterange"]').daterangepicker({
    ranges: {
      'All Time': [moment().subtract(10, 'years').startOf('month'), moment().endOf('year')],
      'Today': [moment(), moment()],
      'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
      'Last 7 Days': [moment().subtract(6, 'days'), moment()],
      'Last 30 Days': [moment().subtract(29, 'days'), moment()],
      'This Month': [moment().startOf('month'), moment().endOf('month')],
      'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
    }
  });

  $('input[name="daterange"]').on('apply.daterangepicker', function(ev, picker) {
    Session.set( "transferRange", {start: picker.startDate.format('YYYY-MM-DD'), end: picker.endDate.format('YYYY-MM-DD')} );
  });
});
