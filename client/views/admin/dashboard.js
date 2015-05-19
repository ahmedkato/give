Template.Dashboard.helpers({
    report_query: function () {
        var startDate = moment().subtract('days', 29).format('YYYY-MM-DD');
        var endDate =  moment().format('YYYY-MM-DD');
        return '?startDate=' + startDate + '&endDate=' + endDate;
    }
});

Template.Dashboard.events({
    'click #get_id': function(e) {
        //prevent the default reaction to submitting this form
        e.preventDefault();
        // Stop propagation prevents the form from being submitted more than once.
        e.stopPropagation();

        Meteor.call("get_balanced_customer_data", $('#stripe_id').val(), function (error, result) {
            if (result) {
                console.dir(result);
                alert("Got it: " + result);
            } else {
                console.log(error);
            }
        });
    },
    'click #new-gift': function(evt){
        evt.preventDefault();
        $('#modal_for_admin_give_form').modal({
            show: true,
            backdrop: 'static'
        });
    }
});