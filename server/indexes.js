Audit_trail._ensureIndex(
  {'charge_id': 1},
  {'persona_id': 1},
  {'user_id': 1},
  {background: true});

Charges._ensureIndex(
  {'id': 1},
  {'customer': 1},
  {'invoice': 1},
  {background: true});

Customers._ensureIndex(
  {'id': 1},
  {'customer': 1},
  {'metadata.dt_persona_id': 1},
  {background: true});

Devices._ensureIndex(
  {'id': 1},
  {'customer': 1},
  {background: true});

Donations._ensureIndex(
  {'customer_id': 1},
  {background: true});

DT_splits._ensureIndex(
  {'donation_id': 1},
  {'fund_id': 1},
  {background: true});

DT_splits._ensureIndex(
  {'memo': "text"},
  {background: true});

DT_donations._ensureIndex(
  {'id': 1},
  {'persona_id': 1},
  {'transaction_id': 1},
  {background: true});

DT_funds._ensureIndex(
  {'name': 1},
  {background: true});

Invoices._ensureIndex(
  {'id': 1},
  {'customer': 1},
  {'charge': 1},
  {'subscription': 1},
  {background: true});

Meteor.users._ensureIndex(
  {'emails.address': 1},
  {'primary_customer_id': 1},
  {background: true});

Config._ensureIndex(
  {'organization_info.web.domain_name': 1},
  {backgrond: true});

Config._ensureIndex(
  { 'donationOptions.id': 1 },
  { 'donationOptions.groupId': 1 },
  { unique: true },
  { backgrond: true }
);

Subscriptions._ensureIndex(
  {'id': 1},
  {'customer': 1},
  {background: true});

Transactions._ensureIndex(
  {'id': 1},
  {'transfer_id': 1},
  {background: true});

Transfers._ensureIndex(
  {'id': 1},
  {'balance_transaction': 1},
  {background: true});
