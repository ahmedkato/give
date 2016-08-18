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

function getAdjustmentAmount(id, trip, fundraiser) {
  let trip_id = trip._id;
  let deadline_id = id;
  if (!trip || !fundraiser) return;

  let deadlineElementPosition = trip.deadlines
    .map(function(item) {return item.id; }).indexOf(deadline_id);

  let tripElementPosition = fundraiser.trips
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

function getDeadlineInfo(){
  let today = moment();
  let tripId = Router.current().params._id;
  if (Trips.findOne()) {
    let allDeadlines = Trips.findOne( { _id: tripId } )
      .deadlines;
    let lastDeadlineDate = allDeadlines
      .map( ( deadline ) => {
        return true;
      } );
    let deadlinesCount = allDeadlines
      .length;
    let pastDeadlines = allDeadlines
      .filter( ( deadline ) => {
        if( today.diff( deadline.dueDate ) > 0 ) return true;
      } );

    return { allDeadlines, lastDeadlineDate, pastDeadlines, deadlinesCount };
  }
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
    // TODO: Fix this for those who have a trip cost lower then the deadline total cost
    // Thinking of Kyle N.
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
    let adjustment = getAdjustmentAmount(this.id, Template.parentData(1), Template.parentData(2));
    return Number(deadlineAmount) + Number(adjustment);
  },
  deadlineDue() {
    let tripId = Router.current().params._id;
    let deadlineId = this.id;
    let trip = Trips.findOne({_id: tripId});
    let tripDeadline = _.findWhere(trip.deadlines, {id: deadlineId});
    return tripDeadline && tripDeadline.dueDate;
  },
  deadlineData() {
    let deadlineInfo = getDeadlineInfo();
    let trip = Trips.findOne();
    let name = this.fname + " " + this.lname;
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
      let firstDeadline = deadlineInfo.allDeadlines[0];
      totalLeftToRaise = add(getAdjustmentAmount(firstDeadline.id, trip, this), firstDeadline.amount);
      deadlineDate = firstDeadline.dueDate;
    } else {
      let deadlineDifference = (deadlineInfo.deadlinesCount - deadlineInfo.pastDeadlines.length);
      let allDeadlinesShouldBeUsed = (deadlineDifference <= 1);
      let includeDeadlinesUpToIndex = allDeadlinesShouldBeUsed ? deadlineInfo.deadlinesCount : deadlineDifference + 1;

      let relevantDeadlines = deadlineInfo
        .allDeadlines
        .filter((deadline, index)=>{
          if(index <= includeDeadlinesUpToIndex){
            return deadline;
          }
          return 0;
        });

      let relevantDeadlinesTotalAmount = relevantDeadlines
        .map((deadline)=>{
          return add(getAdjustmentAmount(deadline.id, trip, this), deadline.amount)
        })
        .reduce(add, 0);

      deadlineDate = relevantDeadlines
        .map((deadline)=> {
          return deadline.dueDate;
        })
        .reduce(returnGreater, 0);

      totalLeftToRaise = relevantDeadlinesTotalAmount - getAmountRaised(name);
    }

    let allDeadlinesTotalAmount = deadlineInfo
      .allDeadlines
      .map((deadline)=>{
        return add(getAdjustmentAmount(deadline.id, trip, this), deadline.amount)
      })
      .reduce(add, 0);

    let lastDueDate = deadlineInfo
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