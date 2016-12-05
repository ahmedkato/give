Template.DonationToDuplicates.helpers({
  selectableDesignation(){
    if(this.memo) {
      console.log( "false" );
      return false;
    } else {
      return true;
    }
  },
});

Template.DonationToDuplicates.events({
  'change [name="donateToDuplicate"]'() {
    let config = ConfigDoc();
    let writeInDonationTypeId = config.Settings.DonorTools.writeInDonationTypeId;

    if (writeInDonationTypeId.indexOf(Number($('[name="donateToDuplicate"]').val())) === -1 ) {
      $('#giftNoteText').hide();
      Session.set('showWriteIn', 'no');
      // setup modal for entering give toward information
      if ($('[name="donateToDuplicate"]').val() && $('[name="donateToDuplicate"]').val().toLowerCase() === 'trips') {
        Session.set("workingWithSplitID", this._id);

        $('#modal_for_trips').modal({
          show: true,
          backdrop: 'static'
        });
      }
    } else {
      Session.set('showWriteIn', 'yes');
      // setup modal for entering give toward information
      $('#modal_for_write_in').modal({
        show: true,
        backdrop: 'static'
      });
    }
    //Session.set('params.donateTo', $('[name="donateToDuplicate"]').val());
  }
});