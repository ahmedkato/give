Template.QuestionModal.onCreated(function(){
  this.autorun(()=>{
    this.subscribe('dtPersonaEmails');
  });

  // update personas here
  Meteor.call("updateDTPersonas");
});

Template.QuestionModal.helpers({
  dtPersona(){
    return DT_personas.find();
  },
  mainEmail(){
    if (this.address_type_id === 5){
      return 'checked';
    }
  }
});

Template.QuestionModal.events({
  'click #yes-button'(){
    const personas = DT_personas.find();

    Bert.alert({
      message: "Great, thanks",
      type: 'success',
      icon: 'fa-smile-o',
      style: 'growl-bottom-right'
    });

    let showEmailModal = false;
    personas.forEach((persona) =>{
      Meteor.call("updateTag", persona._id, true, function (err, res) {
        if (err) {
          console.error(err);
        } else {
          console.log(res);
        }
      });
      if(persona.email_addresses.length > 1) {
        showEmailModal = true;
      }
    });

    // Since we are attempting to update DT, we will want to wait to call the update document function.
    Meteor.setTimeout(function () {
      Meteor.call('update_user_document_by_adding_persona_details_for_each_persona_id');
    }, 500);

    if (showEmailModal) {
      $( '#primary-email-modal' ).modal( { show: true } );
    } else {
      Meteor.call("setAnsweredTrue", "endOfYearStatement");
    }
  },
  'click #no-button'(){
    Bert.alert({
      message: "If you change your mind, you can always check the highlighted box on this page. Thanks",
      type: 'success',
      icon: 'fa-smile-o',
      style: 'growl-bottom-right'
    });
    $("html, body").animate({ scrollTop: ($("#receiveEndOfYearElectronically").offset().top - 50) }, "slow");
    $('#tag-selections').css({border: 'solid #48c9b0'}).animate({borderWidth: 4}, 500).animate({borderWidth: 0}, 1000);
    Meteor.call("setAnsweredTrue", "endOfYearStatement");
  },
  'click .answer'(){
    $('#question-modal').modal('hide');
  },
  'click #save-primary-email'(){
    const selected = [];
    $('.primary-email-question input:checked').each(function() {
      selected.push($(this).val())
    });
    if(selected && selected.length > 0){
      Meteor.call("makeTheseMainEmails", selected);
      Bert.alert({
        message: "Ok, we have updated that, thanks",
        type: 'success',
        icon: 'fa-smile-o',
        style: 'growl-bottom-right'
      });

      Meteor.call("setAnsweredTrue", "endOfYearStatement");
      $('#primary-email-modal').modal('hide');
    }
  }
});
