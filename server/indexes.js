Meteor.startup(function () {
  Audit_trail._ensureIndex( { 'category': 1 } );
  Audit_trail._ensureIndex( { 'type': 1 } );
  Audit_trail._ensureIndex( { 'subtype': 1 } );
  Audit_trail._ensureIndex( { 'show': 1 } );
  Audit_trail._ensureIndex( { 'relatedCollection': 1 } );
  Audit_trail._ensureIndex( { 'relatedDoc': 1 } );
  Audit_trail._ensureIndex( { 'userId': 1 } );

  BankAccounts._ensureIndex( { 'customer_id': 1 } );

  Charges._ensureIndex( { 'id': 1 } );
  Charges._ensureIndex( { 'invoice': 1 } );
  Charges._ensureIndex( { 'customer': 1 } );

  Config._ensureIndex(
    { 'OrgInfo.web.domain_name': 1 },
    { unique: true }
  );
  Config._ensureIndex(
    { 'Giving.options.id': 1 },
    { unique: true }
  );
  Config._ensureIndex(
    { 'Giving.options.groupId': 1 },
    { unique: true }
  );

  Customers._ensureIndex( { 'id': 1 } );
  Customers._ensureIndex( { 'customer': 1 } );
  Customers._ensureIndex( { 'metadata.dt_persona_id': 1 } );
  Customers._ensureIndex( { 'metadata.user_id': 1 } );

  Devices._ensureIndex( { 'id': 1 } );
  Devices._ensureIndex( { 'customer': 1 } );

  Donations._ensureIndex( { 'charge_id': 1 } );
  Donations._ensureIndex( { 'customer_id': 1 } );
  Donations._ensureIndex( { 'method': 1 } );
  Donations._ensureIndex( { 'status': 1 } );

  DT_splits._ensureIndex( { memo: "text" } );
  DT_splits._ensureIndex( { 'donation_id': 1 } );
  DT_splits._ensureIndex( { 'fund_id': 1 } );

  DT_donations._ensureIndex( { 'id': 1 } );
  DT_donations._ensureIndex( { 'persona_id': 1 } );
  DT_donations._ensureIndex( { 'transaction_id': 1 } );

  DT_funds._ensureIndex( { 'id': 1 } );
  DT_funds._ensureIndex( { 'name': 1 } );

  DT_personas._ensureIndex( { 'id': 1 } );

  Fundraisers._ensureIndex( { 'email': 1 }, { unique: true } );

  Invoices._ensureIndex( { 'id': 1 } );
  Invoices._ensureIndex( { 'customer': 1 } );
  Invoices._ensureIndex( { 'charge': 1 } );
  Invoices._ensureIndex( { 'subscription': 1 } );

  Meteor.users._ensureIndex( { 'emails.address': 1 } );
  Meteor.users._ensureIndex( { 'profile.fname': 1 } );
  Meteor.users._ensureIndex( { 'profile.lname': 1 } );
  Meteor.users._ensureIndex( { 'profile.business_name': 1 } );
  Meteor.users._ensureIndex( { 'primary_customer_id': 1 } );
  Meteor.users._ensureIndex( { 'emailSubscriptions.id': 1 } );
  Meteor.users._ensureIndex( { 'emailSubscriptions.isActive': 1 } );

  Subscriptions._ensureIndex( { 'id': 1 } );
  Subscriptions._ensureIndex( { 'customer': 1 } );

  Transactions._ensureIndex( { 'id': 1 } );
  Transactions._ensureIndex( { 'transfer_id': 1 } );

  Transfers._ensureIndex( { 'id': 1 } );
  Transfers._ensureIndex( { 'balance_transaction': 1 } );

  Trips._ensureIndex( { 'fundId': 1 } );
  Trips._ensureIndex( { 'name': 1 } );
});