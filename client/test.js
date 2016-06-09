/**
 * Created by joshuabechard on 6/9/16.
 */
var test = {
  "amount":       parseInt( ((Give.getCleanValue( '#amount' ).replace( /[^\d\.\-\ ]/g, '' )) * 100).toFixed( 0 ), 10 ),
  "coverTheFees": $( '#coverTheFees' ).is( ":checked" ),
  "created_at":   new Date().getTime() / 1000 | 0,
  "donateTo":     Give.getCleanValue( "#donateTo" ),
  "donateWith":   Give.getCleanValue( '#donateWith' ),
  "dt_source":    Give.getCleanValue( '#dt_source' ),
  "is_recurring": Give.getCleanValue( '#is_recurring' ),
  "note":         Give.getCleanValue( "#note" ),
  "saved":        $( '#save_payment' ).is( ":checked" ),
  "start_date":   moment( new Date( Give.getCleanValue( '#start_date' ) ) ).format( 'X' ),
  "total_amount": parseInt( (Give.getCleanValue( '#total_amount' ) * 100).toFixed( 0 ), 10 )
}

var test1 = {
  "amount":               parseInt( ((Give.getCleanValue( '#amount' ).replace( /[^\d\.\-\ ]/g, '' )) * 100).toFixed( 0 ), 10 ),
  "total_amount":         parseInt( (Give.getCleanValue( '#total_amount' ) * 100).toFixed( 0 ), 10 ),
  "donateTo":             Give.getCleanValue( "#donateTo" ),
  "note":                 Give.getCleanValue( "#note" ),
  "donateWith":           Give.getCleanValue( '#donateWith' ),
  "is_recurring":         Give.getCleanValue( '#is_recurring' ),
  "coverTheFees":         $( '#coverTheFees' ).is( ":checked" ),
  "created_at":           new Date().getTime() / 1000 | 0,
  "start_date":           moment( new Date( Give.getCleanValue( '#start_date' ) ) ).format( 'X' ),
  "saved":                $( '#save_payment' ).is( ":checked" ),
  "send_scheduled_email": "no"
}

var test2 = {
  "amount":       parseInt( ((Give.getCleanValue( '#amount' ).replace( /[^\d\.\-\ ]/g, '' )) * 100).toFixed( 0 ), 10 ),
  "total_amount": parseInt( (Give.getCleanValue( '#total_amount' ) * 100).toFixed( 0 ), 10 ),
  "coverTheFees": $( '#coverTheFees' ).is( ":checked" ),
  "created_at":   new Date().getTime() / 1000 | 0,
  "donateTo":     Give.getCleanValue( "#donateTo" ),
  "donateWith":   Give.getCleanValue( "#donateWith" ),
  "dt_source":    Give.getCleanValue( '#dt_source' ),
  "is_recurring": Give.getCleanValue( '#is_recurring' ),
  "saved":        $( '#save_payment' ).is( ":checked" ),
  "start_date":   moment( new Date( Give.getCleanValue( '#start_date' ) ) ).format( 'X' ),
  "note":      Give.getCleanValue( "#note" )
}