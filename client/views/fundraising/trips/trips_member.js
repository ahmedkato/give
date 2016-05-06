Template.TripsMember.onCreated(function () {
  this.autorun(()=> {
    this.subscribe("tripsMember");
    this.subscribe("userDTFunds");
  })
});

Template.TripsMember.helpers({
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
  }
});

Template.TripsMember.events({
  'click .see-trip'(e) {
    console.log("CLicked row" );
    let tripId = $(e.currentTarget).attr("data-id");
    Router.go('TripMember', {_id: tripId});
  },
  'click #give-to-trip'() {
    Router.go("/user/give/?donateTo=trips");
  }
});
