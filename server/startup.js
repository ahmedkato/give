Meteor.startup( function() {
  // If the 'dev' property isn't set inside Meteor.settings then
  // check for Stripe plans and create them if they don't already exist
  if (!Meteor.settings.dev) {
    Utils.create_stripe_plans();
  }
});
