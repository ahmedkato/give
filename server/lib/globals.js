// Initialize Stripe with the secret key
Stripe = StripeAPI(Meteor.settings.stripe.secret);

// Define a global object for Stripe Methods
StripeFunctions = {};

