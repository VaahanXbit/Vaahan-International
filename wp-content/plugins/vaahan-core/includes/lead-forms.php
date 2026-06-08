<?php
/**
 * Vaahan Core — Lead Forms
 * includes/lead-forms.php
 *
 * Handles lead form submissions, storage, and routing to partners.
 * All lead data stored in wp_vaahan_leads table (created on plugin activation).
 */

if ( ! defined( 'ABSPATH' ) ) exit;


/* ============================================================
   1. AJAX HANDLER — LEAD FORM SUBMISSION
   Receives form data, validates, stores in DB, sends to partner
   ============================================================ */

function vaahan_handle_lead_submission() {

    // Verify nonce
    if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( $_POST['nonce'], 'vaahan_lead_nonce' ) ) {
        wp_send_json_error( array( 'message' => 'Security check failed.' ) );
    }

    // Sanitize all inputs
    $data = array(
        'lead_type'    => sanitize_text_field( $_POST['lead_type']   ?? 'general' ),
        'name'         => sanitize_text_field( $_POST['name']        ?? '' ),
        'email'        => sanitize_email(      $_POST['email']       ?? '' ),
        'phone'        => sanitize_text_field( $_POST['phone']       ?? '' ),
        'city'         => sanitize_text_field( $_POST['city']        ?? '' ),
        'car_budget'   => sanitize_text_field( $_POST['car_budget']  ?? '' ),
        'intent'       => sanitize_text_field( $_POST['intent']      ?? '' ),
        'source_url'   => esc_url_raw(         $_POST['source_url']  ?? '' ),
        'utm_source'   => sanitize_text_field( $_POST['utm_source']  ?? '' ),
        'utm_medium'   => sanitize_text_field( $_POST['utm_medium']  ?? '' ),
        'utm_campaign' => sanitize_text_field( $_POST['utm_campaign']?? '' ),
    );

    // Basic validation
    if ( empty( $data['name'] ) || empty( $data['email'] ) || empty( $data['phone'] ) ) {
        wp_send_json_error( array( 'message' => 'Name, email and phone are required.' ) );
    }

    if ( ! is_email( $data['email'] ) ) {
        wp_send_json_error( array( 'message' => 'Please enter a valid email address.' ) );
    }

    // Store in database
    $lead_id = vaahan_store_lead( $data );

    if ( ! $lead_id ) {
        wp_send_json_error( array( 'message' => 'Something went wrong. Please try again.' ) );
    }

    // Send notification email to admin
    vaahan_notify_admin( $lead_id, $data );

    // TODO: Send to partner API (PolicyBazaar, HDFC etc.)
    // vaahan_send_to_partner( $lead_id, $data );

    wp_send_json_success( array(
        'message' => 'Thank you! We will get back to you within 24 hours.',
        'lead_id' => $lead_id,
    ));
}
add_action( 'wp_ajax_vaahan_lead_submit',        'vaahan_handle_lead_submission' );
add_action( 'wp_ajax_nopriv_vaahan_lead_submit', 'vaahan_handle_lead_submission' );


/* ============================================================
   2. STORE LEAD IN DATABASE
   ============================================================ */

function vaahan_store_lead( $data ) {
    global $wpdb;

    $table = $wpdb->prefix . 'vaahan_leads';

    $inserted = $wpdb->insert(
        $table,
        array(
            'lead_type'    => $data['lead_type'],
            'name'         => $data['name'],
            'email'        => $data['email'],
            'phone'        => $data['phone'],
            'city'         => $data['city'],
            'car_budget'   => $data['car_budget'],
            'intent'       => $data['intent'],
            'source_url'   => $data['source_url'],
            'utm_source'   => $data['utm_source'],
            'utm_medium'   => $data['utm_medium'],
            'utm_campaign' => $data['utm_campaign'],
            'status'       => 'new',
            'created_at'   => current_time( 'mysql' ),
        ),
        array( '%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s' )
    );

    return $inserted ? $wpdb->insert_id : false;
}


/* ============================================================
   3. ADMIN NOTIFICATION EMAIL
   ============================================================ */

function vaahan_notify_admin( $lead_id, $data ) {

    $to      = get_option( 'admin_email' );
    $subject = '[Vaahan] New ' . strtoupper( $data['lead_type'] ) . ' Lead — ' . $data['name'];

    $message  = "New lead received on Vaahan International.\n\n";
    $message .= "Lead ID:    #" . $lead_id . "\n";
    $message .= "Type:       " . $data['lead_type'] . "\n";
    $message .= "Name:       " . $data['name'] . "\n";
    $message .= "Email:      " . $data['email'] . "\n";
    $message .= "Phone:      " . $data['phone'] . "\n";
    $message .= "City:       " . $data['city'] . "\n";
    $message .= "Budget:     " . $data['car_budget'] . "\n";
    $message .= "Intent:     " . $data['intent'] . "\n";
    $message .= "Source URL: " . $data['source_url'] . "\n";
    $message .= "UTM Source: " . $data['utm_source'] . "\n";
    $message .= "\nView all leads: " . admin_url( 'admin.php?page=vaahan-leads' ) . "\n";

    wp_mail( $to, $subject, $message );
}


/* ============================================================
   4. PARTNER API INTEGRATION
   TODO: Implement after partner agreements are signed
   ============================================================ */

function vaahan_send_to_partner( $lead_id, $data ) {
    global $wpdb;

    $partner_map = array(
        'insurance' => 'policybazaar',
        'auto_loan' => 'hdfc_bank',
        'general'   => null,
    );

    $partner = isset( $partner_map[ $data['lead_type'] ] ) ? $partner_map[ $data['lead_type'] ] : null;
    if ( ! $partner ) return;

    // TODO: Replace with actual partner API endpoint and credentials
    $api_endpoints = array(
        'policybazaar' => array(
            'url'    => 'https://api.policybazaar.com/leads', // placeholder
            'key'    => get_option( 'vaahan_policybazaar_api_key', '' ),
        ),
        'hdfc_bank' => array(
            'url'    => 'https://api.hdfcbank.com/leads', // placeholder
            'key'    => get_option( 'vaahan_hdfc_api_key', '' ),
        ),
    );

    if ( empty( $api_endpoints[ $partner ]['key'] ) ) return;

    $response = wp_remote_post( $api_endpoints[ $partner ]['url'], array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $api_endpoints[ $partner ]['key'],
            'Content-Type'  => 'application/json',
        ),
        'body'    => wp_json_encode( array(
            'name'   => $data['name'],
            'email'  => $data['email'],
            'phone'  => $data['phone'],
            'city'   => $data['city'],
            'budget' => $data['car_budget'],
            'source' => 'vaahan-international.com',
        )),
        'timeout' => 15,
    ));

    // Log result
    $success = ! is_wp_error( $response ) && wp_remote_retrieve_response_code( $response ) === 200;

    $wpdb->update(
        $wpdb->prefix . 'vaahan_leads',
        array(
            'partner_sent'    => $success ? 1 : 0,
            'partner_name'    => $partner,
            'partner_sent_at' => current_time( 'mysql' ),
        ),
        array( 'id' => $lead_id ),
        array( '%d', '%s', '%s' ),
        array( '%d' )
    );
}
