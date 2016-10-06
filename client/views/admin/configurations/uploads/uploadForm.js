Template.uploadForm.onRendered(function () {
  import "/imports/ui/stylesheets/custom.css";
});
Template.uploadForm.onCreated(function () {
  this.currentUpload = new ReactiveVar(false);
});

Template.uploadForm.helpers({
  currentUpload: function () {
    return Template.instance().currentUpload.get();
  }
});

Template.uploadForm.events({
  'click .file-area'(e){
    // Since the file area is being hidden, click the hidden button
    let clickMe = $(e.currentTarget).children('input')[0];
    clickMe.click();
  },
  'change [name="fileInput"]': function (e, template) {
    if (e.currentTarget.files && e.currentTarget.files[0]) {
      let imageType = e.currentTarget.getAttribute('data-imagetype');
      console.log(imageType);
      let fundId = e.currentTarget.getAttribute('data-fundid');

      var upload = Images.insert({
        meta: {[imageType]:  "_true"},
        file:       e.currentTarget.files[0],
        streams:    'dynamic',
        chunkSize:  'dynamic'
      }, false);

      upload.on('start', function () {
        template.currentUpload.set(this);
      });

      upload.on('end', function (error, fileObj) {
        if (error) {
          alert('Error during upload: ' + error);
        } else {
          alert('File "' + fileObj.name + '" successfully uploaded');

          // Hide the popovers, they get stuck open if the mouse if over the popover area when
          // an image upload ends
          $('.popover').popover('hide');
        }
        template.currentUpload.set(false);
      });

      upload.start();
    }
  }
});