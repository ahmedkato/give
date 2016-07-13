Meteor.startup( function() {
  // If the 'dev' property isn't set inside Meteor.settings then
  // check for Stripe plans and create them if they don't already exist
  if(!Meteor.settings.dev){
    Utils.create_stripe_plans();
  }

  // make sure that the plans we need are created in Stripe
  let config = ConfigDoc();

  if (config &&
    config.Services &&
    config.Services.Kadira &&
    config.Services.Kadira.appId &&
    config.Services.Kadira.appSecret) {
    Kadira.connect(
      config.Services.Kadira.appId, config.Services.Kadira.appSecret
    );
  }

  // TODO: convert the time entry below to something that is pulled in from
  // a admin entered settings

  // TODO: when asking the user what time they would like this daily task to run
  // show them what time the server says it is right now. This way they can
  // make the time adjustment for themselves

  // TODO: connect the below job to an on/off switch in the setting panel
  // Then default it to off and wrap the below function in an if statement that
  // looks for that setting to be true
  // then run the same job as below so that it is started for the first time
  // before any server restart happens
  SyncedCron.remove('Send monthly report emails');
  SyncedCron.add({
    name: 'Send monthly report emails',
    schedule: (parser)=> {
      return parser.recur().first().dayOfMonth().on('18:00:00').time();
    },
    job: ()=> {
      let sendScheduledEmails = Utils.sendScheduledEmails('monthly');
      return sendScheduledEmails;
    }
  });

  SyncedCron.remove('Send weekly report emails');
  SyncedCron.add({
    name: 'Send weekly report emails',
    schedule: (parser)=> {
      return parser.recur().on(6).dayOfWeek().on('18:00:00').time();
    },
    job: ()=> {
      let sendScheduledEmails = Utils.sendScheduledEmails('weekly');
      return sendScheduledEmails;
    }
  });

  SyncedCron.remove('Send daily report emails');
  SyncedCron.add({
    name: 'Send daily report emails',
    schedule: (parser)=> {
      return parser.recur().on('18:00:00').time();
    },
    job: ()=> {
      let sendScheduledEmails = Utils.sendScheduledEmails('daily');
      return sendScheduledEmails;
    }
  });

  SyncedCron.remove('Get Trip Fund data');
  SyncedCron.add({
    name: 'Get Trip Fund data',
    schedule: (parser)=> {
      return parser.recur().on('17:55:00').time();
    },
    job: ()=> {
      let updateTripFunds = Utils.updateTripFunds();
      return updateTripFunds;
    }
  });

  SyncedCron.start();
});
