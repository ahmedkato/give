/*****************************************************************************/
/* OrgInfo: Helpers */
/*****************************************************************************/
Template.OrgInfo.helpers({
  updateDoc: function () {
    return MultiConfig.findOne({_id: "trashmountain"} );
  }
});