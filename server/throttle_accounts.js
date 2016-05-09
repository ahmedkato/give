// TODO: Need to rewrite this, but without the buggy after taste :-)
/*
if (Meteor.isServer) {
    // configure ThrottleAccounts.login - Accounts.validateLoginAttempt()
    ThrottleAccounts.login(
        'connection',
        2,
        (4 * 60000),
        'Nope - You are limited to 2 logins every 4 min (per DDP connection)'
    );
    ThrottleAccounts.login(
        'ip',
        2,
        (5 * 60000),
        'Nope - You are limited to 2 logins every 5 min'
    );
}*/
