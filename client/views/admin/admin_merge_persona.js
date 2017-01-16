import parsley from 'parsleyjs';

Template.AdminMergePersona.onRendered(function() {
  // Setup parsley form validation
  $('#quick_move').parsley();
});

Template.AdminMergePersona.events({
  'submit form': function(e) {
    // prevent the default reaction to submitting this form
    e.preventDefault();
    // Stop propagation prevents the form from being submitted more than once.
    e.stopPropagation();
    Session.set("loading", true);
    Meteor.call("merge_dt_persona", Number($("#old-persona-id").val()), Number($("#new-persona-id").val()), function(error, result) {
      if (result) {
        console.dir(result);
        $('#old-persona-id').val('');
        $('#new-persona-id').val('');
        $('#modal_for_admin_merge_persona').modal('hide');
        Bert.alert(result, 'success');
      } else {
        console.log(error);
        Bert.alert(error, 'danger');
      }
      Session.set("loading", false);
    });
  }
});
