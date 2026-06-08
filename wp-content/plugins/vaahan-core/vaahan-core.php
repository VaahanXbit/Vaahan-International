<?php
/**
 * Plugin Name:       Vaahan Core
 * Plugin URI:        https://vaahan-international.com
 * Description:       Core functionality for Vaahan International.
 *                    Lead generation forms, shortcodes, widgets, and custom blocks.
 *                    All custom functionality lives here — NOT in the theme.
 * Version:           1.0.0
 * Author:            Vaahan International
 * Text Domain:       vaahan-core
 * Requires WP:       6.0
 * Requires PHP:      7.4
 */

// Block direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Plugin constants
define( 'VAAHAN_PLUGIN_VERSION', '1.0.0' );
define( 'VAAHAN_PLUGIN_DIR',     plugin_dir_path( __FILE__ ) );
define( 'VAAHAN_PLUGIN_URL',     plugin_dir_url( __FILE__ ) );


/* ============================================================
   LOAD INCLUDES
   ============================================================ */

require_once VAAHAN_PLUGIN_DIR . 'includes/shortcodes.php';
require_once VAAHAN_PLUGIN_DIR . 'includes/lead-forms.php';
require_once VAAHAN_PLUGIN_DIR . 'includes/widgets.php';
require_once VAAHAN_PLUGIN_DIR . 'includes/admin.php';


/* ============================================================
   PLUGIN ACTIVATION / DEACTIVATION
   ============================================================ */

function vaahan_activate() {
    // Create lead submissions table on activation
    vaahan_create_leads_table();
    // Flush rewrite rules
    flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'vaahan_activate' );

function vaahan_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'vaahan_deactivate' );


/* ============================================================
   CREATE LEADS DATABASE TABLE
   Stores all lead form submissions for reporting
   ============================================================ */

function vaahan_create_leads_table() {
    global $wpdb;

    $table_name      = $wpdb->prefix . 'vaahan_leads';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id              BIGINT(20)   NOT NULL AUTO_INCREMENT,
        lead_type       VARCHAR(50)  NOT NULL DEFAULT 'general',
        name            VARCHAR(100) NOT NULL DEFAULT '',
        email           VARCHAR(100) NOT NULL DEFAULT '',
        phone           VARCHAR(20)  NOT NULL DEFAULT '',
        city            VARCHAR(50)  NOT NULL DEFAULT '',
        car_budget      VARCHAR(50)  NOT NULL DEFAULT '',
        intent          VARCHAR(50)  NOT NULL DEFAULT '',
        source_url      TEXT,
        utm_source      VARCHAR(100) DEFAULT '',
        utm_medium      VARCHAR(100) DEFAULT '',
        utm_campaign    VARCHAR(100) DEFAULT '',
        partner_sent    TINYINT(1)   DEFAULT 0,
        partner_name    VARCHAR(100) DEFAULT '',
        partner_sent_at DATETIME     DEFAULT NULL,
        status          VARCHAR(20)  DEFAULT 'new',
        notes           TEXT,
        created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY lead_type   (lead_type),
        KEY status      (status),
        KEY created_at  (created_at)
    ) $charset_collate;";

    require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
    dbDelta( $sql );
}


/* ============================================================
   ENQUEUE PLUGIN ASSETS
   ============================================================ */

function vaahan_core_enqueue_assets() {
    wp_enqueue_style(
        'vaahan-core-css',
        VAAHAN_PLUGIN_URL . 'assets/css/vaahan-core.css',
        array(),
        VAAHAN_PLUGIN_VERSION
    );

    wp_enqueue_script(
        'vaahan-core-js',
        VAAHAN_PLUGIN_URL . 'assets/js/vaahan-core.js',
        array( 'jquery' ),
        VAAHAN_PLUGIN_VERSION,
        true
    );

    wp_localize_script( 'vaahan-core-js', 'vaahanCore', array(
        'ajaxUrl' => admin_url( 'admin-ajax.php' ),
        'nonce'   => wp_create_nonce( 'vaahan_lead_nonce' ),
    ));
}
add_action( 'wp_enqueue_scripts', 'vaahan_core_enqueue_assets' );
