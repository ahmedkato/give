Audit_trail._ensureIndex({'charge_id': 1});
Audit_trail._ensureIndex({'persona_id': 1});
Audit_trail._ensureIndex({'user_id': 1});

BankAccounts._ensureIndex({'customer_id': 1});

Charges._ensureIndex({'id': 1});
Charges._ensureIndex({'invoice': 1});
Charges._ensureIndex({'customer': 1});

Config._ensureIndex(
  {'OrgInfo.web.domain_name': 1},
  { unique: true }
);

Config._ensureIndex(
  { 'Giving.options.id': 1 },
  { 'Giving.options.groupId': 1 },
  { unique: true }
);

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
  {'charge_id': 1},
  {'customer_id': 1},
  {'method': 1},
  {'status': 1},
  {background: true});

DT_splits._ensureIndex(
  {memo: "text"},
  {background: true});
DT_splits._ensureIndex(
  {'donation_id': 1},
  {'fund_id': 1},
  {background: true});

DT_donations._ensureIndex({'id': 1});
DT_donations._ensureIndex({'persona_id': 1});
DT_donations._ensureIndex({'transaction_id': 1})

DT_funds._ensureIndex(
  {'id': 1},
  {'name': 1},
  {background: true});

DT_personas._ensureIndex(
  {'id': 1},
  {background: true});

Fundraisers._ensureIndex(
  {'email': 1},
  { unique: true },
  { background: true });

Invoices._ensureIndex(
  {'id': 1},
  {'customer': 1},
  {'charge': 1},
  {'subscription': 1},
  {background: true});

Meteor.users._ensureIndex(
  {'emails.address': 1},
  {'primary_customer_id': 1},
  {'emailSubscriptions.id': 1},
  {'emailSubscriptions.isActive': 1},
  {background: true});

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

Trips._ensureIndex(
  {'fundId': 1},
  {'name': 1},
  {background: true});

Uploads._ensureIndex(
  {'configId': 1},
  {'fundId': 1},
  {background: true});
