Meteor.startup(function() {

  // if there is no org_domain in the settings.json file then put localhost in there
  Meteor.settings.public.org_domain = 
    Meteor.settings.public.org_domain ?
      Meteor.settings.public.org_domain :
      'localhost';

  if( Meteor.users.find().count() === 0 ) {
    logger.info("Running fixtures");

    // CHANGE THE FIXTURE EMAIL BELOW
    let email = 'test@example.com';
    let tempPassword = 'sdie3030s,,@isS;';
    
    let initRoles = ['admin', 'manager', 'trips-manager'];

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
