Template.ProfileModal.helpers({
  this_persona: function() {
    let persona_info;
    if (Session.get('params.userID')) {
      persona_info = Meteor.users.findOne({_id: Session.get('params.userID')}) &&
        Meteor.users.findOne({_id: Session.get('params.userID')}).persona_info;
      return _.where(persona_info, {id: Number(Session.get('activeTab'))});
    } else if (Session.get('activeTab')) {
      persona_info = Meteor.users.findOne() && Meteor.users.findOne().persona_info;
      return _.where(persona_info, {id: Number(Session.get('activeTab'))});
    } else {
      persona_info = Meteor.users.findOne() && Meteor.users.findOne().persona_info;
      if (persona_info && persona_info.length > 0 ) {
        return persona_info[0];
      }
    }
    return;
  },
  personaStreetAddress: function() {
    let street_address = this && this[0] && this[0].addresses && this[0].addresses[0].street_address;
    if (street_address) {
      street_address = street_address.split("\n");
      return street_address;
    }
    return;
  }
});
