function updateDoc(e, type, value) {
  let config = ConfigDoc();
  let id = $(e.currentTarget).data('group-id');
  Meteor.call( "updateGuide", id, type, value, function ( err, res ) {
    if( res ) {
      console.log( res );
    } else {
      console.error( err );
    }
  });
}

Template.GivingGuide.onRendered(function(){
  $('[data-toggle="popover"]').popover({html: true});
  $('[role="iconpicker"]').iconpicker({iconset: 'fontawesome',
    selectedClass: 'btn-primary',
    unselectedClass: 'btn-default'
  });
});

Template.GivingGuide.helpers({
  configId: function() {
    let config = ConfigDoc();
    return config && config._id;
  },
  givingGroups: function() {
    let config = ConfigDoc();
    var givingOptions = config && config.Giving && config.Giving.options;

    if(givingOptions && givingOptions.length > 0){
      let groups = _.filter( givingOptions, function(item) {
        if ( item && item.groupId ) {
          return item;
        }
      });
      
      return groups;
    }
  },
  checked: function() {
    if (this.guideShow) {
      return 'checked';
    }
    return;
  }
});

Template.GivingGuide.events({
  'click .guide-show': function(e) {
    console.log("Checked? " + $(e.currentTarget).is(':checked'));
    updateDoc(e, 'guideShow', $(e.currentTarget).is(':checked'));
  },
  'change .guide-icon': function (e) {
    console.log("Change: " + e.icon);
    updateDoc(e, 'guideIcon', e.icon);
  },
  'input .guide-title': _.debounce(function (e) {
    console.log("Change: " + $(e.currentTarget).val());
    updateDoc(e, 'guideTitle', $(e.currentTarget).val());
  }, 500),
  'input .guide-description': _.debounce(function (e) {
    console.log("Change: " + $(e.currentTarget).val());
    updateDoc(e, 'guideDescription', $(e.currentTarget).val());
  }, 500)
});
