import parsley from 'parsleyjs';

function checkDependantStates() {
  if (AutoForm.getFieldValue("Settings.ach_verification_type", "updateSettingsSection") === 'manual') {
    $('[name="Settings.forceACHDay"]').prop('disabled', false);
    $('[name="Settings.doNotAllowOneTimeACH"]').bootstrapSwitch('readonly', false);
    $('[name="Settings.collectBankAccountType"]').bootstrapSwitch('readonly', false);
  } else {
    $('[name="Settings.doNotAllowOneTimeACH"]').bootstrapSwitch('state', false);
    $('[name="Settings.doNotAllowOneTimeACH"]').bootstrapSwitch('readonly', true);
    $('[name="Settings.collectBankAccountType"]').bootstrapSwitch('state', false);
    $('[name="Settings.collectBankAccountType"]').bootstrapSwitch('readonly', true);
    $('[name="Settings.forceACHDay"]').val('any');
    $('[name="Settings.forceACHDay"]').prop('disabled', true);
  }
}

AutoForm.hooks({
  'updateSettingsSection': {
    onSuccess: function() {
      // Send an email to all the admins letting them know about this change.
      /* Meteor.call("sendChangeConfigNotice", 'settings', function(error, result) {
       if (result) {
       console.log("Sent");
       } else {
       console.error(error);
       }
       });*/
      Meteor.call( "get_dt_funds", function( error, result ) {
        if ( result ) {
          console.log( "Got all funds" );
        } else {
          console.error( error );
        }
      } );
      Bert.alert({
        message: "Great, thanks",
        type: 'success',
        icon: 'fa-smile-o',
        style: 'growl-bottom-right'
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

Template.Settings.onRendered(function() {
  $("[name='Settings.ach_verification_type']").attr('required', true);
  $("[name='Settings.DonorTools.url']").attr('required', true);
  $("#updateSettingsSection").parsley();
  $("[data-toggle='switch']").bootstrapSwitch();
});

Template.Settings.helpers({
  configDocument: function() {
    const config = ConfigDoc();

    if (config) {
      return config;
    }
    return;
  }
});

Template.Settings.events({
  // check to see if the ACH verification type is set to manual
  // if it is then change the dependant values by removing their disabled state
  'change [name="Settings.ach_verification_type"]': function() {
    checkDependantStates();
  }
});

Template.Settings.onRendered(function() {
  checkDependantStates();
});
