AllErrors = new Mongo.Collection('allerrors');

Audit_trail = new Mongo.Collection('audit_trail');

BankAccounts = new Mongo.Collection('bankAccounts');

Charges = new Mongo.Collection('charges');

// Organization configuration
Config = new Mongo.Collection('config');

Config.after.update(function (userId, doc, fieldNames) {

  if (fieldNames.indexOf("Settings") !== -1) {
    if( Meteor.isServer && userId ) {

      let config = Config.findOne( {
        'OrgInfo.web.domain_name': Meteor.settings.public.org_domain
      });

      if( config ) {
        Meteor.setTimeout( ()=> {
          // Send an email to all the admins letting them know about this change.
          Utils.send_change_email_notice_to_admins( userId, fieldNames[0].toLowerCase() );
        }, 1000 );

        return Mandrill.config( {
          username: config.OrgInfo.emails.mandrillUsername,
          "key":    config.OrgInfo.emails.mandrillKey
        } );

      }
    }
  }
});

Customers = new Mongo.Collection('customers');

Devices = new Mongo.Collection('devices');

Donate = new Mongo.Collection('donate');

Donations = new Mongo.Collection('donations');

DT_splits = new Mongo.Collection('dt_splits');

DT_donations = new Mongo.Collection('dt_donations');

DT_funds = new Mongo.Collection('dt_funds');

DT_sources = new Mongo.Collection('dt_sources');

Invoices = new Mongo.Collection('invoices');

Payments = new Mongo.Collection('payments');

Refunds = new Mongo.Collection('refunds');

Subscriptions = new Mongo.Collection('subscriptions');

// Used to collect Stripe transactions for the transfer reports
Transactions = new Mongo.Collection('transactions');

// Used to collect Stripe transfers
Transfers = new Mongo.Collection('transfers');

// Uploads, used for admin file uploading
Uploads = new Mongo.Collection('uploads');
