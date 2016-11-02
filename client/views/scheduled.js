Template.DonationScheduled.helpers({
  frequency: function() {
    if (Session.get('params.frequency') &&
      Session.get('params.frequency') === 'one_time') {
      return 'one-time';
    } else {
      return Session.get('params.frequency');
    }
  },
  amount: function() {
    return Session.get('params.amount');
  },
  start_date: function() {
    if (Session.get('params.startdate')){
      if (Session.get('params.startdate') ==='today'){
        return moment().format('DD MMMM, YYYY');
      } else {
        return moment(Session.get('params.startdate') * 1000).format('DD MMMM, YYYY');
      }
    }
  },
  one_time_language: function () {
    if (Session.get('params.frequency') &&
      Session.get('params.frequency') === 'one_time') {
      return true;
    } else {
      return false;
    }
  }
});

Template.DonationScheduled.onRendered(function() {
  $('#modal_for_user_give_form').modal('hide');
  $('#modal_for_admin_give_form').modal('hide');
  $('body').removeClass('modal-open');
  $('.modal-backdrop').remove();
  Session.set("loading", false);
});
