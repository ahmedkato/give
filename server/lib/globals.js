Stripe = require("stripe")(
  Meteor.settings.stripe.secret
);

// Define a global object for Stripe Methods
StripeFunctions = {};
