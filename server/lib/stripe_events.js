function logEvent(type) {
  logger.info(type + ': event processed');
}

Stripe_Events = {
  'account.updated': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'account.application.deauthorized': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'application_fee.created': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'application_fee.refunded': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'balance.available': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'charge.pending': function(stripeEvent) {
    logEvent( stripeEvent.type + ': event processed' );

    let subscription_cursor, invoice_cursor, subscription_id, interval, invoice_object;

    if ( stripeEvent.data.object.invoice ) {
      invoice_cursor = Invoices.findOne({_id: stripeEvent.data.object.invoice});
      // It is possible that the invoice event hasn't been received by our server
      if (invoice_cursor && invoice_cursor.id) {
        subscription_cursor = Subscriptions.findOne({_id: invoice_cursor.subscription});
        subscription_id = invoice_cursor.subscription;
      } else {
        invoice_object = StripeFunctions.get_invoice(stripeEvent.data.object.invoice);
        subscription_cursor = Subscriptions.findOne( { _id: invoice_object.subscription } );
        console.log(invoice_object);
        subscription_id = invoice_object.subscription;
      }
      const intervalCount = subscription_cursor.plan.interval_count;
      interval = subscription_cursor.plan.interval;
      if (intervalCount === 6 && interval === 'month') {
        interval = 'semi-annual';
      } else if (intervalCount === 2 && interval === 'week') {
        interval = 'bi-week';
      }

      Utils.send_donation_email( true, stripeEvent.data.object.id, stripeEvent.data.object.amount, stripeEvent.type,
        stripeEvent, interval, subscription_id );
    } else {
      Utils.send_donation_email(false, stripeEvent.data.object.id, stripeEvent.data.object.amount, stripeEvent.type,
        stripeEvent, "One Time", null);
    }
    return;
  },
  'charge.succeeded': function(stripeEvent) {
    logEvent(stripeEvent.type);

    let send_successful_email;
    const config = ConfigDoc();

    if (stripeEvent.data.object.refunded) {
      logger.warn("This successful charge has been refunded.");
    }
    if (stripeEvent.data.object.invoice) {
      const wait_for_metadata_update = Utils.update_charge_metadata(stripeEvent);

      const invoice_cursor = Invoices.findOne({_id: stripeEvent.data.object.invoice});
      const subscription_cursor = Subscriptions.findOne({_id: invoice_cursor.subscription});

      const intervalCount = subscription_cursor.plan.interval_count;
      let interval = subscription_cursor.plan.interval;
      if (intervalCount === 6 && interval === 'month') {
        interval = 'semi-annual';
      } else if (intervalCount === 2 && interval === 'week') {
        interval = 'bi-week';
      }
      Utils.send_donation_email( true, stripeEvent.data.object.id, stripeEvent.data.object.amount, stripeEvent.type,
        stripeEvent, interval, invoice_cursor.subscription );
      if (config && config.OrgInfo && config.OrgInfo.emails && config.OrgInfo.emails.largeGiftThreshold) {
        if (stripeEvent.data.object.amount >= (config.OrgInfo.emails.largeGiftThreshold * 100)) {
          send_successful_email = Utils.send_donation_email( true, stripeEvent.data.object.id, stripeEvent.data.object.amount, 'large_gift',
            stripeEvent, interval, invoice_cursor.subscription );
        }
      }
    } else {
      send_successful_email = Utils.send_donation_email(false, stripeEvent.data.object.id, stripeEvent.data.object.amount, stripeEvent.type,
        stripeEvent, "One Time", null);
      if (config && config.OrgInfo && config.OrgInfo.emails && config.OrgInfo.emails.largeGiftThreshold) {
        if ( stripeEvent.data.object.amount >= (config.OrgInfo.emails.largeGiftThreshold * 100) ) {
          Utils.send_donation_email( false, stripeEvent.data.object.id, stripeEvent.data.object.amount, 'large_gift',
            stripeEvent, "One Time", null );
        }
      }
    }
    return;
  },
  'charge.failed': function(stripeEvent) {
    logEvent(stripeEvent.type);

    const event = {
      relatedDoc: stripeEvent.data.object.id,
      category: 'Stripe',
      relatedCollection: 'Charges',
      type: 'charge.failed',
      page: '/thanks?charge=' + stripeEvent.data.object.id
    };
    Utils.audit_event(event);

    if (stripeEvent.data.object.refunds && stripeEvent.data.object.refunds.data &&
      stripeEvent.data.object.refunds.data[0] && stripeEvent.data.object.refunds.data[0].id) {
      const refund_object = Utils.stripe_get_refund(stripeEvent.data.object.refunds.data[0].id);
      Refunds.upsert({_id: refund_object.id}, refund_object);
    }
    if (stripeEvent.data.object.invoice) {
      const wait_for_metadata_update = Utils.update_charge_metadata( stripeEvent );

      const invoiceCursor = Invoices.findOne( { _id: stripeEvent.data.object.invoice } );
      const subscriptionCursor = Subscriptions.findOne( { _id: invoiceCursor.subscription } );

      Utils.send_donation_email( true, stripeEvent.data.object.id, stripeEvent.data.object.amount, stripeEvent.type,
        stripeEvent, subscriptionCursor.plan.interval, invoiceCursor.subscription );

      if (invoiceCursor.attempt_count && invoiceCursor.attempt_count === 3) {
        const config = ConfigDoc();

        const customerCursor = Customers.findOne({_id: stripeEvent.data.object.customer});
        const URL = Meteor.absoluteUrl('user/subscriptions/card/change?s=' + subscriptionCursor.id + '&c=' + customerCursor.id);
        const companyName = customerCursor.metadata.business_name || "";
        const fullName = customerCursor.metadata.fname + " " + customerCursor.metadata.lname;
        const emailMessage = ((companyName || fullName) + "'s gift of $" + (stripeEvent.data.object.amount / 100).toFixed(2) +
        " failed to process " + invoiceCursor.attempt_count + " times. " +
        "The card's last 4 digits are " + stripeEvent.data.object.source.last4 + ". " +
        'To see this person in DonorTools click this link. ' + config.Settings.DonorTools.url + "/people/" +
        (customerCursor && customerCursor.metadata && customerCursor.metadata.dt_persona_id) +
        ' To fix the payment method click the button below.');
        const emailObject = {
          to: config.OrgInfo.emails.canceledGift,
          previewLine: ", " + companyName || fullName + "'s gift failed to process",
          type: 'Failed Gift',
          emailMessage,
          buttonText: 'Fix/Change the Payment Method',
          buttonURL: URL
        };

        Utils.sendEmailNotice(emailObject);

        const failedEvent = {
          id: stripeEvent.data.object.id,
          type: "Failed Email",
          relatedCollection: 'Charges',
          failureCode: stripeEvent.data.object.failure_code,
          failureMessage: stripeEvent.data.object.failure_message
        };

        failedEvent.emailSentTo = config.OrgInfo.emails.canceledGift;
        failedEvent.category = 'Email';
        failedEvent.page = emailObject.buttonURL;
        Utils.audit_event(failedEvent);
      }
    } else {
      Utils.send_donation_email( false, stripeEvent.data.object.id, stripeEvent.data.object.amount, stripeEvent.type,
        stripeEvent, "One Time", null );
    }
    return;
  },
  'charge.refunded': function(stripeEvent) {
    logEvent(stripeEvent.type);

    const event = {
      id: stripeEvent.data.object.id,
      category: 'Stripe',
      relatedCollection: 'Charges',
      type: 'charge.refunded',
      page: '/thanks?charge=' + stripeEvent.data.object.id
    };
    Utils.audit_event(event);
    const refund_object = Utils.stripe_get_refund(stripeEvent.data.object.refunds.data[0].id);
    Refunds.upsert({_id: refund_object.id}, refund_object);
    return;
  },
  'charge.captured': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'charge.updated': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'charge.dispute.created': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'charge.dispute.updated': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'charge.dispute.closed': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.created': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.updated': function(stripeEvent) {
    logEvent(stripeEvent.type);
    /* let customer = Utils.get_stripe_customer(stripeEvent.data.object.id);
    Customers.update({_id: customer.id}, {$set: customer});*/
    return;
  },
  'customer.deleted': function(stripeEvent) {
    const user_with_customer_email = Meteor.users.findOne({'emails.address': stripeEvent.data.object.email});

    Customers.remove({_id: stripeEvent.data.object.id});

    // Remove the devices associated with this customer
    stripeEvent.data.object.sources.data.forEach(function(element) {
      console.log("Removing this device: " + element.id);
      Devices.remove({_id: element.id});
    });

    const other_customers = Customers.findOne({email: stripeEvent.data.object.email});

    // check to see if the customer that was deleted was also set as the primary customer for this user
    // if so, put the next customer record in its place, copying the data from the first into the second.
    if (other_customers && user_with_customer_email.primary_customer_id === stripeEvent.data.object.id) {
      Meteor.users.update({'emails.address': stripeEvent.data.object.email}, {$set: {primary_customer_id: other_customers._id}});
    }

    logEvent(stripeEvent.type);
    return;
  },
  'customer.card.created': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.card.updated': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.source.deleted': function(stripeEvent) {
    Devices.remove({_id: stripeEvent.data.object.id});
    logEvent(stripeEvent.type);
    return;
  },
  'customer.bank_account.deleted': function(stripeEvent) {
    Devices.remove({_id: stripeEvent.data.object.id});
    logEvent(stripeEvent.type);
    return;
  },
  'customer.card.deleted': function(stripeEvent) {
    Devices.remove({_id: stripeEvent.data.object.id});
    logEvent(stripeEvent.type);
    return;
  },
  'customer.source.created': function(stripeEvent) {
    StripeFunctions.store_stripe_event(stripeEvent);
    logEvent(stripeEvent.type);
    return;
  },
  'customer.source.updated': function(stripeEvent) {
    StripeFunctions.store_stripe_event(stripeEvent);
    logEvent(stripeEvent.type);
    return;
  },
  'customer.subscription.created': function(stripeEvent) {
    StripeFunctions.store_stripe_event(stripeEvent);
    logEvent(stripeEvent.type);
    return;
  },
  'customer.subscription.updated': function(stripeEvent) {
    StripeFunctions.store_stripe_event(stripeEvent);
    logEvent(stripeEvent.type);
    return;
  },
  'customer.subscription.deleted': function(stripeEvent) {
    StripeFunctions.store_stripe_event(stripeEvent);

    Utils.send_cancelled_email_to_admin(stripeEvent.data.object.id, stripeEvent);

    // TODO: setup an email for sending to the user as well
    // TODO: include a link to resubscribe
    // This is so that at any time they can click that link and get their gift going again

    logEvent(stripeEvent.type);
    return;
  },
  'customer.subscription.trial_will_end': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.discount.created': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.discount.updated': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.discount.deleted': function(stripeEvent) {
    StripeFunctions.store_stripe_event(stripeEvent);
    logEvent(stripeEvent.type);
    return;
  },
  'invoice.created': function(stripeEvent) {
    Utils.add_meta_from_subscription_to_charge(stripeEvent);

    logEvent(stripeEvent.type);
    return;
  },
  'invoice.updated': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'invoice.payment_succeeded': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'invoice.payment_failed': function(stripeEvent) {
    // TODO: Need to handle this
    logEvent(stripeEvent.type);
    return;
  },
  'invoiceitem.created': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'invoiceitem.updated': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'invoiceitem.deleted': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'plan.created': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'plan.updated': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'plan.deleted': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'coupon.created': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'coupon.deleted': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'recipient.created': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'recipient.updated': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'recipient.deleted': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'transfer.created': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'transfer.updated': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'transfer.paid': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'transfer.failed': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'bitcoin.receiver.created': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'bitcoin.receiver.transaction.created': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'bitcoin.receiver.filled': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'ping': function(stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  }
};
