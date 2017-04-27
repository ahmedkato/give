Router.configure({
  layoutTemplate: 'MasterLayout',
  loadingTemplate: 'loading',
  notFoundTemplate: 'NotFound',
  templateNameConverter: 'upperCamelCase',
  routeControllerNameConverter: 'upperCamelCase'
});

Router.plugin('ensureSignedIn', {
  except: ['donation.form', 'donation.landing', 'donation.thanks',
    'donation.gift', 'donation.scheduled', 'enrollAccount',
    'forgotPwd', 'resetPwd', 'stripe_webhooks', 'signIn']
});

Router.onAfterAction(function() {
  Meteor.setTimeout(() => {
    const config = ConfigDoc();

    if (!(config && config.Settings && config.Settings.showDonatePage)) {
      if (!Meteor.user() && !Meteor.loggingIn() && !(Router.current().route.getName() === 'signIn')) {
        // TODO: fix this area, it is coming up to much...
        // this.render("SetupNotComplete");
      }
    }
  }, 3000);
}, {
  only: ['donation.form', 'donation.landing']
});

Router.onBeforeAction(function() {
  if (!Roles.userIsInRole(Meteor.user(), ['admin'])) {
    this.render("NotFound");
  } else {
    this.next();
  }
}, {
  only: ['Users', 'GivingOptions', 'OrgInfo', 'admin.ach', 'AdminSubscriptions', 'Gifts']
});

Router.onBeforeAction(function() {
  if (!Roles.userIsInRole(Meteor.user(), ['admin', 'manager'])) {
    this.render("NotFound");
  } else {
    this.next();
  }
}, {
  only: 'Dashboard'
});

Router.onBeforeAction(function() {
  if (!Roles.userIsInRole(Meteor.user(), ['admin', 'manager']) ) {
    this.render("NotFound");
  } else {
    this.next();
  }
}, {
  only: ['transfers', 'Reports']
});

Router.onBeforeAction(function() {
  if (!Roles.userIsInRole(Meteor.user(), ['admin', 'trips-manager']) ) {
    this.render("NotFound");
  } else {
    this.next();
  }
}, {
  only: ['TripsAdmin', 'TripAdmin']
});

Router.onBeforeAction(function() {
  if (!Roles.userIsInRole(Meteor.user(), ['admin', 'trips-manager', 'trips-member']) ) {
    this.render("NotFound");
  } else {
    this.next();
  }
}, {
  only: ['TripsMember', 'TripMember', 'Trips']
});

/* Router.route('/', {
  name: 'donation.form',
  path: '/',
  action: function() {
    const params = this.params;
    Session.set('params.amount', params.query.amount);
    Session.set('params.campaign', params.query.campaign);
    Session.set('params.donateTo', params.query.donateTo);
    Session.set('params.donateWith', params.query.donateWith);
    Session.set('params.dt_source', params.query.dt_source);
    Session.set('params.note', params.query.note);
    Session.set('params.enteredCampaignValue', params.query.enteredCampaignValue);
    Session.set('params.exp_month', params.query.exp_month);
    Session.set('params.exp_year', params.query.exp_year);
    Session.set('params.locked_amount', params.query.locked_amount);
    Session.set('params.locked_frequency', params.query.locked_frequency);
    Session.set('params.recurring', params.query.recurring);

    if (Meteor.user()) {
      if (Roles.userIsInRole(Meteor.userId(), ['super-admin', 'admin', 'manager'])) {
        return Router.go('Dashboard');
      }
      return Router.go('user.profile', {}, {query: params.query});
    }
    this.render('DonationForm');
  }
});*/

Router.route('/', function() {
  const params = this.params;
  Session.set('params.amount', params.query.amount);
  Session.set('params.campaign', params.query.campaign);
  Session.set('params.donateTo', params.query.donateTo);
  Session.set('params.donateWith', params.query.donateWith);
  Session.set('params.dt_source', params.query.dt_source);
  Session.set('params.note', params.query.note);
  Session.set('params.enteredCampaignValue', params.query.enteredCampaignValue);
  Session.set('params.exp_month', params.query.exp_month);
  Session.set('params.exp_year', params.query.exp_year);
  Session.set('params.locked_amount', params.query.locked_amount);
  Session.set('params.locked_frequency', params.query.locked_frequency);
  Session.set('params.recurring', params.query.recurring);

  if (Meteor.user()) {
    if (Roles.userIsInRole(Meteor.userId(), ['super-admin', 'admin', 'manager'])) {
      return Router.go('Dashboard');
    }
    return Router.go('user.profile', {}, {query: params.query});
  }
  this.render('DonationForm');
}, {
  name: 'donation.form'
});

Router.route('/landing', function() {
  if (Meteor.user()) {
    Session.set('params.give', "Yes");
    Router.go('subscriptions');
  }

  this.render('DonationLanding');
}, {
  name: 'donation.landing'
});

Router.route('/thanks', {
  name: 'donation.thanks',
  waitOn: function() {
    return [
      Meteor.subscribe('receiptCharge', this.params.query.charge)
    ];
  },
  action: function() {
    this.render('Thanks', {
      data: function() {
        Session.set('print', this.params.query.print);
        Session.set('params.charge', this.params.query.charge);
      }
    });
  }
});

Router.route('/gift/:_id', function() {
  const params = this.params;

  this.subscribe('donate', params._id);

  if (this.ready()) {
    this.render('Gift', {
      data: function() {
        Session.set('print', params.query.print);
        Session.set('transaction_guid', params.query.transaction_guid);
        return Donate.findOne(params._id);
      }
    });
    this.next();
  } else {
    this.render('Loading');
    this.next();
  }
}, {
  name: 'donation.gift'
});

Router.route('/dashboard', function() {
  this.layout('AdminLayout');
  this.render('Dashboard');
}, {
  name: 'Dashboard'
});

Router.route('/reports', function() {
  this.layout('AdminLayout');

  this.render('Reports');
}, {
  name: 'Reports'
});

Router.route('/user', function() {
  this.layout('UserLayout');

  this.wait([
    Meteor.subscribe('userStripeData'),
    Meteor.subscribe('userDTFunds')
  ]);
  if (this.ready()) {
    this.render('UserProfile');
  } else {
    this.render('Loading');
  }
}, {
  name: 'user.profile'
});

Router.route('/dashboard/ach', function() {
  this.layout('AdminLayout');

  this.render('ACH');
}, {
  name: 'admin.ach'
});

Router.route('/transfers', {
  layoutTemplate: 'UserLayout',

  action: function() {
    if (this.ready()) {
      this.render();
    } else {
      this.render('Loading');
    }
  },
  name: 'StripeTransfers'
});

Router.route('/expiring', {
  layoutTemplate: 'UserLayout',

  subscriptions: function() {
    return [
      Meteor.subscribe('subscriptions_and_customers')
    ];
  },
  action: function() {
    if (this.ready()) {
      this.render();
    } else {
      this.render('Loading');
    }
  },
  name: 'stripe.expiring'
});

Router.route('/transfers/:_id', {
  layoutTemplate: 'UserLayout',
  action: function() {
    const params = this.params;
    const id = params._id;

    Session.set('transferId', id);
    this.render('StripeTransferDetails');
  },
  name: 'StripeTransferDetails'
});

Router.route('/user/give', {
  layoutTemplate: 'UserLayout',

  action: function() {
    const params = this.params;

    Session.set('params.amount', params.query.amount);
    Session.set('params.campaign', params.query.campaign);
    Session.set('params.donateTo', params.query.donateTo);
    Session.set('params.donateWith', params.query.donateWith);
    Session.set('params.dt_source', params.query.dt_source);
    Session.set('params.note', params.query.note);
    Session.set('params.enteredCampaignValue', params.query.enteredCampaignValue);
    Session.set('params.exp_month', params.query.exp_month);
    Session.set('params.exp_year', params.query.exp_year);
    Session.set('params.locked_amount', params.query.locked_amount);
    Session.set('params.locked_frequency', params.query.locked_frequency);
    Session.set('params.recurring', params.query.recurring);
    Session.set('params.userID', params.query.userID);

    this.render('UserGive');
  },
  name: 'user.give'
});

Router.route('/admin/give', {
  layoutTemplate: 'UserLayout',

  action: function() {
    const params = this.params;

    Session.set('params.amount', params.query.amount);
    Session.set('params.campaign', params.query.campaign);
    Session.set('params.donateTo', params.query.donateTo);
    Session.set('params.donateWith', params.query.donateWith);
    Session.set('params.dt_source', params.query.dt_source);
    Session.set('params.note', params.query.note);
    Session.set('params.enteredCampaignValue', params.query.enteredCampaignValue);
    Session.set('params.exp_month', params.query.exp_month);
    Session.set('params.exp_year', params.query.exp_year);
    Session.set('params.locked_amount', params.query.locked_amount);
    Session.set('params.locked_frequency', params.query.locked_frequency);
    Session.set('params.recurring', params.query.recurring);
    Session.set('params.userID', params.query.userID);

    this.render('AdminGive');
  },
  name: 'admin.give'
});

Router.route('Subscriptions', {
  name: 'subscriptions',
  action: function() {
    Session.set('fix_it', this.params.query.fix_it);
    this.render('SubscriptionsOverview');
  },
  layoutTemplate: 'UserLayout',
  path: '/user/subscriptions'
});

Router.route('UpdateSubscription', {
  name: 'UpdateSubscription',
  action: function() {
    this.render('UpdateSubscription');
    Session.set('subscription', this.params.query.subscription);
    Session.set('change_amount', this.params.query.amount);
    Session.set('customer', this.params.query.customer);
    Session.set('change_donateTo', this.params.query.donateTo);
    Session.set('change_date', this.params.query.date);
  },
  layoutTemplate: 'UserLayout',
  path: '/user/update-subscription'
});

Router.route('UpdateDonation', {
  name: 'UpdateDonation',
  action: function() {
    this.render('UpdateDonation');
    Session.set('donation', this.params.query.donation);
    Session.set('change_amount', this.params.query.amount);
    Session.set('customer', this.params.query.customer);
    Session.set('change_donateTo', this.params.query.donateTo);
    Session.set('change_date', this.params.query.date);
  },
  layoutTemplate: 'UserLayout',
  path: '/user/update-donation'
});

Router.route('/scheduled', {
  name: 'donation.scheduled',

  action: function() {
    Session.set('params.frequency', this.params.query.frequency);
    Session.set('params.amount', this.params.query.amount);
    Session.set('params.startdate', this.params.query.startdate);

    this.render('DonationScheduled');
  }
});

if (Meteor.isServer) {
  Router.route( '/webhooks/stripe', function() {
    // Receive an event, check that it contains a data.object object and send along to appropriate function
    const request = this.request.body;
    let response = this.response;
    let dtStatus;
    // This shouldn't be considered a security precaution since anyone can forge these headers
    // we just use it here to weed out any traffic that hits the URL without trying to forge
    // a Stripe origin header
    // Every request here always gets verified by Stripe and we use the verified
    // response inside the app
    response.setHeader( 'access-control-allow-origin', 'https://stripe.com' );

    if ( request.data && request.data.object ) {
      Meteor.call( "checkDonorTools", ( err, res ) =>{
        if ( res && res === true ) {
          dtStatus = true;
        } else {
          logger.info( "DT connection is down" );
          dtStatus = false;
        }
        if ( dtStatus ) {
          // Process this event, but first check that it actually came from Stripe
          StripeFunctions.control_flow_of_stripe_event_processing( request );

          logger.info( "Sending 200 to Stripe" );
          // Got it, let the Stripe server go
          response.statusCode = 200;
          response.end( 'Oh hai Stripe!\n' );
        } else {
          response.statusCode = 500;
          response.end( 'Sorry, no connection to DonorTools available!' );
        }
      } );

    } else {
      this.response.statusCode = 400;
      this.response.end( 'Oh hai Stripe!\n\n' );
    }
  }, {
    where: 'server',
    name: 'stripe_webhooks'
  } );
}

Router.route('FixCardSubscription', {
  layoutTemplate: 'UserLayout',
  path: '/user/subscriptions/card/change',
  template: 'FixCardSubscription',
  subscriptions: function() {
    const query = this.params.query;

    return [
      Meteor.subscribe( 'customer', query.c )
    ];
  },
  action: function() {
    const query = this.params.query;

    if (this.ready()) {
      Session.set('sub', query.s);
      Session.set('resubscribe', query.resubscribe);
      if (query.newcard === 'true') {
        Session.set('addingNewCreditCard', true);
      }
      this.render();
    } else {
      this.render('Loading');
    }
  },
  name: 'FixCardSubscription'
});

Router.route('FixBankSubscription', {
  layoutTemplate: 'UserLayout',
  path: '/user/subscriptions/bank/change',
  template: 'FixBankSubscription',
  subscriptions: function() {
    return [
      Meteor.subscribe('subscription', this.params.query.s),
      Meteor.subscribe('customer', this.params.query.c)
    ];
  },
  action: function() {
    if (this.ready()) {
      const query = this.params.query;
      Session.set('sub', query.s);
      Session.set('resubscribe', query.resubscribe);
      this.render();
    } else {
      this.render('Loading');
    }
  },
  name: 'FixBankSubscription'
});

Router.route('/dashboard/giving_options', {
  name: 'GivingOptions',
  where: 'client'
});

Router.route('/dashboard/giving_guide', {
  name: 'GivingGuide',
  where: 'client',
  waitOn: function() {
    return [ Meteor.subscribe('wholeConfigDoc'), Meteor.subscribe('userDTFunds')];
  }
});

Router.route('/dashboard/orginfo', {
  name: 'OrgInfo',
  where: 'client',
  waitOn: function() {
    return Meteor.subscribe('wholeConfigDoc');
  },
  data: function() {
    return Config.find();
  }
});

Router.route('/dashboard/settings', {
  name: 'settings',
  where: 'client',
  waitOn: function() {
    return Meteor.subscribe('wholeConfigDoc');
  },
  data: function() {
    return Config.find();
  }
});

Router.route('/dashboard/services', {
  name: 'services',
  where: 'client',
  waitOn: function() {
    return Meteor.subscribe('wholeConfigDoc');
  },
  data: function() {
    return Config.find();
  }
});

Router.route('/dashboard/subscriptions', {
  layoutTemplate: 'UserLayout',
  name: 'AdminSubscriptions',
  where: 'client',
  template: 'AdminSubscriptions',
  data: function() {
    const query = this.params.query;
    Session.set("searchValue", query.sub);
  }
});

Router.route('/dashboard/users', {
  layoutTemplate: 'UserLayout',
  name: 'ManageUsers',
  where: 'client',
  template: 'ManageUsers'
});

Router.route('/dashboard/user/:id', {
  layoutTemplate: 'AdminLayout',
  name: 'ManageUser',
  where: 'client',
  template: 'OtherUserProfile',
  waitOn: function() {
    const id = this.params.id;
    Session.set( 'params.userID', id );
  }
});

Router.route('/dashboard/logos', {
  name: 'Logos',
  where: 'client',
  template: 'Logos'
});

Router.route('/dashboard/timeline', {
  layoutTemplate: 'AdminLayout',
  name: 'Timeline',
  where: 'client',
  template: 'Timeline'
});

Router.route('/dashboard/gifts', {
  layoutTemplate: 'AdminLayout',
  name: 'Gifts',
  where: 'client',
  template: 'Gifts'
});

Router.route('/trips', {
  layoutTemplate: 'AdminLayout',
  name: 'Trips',
  where: 'client',
  template: 'TripsDashboard'
});

Router.route('/trips/admin', {
  layoutTemplate: 'AdminLayout',
  name: 'TripsAdmin',
  where: 'client',
  template: 'TripsAdmin'
});

Router.route('/trips/admin/:_id', {
  layoutTemplate: 'AdminLayout',
  name: 'TripAdmin',
  template: 'TripAdmin',
  waitOn: function() {
    const params = this.params;
    Meteor.subscribe('trips', params._id);
  }
});

Router.route('/trips/member', {
  layoutTemplate: 'AdminLayout',
  name: 'TripsMember',
  where: 'client',
  template: 'TripsMember'
});

Router.route('/trips/member/:_id', {
  layoutTemplate: 'AdminLayout',
  name: 'TripMember',
  template: 'TripMember',
  waitOn: function() {
    const params = this.params;
    Meteor.subscribe('trips', params._id);
  }
});
