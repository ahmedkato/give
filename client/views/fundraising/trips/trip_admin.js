function getAmountRaised(name) {
  const dtSplits = DT_splits.find( { 'memo': {
    $regex: name, $options: 'i'
  } } );
  const amount = dtSplits.fetch().reduce(function( prevValue, item ) {
    return prevValue + item.amount_in_cents;
  }, 0);
  if (amount) {
    return amount / 100;
  }
  return 0;
}

function onFormError() {
  Bert.alert({
    message: "Looks like you might be missing some required fields.",
    type: 'danger',
    icon: 'fa-frown-o'
  });
}

function onFormSuccess() {
  Bert.alert({
    message: "Good work",
    type: 'success',
    icon: 'fa-smile-o'
  });
}

function getAdjustmentAmount(id, trip, fundraiser) {
  const trip_id = trip._id;
  const deadline_id = id;
  const tripDeadlines = trip.deadlines;
  const fundraiserTrips = fundraiser.trips;

  const deadlineElementPosition = tripDeadlines
    .map(function(item) {return item.id; }).indexOf(deadline_id);

  const tripElementPosition = fundraiserTrips
    .map(function(item) {return item.id; }).indexOf(trip_id);

  if (fundraiser && fundraiserTrips && fundraiserTrips[tripElementPosition] &&
    fundraiserTrips[tripElementPosition].deadlines &&
    fundraiserTrips[tripElementPosition].deadlines[deadlineElementPosition] &&
    fundraiserTrips[tripElementPosition].deadlines[deadlineElementPosition].amount) {
    return fundraiserTrips[tripElementPosition].deadlines[deadlineElementPosition].amount;
  }
  return '0';
}

AutoForm.hooks({
  'fundraisers-form': {
    onSuccess: function() {
      onFormSuccess();
    },
    onError: function(error) {
      console.error(error);
      onFormError();
    },
    onSubmit: function(insertDoc) {
      insertDoc.trips = [{id: Trips.findOne()._id}];
      Meteor.call("insertFundraisersWithTrip", insertDoc, function( err, res ) {
        if (err) {
          console.error(err);
          onFormError();
        } else {
          console.log(res);
          AutoForm.resetForm('fundraisers-form');
          $("[type='submit']").prop("disabled", false);
          $("[type='submit']").removeAttr("disabled");
          onFormSuccess();
        }
      });
      return false;
    }
  }
});

Template.TripAdmin.onCreated(function() {
  const tripId = Router.current().params._id;
  this.autorun(()=> {
    this.subscribe("userDTFunds");
    this.subscribe("fundraisers", tripId);
    this.subscribe("travelDTSplits", tripId);
  });
});

Template.TripAdmin.helpers({
  trip() {
    return Trips.findOne();
  },
  subscribed() {
    const tripId = Router.current().params._id;
    const fundId = Trips.findOne({_id: tripId}) && Trips.findOne({_id: tripId}).fundId;

    if ( Meteor.users.findOne( { _id: Meteor.userId(),
      emailSubscriptions: fundId
    } ) ) {
      return 'subscribed';
    } else {
      return 'not-subscribed';
    }
  },
  name() {
    const DTFund = DT_funds.findOne({_id: this.fundId});
    if (DTFund) {
      return DTFund.name;
    }
    return;
  },
  participant() {
    const participant = Fundraisers.find();
    if (participant) {
      return participant;
    }
    return;
  },
  participantName() {
    const name = this.fname + " " + this.lname;
    return name;
  },
  amountRaised() {
    const raised = getAmountRaised(this.fname + " " + this.lname);
    return raised;
  },
  amountRaisedPercent(amountRaised) {
    const deadlines = Trips.findOne().deadlines;

    const deadlinesTotal = deadlines.reduce( function(previousVal, deadline) {
      return previousVal + deadline.amount;
    }, 0);

    if (deadlinesTotal && amountRaised) {
      return Math.ceil(100 * (amountRaised / deadlinesTotal));
    }
    return 0;
  },
  deadlines() {
    if (this.deadlines && this.deadlines.length > 0 ) {
      return this.deadlines.sort(function(item, nextItem) {return item.dueDate - nextItem.dueDate;});
    }
    return;
  },
  percentageOfDeadline() {
    const parent = Template.parentData(1);
    const parentParent = Template.parentData(2);

    // Sort the deadlines in case the user entered them out of order,
    const deadlinesSorted = parent.deadlines
      .sort(function(item, nextItem) {return item.dueDate - nextItem.dueDate;});

    // Get the index position of this deadline
    const elementPosition = deadlinesSorted
      .map(function(item) {return item.id; }).indexOf(this.id);


    const totalOfDeadlinesToThisDeadline = deadlinesSorted
      .reduce(function( total, deadline, index ) {
        if (elementPosition >= index) {
          return total += deadline.amount;
        } else {
          return total;
        }
      }, 0);

    const totalOfAdjustmentsToThisDeadline = deadlinesSorted
      .reduce(function( total, deadline, index ) {
        if (elementPosition >= index) {
          return total += Number(getAdjustmentAmount(deadline.id, parent, parentParent));
        } else {
          return total;
        }
      }, 0);

    const raised = getAmountRaised(parentParent.fname + " " + parentParent.lname);

    const deadlineAmountAfterAdjustments = totalOfDeadlinesToThisDeadline + totalOfAdjustmentsToThisDeadline;

    if (raised > deadlineAmountAfterAdjustments) {
      return 100;
    } else {
      return ((100 * (raised / deadlineAmountAfterAdjustments).toFixed(2)));
    }
  },
  donationForThisFundraiser() {
    const name = this.fname + " " + this.lname;
    const dtSplits = DT_splits.find( { 'memo': {
      $regex: name, $options: 'i'
    } } );
    if (dtSplits && dtSplits.count() > 0) {
      return dtSplits;
    }
    return;
  },
  donorName() {
    // inside split
    const donation = DT_donations.findOne({_id: this.donation_id});
    if (donation) {
      const dtPersona = DT_personas.findOne({_id: donation.persona_id});
      if (dtPersona) {
        return dtPersona.recognition_name;
      } else {
        Meteor.call("getDTPerson", donation.persona_id, function( err, res ) {
          if (!err) {
            return res.recognition_name;
          } else {
            console.error(err);
          }
        });
      }
    }
    return;
  },
  splitAmount() {
    return this.amount_in_cents ? (this.amount_in_cents / 100) : "";
  },
  adjustedAmount() {
    const trip = Template.parentData(1);
    const fundraiser = Template.parentData(2);

    const deadlineAmount = this.amount;

    // console.log(deadlineAmount);
    console.log(this.id, trip, fundraiser);
    const adjustment = getAdjustmentAmount(this.id, trip, fundraiser);
    // console.log(adjustment);
    // console.log(Number(deadlineAmount) + Number(adjustment));
    return (Number(deadlineAmount) + Number(adjustment));
  },
  deadlineAdjustmentValue() {
    const parent = Template.parentData(1);
    const parentParent = Template.parentData(2);

    const adjustmentValue = getAdjustmentAmount(this.id, parent, parentParent);
    return Number(adjustmentValue);
  },
  deadlineDue() {
    const tripId = Router.current().params._id;
    const deadlineId = this.id;
    const trip = Trips.findOne({_id: tripId});
    const tripDeadline = _.findWhere(trip.deadlines, {id: deadlineId});
    return tripDeadline && tripDeadline.dueDate;
  }
});

Template.TripAdmin.events({
  'click .remove-participant'() {
    const self = this;
    console.log("remove participant clicked");
    swal({
      title: "Are you sure you want to remove this participant?",
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
        const tripId = Router.current().params._id;
        Meteor.call( 'removeTripParticipant', self._id, tripId, function( error, response ) {
          if ( error ) {
            console.log(error);
            swal("Error", "Something went wrong", "error");
          } else {
            console.log(response);
            swal({
              title: "Done",
              text: "Ok, I've removed that participant.",
              type: 'success'
            });
          }
        });
      }
    });
  },
  'submit .update-participant'(e) {
    console.log("Clicked update adjustments");
    e.preventDefault();
    const target = e.target;
    const participant_id = this._id;
    console.log(participant_id);
    const adjustments = $.map($("[name=" + participant_id + "] .trip-adjustments"),
      function(item, index) {
        console.log(index, item);
        return {
          id: $(item).attr('name'),
          amount: $(item).val()
        };
      });

    const formValues = {
      trip_id: Trips.findOne()._id,
      participant_id: participant_id,
      deadlines: adjustments,
      fname: target.fname.value,
      lname: target.lname.value,
      email: target.email.value
    };

    Meteor.call("updateTripParticipantAndAdjustments", formValues, ( err, res )=> {
      if (err) {
        console.error(err);
        onFormError();
      } else {
        console.log(res);
        onFormSuccess();
        $("#collapse-edit-" + participant_id).collapse('toggle');
      }
    });
  }
});
