// meteor-security ongoworks allow/deny rules
Security.permit(['insert', 'update', 'remove'])
  .collections(
  [
    Audit_trail,
    BankAccounts,
    Charges,
    Config,
    Customers,
    Devices,
    Donate,
    Donations,
    DT_splits,
    DT_donations,
    DT_funds,
    DT_sources,
    Fundraisers,
    Invoices,
    Payments,
    Refunds,
    Subscriptions,
    Transactions,
    Transfers,
    Uploads
  ])
  .ifHasRole('admin')
  .allowInClientCode();

Security.permit(['insert', 'update', 'remove'])
  .collections([Trips])
  .ifHasRole(['admin', 'trips-manager'])
  .allowInClientCode();