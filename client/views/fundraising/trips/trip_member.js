function getAmountRaised(name) {
  let dtSplits = DT_splits.find( { 'memo': {
    $regex: name, $options: 'i'
  } } );
  let amount = dtSplits.fetch().reduce(function ( prevValue, item ) {
    return prevValue + item.amount_in_cents;
  }, 0);
  if (amount) {
    return amount/100;
  }
  return 0;
}

function getAdjustmentAmount(id) {
  let parent = Template.parentData(1);
  let parentParent = Template.parentData(2);
  let trip_id = parent._id;
  let deadline_id = id;

  let deadlineElementPosition = parent.deadlines
    .map(function(item) {return item.id; }).indexOf(deadline_id);

  let tripElementPosition = parentParent.trips
    .map(function(item) {return item.id; }).indexOf(trip_id);

  if (parentParent &&
    parentParent.trips && parentParent.trips[tripElementPosition] &&
    parentParent.trips[tripElementPosition].deadlines &&
    parentParent.trips[tripElementPosition].deadlines[deadlineElementPosition] &&
    parentParent.trips[tripElementPosition].deadlines[deadlineElementPosition].amount) {
    return Number(parentParent.trips[tripElementPosition].deadlines[deadlineElementPosition].amount);
  }
  return '0';
}

Template.TripMember.onRendered(function () {
  Meteor.setTimeout(()=> {
    $('[data-toggle="popover"]').popover({html: true});
  }, 1000);
});

Template.TripMember.onCreated(function () {
  let tripId = Router.current().params._id;
  this.autorun(()=> {
    this.subscribe("emailSubscriptions");
    this.subscribe("userDTFunds");
    this.subscribe("tripsMember");
    this.subscribe("travelDTSplits", tripId);
  });
});

Template.TripMember.helpers({
  trip() {
    return Trips.findOne();
  },
  subscribed() {
    let tripId = Router.current().params._id;
    let fundId = Trips.findOne({_id: tripId}) && Trips.findOne({_id: tripId}).fundId;

    if( Meteor.users.findOne( { _id: Meteor.userId(),
        'emailSubscriptions.id': fundId
      } ) ) {
      return 'subscribed';
    } else {
      return 'not-subscribed';
    }
  },
  frequencyChecked(val){
    let tripId = Router.current().params._id;
    let fundId = Trips.findOne({_id: tripId}) && Trips.findOne({_id: tripId}).fundId;

    if( Meteor.users.findOne( { _id: Meteor.userId(),
        'emailSubscriptions.id': fundId
      } ) ) {
      let user = Meteor.users.findOne( { _id: Meteor.userId(),
        'emailSubscriptions.id': fundId
      } );
      let subscriptionObject = _.findWhere( user.emailSubscriptions, { id: fundId } );
      if( subscriptionObject.frequency === val ) {
        return 'checked';
      }
    }
    return;
  },
  name() {
    let DTFund = DT_funds.findOne({_id: this.fundId});
    if (DTFund) {
      return DTFund.name;
    }
    return;
  },
  participant() {
    let participant = Fundraisers.findOne();
    if(participant) {
      return participant;
    }
    return;
  },
  amountRaised(){
    let raised = getAmountRaised(this.fname + " " + this.lname);
    return raised;
  },
  amountRaisedPercent(amountRaised){
    let deadlines = Trips.findOne() && Trips.findOne().deadlines;
    if (!deadlines){
      return;
    }

    let deadlinesTotal = deadlines.reduce( function(previousVal, deadline){
      return previousVal + deadline.amount;
    }, 0);

    if (deadlinesTotal && amountRaised) {
      return Math.ceil(100*(amountRaised/deadlinesTotal));
    }
    return 0;
  },
  deadlines() {
    if (this.deadlines && this.deadlines.length > 0 ) {
      return this.deadlines.sort(function(item, nextItem){return item.dueDate - nextItem.dueDate;});
    } else if (this.deadlines) {
      return this.deadlines;
    }
    return;
  },
  percentageOfDeadline() {
    let parent = Template.parentData(1);
    let parentParent = Template.parentData(2);

    // Sort the deadlines in case the user entered them out of order,
    let deadlinesSorted = parent.deadlines
      .sort(function(item, nextItem){return item.dueDate - nextItem.dueDate;});

    // Get the index position of this deadline
    let elementPosition = deadlinesSorted
      .map(function(item) {return item.id; }).indexOf(this.id);

    let totalOfDeadlinesToThisDeadline = deadlinesSorted
      .reduce(function ( total, deadline, index ) {
        if (elementPosition >= index) {
          return total += deadline.amount;
        } else {
          return total;
        }
      }, 0);

    let totalOfAdjustmentsToThisDeadline = deadlinesSorted
      .reduce(function ( total, deadline, index ) {
        if (elementPosition >= index) {
          return total += Number(getAdjustmentAmount(deadline.id, parent, parentParent));
        } else {
          return total;
        }
      }, 0);

    let raised = getAmountRaised(parentParent.fname + " " + parentParent.lname);

    let deadlineAmountAfterAdjustments = totalOfDeadlinesToThisDeadline + totalOfAdjustmentsToThisDeadline;

    if (raised > deadlineAmountAfterAdjustments) {
      return 100;
    } else {
      return ((100*(raised/deadlineAmountAfterAdjustments)).toFixed(2));
    }
  },
  donationForThisFundraiser() {
    let tripId = Router.current().params._id;
    let fundId = Trips.findOne({_id: tripId}) && Trips.findOne({_id: tripId}).fundId;
    if (fundId) {
      let name = this.fname + " " + this.lname;
      let dtSplits = DT_splits.find( {$and: [{ 'memo': {
        $regex: name, $options: 'i'
      } }, {fund_id: Number(fundId)}]} );
      if (dtSplits && dtSplits.count() > 0) {
        return dtSplits;
      }  
    }
    return;
  },
  donorName(){
    // inside split
    let donation = DT_donations.findOne({_id: this.donation_id});
    if (donation) {
      let dtPersona = DT_personas.findOne({_id: donation.persona_id});
      if (dtPersona) {
        return dtPersona.recognition_name;
      } else {
        Meteor.call("getDTPerson", donation.persona_id, function ( err, res ) {
          if(!err){
            return res.recognition_name;
          } else {
            console.error(err);
          }
        })
      }
    }
    return;
  },
  splitAmount(){
    return this.amount_in_cents ? (this.amount_in_cents/100) : "";
  },
  adjustedAmount() {
    let deadlineAmount = this.amount;
    let adjustment = getAdjustmentAmount(this.id);
    return Number(deadlineAmount) + Number(adjustment);
  },
  deadlineAdjustmentValue() {
    let adjustmentValue = getAdjustmentAmount(this.id);
    return adjustmentValue;
  },
  deadlineDue() {
    let tripId = Router.current().params._id;
    let deadlineId = this.id;
    let trip = Trips.findOne({_id: tripId});
    let tripDeadline = _.findWhere(trip.deadlines, {id: deadlineId});
    return tripDeadline && tripDeadline.dueDate;
  }
});

Template.TripMember.events({
  'click .subscribed-span'() {
    let tripId = Router.current().params._id;

    let fundraiserId = this._id;
    let fundId = Trips.findOne({_id: tripId}) && Trips.findOne({_id: tripId}).fundId;

    Meteor.call("toggleEmailSubscription", fundId, fundraiserId, ( error, response ) => {
      if( error ) {
        console.log("error: " + error );
        Bert.alert({
          message: error.reason,
          type: 'danger',
          icon: 'fa-frown-o'
        });
      } else {
        Bert.alert(response, 'success');
      }
    } );

  },
  'click [name="frequency"]'(e){
    let tripId = Router.current().params._id;

    let fundraiserId = this._id;
    let fundId = Trips.findOne({_id: tripId}) && Trips.findOne({_id: tripId}).fundId;

    let frequency = $(e.currentTarget).val();

    Meteor.call("updateReportFrequency", fundId, fundraiserId, frequency, ( error, response ) => {
      if( error ) {
        console.log("error: " + error );
        Bert.alert({
          message: error.reason,
          type: 'danger',
          icon: 'fa-frown-o'
        });
      } else {
        Bert.alert(response, 'success');
      }
    } );
  }
});