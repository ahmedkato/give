Template.AddRole.helpers({
  roles: function() {
    console.log(Meteor.roles.find().fetch());
    return Meteor.roles.find();
  },
  roleName: function() {
    return '<label class="label label-success">' + this.name + '</label>';
  }
});

Template.AddRole.events( {
  'submit form': function( e ) {
    e.preventDefault();

    const roleName = $("#roleName").val();
    if (Router.current().route.getName() === 'User') {
      var add_to = FlowRouter.getParam("_id");
    }
    Meteor.call("addRole", roleName.toLowerCase(), add_to ? add_to : '', function(err, res) {
      if (err) {
        console.log(err);
        Bert.alert(err, "danger");
      } else {
        Bert.alert(res, "success");
        $("#roleName").val("");
      }
    });
  },
  'click .cancel-button': function() {
    console.log("Clicked cancel");
    Session.set("addingNew", false);
  }
});
