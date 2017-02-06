Meteor.startup(function() {
  // if there is no org_domain in the settings.json file then put localhost in there
  Meteor.settings.public.org_domain = Meteor.settings.public.org_domain ? Meteor.settings.public.org_domain : 'localhost';

  // Commented this fixture out, if you are just setting up, you'll want to un-comment this line to get an admin account setup
  if( Meteor.users.find().count() === 0 ) {
    logger.info("Running fixtures");

    // CHANGE THE FIXTURE EMAIL BELOW
    let email = 'support@trashmountain.com';
    let tempPassword = 'sdie3038s,,@isT;';

    let initRoles = ['admin', 'manager'];

    let allRoles = Roles.getAllRoles().map(function(item) {
      return item.name;
    });

    let differenceRoles = _.difference(initRoles, allRoles);

    // Create any of the roles that aren't already created
    differenceRoles.forEach(function ( item ) {
      Roles.createRole(item);
    });

    // Create a user
    let user_id = Accounts.createUser({
      email: email,
      password: tempPassword
    });

    // Let the Roles functions run first
    Meteor.setTimeout(()=> {

      // Set this fixture account to verified
      Meteor.users.update({'emails.address': email}, {$set: {'emails.$.verified': true, profile: {}}});

      // Add roles to this account
      Roles.addUsersToRoles(user_id, ["admin"]);
    }, 1000);
  }
});
