Template.Thanks.onRendered(function() {
    // Turn it off - remove the function entirely
    window.onbeforeunload = null;
    $('#modal_for_user_give_form').modal('hide');
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
});

Template.Thanks.helpers({
  charge(){
    return Charges.findOne();
  },
  displayReceipt: function () {
    let charge = Charges.findOne();
    let debitStatus =  charge && charge.status;
    let refundStatus =  charge && charge.refunded;
    return (debitStatus === 'succeeded' && !refundStatus);
  },
  successOrPendingPayment: function () {
    return (this.status === 'succeeded' || this.status === 'pending' || this.status == null);
  },
    successOrPendingTrans: function () {
      return "<h3 class='text-center'>Thank you for your gift!</h3>\
        <p class='alert alert-info'>\
          You will receive an email acknowledgement immediately and an email receipt after your gift has been successfully processed.\
          This page will automatically show your gift receipt once the payment has been approved. <strong>For ACH gifts it may take up to a \
          seven days to receive an email receipt.</strong> \
        </p>\
        <p id='success_pending_icon' class='text-center alert alert-success'>\
          <i class='fa fa-check-square large-check'></i>\
        </p>";
    },
    failedTrans: function () {
      let config = ConfigDoc();

      var referrer = Donations.findOne().URL;
      var errorMessage = Charges.findOne().failure_code ? Charges.findOne().failure_code + " " + Charges.findOne().failure_message : 'The error we got from the card \
        processor was not very helpful so instead of displaying their cryptic error message you got this message, sorry we could not be more helpful.';
      if(!referrer || !errorMessage) {
        return "<h3 class='text-center badText'>Something went wrong.</h3>\
        <p class='text-center alert alert-error'>\
          We weren't able to process your gift. Please <a href='" + config.OrgInfo.web.domain_name + "/landing'>go back</a> and try again.\
          <br>\
          <a id='failed_icon' href='" + config.OrgInfo.web.domain_name + "/landing'><i class='fa fa-arrow-left large-arrow'></i></a>\
        </p>";
      }
      return "<h3 class='text-center badText'>Something went wrong.</h3>\
        <p class='text-center alert alert-error'>\
          We weren't able to process your gift. Here is the error: <br><strong>" + errorMessage + "</strong><br> Please <a href='" + referrer + "'>go back</a> and try again.\
          <br>\
          <a id='failed_icon' href='" + referrer + "'><i class='fa fa-arrow-left large-arrow'></i></a>\
        </p>";
  },
  refundedTrans: function () {
    let config = ConfigDoc();
    return "<h3 class='text-center badText'>This gift has been refunded.</h3>\
      <p class='text-center alert alert-error'>\
        <i class='fa fa-undo large-arrow'></i>\
      </p>";
  },
  refunded(){
    return this && this.refunded;
  }
});

Template.Thanks.events({
    'click #userProfileButton': function (e){
        //prevent the default reaction to submitting this form
        e.preventDefault();
        // Stop propagation prevents the form from being submitted more than once.
        e.stopPropagation();
        Router.go('user.profile');
    }
});