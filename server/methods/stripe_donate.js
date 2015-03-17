var Future = Npm.require('fibers/future');

Meteor.methods({
    stripeDonation: function(data, paymentDevice, type){
        logger.info("Started stripeDonation");
        try {
            //Check the form to make sure nothing malicious is being submitted to the server
            Utils.checkFormFields(data);

            //Convert donation to more readable format
            var donateTo = Utils.getDonateTo(data.paymentInformation.donateTo);

            if(donateTo === 'Write In') {
                donateTo = data.paymentInformation.writeIn;
            }

            // Does the user exist in the Meteor user's collection?
            var lookupCustomer = Meteor.users.findOne({"emails.address": data.customer.email_address});

            // If the user doesn't exist in the Meteor user's collection, run the below code
            if ( !lookupCustomer ) {
                logger.info("Didn't find that user in the Meteor user's collection.");

                var customerData = Utils.create_customer(data.paymentInformation.id, data.customer);
                if(!customerData.object){
                    return {error: customerData.rawType, message: customerData.message};
                }
                console.dir(customerData);
                // break up the function for testing.
                return customerData;

                data._id = Donations.insert({
                    created_at: data.paymentInformation.created_at,
                    sessionId: data.sessionId,
                    URL: data.URL,
                    'donateTo': donateTo,
                    'donateWith': data.paymentInformation.donateWith,
                    'type': data.paymentInformation.type,
                    'total_amount': data.paymentInformation.total_amount,
                    'amount': data.paymentInformation.amount,
                    'fees': data.paymentInformation.fees,
                    'coveredTheFees': data.paymentInformation.coverTheFees,
                    'customer_id': customerData.id,
                    'status': 'pending'
                });
                logger.info("ID: " + data._id);

                //Runs if the form used was the credit card form, which sets type as part of the array which is passed to this server side function

                if (data.paymentInformation.donateWith === "Card") {

                    //Get the card data from balanced and store it
                    var card = Utils.get_card(customerData._id, data.paymentInformation.href);

                    //Create a new order
                    var orders = Utils.create_order(data._id, customerData.href);

                    //Associate the card with the balanced customer
                    var associate = Utils.create_association(customerData._id, card.href, customerData.href);

                    //Debit the order
                    var debit_id = Utils.debit_order(data.paymentInformation.total_amount, data._id, customerData._id, orders.href, card.href);

                }
                //for running ACH
                else {
                    console.log(data.paymentInformation.href);

                    //Get the check data from balanced and store it
                    var check = Utils.get_check(customerData._id, data.paymentInformation.href);

                    //Create a new order
                    var orders = Utils.create_order(data._id, customerData.href);

                    //Associate the card with the balanced customer
                    var associate = Utils.create_association(customerData._id, check.href, customerData.href);

                    //Debit the order
                    var debit_id = Utils.debit_order(data.paymentInformation.total_amount, data._id, customerData._id, orders.href, check.href);

                }

                return {c: customerData._id, don: data._id, deb: debit_id};
            }
            // If the user does exist in the Meteor user's collection, run the below code
            else{
                logger.info("Found that user in the Meteor user's collection.");
            }




        } catch (e) {
            logger.error("Got to catch error area of processPayment function." + e + " " + e.reason);
            logger.error("e.category_code = " + e.category_code + " e.descriptoin = " + e.description);
            if(e.category_code) {
                logger.error("Got to catch error area of create_associate. ID: " + data._id + " Category Code: " + e.category_code + ' Description: ' + e.description);
                var debitSubmitted = '';
                if(e.category_code === 'invalid-routing-number'){
                    debitSubmitted = false;
                }
                Donations.update(data._id, {
                    $set: {
                        'failed.category_code': e.category_code,
                        'failed.description': e.description,
                        'failed.eventID': e.request_id,
                        'debit.status': 'failed',
                        'debit.submitted': debitSubmitted
                    }
                });
                throw new Meteor.Error(500, e.category_code, e.description);
            } else {
                throw new Meteor.Error(500, e.reason, e.details);
            }
        }
    }
});
