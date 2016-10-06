Meteor.startup( function() {
  Stripe.setPublishableKey(Meteor.settings.public.stripe_publishable);
  Bert.defaults = {
    hideDelay: 10000,
    style: 'growl-bottom-right'
  };

  Meteor.Spinner.options = {
    lines: 15, // The number of lines to draw
    length: 45, // The length of each line
    width: 11, // The line thickness
    radius: 25, // The radius of the inner circle
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: '#fff', // #rgb or #rrggbb
    speed: 0.7, // Rounds per second
    trail: 60 // Afterglow percentage
  };
});
