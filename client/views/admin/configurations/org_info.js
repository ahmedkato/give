AutoForm.hooks({
  'updateInfoSection': {
    onSuccess: function() {
      Bert.alert({
        message: "Good work",
        type: 'success',
        icon: 'fa-smile-o',
        style: 'growl-bottom-right'
      });
      Router.go("Dashboard");
    },
    onError: function(formType, error) {
      console.error(error);
      Bert.alert({
        message: "Looks like you might be missing some required fields.",
        type: 'danger',
        icon: 'fa-frown-o',
        style: 'growl-bottom-right'
      });
    }
  }
});

Template.OrgInfo.onCreated(function() {
  this.formType = new ReactiveVar('insert');
});

Template.OrgInfo.onRendered(function() {
  $("[name='OrgInfo.phone']").mask("(999) 999-9999");
  $("#updateInfoSection").parsley();
});

Template.OrgInfo.helpers({
  configDocument: function() {
    const config = ConfigDoc();

    if (config) {
      Template.instance().formType.set('update');
      return config;
    }
    return;
  },
  formType: function() {
    const formType = Template.instance().formType.get();
    return formType;
  },
  fields(){
    return "OrgInfo.name,OrgInfo.full_name,OrgInfo.logoURL," +
    "OrgInfo.phone,OrgInfo.is_501c3, OrgInfo.ein,OrgInfo.mission_statement," +
    "OrgInfo.address,OrgInfo.emails, OrgInfo.web"
  }
});
