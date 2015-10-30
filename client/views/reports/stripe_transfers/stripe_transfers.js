/*****************************************************************************/
/* StripeTransfers: Event Handlers */
/*****************************************************************************/
Template.StripeTransfers.events({
  'click .clickable_row': function(){
    Router.go('/transfers/' + this.id);
  },
  'change #startDate': function (e) {
    e.preventDefault();
    Session.set("transferRange", $("#startDate").val());
  }
});

/*****************************************************************************/
/* StripeTransfers: Helpers */
/*****************************************************************************/
Template.StripeTransfers.helpers({
  transfer: function () {
    return Transfers.find( {}, {
      sort: { date: -1 }
    } );
  },
  transfer_date: function () {
    let timestamp = this.date;
    return moment.utc(timestamp, 'X').format("MMMM Do, YYYY");
  }
});

/*****************************************************************************/
/* StripeTransfers: Lifecycle Hooks */
/*****************************************************************************/
Template.StripeTransfers.onCreated(function () {
});

Template.StripeTransfers.onRendered(function () {
  Session.setDefault("transferRange", '');

  Tracker.autorun(function () {
    Meteor.subscribe('transfersRange', Session.get("transferRange"));
  });

  $('.date-picker').datepicker( {
    changeMonth: true,
    changeYear: true,
    showButtonPanel: true,
    dateFormat: 'MM yy',
    onClose: function(dateText, inst) {
      var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
      var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
      $(this).datepicker('setDate', new Date(year, month, 1));
      $(this).change();
    },
    onSelect: function () {
      $(this).change();
    },
    beforeShow: function(input, inst) {
      $('#ui-datepicker-div').addClass("no-calendar");
    }
  });

  var dynamicStyle = $("<style> .ui-datepicker-calendar { display: none; } </style>")
    .attr("id", "dynamicDatepickerStyle");
  $("#monthDate1").datepicker({
    beforeShow: function ()
                {
                  $("body").append(dynamicStyle);
                },

    onClose: function ()
             {
               $("#dynamicDatepickerStyle").remove();
             }
  });

  $("#ui-datepicker-div").delegate(".ui-datepicker-close", 'click', function(){
    var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
    var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
    $("#monthDate1").datepicker('option', 'defaultDate', new Date(year, month, 1));
    $("#monthDate1").datepicker('setDate', new Date(year, month, 1));
  });
});

Template.StripeTransfers.onDestroyed(function () {
});
