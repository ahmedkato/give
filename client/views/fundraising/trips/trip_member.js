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

function getAdjustmentAmount(id, trip, fundraiser) {
  const trip_id = trip._id;
  const deadline_id = id;
  if (!trip || !fundraiser) return;

  const deadlineElementPosition = trip.deadlines
    .map(function(item) {return item.id; }).indexOf(deadline_id);

  const tripElementPosition = fundraiser.trips
    .map(function(item) {return item.id; }).indexOf(trip_id);

  if (fundraiser &&
    fundraiser.trips && fundraiser.trips[tripElementPosition] &&
    fundraiser.trips[tripElementPosition].deadlines &&
    fundraiser.trips[tripElementPosition].deadlines[deadlineElementPosition] &&
    fundraiser.trips[tripElementPosition].deadlines[deadlineElementPosition].amount) {
    return Number(fundraiser.trips[tripElementPosition].deadlines[deadlineElementPosition].amount);
  }
  return '0';
}

function getDeadlineInfo() {
  const today = moment();
  const tripId = Router.current().params._id;
  if (Trips.findOne()) {
    const allDeadlines = Trips.findOne( { _id: tripId } )
      .deadlines;
    const lastDeadlineDate = allDeadlines
      .map( ( deadline ) => {
        return true;
      } );
    const deadlinesCount = allDeadlines
      .length;
    const pastDeadlines = allDeadlines
      .filter( ( deadline ) => {
        if ( today.diff( deadline.dueDate ) > 0 ) return true;
      } );

    return { allDeadlines, lastDeadlineDate, pastDeadlines, deadlinesCount };
  }
}

Template.TripMember.onRendered(function() {
  Meteor.setTimeout(()=> {
    $('[data-toggle="popover"]').popover({html: true});
  }, 1000);
});

Template.TripMember.onCreated(function() {
  const tripId = Router.current().params._id;
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
    const tripId = Router.current().params._id;
    const fundId = Trips.findOne({_id: tripId}) && Trips.findOne({_id: tripId}).fundId;

    if ( Meteor.users.findOne( { _id: Meteor.userId(),
      'emailSubscriptions.id': fundId
    } ) ) {
      return 'subscribed';
    } else {
      return 'not-subscribed';
    }
  },
  frequencyChecked(val) {
    const tripId = Router.current().params._id;
    const fundId = Trips.findOne({_id: tripId}) && Trips.findOne({_id: tripId}).fundId;

    if ( Meteor.users.findOne( { _id: Meteor.userId(),
      'emailSubscriptions.id': fundId
    } ) ) {
      const user = Meteor.users.findOne( { _id: Meteor.userId(),
        'emailSubscriptions.id': fundId
      } );
      const subscriptionObject = _.findWhere( user.emailSubscriptions, { id: fundId } );
      if ( subscriptionObject.frequency === val ) {
        return 'checked';
      }
    }
    return;
  },
  name() {
    const DTFund = DT_funds.findOne({_id: this.fundId});
    if (DTFund) {
      return DTFund.name;
    }
    return;
  },
  participant() {
    const participant = Fundraisers.findOne();
    if (participant) {
      return participant;
    }
    return;
  },
  amountRaised() {
    const raised = getAmountRaised(this.fname + " " + this.lname);
    return raised;
  },
  amountRaisedPercent(amountRaised) {
    // TODO: Fix this for those who have a trip cost lower then the deadline total cost
    // Thinking of Kyle N.
    const deadlines = Trips.findOne() && Trips.findOne().deadlines;
    if (!deadlines) {
      return;
    }

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
    } else if (this.deadlines) {
      return this.deadlines;
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
      return ((100 * (raised / deadlineAmountAfterAdjustments)).toFixed(2));
    }
  },
  donationForThisFundraiser() {
    const tripId = Router.current().params._id;
    const fundId = Trips.findOne({_id: tripId}) && Trips.findOne({_id: tripId}).fundId;
    if (fundId) {
      const name = this.fname + " " + this.lname;
      const dtSplits = DT_splits.find( {$and: [{ 'memo': {
        $regex: name, $options: 'i'
      } }, {fund_id: Number(fundId)}]} );
      if (dtSplits && dtSplits.count() > 0) {
        return dtSplits;
      }
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
    const deadlineAmount = this.amount;
    const adjustment = getAdjustmentAmount(this.id, Template.parentData(1), Template.parentData(2));
    return Number(deadlineAmount) + Number(adjustment);
  },
  deadlineDue() {
    const tripId = Router.current().params._id;
    const deadlineId = this.id;
    const trip = Trips.findOne({_id: tripId});
    const tripDeadline = _.findWhere(trip.deadlines, {id: deadlineId});
    return tripDeadline && tripDeadline.dueDate;
  },
  deadlineData() {
    const deadlineInfo = getDeadlineInfo();
    const trip = Trips.findOne();
    const name = this.fname + " " + this.lname;
    let totalLeftToRaise, deadlineDate, totalDue;

    // Used to add values in array to get a total
    function add(a, b) {
      return Number(a) + Number(b);
    }

    // Return higher of the two moments or numbers
    function returnGreater(a, b) {
      return a > b ? a : b;
    }

    if (deadlineInfo.pastDeadlines === 0) {
      const firstDeadline = deadlineInfo.allDeadlines[0];
      totalLeftToRaise = add(getAdjustmentAmount(firstDeadline.id, trip, this), firstDeadline.amount);
      deadlineDate = firstDeadline.dueDate;
    } else {
      const deadlineDifference = (deadlineInfo.deadlinesCount - deadlineInfo.pastDeadlines.length);
      const allDeadlinesShouldBeUsed = (deadlineDifference <= 1);
      const includeDeadlinesUpToIndex = allDeadlinesShouldBeUsed ? deadlineInfo.deadlinesCount : deadlineDifference + 1;

      const relevantDeadlines = deadlineInfo
        .allDeadlines
        .filter((deadline, index)=>{
          if (index <= includeDeadlinesUpToIndex) {
            return deadline;
          }
          return 0;
        });

      const relevantDeadlinesTotalAmount = relevantDeadlines
        .map((deadline)=>{
          return add(getAdjustmentAmount(deadline.id, trip, this), deadline.amount);
        })
        .reduce(add, 0);

      deadlineDate = relevantDeadlines
        .map((deadline)=> {
          return deadline.dueDate;
        })
        .reduce(returnGreater, 0);

      totalLeftToRaise = relevantDeadlinesTotalAmount - getAmountRaised(name);
    }

    const allDeadlinesTotalAmount = deadlineInfo
      .allDeadlines
      .map((deadline)=>{
        return add(getAdjustmentAmount(deadline.id, trip, this), deadline.amount);
      })
      .reduce(add, 0);

    const lastDueDate = deadlineInfo
      .allDeadlines
      .map((deadline)=> {
        return deadline.dueDate;
      })
      .reduce(returnGreater, 0);

    return {
      amount: totalLeftToRaise.toFixed(2),
      date: deadlineDate,
      totalDue: (allDeadlinesTotalAmount - getAmountRaised(name)),
      lastDueDate: lastDueDate
    };
  }
});

Template.TripMember.events({
  'click .subscribed-span'() {
    const tripId = Router.current().params._id;

    const fundraiserId = this._id;
    const fundId = Trips.findOne({_id: tripId}) && Trips.findOne({_id: tripId}).fundId;

    Meteor.call("toggleEmailSubscription", fundId, fundraiserId, ( error, response ) => {
      if ( error ) {
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
  'click [name="frequency"]'(e) {
    const tripId = Router.current().params._id;

    const fundraiserId = this._id;
    const fundId = Trips.findOne({_id: tripId}) && Trips.findOne({_id: tripId}).fundId;

    const frequency = $(e.currentTarget).val();

    Meteor.call("updateReportFrequency", fundId, fundraiserId, frequency, ( error, response ) => {
      if ( error ) {
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
