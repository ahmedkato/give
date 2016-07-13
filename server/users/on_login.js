Accounts.validateLoginAttempt(function(attemptObj) {
  if (attemptObj.user && attemptObj.allowed && attemptObj.user.state && attemptObj.user.state.status === 'disabled') {
    throw new Meteor.Error(403, "Your account is disabled. Please call us to have it enabled " +
      Meteor.settings.public.org_phone);
  }
  return true;
});
