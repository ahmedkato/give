/* DonationForm: Event Handlers and Helpers */
/*****************************************************************************/


// this function is used to update the displayed total
// since we can take payment with card fees added in this is needed to update the
// amount that is shown to the user and passed as total_amount through the form
//display error modal if there is an error while initially submitting data from the form.
function handleErrors(error) {
    spinner.stop();
    $("#spinDiv").hide();

    Session.set("loaded", true);
    if(error.message === "Your card's security code is invalid."){
        var gatherInfo = {};
        gatherInfo.browser = navigator.userAgent;

        $('#modal_for_initial_donation_error').modal({show: true});
        $(".modal-dialog").css("z-index", "1500");
        $('#errorCategory').html(error.code);
        $('#errorDescription').html(error.message);
    } else{

        $('#modal_for_initial_donation_error').modal({show: true});
        $(".modal-dialog").css("z-index", "1500");
        $('#errorCategory').html(error.code);
        $('#errorDescription').html(error.message);
    }

}

function fillForm() {
    if (Session.get("paymentMethod") === "Check") {
        $('#routing_number').val("111000025"); // Invalid test =  fail after initial screen =  valid test = 111000025
        $('#account_number').val("000123456789"); // Invalid test =  fail after initial screen =  valid test = 000123456789
    } else {
        $('#card_number').val("4242424242424242"); //Succeeded = 4242424242424242 Failed = 4242111111111111 AMEX = 378282246310005
        $('#expiry_month option').prop('selected', false).filter('[value=12]').prop('selected', true);
        $('select[name=expiry_month]').change();
        $('#expiry_year option').prop('selected', false).filter('[value=2015]').prop('selected', true);
        $('select[name=expiry_year]').change();
        $('#cvv').val("123"); //CVV mismatch = 200
    }
    $('#fname').val("John");
    $('#lname').val("Doe");
    $('#org').val("");
    $('#email_address').val("josh@trashmountain.org");
    $('#email_address_verify').val('josh@trashmountain.org');
    $('#phone').val("(785) 246-6845");
    $('#address_line1').val("Address Line 1");
    $('#address_line2').val("Address Line 2");
    $('#city').val("Topeka");
    $('#region').val("KS");
    $('#postal_code').val("66618");
    $('#amount').val("1.03");
}

function updateTotal() {
    var data = Session.get('paymentMethod');
    var donationAmount = $('#amount').val();
    donationAmount = donationAmount.replace(/[^\d\.\-\ ]/g, '');
    donationAmount = donationAmount.replace(/^0+/, '');
    if (data === 'Check') {
        if ($.isNumeric(donationAmount)) {
            $("#total_amount").val(donationAmount);
            $("#show_total").hide();
            $("#total_amount_display").text("$" + donationAmount).css({
                'color': '#34495e'
            });
            return Session.set("total_amount", $("#total_amount").val());
        } else {
            return $("#total_amount_display").text("Please enter a number in the amount field.").css({
                'color': 'red'
            });
        }
    } else {
        if (donationAmount < 1 && $.isNumeric(donationAmount)) {
            return $("#total_amount_display").text("Amount cannot be lower than $1.").css({
                'color': 'red'
            });
        } else {
            if ($.isNumeric(donationAmount)) {
                if ($('#coverTheFees').prop('checked')) {
                    $("#show_total").show();
                    Session.set("coverTheFees", true);
                    var fee = (donationAmount * 0.029 + 0.30).toFixed(2);
                    var roundedAmount = (+donationAmount + (+fee)).toFixed(2);
                    $("#total_amount_display").text(" + $" + fee + " = $" + roundedAmount).css({
                        'color': '#34495e'
                    });
                    $("#total_amount").val(roundedAmount);
                    return Session.set("amount", roundedAmount);
                } else {
                    Session.set("coverTheFees", false);
                    $("#total_amount").val(donationAmount);
                    $("#show_total").hide();
                    return $("#total_amount_display").text("").css({
                        'color': '#34495e'
                    });
                }
            } else {
                return $("#total_amount_display").text("Please enter a number in the amount field").css({
                    'color': 'red'
                });
            }
        }
    }
}

function toggleBox() {
    $(':checkbox').checkbox('toggle');
}

//This is the callback for the client side tokenization of cards and bank_accounts.
function handleCalls(payment, form, type) {
    // payment is the token returned from Stripe
    console.dir(payment);
    form.paymentInformation.token_id = payment.id;
    if(type === 'card'){
        form.paymentInformation.source_id = payment.card.id;
    } else {
        form.paymentInformation.source_id = payment.bank_account.id;
    }
    Meteor.call('stripeDonation', form, function (error, result) {
        if (error) {
            //handleErrors is used to check the returned error and the display a user friendly message about what happened that caused
            //the error.
            handleErrors(error);
            //run updateTotal so that when the user resubmits the form the total_amount field won't be blank.
            updateTotal();
        } else {
            console.dir(result);
            if ( result.error ) {
                var send_error = {code: result.error, message: result.message};
                handleErrors(send_error);
                //run updateTotal so that when the user resubmits the form the total_amount field won't be blank.
                updateTotal();
            } else if(result.charge === 'scheduled'){
                // Send the user to the scheduled page and include the frequency and the amount in the url for displaying to them
                Router.go('/give/scheduled/?frequency=' + form.paymentInformation.is_recurring + '&amount=' + form.paymentInformation.amount/100 + '&start_date=' + form.paymentInformation.start_date );
            }else{
                Router.go('/give/thanks?c=' + result.c + "&don=" + result.don + "&charge=" + result.charge);
            }
        }
    });
}

Template.DonationForm.events({
    'submit form': function(e) {
        //prevent the default reaction to submitting this form
        e.preventDefault();
        // Stop propagation prevents the form from being submitted more than once.
        e.stopPropagation();

        if($("#is_recurring").val() === ''){
            $("#s2id_is_recurring").children().addClass("redText");
            return;
        }
        var opts = {color: '#FFF', length: 60, width: 10, lines: 8};
        var target = document.getElementById('spinContainer');
        spinner = new Spinner(opts).spin(target);

        $.fn.scrollView = function () {
            return this.each(function () {
                $('html, body').animate({
                    scrollTop: $(this).offset().top
                }, 1000);
            });
        }
        $('#spinContainer').scrollView();
        $("#spinDiv").show();

        $(window).off('beforeunload');

        updateTotal();
        if (($('#total_amount').val()) > 15000) {
            var error = {};
            error.reason = 'Exceeds processor amount';
            error.details = "<tr>\
                        <td>Sorry, our processor will not allow us to accept gifts larger than $15,000.&nbsp; Here are a couple of options.</td>\
                    <tr>\
                        <td>1. Split your gift into several donations.</td>\
                    </tr>\
                        <td>2. Call us and give your gift over the phone by ACH.&nbsp; <tel>(785)246-6845</tel></td>\
                    </tr>\
                    <tr>\
                        <td>3. Mail your check of any amount to<br> 1555 NW Gage BLVD. <br>Topeka, KS 66618</td>\
                    </tr>\
                </tr>";
            handleErrors(error);
            throw new Meteor.Error(error);
        }


        var form = {
            "paymentInformation": {
                "amount": parseInt(($('#amount').val().replace(/[^\d\.\-\ ]/g, '')) * 100),
                "total_amount": parseInt(($('#total_amount').val() * 100).toFixed(0)),
                "donateTo": $("#donateTo").val(),
                "writeIn": $("#enteredWriteInValue").val(),
                "donateWith": $("#donateWith").val(),
                "is_recurring": $('#is_recurring').val(),
                "coverTheFees": $('#coverTheFees').is(":checked"),
                "created_at": moment().format('MM/DD/YYYY, hh:mm'),
                "start_date": moment(new Date($('#start_date').val())).format('X'),
                "saved": $('#save_payment').is(":checked")
            },
            "customer": {
                "fname": $('#fname').val(),
                "lname": $('#lname').val(),
                "org": $('#org').val(),
                "email_address": $('#email_address').val(),
                "phone_number": $('#phone').val(),
                "address_line1": $('#address_line1').val(),
                "address_line2": $('#address_line2').val(),
                "region": $('#region').val(),
                "city": $('#city').val(),
                "postal_code": $('#postal_code').val(),
                "country": $('#country').val(),
                "created_at": moment().format('MM/DD/YYYY, hh:mma')
            },
            "URL": document.URL,
            sessionId: Meteor.default_connection._lastSessionId
        };

        form.paymentInformation.later = (!moment(new Date($('#start_date').val())).isSame(Date.now(), 'day'));
        if(!form.paymentInformation.later){
            form.paymentInformation.start_date = 'today';
        }

        if (form.paymentInformation.total_amount !== form.paymentInformation.amount) {
            form.paymentInformation.fees = (form.paymentInformation.total_amount - form.paymentInformation.amount);
        }

        if (form.paymentInformation.donateWith === "Card") {
            form.paymentInformation.type = "Card";

            Stripe.card.createToken({
                name: $('#fname').val() + ' ' + $('#lname').val(),
                number: $('#card_number').val(),
                cvc: $('#cvv').val(),
                exp_month: $('#expiry_month').val(),
                exp_year: $('#expiry_year').val(),
                address_line1: $('#address_line1').val(),
                address_line2: $('#address_line2').val(),
                address_city: $('#city').val(),
                address_state: $('#region').val(),
                address_country: $('#country').val(),
                address_zip: $('#postal_code').val()
            },  function(status, response){
                if (response.error) {
                    //error logic here
                    handleErrors(response.error);
                } else {
                    // Call your backend
                    console.log(form.paymentInformation.start_date);
                    handleCalls(response, form, 'card');
                }
            });
        } else {
            form.paymentInformation.type = "Check";
            Stripe.bankAccount.createToken({
                name: $('#fname').val() + ' ' + $('#lname').val(),
                country: $('#country').val(),
                routing_number: $('#routing_number').val(),
                account_number: $('#account_number').val(),
                address_line1: $('#address_line1').val(),
                address_line2: $('#address_line2').val(),
                address_city: $('#city').val(),
                address_state: $('#region').val(),
                address_zip: $('#postal_code').val()
            },  function(status, response){
                if (response.error) {
                    //error logic here
                    handleErrors(response.error);
                } else {
                    // Call your backend
                    handleCalls(response, form, 'check');
                }
            });
        }
    },
    'change #is_recurring': function() {
        if ($("#is_recurring").val() !== 'one_time') {
            Session.set('recurring', true);
            $('#calendarSection').show();
            $("#s2id_is_recurring").children().removeClass("redText");
        } else {
            Session.set('recurring', false);
            $('#calendarSection').hide();
            $("#s2id_is_recurring").children().removeClass("redText");
        }
    },
    'keyup, change #amount': function() {
        return updateTotal();
    },
    // disable mousewheel on a input number field when in focus
    // (to prevent Chromium browsers change of the value when scrolling)
    'focus #amount': function(e, tmpl) {
        $('#amount').on('mousewheel.disableScroll', function(e) {
            e.preventDefault();
        });
    },
    'blur #amount': function(e) {
        $('#amount').on('mousewheel.disableScroll', function(e) {
            e.preventDefault();
        });
        return updateTotal();
    },
    'change [name=coverTheFees]': function() {
        return updateTotal();
    },
    'change [name=donateWith]': function() {
        var selectedValue = $("[name=donateWith]").val();
        Session.set("paymentMethod", selectedValue);
        if(Session.equals("paymentMethod", "Check")){
            updateTotal();
            $("#show_total").hide();
        }
    },
    'change #donateTo': function() {
        if($('#donateTo').val() !== 'WriteIn') {
            $('#giftDesignationText').hide();
        } else {
            Session.set('showWriteIn', 'yes');
            Session.set('params.donateTo', 'WriteIn');
            //setup modal for entering give toward information
            $('#modal_for_write_in').modal({
                show: true,
                backdrop: 'static'
            }, function(e) {
            });
        }
    },
    // keypress input detection for autofilling form with test data
    'keypress input': function(e) {
        if (e.which === 17) { //17 is ctrl + q
            fillForm();
        }
    },
    'focus, blur #cvv': function(e) {
        $('#cvv').on('mousewheel.disableScroll', function(e) {
            e.preventDefault();
        });
    },
    'focus, blur #card_number': function(e) {
        $('#card_number').on('mousewheel.disableScroll', function(e) {
            e.preventDefault();
        });
    },
    'click #write_in_save': function (e) {
        $('#modal_for_write_in').modal('hide');
        function removeParam(key, sourceURL) {
            var rtn = sourceURL.split("?")[0],
                param,
                params_arr = [],
                queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
            if (queryString !== "") {
                params_arr = queryString.split("&");
                for (var i = params_arr.length - 1; i >= 0; i -= 1) {
                    param = params_arr[i].split("=")[0];
                    if (param === key) {
                        params_arr.splice(i, 1);
                    }
                }
                rtn = rtn + "?" + params_arr.join("&");
            }
            return rtn;
        }
        var goHere = removeParam('enteredWriteInValue', window.location.href);
        console.log(goHere);
        Session.set('showWriteIn', 'no');
        var goHere = goHere + '&enteredWriteInValue=' + $('#writeIn').val();
        Router.go(goHere);
        $('#giftDesignationText').show();
    },
    'blur #donation_form input': function (e){
        // TODO: remove this area and use iron-router instead.
        // http://stackoverflow.com/questions/24367914/aborting-navigation-with-meteor-iron-router
        if(document.URL !== "http://127.0.0.1:3000/give/user"){
            $(window).on('beforeunload', function(){
                return "It looks like you have input you haven't submitted."
            });
        }
    },
    'click #userProfileButton': function (e){
        //prevent the default reaction to submitting this form
        e.preventDefault();
        // Stop propagation prevents the form from being submitted more than once.
        e.stopPropagation();
        Router.go('/give/user');
    }

});
Template.DonationForm.helpers({
    paymentQuestionIcon: function(){
        if(Session.equals('paymentMethod', 'Check')){
            return "<i class='makeRightOfInput fa fa-question-circle' id='accountTypeQuestion' data-toggle='popover' " +
                "data-trigger='hover focus' data-container='body' data-content='There are usually 3 sets of "+
                "numbers at the bottom of a check. The short check number, the 9 digit routing number and the" +
                "account number.'>" +
                "</i>";
        } else {
            return "<i class='makeRightOfInput fa fa-question-circle' id='accountTypeQuestion' data-toggle='popover' " +
                "data-trigger='hover focus' data-container='body' data-content='" +
                "Visa®, Mastercard®, and Discover® cardholders: " +
                "Turn your card over and look at the signature box. You should see either the entire 16-digit credit " +
                "card number or just the last four digits followed by a special 3-digit code. This 3-digit code is " +
                "your CVV number / Card Security Code.  " +
                "American Express® cardholders: " +
                "Look for the 4-digit code printed on the front of your card just above and to the right of your " +
                "main credit card number. This 4-digit code is your Card Identification Number (CID). The CID is the " +
                "four-digit code printed just above the Account Number.'" +
                "</i>";
        }

    },
    paymentWithCard: function() {
        return Session.equals("paymentMethod", "Card");
    },
    coverTheFeesChecked: function() {
        return this.coverTheFees ? 'checked' : '';
    },
    attributes_Input_Amount: function() {
        return {
            name: "amount",
            id: "amount",
            type: "digits",
            min: 1,
            required: true
        };
    },
    errorCategory: function() {
        return 'Error Category';
    },
    errorDescription: function() {
        return 'Error Description';
    },
    amount: function() {
        return Session.get('params.amount');
    },
    writeInValue: function () {
        return Session.get('params.enteredWriteInValue');
    },
    today: function () {
        return moment().format('D MMM, YYYY');
    },
    amountWidth: function() {
        if(Session.equals("paymentMethod", "Card")){
            return 'form-group col-md-4 col-sm-4 col-xs-12';
        } else{
            return 'form-group';
        }
    },
    showTotal: function() {
       return Session.equals("coverTheFees", true);
    },
    checkedFeeWidth: function(){
        if(Session.equals("coverTheFees", true)){
            return "form-group";
        } else return "form-group";
    },
    MeteorUser: function(){
        if(Meteor.user()){
            return true;
        } else{
            return false;
        }
    }
});
/*****************************************************************************/
/* DonationForm: Lifecycle Hooks */
/*****************************************************************************/
Template.DonationForm.destroyed = function() {

};
Template.DonationForm.rendered = function() {
    // Setup parsley form validation
    $('#donation_form').parsley();

    //Set the checkboxes to unchecked
    $(':checkbox').radiocheck('uncheck');

    $('[data-toggle="popover"]').popover({html: true});

    // show the datepicker if the frequency is monthly when the page loads
    if(Session.equals('params.recurring', 'monthly')){
        $('#calendarSection').show();
    }
    //setup modal for entering give toward information
    if (Session.equals('params.donateTo', 'WriteIn') && !(Session.equals('showWriteIn', 'no'))) {
        $('#modal_for_write_in').modal({
            show: true,
            backdrop: 'static'
        });
    }

    var datepickerSelector = $('#start_date');
    datepickerSelector.datepicker({
        showOtherMonths: true,
        selectOtherMonths: true,
        dateFormat: 'd MM, yy',
        minDate: 0,
        maxDate: +32
    }).prev('.input-group-btn').on('click', function (e) {
        e && e.preventDefault();
        datepickerSelector.focus();
    });
    $.extend($.datepicker, { _checkOffset: function (inst,offset,isFixed) { return offset; } });

    // Now let's align datepicker with the prepend button
    datepickerSelector.datepicker('widget').css({ 'margin-left': -datepickerSelector.prev('.input-group-btn').find('.btn').outerWidth() + 5 });


};
Template.checkPaymentInformation.helpers({
    attributes_Input_AccountNumber: function() {
        return {
            type: "text",
            id: "account_number",
            placeholder: "Bank Account Number",
            required: true
        };
    },
    attributes_Input_RoutingNumber: function() {
        return {
            type: "text",
            id: "routing_number",
            placeholder: "Routing numbers are 9 digits long",
            required: true
        };
    }
});
//Check Payment Template mods
Template.checkPaymentInformation.rendered = function() {
    $('[data-toggle="popover"]').popover();
    $("#routing_number").mask("999999999");

    $('select').select2({dropdownCssClass: 'dropdown-inverse'});
};
//Card Payment Template mods
Template.cardPaymentInformation.rendered = function() {
    $('[data-toggle="popover"]').popover();
    $('select').select2({dropdownCssClass: 'dropdown-inverse'});

    if (Session.get('params.exp_month')) {
        $("#expiry_month").val(Session.get('params.exp_month'));
    }

    if (Session.get('params.exp_year')) {
        $("#expiry_year").val(Session.get('params.exp_year'));
    }
};