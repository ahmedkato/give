AutoForm.hooks({
  'updateServicesSection': {
    onSuccess: function() {
      Bert.alert({
        message: "Great, thanks",
        type: 'success',
        icon: 'fa-smile-o',
        style: 'growl-bottom-right'
      });
      // Send an email to all the admins letting them know about this change.
      Meteor.call("sendChangeConfigNotice", 'services', function(error, result) {
        if (result) {
          console.log("Sent");
        } else {
          console.error(error);
        }
      });
      Router.go("Dashboard");
    },
    onError: function(formType, error) {
      console.error(error);
      Bert.alert({
        message: "Looks like you might be missing some required fields or you need to change something.",
        type: 'danger',
        icon: 'fa-frown-o',
        style: 'growl-bottom-right'
      });
    }
  }
});

Template.Services.helpers({
  configDocument: function() {
    const org_info = Config.findOne({
      'OrgInfo.web.domain_name': Meteor.settings.public.org_domain
    });
    return org_info;
  }
});
