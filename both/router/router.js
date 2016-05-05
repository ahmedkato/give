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
    let config = ConfigDoc();

    if (!(config && config.Settings && config.Settings.showDonatePage)){
      if (!Meteor.user() && !Meteor.loggingIn() && !(Router.current().route.getName() === 'signIn')) {
        this.render("SetupNotComplete");
      }
    }
  }, 1000);
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
  only: ['Users', 'GivingOptions', 'OrgInfo', 'admin.ach']
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
  only: ['AdminTrips', 'AdminTrip']
});

Router.onBeforeAction(function() {
  if (!Roles.userIsInRole(Meteor.user(), ['admin', 'trips-manager', 'trips-member']) ) {
    this.render("NotFound");
  } else {
    this.next();
  }
}, {
  only: ['MemberTrips', 'MemberTrip', 'Trips']
});

Router.route('', {
  name: 'donation.form',
  path: '',
  subscriptions: function() {
    this.subscribe('Serve1000Sources2015').wait();
  },
  waitOn: function() {
    return Meteor.subscribe('Serve1000Sources2015');
  },
  action: function() {
    var params = this.params;

    if (Meteor.user()) {
      Router.go('user.give');
    }
    this.render('DonationForm');

    Session.set('params.amount', params.query.amount);
    Session.set('params.campaign', params.query.campaign);
    Session.set('params.donateTo', params.query.donateTo);
    Session.set('params.donateWith', params.query.donateWith);
    Session.set('params.dt_source', params.query.dt_source);
    Session.set('params.start_date', params.query.start_date);
    Session.set('params.note', params.query.note);
    Session.set('params.enteredWriteInValue', params.query.enteredWriteInValue);
    Session.set('params.enteredCampaignValue', params.query.enteredCampaignValue);
    Session.set('params.exp_month', params.query.exp_month);
    Session.set('params.exp_year', params.query.exp_year);
    Session.set('params.locked_amount', params.query.locked_amount);
    Session.set('params.locked_frequency', params.query.locked_frequency);
    Session.set('params.recurring', params.query.recurring);
    Session.set('params.writeIn', params.query.writeIn);
  }
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
      Meteor.subscribe('receipt_customers', this.params.query.c),
      Meteor.subscribe('receipt_charges', this.params.query.charge)
    ];
  },
  action: function() {
    this.render('Thanks', {
      data: function() {
        Session.set('print', this.params.query.print);
      }
    });
  }
});

Router.route('/gift/:_id', function() {
  var params = this.params;

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
  }else {
    this.render('Loading');
    this.next();
  }
}, {
  name: 'donation.gift'
});

Router.route('/dashboard', function() {
  this.layout('AdminLayout');

  this.wait(Meteor.subscribe('publish_for_admin_give_form'));
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
    Meteor.subscribe('userDT'),
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
  name: 'stripe.transfers'
});

Router.route('/expiring',{
  layoutTemplate: 'UserLayout',

  subscriptions: function(){
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

Router.route('/transfers/:_id', function() {
  var params = this.params;
  var id = params._id;

  this.layout('UserLayout');

  this.wait([Meteor.subscribe('transfers', id), Meteor.subscribe('transactions', id), Meteor.subscribe('DTSources') ]);
  if (this.ready()) {
    this.render('StripeTransferDetails');
  } else {
    this.render('Loading');
  }
});

Router.route('/user/give', {
  layoutTemplate: 'UserLayout',

  subscriptions: function() {
    return [
      Meteor.subscribe('userStripeData'),
      Meteor.subscribe('userDT'),
      Meteor.subscribe('userDTFunds'),
      Meteor.subscribe('devices')
    ];
  },
  action: function() {
    var params = this.params;

    Session.set('params.amount', params.query.amount);
    Session.set('params.campaign', params.query.campaign);
    Session.set('params.donateTo', params.query.donateTo);
    Session.set('params.donateWith', params.query.donateWith);
    Session.set('params.dt_source', params.query.dt_source);
    Session.set('params.start_date', params.query.start_date);
    Session.set('params.note', params.query.note);
    Session.set('params.enteredWriteInValue', params.query.enteredWriteInValue);
    Session.set('params.enteredCampaignValue', params.query.enteredCampaignValue);
    Session.set('params.exp_month', params.query.exp_month);
    Session.set('params.exp_year', params.query.exp_year);
    Session.set('params.locked_amount', params.query.locked_amount);
    Session.set('params.locked_frequency', params.query.locked_frequency);
    Session.set('params.recurring', params.query.recurring);
    Session.set('params.writeIn', params.query.writeIn);

    this.render('UserGive');

  },
  name: 'user.give'
});

Router.route('Subscriptions', function() {
  var params = this.params;
  Session.set('fix_it', params.query.fix_it);

  this.wait([Meteor.subscribe('subscriptions'), Meteor.subscribe('userDoc')]);
  if (this.ready()) {
    this.render();
  } else {
    this.render('Loading');
  }
}, {
  name: 'subscriptions',
  layoutTemplate: 'UserLayout',
  path: '/user/subscriptions'
});

Router.route('/scheduled', {
  name: 'donation.scheduled',

  data: function() {
    Session.set('params.frequency', this.params.query.frequency);
    Session.set('params.amount', this.params.query.amount);
    Session.set('params.start_date', this.params.query.start_date === 'today' ?
      moment().format('DD MMMM, YYYY') :
      moment(this.params.query.start_date * 1000).format('DD MMMM, YYYY'));
  }
});

if (Meteor.isServer) {

  Router.route( '/webhooks/stripe', function () {
    // Receive an event, check that it contains a data.object object and send along to appropriate function
    var request = this.request.body;
    var dtStatus;

    // This shouldn't be considered a security precaution since anyone can forge these headers
    // we just use it here to weed out any traffic that hits the URL without trying to forge
    // a strip origin header
    // Every request here always gets verified by Stripe and we use the verified
    // response inside the app
    this.response.setHeader( 'access-control-allow-origin', 'https://stripe.com' );

    if( request.data && request.data.object ) {
      Meteor.call( "checkDonorTools", function ( err, res ) {
        if( res && res === true ) {
          dtStatus = true;
        } else {
          logger.info( "DT connection is down" );
          dtStatus = false;
        }
      } );
      if( dtStatus ) {
        // Got it, let the Stripe server go
        this.response.statusCode = 200;
        this.response.end( 'Oh hai Stripe!\n' );

        // Process this event, but first check that it actually came from Stripe
        StripeFunctions.control_flow_of_stripe_event_processing( request );
      } else {
        this.response.statusCode = 500;
        this.response.end( 'Sorry, no connection to DonorTools available!' );
      }
    } else {
      this.response.statusCode = 400;
      this.response.end( 'Oh hai Stripe!\n\n' );
    }
  }, {
    where: 'server',
    name:  'stripe_webhooks'
  } );
}

Router.route('FixCardSubscription', {
  layoutTemplate: 'UserLayout',
  path: '/user/subscriptions/card/resubscribe',
  template: 'FixCardSubscription',
  subscriptions: function() {
    var query = this.params.query;

    return [
      Meteor.subscribe( 'subscription', query.s ),
      Meteor.subscribe( 'customer', query.c )
    ];
   },
  action: function() {
    var query = this.params.query;

    if (this.ready()) {
      Session.set('sub', query.s);
      this.render();
    } else {
      this.render('Loading');
    }
  }
});

Router.route('FixBankSubscription', {
    layoutTemplate: 'UserLayout',
    path: '/user/subscriptions/bank/resubscribe',
    template: 'FixBankSubscription',
    subscriptions: function() {
      return [
        Meteor.subscribe('subscription', this.params.query.s),
        Meteor.subscribe('customer', this.params.query.c)
      ];
    },
    action: function() {
      if (this.ready()) {
        var query = this.params.query;
        Session.set('sub', query.s);
        this.render();
      } else {
        this.render('Loading');
      }
    }
});

Router.route('/dashboard/giving_options', {
  name: 'GivingOptions',
  where: 'client',
  waitOn: function() {
    return [ Meteor.subscribe('wholeConfigDoc'), Meteor.subscribe('userDTFunds')];
  }
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

Router.route('/dashboard/getdtdata', {
  name: 'DtReport',
  where: 'client',
  waitOn: function() {
    return Meteor.subscribe( 'DTSplits' );
  },
  data: function() {
    return DT_splits.find();
  }
});

Router.route('/dashboard/subscriptions', {
  layoutTemplate: 'UserLayout',
  name: 'AdminSubscriptions',
  where: 'client',
  template: 'AdminSubscriptions'
});


Router.route('/dashboard/users', {
  layoutTemplate: 'AdminLayout',
  name: 'ManageUsers',
  where: 'client',
  template: 'ManageUsers',
  waitOn: function() {
    var query = this.params.query;
    var id = query.userID;
    if (id) {
      Session.set( 'params.userID', id );
      Session.set( "showSingleUserDashboard", true );
    }
  },
  data: function() {
    var query = this.params.query;
    var id = query.userID;
    if (id) {
      return Meteor.users.findOne({_id: id});
    } else if (Session.get('params.userID')) {
      return Meteor.users.findOne({_id: Session.get('params.userID')});
    }
    return Meteor.users.find();
  }
});

Router.route('/dashboard/upload', {
  layoutTemplate: 'AdminLayout',
  name: 'Upload',
  where: 'client',
  template: 'Upload'
});


Router.route('/dashboard/logos', {
  name: 'Logos',
  where: 'client',
  template: 'Logos'
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

Router.route('/trips/admin/:_id', function() {
  var params = this.params;

  this.subscribe('trips', params._id);
  this.layoutTemplate = 'AdminLayout';

  if (this.ready()) {
    this.render('TripAdmin');
    this.next();
  } else {
    this.render('Loading');
    this.next();
  }
}, {
  name: 'TripAdmin'
});

Router.route('/trips/member', {
  layoutTemplate: 'AdminLayout',
  name: 'TripsMember',
  where: 'client',
  template: 'TripsMember'
});

Router.route('/trips/member/:_id', function() {
  var params = this.params;

  this.subscribe('trips', params._id);
  this.layoutTemplate = 'AdminLayout';

  if (this.ready()) {
    this.render('TripMember');
    this.next();
  } else {
    this.render('Loading');
    this.next();
  }
}, {
  name: 'TripMember'
});
