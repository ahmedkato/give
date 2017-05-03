Audit_trail = new Mongo.Collection('audit_trail');

BankAccounts = new Mongo.Collection('bankAccounts');

Charges = new Mongo.Collection('charges');

// Organization configuration
Config = new Mongo.Collection('config');

Config.before.update(function (userId, doc, fieldNames, modifier) {
  // if there is a trailing '/' remove it
  if (fieldNames && fieldNames.indexOf("Settings") !== -1) {
    if (modifier &&
      modifier.$set &&
      modifier.$set["Settings.DonorTools.url"] &&
      modifier.$set["Settings.DonorTools.url"].slice(-1) === '/') {
      modifier.$set["Settings.DonorTools.url"] =
        modifier.$set["Settings.DonorTools.url"].slice(0, -1);
    }
  }
});

Config.after.update(function (userId, doc, fieldNames) {
  if (fieldNames && fieldNames.indexOf("Settings") !== -1) {
    if (Meteor.isServer && userId) {
      // Not using the function 'ConfigDoc()' to assign this because this runs on both
      // the client and the server
      const config = Config.findOne({
        'OrgInfo.web.domain_name': Meteor.settings.public.org_domain
      });

      if (config && config.Services && config.Services.emailSendMethod &&
        config.Services.emailSendMethod === "Mandrill") {
        return Mandrill.config({
          username: config.OrgInfo.emails.mandrillUsername,
          "key": config.OrgInfo.emails.mandrillKey
        });
      }
    }
  }
});

Config.after.insert(function () {
  Meteor.setTimeout(() => {
    Meteor.call("afterUpdateInfoSection", function (err, res) {
      if (!err) {
        console.log(res);
      }
    });
  }, 2000);
});

Customers = new Mongo.Collection('customers');

Devices = new Mongo.Collection('devices');

DonationSplits = new Mongo.Collection('donation_splits');

Donate = new Mongo.Collection('donate');

Donations = new Mongo.Collection('donations');

DT_donations = new Mongo.Collection('dt_donations');

DT_funds = new Mongo.Collection('dt_funds');

DT_personas = new Mongo.Collection('dt_personas');

DT_sources = new Mongo.Collection('dt_sources');

DT_splits = new Mongo.Collection('dt_splits');

Fundraisers = new Mongo.Collection('fundraisers');

Invoices = new Mongo.Collection('invoices');

Payments = new Mongo.Collection('payments');

Refunds = new Mongo.Collection('refunds');

Subscriptions = new Mongo.Collection('subscriptions');

// Used to collect Stripe transactions for the transfer reports
Transactions = new Mongo.Collection('transactions');

// Used to collect Stripe transfers
Transfers = new Mongo.Collection('transfers');
// Used to store mission trip information
Trips = new Mongo.Collection('trips');
