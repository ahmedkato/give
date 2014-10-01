var Future = Meteor.npmRequire("fibers/future");

Utils = {
    extractFromPromise: function(promise) {
    var fut = new Future();
    promise.then(function (result) {
        fut.return(result);
    }, function (error) {
        logger.info(error);
        fut.throw(error);
    });
    return fut.wait();
    },
    checkInputs: function(form) {
        return typeof form.customer[0].fname;
    },
    getBillySubscriptionGUID: function(invoiceID){
        var IDs = {};
        var invoice = HTTP.get("https://billy.balancedpayments.com/v1/invoices/" + invoiceID, {
                auth: Meteor.settings.billy_key + ':'
        });
        logger.info("getBillySubscriptionGUID");
        console.dir(invoice);
        IDs.subscription_guid = invoice.data.subscription_guid;
        logger.info("Got the subscription_guid: " + IDs.subscription_guid);
        if(Donate.findOne({'recurring.subscriptions.guid': IDs.subscription_guid})){
            IDs.id = Donate.findOne({'recurring.subscriptions.guid': IDs.subscription_guid})._id;
            logger.info("Got the _id: " + IDs.id);
        }else{
            logger.error("Couldn't find the subscription for this invoice...bummer: " + invoiceID);
            return;
        }

        //update the collection with this invoice
        var invoice_guid = invoice.data.guid;
        var setModifier = { $set: {} };
        setModifier.$set['recurring.invoices.' + invoice_guid] = invoice.data;
        Donate.update({_id: IDs.id}, setModifier);
        return IDs;
    },
    getInvoice: function(subGUID){
        var resultSet;
        resultSet = HTTP.post("https://billy.balancedpayments.com/v1/subscriptions/" + subGUID + "/invoices", {
            auth: Meteor.settings.billy_key + ':'
        });
        return resultSet;
    },
    send_initial_email: function (id) {
    try {
      logger.info("Started send_initial_email with ID: " + id + " --------------------------");
      var error = {};
      var lookup_record = Donate.findOne({_id: id});
      var created_at = moment(Date.parse(lookup_record.created_at)).format('MM/DD/YYYY');
      console.log(created_at);
      var debit = lookup_record.debit;
      var customer = lookup_record.customer;
      var fees = debit.fees;
      logger.info("Cover the fees = " + debit.coveredTheFees);
      logger.info("debit.status: " + debit.status);
      var slug;
      if (debit.status === "failed") {
        return '';
        } else {
        slug = "donation-initial-email";
      }
      Meteor.Mandrill.sendTemplate({
        key: Meteor.settings.mandrillKey,
        templateSlug: slug,
        templateContent: [
          {}
        ],
        mergeVars: [
          {
            "rcpt": customer.email_address,
            "vars": [
            {
              "name": "CreatedAt",
              "content": created_at
            },
            {
              "name": "DEV",
              "content": Meteor.settings.dev
            },
              {
                "name": "DonatedTo",
                "content": debit.donateTo
              }, {
                "name": "DonateWith", //eventually send the card brand and the last four instead of just this
                "content": debit.donateWith
              }, {
                "name": "GiftAmount",
                "content": debit.amount / 100
              }, {
                "name": "GiftAmountFees",
                "content": fees / 100
              }, {
                "name": "TotalGiftAmount",
                "content": debit.total_amount / 100
              }, {
                "name": "FailureReason",
                "content": error.failure_reason
               },{
                "name": "FailureReasonCode",
                "content": error.failure_reason_code
              },{
                "name": "FULLNAME",
                "content": customer.fname + " " + customer.lname
            }, {
                "name": "ADDRESS_LINE1",
                "content": customer.address_line1
            }, {
                "name": "ADDRESS_LINE2",
                "content": customer.address_line2
            }, {
                "name": "LOCALITY",
                "content": customer.city
            }, {
                "name": "REGION",
                "content": customer.region
            }, {
                "name": "POSTAL_CODE",
                "content": customer.postal_code
            }, {
                "name": "PHONE",
                "content": customer.phone_number
            }, {
                "name": "ReceiptNumber",
                "content": id
            }, {
                "name": "Path",
                "content": 'thanks'
            }, {
                "name": "ReceiptOrTransNumber",
                "content": id
            }
            ]
          }
        ],
        toEmail: customer.email_address
      });
    } //End try
    catch (e) {
      logger.error('Mandril sendEmailOutAPI Method error message: ' + e.message);
      logger.error('Mandril sendEmailOutAPI Method error: ' + e);
      throw new Meteor.error(e);
    }
  },
    send_one_time_email: function (id) {
    try {
      logger.info("Started send_one_time_email with ID: " + id + " --------------------------");
      var error = {};
      var lookup_record = Donate.findOne({_id: id});
      var created_at = moment(Date.parse(lookup_record.created_at)).format('MM/DD/YYYY');
      console.log(created_at);
      var debit = lookup_record.debit;
      var customer = lookup_record.customer;
      var fees = debit.fees;
      logger.info("Cover the fees = " + debit.coveredTheFees);
      logger.info("debit.status: " + debit.status);
      var slug;
      if (debit.status === "failed") {
        error = lookup_record.failed;
        slug = "failedpayment";
        } else if (debit.coveredTheFees){
        slug = "fall-2014-donation-electronic-receipt-with-fees";
      } else {
        slug = "fall-2014-donation-electronic-receipt";
      }
      Meteor.Mandrill.sendTemplate({
        key: Meteor.settings.mandrillKey,
        templateSlug: slug,
        templateContent: [
          {}
        ],
        mergeVars: [
          {
            "rcpt": customer.email_address,
            "vars": [
            {
              "name": "CreatedAt",
              "content": created_at
            },
            {
              "name": "DEV",
              "content": Meteor.settings.dev
            },
              {
                "name": "DonatedTo",
                "content": debit.donateTo
              }, {
                "name": "DonateWith", //eventually send the card brand and the last four instead of just this
                "content": debit.donateWith
              }, {
                "name": "GiftAmount",
                "content": debit.amount / 100
              }, {
                "name": "GiftAmountFees",
                "content": fees / 100
              }, {
                "name": "TotalGiftAmount",
                "content": debit.total_amount / 100
              }, {
                "name": "FailureReason",
                "content": error.failure_reason
               },{
                "name": "FailureReasonCode",
                "content": error.failure_reason_code
              },{
                "name": "FULLNAME",
                "content": customer.fname + " " + customer.lname
            }, {
                "name": "ADDRESS_LINE1",
                "content": customer.address_line1
            }, {
                "name": "ADDRESS_LINE2",
                "content": customer.address_line2
            }, {
                "name": "LOCALITY",
                "content": customer.city
            }, {
                "name": "REGION",
                "content": customer.region
            }, {
                "name": "POSTAL_CODE",
                "content": customer.postal_code
            }, {
                "name": "PHONE",
                "content": customer.phone_number
            }, {
                "name": "ReceiptNumber",
                "content": id
            }, {
                "name": "Path",
                "content": 'thanks'
            }, {
                "name": "ReceiptOrTransNumber",
                "content": id
            }
            ]
          }
        ],
        toEmail: customer.email_address
      });
    } //End try
    catch (e) {
      logger.error('Mandril sendEmailOutAPI Method error message: ' + e.message);
      logger.error('Mandril sendEmailOutAPI Method error: ' + e);
      throw new Meteor.error(e);
    }
  },
    send_billy_email: function (id, transaction_guid, status) {
    try {
      logger.info("Started send_billy_email with ID: " + id + " --------------------------");
      logger.info("Started send_billy_email with transaction_guid: " + transaction_guid + " --------------------------");
      logger.info("Started send_billy_email with status: " + status + " --------------------------");
      var error = {};
      
      var lookup_record = Donate.findOne({_id: id});
      var created_at = moment(lookup_record.recurring.transactions[transaction_guid].created_at).format('MM/DD/YYYY');
      var debit = lookup_record.debit;
      console.log("**********HERE IS WHAT YOU ARE LOOKING FOR******************");
      console.dir(debit);
      var customer = lookup_record.customer;
      var fees = (debit.fees);
      logger.info("Cover the fees = " + debit.coveredTheFees);
      logger.info("Transaction Status: " + lookup_record.recurring.transactions[transaction_guid].status);

      console.log("HERE*******" + transaction_guid);
      var slug;
      //TODO: Fix this so that it looks into the transaciton sub-document, not just into the top level, or when it fails, put the transaction GUID into the failed record 
      //that is probably the way to go. 
      if (status === "failed") {
        error = lookup_record.failed;
        slug = "failedpayment";
        } else if (debit.coveredTheFees){
        slug = "fall-2014-donation-electronic-receipt-with-fees";
      } else {
        slug = "fall-2014-donation-electronic-receipt";
      }
      Meteor.Mandrill.sendTemplate({
        key: Meteor.settings.mandrillKey,
        templateSlug: slug,
        templateContent: [
          {}
        ],
        mergeVars: [
          {
            "rcpt": customer.email_address,
            "vars": [
            {
              "name": "CreatedAt",
              "content": created_at
            },
            {
              "name": "DEV",
              "content": Meteor.settings.dev
            },
             {
                "name": "ReceiptOrTransNumber",
                "content": transaction_guid
            },
              {
                "name": "DonatedTo",
                "content": debit.donateTo
              }, {
                "name": "DonateWith", //eventually send the card brand and the last four instead of just this
                "content": debit.donateWith
              }, {
                "name": "GiftAmount",
                "content": debit.amount /100
              }, {
                "name": "GiftAmountFees",
                "content": fees / 100
              }, {
                "name": "TotalGiftAmount",
                "content": debit.total_amount / 100
              }, {
                "name": "FailureReason",
                "content": error.failure_reason
               },{
                "name": "FailureReasonCode",
                "content": error.failure_reason_code
              },{
                "name": "FULLNAME",
                "content": customer.fname + " " + customer.lname
            }, {
                "name": "ADDRESS_LINE1",
                "content": customer.address_line1
            }, {
                "name": "ADDRESS_LINE2",
                "content": customer.address_line2
            }, {
                "name": "LOCALITY",
                "content": customer.city
            }, {
                "name": "REGION",
                "content": customer.region
            }, {
                "name": "POSTAL_CODE",
                "content": customer.postal_code
            }, {
                "name": "PHONE",
                "content": customer.phone_number
            }, {
                "name": "ReceiptNumber",
                "content": id
            }, {
                "name": "Path",
                "content": 'gift'
            }, {
                "name": "TransactionGUID",
                "content": transaction_guid
            }
            ]
          }
        ],
        toEmail: customer.email_address
      });
    } //End try
    catch (e) {
      logger.error('Mandril sendEmailOutAPI Method error message: ' + e.message);
      logger.error('Mandril sendEmailOutAPI Method error: ' + e);
      throw new Meteor.error(e);
    }
  }

};