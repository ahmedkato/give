﻿Meteor.startup(function() {
  Kadira.connect(Meteor.settings.kadiraAppId, Meteor.settings.kadiraAppSecret);
});