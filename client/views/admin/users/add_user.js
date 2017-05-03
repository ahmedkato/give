AutoForm.hooks({
  'new-user-form': {
    onSuccess: function(operation, result, template) {
      Session.set("addingNew", false);
      $("[type='submit']").button('reset');
      Bert.alert( 'Success', 'success', 'growl-bottom-right' );
      Router.go("/dashboard/users");
    },

    onError: function(operation, error) {
      console.log(error);
      console.log(operation);
      $("[type='submit']").button('reset');

      Bert.alert( error.message, 'danger', 'growl-bottom-right' );
    }
  }
});

Template.AddUser.helpers({
  user: function() {
    const editUserID = Router.current().params._id;
    return Meteor.users.findOne({_id: editUserID});
  },
  selected: function() {
    const editUserID = Router.current().params._id;
    if (editUserID) {
      const thisUser = Meteor.users.findOne({_id: editUserID});
      if ( thisUser && thisUser.roles && thisUser.roles.indexOf( this.name ) > -1 ) {
        return 'selected';
      }
    } else {
      return;
    }
  }
});

Template.AddUser.events({
  'click .cancel-button': function() {
    console.log("Clicked cancel");
    Session.set("addingNew", false);
    Router.go("/dashboard/users");
  },
  'click [type="submit"]': function() {
    console.log("Submitted");
    $("[type='submit']").button('loading');
  }
});

Template.AddUser.onRendered(function() {
  $("[name='profile.phone']").mask("(999) 999-9999");
  $("[type='submit']").attr('loading-text', "Loading...");
});
