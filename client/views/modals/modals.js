Template.Modals.onCreated(function () {
  this.autorun(()=> {
    this.subscribe("trips");
    this.subscribe("fundraisersPublic");
  });
});

Template.Modals.events({
  'click #write_in_save': function() {
    // TODO: update this to use the new memo on the split functionality
    // TODO: need to change the give function, it now needs to get the memo from the DonationFormItems and not
    // the form itself
    // TODO: then find the area on the method on the server where this same change needs to be made (if at all)

    // If there is a memo added and they change the designation, we need to remove that split memo before starting the change

    if ($('#writeIn').val() === "") {
      return;
    }

    if(Session.get("workingWithSplitID")){
      DonationFormItems.update({_id: Session.get("workingWithSplitID")}, {
        $set: {
          memo:     $('#writeIn').val()
        }
      } );
    } else {
      DonationFormItems.update({name: "first"}, {
        $set: {
          memo:     $('#writeIn').val()
        }
      } );
      Session.set("params.donateTo", $("#tripSelect").val());
    }
    $('#writeIn').val("");
    Session.set('showWriteIn', 'no');
    $('#modal_for_write_in').modal('hide');

  },
  'click #tripsSave'() {
    if ($('#tripSelect').val() === "" || $('#participantSelect').val() === "") {
      return;
    }
    if(Session.get("workingWithSplitID")){
      DonationFormItems.update({_id: Session.get("workingWithSplitID")}, {
        $set: {
          donateTo: $("#tripSelect").val(),
          memo:     $('#participantSelect').val()
        }
      } );
    } else {
      DonationFormItems.update({name: "first"}, {
        $set: {
          donateTo: $("#tripSelect").val(),
          memo:     $('#participantSelect').val()
        }
      } );
      Session.set("params.donateTo", $("#tripSelect").val());
    }

    $("#tripSelect").chosen().val("");
    $('#participantSelect').chosen().val("");

    $("#tripSelect").trigger("chosen:updated");
    $("#participantSelect").chosen("destroy");
    $("#participantSelect").hide();

    $('#modal_for_trips').modal('hide');
  },
  'change #tripSelect'(){
    let trip = Trips.findOne({fundId: $("#tripSelect").val()});
    if (trip && trip._id) {
      $("#participantSelect").show();
      Session.set("selectedTripId", trip._id);
      $('#participantSelect').chosen({width: "95%"});
      Meteor.setTimeout(function () {
        $("#participantSelect").trigger("chosen:updated");
      }, 1000);
    }
    return;
  }
});

Template.Modals.helpers({
  participants(){
    let trip_id = Session.get("selectedTripId");
    if (trip_id) {
      let fundraisers = Fundraisers.find({'trips.id': trip_id});
      if (fundraisers) {
        return fundraisers;
      }
    }
    return;
  },
  trips(){
    return Trips.find();
  },
  name(){
    let fundId = this.fundId;
    if (fundId) {
      return DT_funds.findOne( { _id: fundId } ) && DT_funds.findOne( { _id: fundId } ).name;
    }
    return;
  }
});

Template.Modals.onRendered( function() {
  Meteor.setTimeout(function(){
    $('#tripSelect').chosen({width: "95%"});
    $("#participantSelect").hide();
    $('#options').chosen({width: "95%"});
  }, 250);
});

Template.Modals.onDestroyed( function() {
  Session.delete( "workingWithSplitID" );
});
