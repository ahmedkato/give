function logEvent(type) {
  logger.info(type + ': event processed');
}

Stripe_Events = {
  'account.updated': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'account.application.deauthorized': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'application_fee.created': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'application_fee.refunded': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'balance.available': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'charge.pending': function (stripeEvent) {
    StripeFunctions.audit_charge( stripeEvent.data.object.id, 'pending' );
    let subscription_cursor, invoice_cursor, subscription_id, interval, invoice_object;

    console.log(stripeEvent);
    if( stripeEvent.data.object.invoice ) {
      invoice_cursor = Invoices.findOne({_id: stripeEvent.data.object.invoice});
      // It is possible that the invoice event hasn't been received by our server
      if(invoice_cursor && invoice_cursor.id) {
        subscription_cursor = Subscriptions.findOne({_id: invoice_cursor.subscription});
        subscription_id = invoice_cursor.subscription;
      } else {
        invoice_object = StripeFunctions.get_invoice(stripeEvent.data.object.invoice);
        subscription_cursor = Subscriptions.findOne( { _id: invoice_object.subscription } );
        console.log(invoice_object);
        subscription_id = invoice_object.subscription;
      }
      interval = subscription_cursor.plan.interval;

      Utils.send_donation_email( true, stripeEvent.data.object.id, stripeEvent.data.object.amount, stripeEvent.type,
        stripeEvent, interval, subscription_id );

    } else {
      Utils.send_donation_email(false, stripeEvent.data.object.id, stripeEvent.data.object.amount, stripeEvent.type,
        stripeEvent, "One Time", null);
    }
    logEvent( stripeEvent.type + ': event processed' );
    return;
  },
  'charge.succeeded': function (stripeEvent) {
    StripeFunctions.audit_charge(stripeEvent.data.object.id, 'succeeded');
    console.log(stripeEvent);
    let send_successful_email;

    if(stripeEvent.data.object.refunded){
      logger.warn("This successful charge has been refunded.");
    }
    if(stripeEvent.data.object.invoice) {
      let wait_for_metadata_update = Utils.update_charge_metadata(stripeEvent);

      let invoice_cursor = Invoices.findOne({_id: stripeEvent.data.object.invoice});
      let subscription_cursor = Subscriptions.findOne({_id: invoice_cursor.subscription});

      console.log(invoice_cursor._id);
      Utils.send_donation_email( true, stripeEvent.data.object.id, stripeEvent.data.object.amount, stripeEvent.type,
        stripeEvent, subscription_cursor.plan.interval, invoice_cursor.subscription );
      if(stripeEvent.data.object.amount >= 50000) {
        send_successful_email = Utils.send_donation_email( true, stripeEvent.data.object.id, stripeEvent.data.object.amount, 'large_gift',
          stripeEvent, subscription_cursor.plan.interval, invoice_cursor.subscription );
      }
    } else {
      send_successful_email = Utils.send_donation_email(false, stripeEvent.data.object.id, stripeEvent.data.object.amount, stripeEvent.type,
        stripeEvent, "One Time", null);
      if(stripeEvent.data.object.amount >= 50000) {
        Utils.send_donation_email( false, stripeEvent.data.object.id, stripeEvent.data.object.amount, 'large_gift',
          stripeEvent, "One Time", null );
      }
    }
    logEvent(stripeEvent.type);
    return;
  },
  'charge.failed': function (stripeEvent) {
    StripeFunctions.audit_charge(stripeEvent.data.object.id, 'failed');

    if(stripeEvent.data.object.refunds && stripeEvent.data.object.refunds.data &&
      stripeEvent.data.object.refunds.data[0] && stripeEvent.data.object.refunds.data[0].id){
      let refund_object = Utils.stripe_get_refund(stripeEvent.data.object.refunds.data[0].id);
      console.log(refund_object);
      Refunds.upsert({_id: refund_object.id}, refund_object);
    }
    // TODO: send failed email
    if(stripeEvent.data.object.invoice) {
      let wait_for_metadata_update = Utils.update_charge_metadata( stripeEvent );

      let invoice_cursor = Invoices.findOne( { _id: stripeEvent.data.object.invoice } );
      let subscription_cursor = Subscriptions.findOne( { _id: invoice_cursor.subscription } );

      console.log( invoice_cursor._id );
      Utils.send_donation_email( true, stripeEvent.data.object.id, stripeEvent.data.object.amount, stripeEvent.type,
        stripeEvent, subscription_cursor.plan.interval, invoice_cursor.subscription );
    } else {
      Utils.send_donation_email( false, stripeEvent.data.object.id, stripeEvent.data.object.amount, stripeEvent.type,
        stripeEvent, "One Time", null );
    }
    logEvent(stripeEvent.type);
    return;
  },
  'charge.refunded': function (stripeEvent) {
    StripeFunctions.audit_charge(stripeEvent.data.object.id, 'refunded');
    let refund_object = Utils.stripe_get_refund(stripeEvent.data.object.refunds.data[0].id);
    console.log(refund_object);
    Refunds.upsert({_id: refund_object.id}, refund_object);
    logEvent(stripeEvent.type);
    return;
  },
  'charge.captured': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'charge.updated': function (stripeEvent) {
    // TODO: Need to handle this
    logEvent(stripeEvent.type);
    return;
  },
  'charge.dispute.created': function (stripeEvent) {
    //TODO: need to send me an email so I can check into this
    logEvent(stripeEvent.type);
    return;
  },
  'charge.dispute.updated': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'charge.dispute.closed': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.created': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.updated': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.deleted': function (stripeEvent) {
    var user_with_customer_email = Meteor.users.findOne({'emails.address': stripeEvent.data.object.email});

    Customers.remove({_id: stripeEvent.data.object.id});

    // Remove the devices associated with this customer
    stripeEvent.data.object.sources.data.forEach(function(element){
        console.log("Removing this device: " + element.id);
        Devices.remove({_id: element.id});
    });

    var other_customers = Customers.findOne({email: stripeEvent.data.object.email});

    // check to see if the customer that was deleted was also set as the primary customer for this user
    // if so, put the next customer record in its place, copying the data from the first into the second.
    if(other_customers && user_with_customer_email.primary_customer_id === stripeEvent.data.object.id){
        Meteor.users.update({'emails.address': stripeEvent.data.object.email}, {$set: {primary_customer_id: other_customers._id}});
    }

    logEvent(stripeEvent.type);
    return;
  },
  'customer.card.created': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.card.updated': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.source.deleted': function (stripeEvent) {
    Devices.remove({_id: stripeEvent.data.object.id});
    logEvent(stripeEvent.type);
    return;
  },
  'customer.bank_account.deleted': function (stripeEvent) {
    Devices.remove({_id: stripeEvent.data.object.id});
    logEvent(stripeEvent.type);
    return;
  },
  'customer.card.deleted': function (stripeEvent) {
    Devices.remove({_id: stripeEvent.data.object.id});
    logEvent(stripeEvent.type);
    return;
  },
  'customer.source.created': function (stripeEvent) {
    StripeFunctions.store_stripe_event(stripeEvent);
    logEvent(stripeEvent.type);
    return;
  },
  'customer.source.updated': function (stripeEvent) {
    StripeFunctions.store_stripe_event(stripeEvent);
    logEvent(stripeEvent.type);
    return;
  },
  'customer.subscription.created': function (stripeEvent) {
    StripeFunctions.store_stripe_event(stripeEvent);
    logEvent(stripeEvent.type);
    return;
  },
  'customer.subscription.updated': function (stripeEvent) {
    StripeFunctions.store_stripe_event(stripeEvent);
    logEvent(stripeEvent.type);
    return;
  },
  'customer.subscription.deleted': function (stripeEvent) {
    StripeFunctions.store_stripe_event(stripeEvent);

    Utils.send_cancelled_email_to_admin(stripeEvent.data.object.id, stripeEvent);

    // TODO: setup an email for sending to the user as well
    // TODO: include a link to resubscribe

    logEvent(stripeEvent.type);
    return;
  },
  'customer.subscription.trial_will_end': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.discount.created': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.discount.updated': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'customer.discount.deleted': function (stripeEvent) {
    StripeFunctions.store_stripe_event(stripeEvent);
    logEvent(stripeEvent.type);
    return;
  },
  'invoice.created': function (stripeEvent) {
    Utils.add_meta_from_subscription_to_charge(stripeEvent);

    logEvent(stripeEvent.type);
    return;
  },
  'invoice.updated': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'invoice.payment_succeeded': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'invoice.payment_failed': function (stripeEvent) {
    // TODO: Need to handle this
    logEvent(stripeEvent.type);
    return;
  },
  'invoiceitem.created': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'invoiceitem.updated': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'invoiceitem.deleted': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'plan.created': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'plan.updated': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'plan.deleted': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'coupon.created': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'coupon.deleted': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'recipient.created': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'recipient.updated': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'recipient.deleted': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'transfer.created': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'transfer.updated': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'transfer.paid': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'transfer.failed': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'bitcoin.receiver.created': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'bitcoin.receiver.transaction.created': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'bitcoin.receiver.filled': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  },
  'ping': function (stripeEvent) {
    logEvent(stripeEvent.type);
    return;
  }
};