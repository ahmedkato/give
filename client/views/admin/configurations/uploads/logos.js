import { clearImage } from '/imports/api/miscFunctions';

Template.Logos.helpers( {
  images: function () {
    return Images.find().count() ? Images.find() : false;
  },
});

Template.Logos.events({
  'click .clear-image': function(e) {
    let type = $(e.currentTarget).data('el-type');
    return clearImage(type);
  }
});