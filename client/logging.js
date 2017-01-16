export default logger = {
  log(message) {
    Meteor.call('clientLog', message, Meteor.connection._lastSessionId);
  }
};
