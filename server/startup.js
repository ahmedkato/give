Meteor.startup( function() {
  // If the 'dev' property isn't set inside Meteor.settings then
  // check for Stripe plans and create them if they don't already exist
  if (!Meteor.settings.dev) {
    Utils.create_stripe_plans();
  }

  // make sure that the plans we need are created in Stripe
  const config = ConfigDoc();

  if (config &&
    config.Services &&
    config.Services.Kadira &&
    config.Services.Kadira.appId &&
    config.Services.Kadira.appSecret) {
    Kadira.connect(
      config.Services.Kadira.appId, config.Services.Kadira.appSecret
    );
  }
});
