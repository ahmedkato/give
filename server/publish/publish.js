/*****************************************************************************/
/* Publish Functions
/*****************************************************************************/

Meteor.publish('receipt_donations', function (input) {
	//Check the input that came from the client
	check(input, String);
	return Donations.find({_id: input}, {fields: {
		sessionId: 0,
		viewable: 0,
		created_at: 0,
		order: 0
	}});
});

Meteor.publish("userDonations", function () {
	if (this.userId) {
    var donations = Meteor.users.findOne({_id: this.userId}).donations;
    return Donations.find({'_id': { $in: donations}});
	} else {
    this.ready();
	}
});

Meteor.publish("subscription", function (subscription_id) {
  //Check the subscription_id that came from the client
  check(subscription_id, String);

	if (this.userId) {
    return Subscriptions.find({
      _id: subscription_id
    }, {
      fields: {
      transactions: 0,
      tax_percent: 0,
      discount: 0,
      application_fee_percent: 0
    }});
	} else {
    this.ready();
	}
});

Meteor.publish("devices", function() {
	if (this.userId) {
    var customers = Customers.find({'metadata.user_id': this.userId});
    var customer_ids = [];

    customers.forEach(function(element) {
      customer_ids.push(element.id);
    });

    console.log(customer_ids);
    return Devices.find({$and: [
      { 'customer': {
        $in: customer_ids}
      }, {
        'metadata.saved': 'true'
      }]
    }, { fields: {
      account_holder_name: 0,
      fingerprint: 0,
      routing_number: 0
    }});
	} else {
    this.ready();
  }
});

Meteor.publish("customer", function (customer) {
  //Check the subscription_id that came from the client
  check(customer, String);

	if ((this.userId && Customers.find({_id: customer}, {'metadata.user_id': this.userId})) || (Roles.userIsInRole(this.userId, ['super-admin', 'admin'])) ){
    return Customers.find({
      _id: customer
    }, {
      fields: {
        account_balance: 0,
        currency: 0,
        delinquent: 0,
        discount: 0,
        livemode: 0,
        shipping: 0,
        subscriptions: 0
      }
    });
	} else {
    this.ready();
	}
});

Meteor.publish("userStripeData", function(id) {
  logger.info("Started userStripeData");
  check(id, Match.Optional(String));

  var userID;

  if (this.userId) {
    if(id){
      userID = id;
    } else {
      userID = this.userId;
    }
  } else {
    this.ready();
  }

  var customers = Customers.find({'metadata.user_id': userID});
  if(!Customers.findOne({'metadata.user_id': userID})){
    this.ready();
  }
  var customers_ids = [];

  customers.forEach(function(element) {
      customers_ids.push(element.id);
  });
  var charges = Charges.find({'customer': {$in: customers_ids}});
  var donations = Donations.find({'customer_id': {$in: customers_ids}});
  var user = Meteor.users.find({_id: userID}, {fields: {services: 0}});
  return[customers, charges, user, donations];
});

Meteor.publish("userStripeDataWithSubscriptions", function () {
  if (this.userId) {
      var customers = Customers.find({'metadata.user_id': this.userId});
      var customer_ids = [];

      customers.forEach(function(element) {
          customer_ids.push(element.id);
      });
      var charges = Charges.find({'customer': {$in: customer_ids}});
      var subscriptions = Subscriptions.find({$and: [{'customer': {$in: customer_ids}}, {'metadata.replaced': {$ne: true}}]});
      var user = Meteor.users.find({_id: this.userId});
      var devices = Devices.find({
        $and: [{
          'customer': {
            $in: customer_ids
          }
        }, {
          'metadata.saved': 'true'
        }]
      }, {
        fields: {
          fingerprint: 0,
          routing_number: 0,
          account_holder_type: 0,
          currency: 0
        }
      });
      return[customers, charges, subscriptions, user, devices];
  } else {
    this.ready();
	}
});

Meteor.publish("userSubscriptions", function () {
  logger.info("Started userSubscriptions subscription");

  if (this.userId) {
    var customers = Customers.find({'metadata.user_id': this.userId});
    var subscriptions = [];
    customers.forEach(function(element) {
        console.log(element.id);
        subscriptions.push(Subscriptions.find({customer: element.id}));
    });
    return subscriptions;
  } else {
    this.ready();
	}
});

Meteor.publish("userDT", function (id) {
  logger.info("Started userDT subscription");
  check(id, Match.Optional(String));

  var userID;

  if (this.userId) {
    if (id) {
      if (Roles.userIsInRole(this.userId, ['super-admin', 'admin'])) {
        userID = id;
      } else {
        logger.warn('This user: ' + this.userId + ' attempted to use an id to ' +
          'view Donor Tools data inside the userDT publication');
        this.ready();
      }
    } else {
      userID = this.userId;
    }
	} else {
    this.ready();
  }

  if (Meteor.users.findOne({_id: userID}) && Meteor.users.findOne({_id: userID}).persona_ids) {
    var persona_ids = Meteor.users.findOne({_id: userID}).persona_ids;
    console.log(persona_ids);
    return DT_donations.find({persona_id: {$in: persona_ids}});
  } else if(Meteor.users.findOne({_id: userID}) && Meteor.users.findOne({_id: userID}).persona_id) {
    var persona_id = Meteor.users.findOne( { _id: userID } ).persona_id;
    console.log( persona_id );
    return DT_donations.find( { persona_id: { $in: persona_id } } );
  } else if(Meteor.users.findOne({_id: userID}) && Meteor.users.findOne({_id: userID}).persona_info){
    var persona_ids = [];
    var persona_info = Meteor.users.findOne({_id: userID}).persona_info;
    persona_info.forEach(function (value) {
      persona_ids.push(value.id);
    });
    console.log(persona_ids);
    return DT_donations.find( { persona_id: { $in: persona_ids } } );
  } else {
    this.ready();
  }
});

Meteor.publish("userDTFunds", function () {
  logger.info("Started userDTFunds subscription");

  return DT_funds.find({}, {
      fields: {
        id: 1,
        name: 1,
        alias: 1,
        archived: 1,
        description: 1,
        tax_deductible: 1
      }
  });
});

Meteor.publish("DTSources", function () {
    return DT_sources.find();
});

Meteor.publish("DTSplits", function () {
  if (Roles.userIsInRole(this.userId, 'admin')) {
    return DT_splits.find();
  } else {
    this.ready();
  }
});

Meteor.publish("transfers", function (id) {
  check(id, Match.Optional(String));
  if (Roles.userIsInRole(this.userId, ['admin', 'manager'])) {
    if(id){
      return Transfers.find({_id: id});
    } else {
      return Transfers.find({}, { sort: { date: -1} } );
    }
  } else {
    this.ready();
  }
});

Meteor.publish("transfersRange", function (search, limit, posted, range) {
  check(search, Match.Maybe(String));
  check(limit, Match.Maybe(Number));
  check(posted, Match.OneOf(null, "true", "false"));
  check(range, {
    start:   Match.Optional( String ),
    end:   Match.Optional( String )
  });

  if (Roles.userIsInRole(this.userId, ['super-admin', 'admin', 'manager'])) {

    logger.info( "search: ", search,
      "limit: ", limit,
      "posted: ", posted,
      "range: ", range );
    let searchValue;
    if( search && !isNaN( search ) ) {
      searchValue = { 'amount': search * 100 }
    } else {
      console.log( "ID: ", search );
      let thisSearch = search ? search : '';
      searchValue = { 'id': { $regex: thisSearch } };
    }
    const limitValue = limit ? limit : 0;
    const options = {
      sort:   { date: -1 },
      limit:  limitValue,
      fields: {
        amount:          1,
        amount_reversed: 1,
        created:         1,
        date:            1,
        id:              1,
        metadata:        1,
        status:          1
      }
    };

    if( posted === "true" ) {
      console.log( posted );
      postedValue = { 'metadata.posted': posted }
    } else {
      postedValue = {
        $or: [{ 'metadata.posted': posted }, { 'metadata.posted': undefined }]
      };
    }
    let transferStart = Number( moment( new Date( range.start ) ).format( 'X' ) );
    let transferEnd = Number( moment( new Date( range.end ) ).format( 'X' ) );

    logger.info( transferStart );
    logger.info( transferEnd );

    return Transfers.find( {
        $and: [
          { date: { $gte: transferStart } },
          { date: { $lte: transferEnd } },
          postedValue,
          searchValue
        ]
      },
      { options },
    );
  } else {
    return;
  }
});

Meteor.publish("adminSubscriptions", function (_id) {
  check(_id, Match.Optional(String));
  logger.info("Got to adminSubscriptions sub");
  let subscriptions;

  if (Roles.userIsInRole(this.userId, ['admin', 'manager'])) {
    if(_id) {
      subscriptions = Subscriptions.find({_id: _id}, {$or: [{status: 'active'}, {status: 'trialing'}]});
    } else {
      subscriptions = Subscriptions.find({$or: [{status: 'active'}, {status: 'trialing'}]});
    }
    return subscriptions;
  } else {
    this.ready();
  }
});

FindFromPublication.publish("all_users", function (_id, searchValue, limit) {
  check(_id, Match.Maybe(String));
  check(searchValue, Match.Maybe(String));
  check(limit, Match.Maybe(Number));
  logger.info("Got to all_users sub");
  let all_users;
  const SEARCH = {
    $or: [
      { 'profile.fname': { $regex: searchValue, $options: 'i' } },
      { 'profile.lname': { $regex: searchValue, $options: 'i' } },
      { 'profile.business_name': { $regex: searchValue, $options: 'i' } },
      { 'emails.address': { $regex: searchValue, $options: 'i' } }
    ]
  };
  const usableSearchValue = searchValue ? SEARCH : {};
  const limitValue = limit ? limit : 0;

  if (Roles.userIsInRole(this.userId, ['admin'])) {
    if(_id) {
      all_users = Meteor.users.find({_id: _id}, {
          fields: {
            services: 0
          }});
    } else {
      const options = {
        sort: {createdAt: -1},
        limit: limitValue,
        fields: {
          services: 0
        }
      };
      all_users = Meteor.users.find(usableSearchValue, options);
    }
    return all_users;
  } else {
    this.ready();
  }
});

Meteor.publish("roles", function () {
  if (Roles.userIsInRole(this.userId, 'admin')) {
    return Meteor.roles.find({});
  } else {
    this.ready();
  }
});


Meteor.publish("config", function () {
  return Config.find({
    'OrgInfo.web.domain_name': Meteor.settings.public.org_domain
  }, {
    fields: {
      'OrgInfo.web': 1,
      'OrgInfo.name': 1,
      'OrgInfo.full_name': 1,
      'OrgInfo.logoURL': 1,
      'OrgInfo.phone': 1,
      'OrgInfo.is_501c3': 1,
      'OrgInfo.ein': 1,
      'OrgInfo.address': 1,
      'OrgInfo.mission_statement': 1,
      'OrgInfo.emails.contact': 1,
      'OrgInfo.emails.support': 1,
      'Services.Analytics.heapId': 1,
      'Settings.Stripe.keysPublishableExists': 1,
      'Settings.Stripe.keysSecretExists': 1,
      'Settings.DonorTools.usernameExists': 1,
      'Settings.DonorTools.passwordExists': 1,
      'Settings.DonorTools.writeInDonationTypeId': 1,
      'Settings.ach_verification_type': 1,
      'Settings.showDonatePage': 1,
      'Settings.doNotAllowOneTimeACH': 1,
      'Settings.collectBankAccountType': 1,
      'Settings.forceACHDay': 1,
      'Settings.DonorTools.url': 1,
      'Giving.options': 1
    }
  });
});

Meteor.publish("wholeConfigDoc", function () {
  if (Roles.userIsInRole(this.userId, 'admin')) {
    return Config.find();
  } else {
    this.ready();
  }
});

Meteor.publish("userDoc", function () {
  if (this.userId) {
    logger.info( "Started publish function, userDoc" );
    let user = Meteor.users.find( { _id: this.userId },
      {
        fields: {
        services: 0
      }
    });
    return user;
  } else {
    this.ready();
  }
});

Meteor.publish("trips", function (id) {
  check(id, Match.Optional(String));
  if (id) {
    return Trips.find({_id: id});
  }
  return Trips.find({active: true, show: true}, {
    fields: {
      fundTotal: 0,
      startDate: 0,
      endDate: 0,
      expires: 0,
      fundAdmin: 0,

    }
  });
});

Meteor.publish("fundraisers", function (id) {
  check(id, Match.Optional(String));
  if (Roles.userIsInRole(this.userId, ['admin', 'trips-manager'])) {
    if (id) {
      return Fundraisers.find({'trips.id': id});
    }
    return Fundraisers.find();
  } else {
    this.ready();
  }
});

Meteor.publish("fundraisersPublic", function (id) {
  check(id, Match.Optional(String));
  if (id) {
    return Fundraisers.find({'trips.id': id}, {fields: {
      email: 0,
      addedBy: 0,
    }});
  }
  return Fundraisers.find({}, {fields: {
    email: 0,
    addedBy: 0,
  }});
});

Meteor.publish("emailSubscriptions", function () {
  if( this.userId ) {
    return Meteor.users.find( { _id: this.userId }, {
      fields: {
        emailSubscriptions: 1
      }
    } );
  }
});

Meteor.publish("fundNames", function () {
  if (Roles.userIsInRole(this.userId, ['admin', 'manager'])) {
    return DT_funds.find( {} , {
      fields: {
        name: 1
      }
    } );
  }
});

Meteor.publish('files.images.all', function () {
  return Images.find().cursor;
});

Meteor.publish('DonationSplits', function (chargeId) {
  check(chargeId, Match.Maybe(String));
  if(!chargeId){
    return;
  }
  return DonationSplits.find({charge_id: chargeId});
});
