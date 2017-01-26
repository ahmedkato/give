Template.UpdateDTDonationForm.events({
  'submit form': function(e) {
    e.preventDefault();

    console.log("Form Submited");
    console.log($('#donation-id').val());

    Meteor.call("updateDTDonation", $('#donation-id').val(), function(err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
        $('#update_dt_donation_form')[0].reset();
        Bert.alert("Updated that donation", "success");
      }
    });
  }
});
