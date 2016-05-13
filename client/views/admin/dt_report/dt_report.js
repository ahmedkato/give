/*****************************************************************************/
/* DtReport: Event Handlers */
/*****************************************************************************/
Template.DtReport.events({
  'click #get-dt-data': function (e) {
    e.preventDefault();
    console.log("Got to click event");

    var getDataButton  = $("#get-dt-data").button('loading');
    var fundsList = [
      63667, 63692, 63695, 64590, 67273, 67274, 67276, 67277, 67282, 64197
    ];
    Meteor.call("GetDTData", fundsList, moment().subtract($('#numberOfDays' ).val(), 'days').format('MMM+DD+YYYY'), moment().format('MMM+DD+YYYY'), function ( error, result ) {
      if(!error) {
        getDataButton.button("reset");

        console.dir(result);
        Bert.alert("Got the DT split Data successfully.", "success");
      } else {
        getDataButton.button("reset");
        console.dir(error);
        Bert.alert("That didn't work...", "danger");
      }
    });

  },
  'click #show-dt-split': function () {
    var showDataButton   = $("#show-dt-split").button('loading');
    // use these to total the groups a-c for sub-results base on 1 month.

    Meteor.call("ShowDTSplits", function ( error, result ) {
      if(!error) {
        showDataButton.button("reset");

        console.dir(result);

        Bert.alert("Got the DT split Data successfully. Value is: " + result, "success");
      } else {
        showDataButton.button("reset");
        console.dir(error);
        Bert.alert("That didn't work...", "danger");
      }
    });
  }
});