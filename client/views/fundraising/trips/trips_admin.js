AutoForm.hooks({
  'trips-form': {
    onSuccess: function () {
      Bert.alert({
        message: "Good work",
        type: 'success',
        icon: 'fa-smile-o',
        style: 'growl-bottom-right'
      });
      $("html, body").animate({ scrollTop: 0 }, "slow");
      // Call the function to go get all of the splits and donations for trips
      Meteor.call("updateTripFunds");
    },
    onError: function(formType, error) {
      console.error(error);
      Bert.alert({
        message: "Looks like you might be missing some required fields.",
        type: 'danger',
        icon: 'fa-frown-o',
        style: 'growl-bottom-right'
      });
    },
    onSubmit: function () {
      return this.event.preventDefault();
    }
  },
  'trips-update-form': {
    onSuccess: function () {
      Bert.alert({
        message: "Good work",
        type: 'success',
        icon: 'fa-smile-o'
      });
      Session.set('showUpdateTrip', false);
      Session.set('tripDoc', '');
      $('html, body').animate({ scrollTop: 0 }, 'slow');
    },
    onError: function(formType, error) {
      console.error(error);
      Bert.alert({
        message: "Looks like you might be missing some required fields.",
        type: 'danger',
        icon: 'fa-frown-o',
      });
    }
  }
});

Template.TripsAdmin.onCreated(function () {
  Session.set('showUpdateTrip', false);
  Session.set('tripDoc', '');
  this.autorun(()=> {
    this.subscribe("userDTFunds");
    this.subscribe("travelDTSplits");
    this.subscribe("trips");
    this.subscribe("fundraisers");
  })
});

Template.TripsAdmin.onDestroyed(function () {
  Session.delete('tripDoc');
  Session.delete('showUpdateTrip');
});

Template.TripsAdmin.helpers({
  showUpdateTrip() {
    return Session.get('showUpdateTrip');
  },
  tripDoc() {
    return Session.get('tripDoc');
  },
  formType() {
    var formType = Template.instance().formType.get();
    return formType;
  },
  trips() {
    return Trips.find();
  },
  name() {
    let dtFund = DT_funds.findOne({_id: this.fundId});
    if (dtFund) {
      return dtFund.name;
    }
    return;
  },
  getParticipantNumber() {
    let number = Fundraisers.find({'trips.id': this._id}).count();
    return number;
  }
});

Template.TripsAdmin.events({
  'click .see-trip'(e) {
    console.log("CLicked row" );
    let tripId = $(e.currentTarget).attr("data-id");
    Router.go('TripAdmin', {_id: tripId});
  },
  'click #getFundsList'(){
    console.log("getFundsList button clicked");
    $("#getFundsList").button("loading");
    Meteor.call("get_dt_funds", ()=>{
      $("#getFundsList").button("reset");
      alert("Got the funds");
    });
  },
  'click .edit-trip'(e){
    console.log($(e.currentTarget).data("id"));
    Session.set('showUpdateTrip', true);
    Session.set('tripDoc', Trips.findOne({_id: $(e.currentTarget).data("id")}));
    Meteor.setTimeout(()=>{
      $("#trips-update-form").addClass("pulse-border");
    }, 100);
  },
  'click .archive-trip'(e){

    console.log("remove participant clicked");
    swal({
      title: "Are you sure you want to archive this trip?",
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
        let tripUpdate = Trips.update({_id: $(e.currentTarget).data("id")}, {$set: {active: false}});
        if (tripUpdate) {
          Meteor.setTimeout(()=>{
            swal({
              title: "Done",
              text: "Ok, I've removed archived that trip.",
              type: 'success'
            });
          }, 500);
        } else {
          console.error("Trip update from active to archive didn't work: ", tripUpdate);
          Meteor.setTimeout(()=>{
            swal("Error", "Something went wrong", "error");
          }, 500);
        }
      }
    });
  },

});
