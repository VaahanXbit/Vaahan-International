<?php
/**
 * Vaahan Core — Admin Panel
 * includes/admin.php
 *
 * Adds a Leads dashboard in WordPress admin.
 * Shows all lead submissions with status, source, and partner info.
 */

if ( ! defined( 'ABSPATH' ) ) exit;


/* ============================================================
   1. REGISTER ADMIN MENU
   ============================================================ */

function vaahan_admin_menu() {
    add_menu_page(
        'Vaahan Leads',
        'Vaahan Leads',
        'manage_options',
        'vaahan-leads',
        'vaahan_leads_page',
        'dashicons-car',
        30
    );

    add_submenu_page(
        'vaahan-leads',
        'All Leads',
        'All Leads',
        'manage_options',
        'vaahan-leads',
        'vaahan_leads_page'
    );

    add_submenu_page(
        'vaahan-leads',
        'Settings',
        'Settings',
        'manage_options',
        'vaahan-settings',
        'vaahan_settings_page'
    );
}
add_action( 'admin_menu', 'vaahan_admin_menu' );


/* ============================================================
   2. LEADS LIST PAGE
   ============================================================ */

function vaahan_leads_page() {
    global $wpdb;
    $table = $wpdb->prefix . 'vaahan_leads';

    // Filters
    $type   = isset( $_GET['type'] )   ? sanitize_text_field( $_GET['type'] )   : '';
    $status = isset( $_GET['status'] ) ? sanitize_text_field( $_GET['status'] ) : '';

    // Build query
    $where = 'WHERE 1=1';
    if ( $type )   $where .= $wpdb->prepare( ' AND lead_type = %s', $type );
    if ( $status ) $where .= $wpdb->prepare( ' AND status = %s', $status );

    $leads = $wpdb->get_results( "SELECT * FROM $table $where ORDER BY created_at DESC LIMIT 100" );
    $total = $wpdb->get_var( "SELECT COUNT(*) FROM $table" );
    $new   = $wpdb->get_var( "SELECT COUNT(*) FROM $table WHERE status = 'new'" );

    ?>
    <div class="wrap">
        <h1 style="display:flex;align-items:center;gap:10px;">
            🚗 Vaahan Leads
            <span style="font-size:0.75rem;background:#C9A800;color:#1A2545;padding:3px 10px;border-radius:20px;font-weight:700;">
                <?php echo $new; ?> New
            </span>
        </h1>

        <!-- Stats row -->
        <div style="display:flex;gap:1rem;margin:1rem 0 1.5rem;">
            <?php
            $stats = array(
                'Total Leads'     => $total,
                'Insurance Leads' => $wpdb->get_var( "SELECT COUNT(*) FROM $table WHERE lead_type='insurance'" ),
                'Auto Loan Leads' => $wpdb->get_var( "SELECT COUNT(*) FROM $table WHERE lead_type='auto_loan'" ),
                'Sent to Partner' => $wpdb->get_var( "SELECT COUNT(*) FROM $table WHERE partner_sent=1" ),
            );
            foreach ( $stats as $label => $count ) :
            ?>
            <div style="background:#1A2545;color:white;padding:1rem 1.5rem;border-radius:8px;min-width:140px;">
                <div style="font-size:1.75rem;font-weight:800;color:#C9A800;"><?php echo $count; ?></div>
                <div style="font-size:0.75rem;opacity:0.6;margin-top:2px;"><?php echo $label; ?></div>
            </div>
            <?php endforeach; ?>
        </div>

        <!-- Filter bar -->
        <form method="get" style="margin-bottom:1rem;">
            <input type="hidden" name="page" value="vaahan-leads">
            <select name="type">
                <option value="">All Types</option>
                <option value="insurance" <?php selected( $type, 'insurance' ); ?>>Insurance</option>
                <option value="auto_loan" <?php selected( $type, 'auto_loan' ); ?>>Auto Loan</option>
                <option value="general"   <?php selected( $type, 'general' ); ?>>General</option>
            </select>
            <select name="status" style="margin-left:0.5rem;">
                <option value="">All Status</option>
                <option value="new"       <?php selected( $status, 'new' ); ?>>New</option>
                <option value="contacted" <?php selected( $status, 'contacted' ); ?>>Contacted</option>
                <option value="converted" <?php selected( $status, 'converted' ); ?>>Converted</option>
            </select>
            <input type="submit" class="button" value="Filter" style="margin-left:0.5rem;">
            <a href="<?php echo admin_url( 'admin.php?page=vaahan-leads' ); ?>" class="button" style="margin-left:0.5rem;">Reset</a>
            <a href="<?php echo admin_url( 'admin-ajax.php?action=vaahan_export_leads&nonce=' . wp_create_nonce('vaahan_export') ); ?>"
               class="button button-primary" style="margin-left:0.5rem;">Export CSV</a>
        </form>

        <!-- Leads table -->
        <table class="widefat fixed striped" style="font-size:0.85rem;">
            <thead>
                <tr>
                    <th style="width:40px;">ID</th>
                    <th style="width:80px;">Type</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>City</th>
                    <th>Budget</th>
                    <th style="width:80px;">Partner Sent</th>
                    <th style="width:80px;">Status</th>
                    <th>Date</th>
                    <th>Source</th>
                </tr>
            </thead>
            <tbody>
                <?php if ( $leads ) : ?>
                    <?php foreach ( $leads as $lead ) : ?>
                    <tr>
                        <td><?php echo $lead->id; ?></td>
                        <td>
                            <span style="background:#EFF6FF;color:#1E40AF;padding:2px 8px;border-radius:20px;font-size:0.7rem;font-weight:600;text-transform:uppercase;">
                                <?php echo esc_html( $lead->lead_type ); ?>
                            </span>
                        </td>
                        <td><?php echo esc_html( $lead->name ); ?></td>
                        <td><?php echo esc_html( $lead->email ); ?></td>
                        <td><?php echo esc_html( $lead->phone ); ?></td>
                        <td><?php echo esc_html( $lead->city ); ?></td>
                        <td><?php echo esc_html( $lead->car_budget ); ?></td>
                        <td style="text-align:center;">
                            <?php echo $lead->partner_sent ? '✅' : '—'; ?>
                        </td>
                        <td>
                            <?php
                            $status_colors = array(
                                'new'       => '#C9A800',
                                'contacted' => '#2563EB',
                                'converted' => '#16A34A',
                            );
                            $color = $status_colors[ $lead->status ] ?? '#94A3B8';
                            ?>
                            <span style="color:<?php echo $color; ?>;font-weight:600;text-transform:capitalize;">
                                <?php echo esc_html( $lead->status ); ?>
                            </span>
                        </td>
                        <td style="color:#94A3B8;font-size:0.75rem;">
                            <?php echo date( 'd M Y, H:i', strtotime( $lead->created_at ) ); ?>
                        </td>
                        <td style="font-size:0.72rem;color:#94A3B8;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                            <?php echo esc_html( $lead->utm_source ?: parse_url( $lead->source_url, PHP_URL_PATH ) ); ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                <?php else : ?>
                    <tr>
                        <td colspan="11" style="text-align:center;padding:2rem;color:#94A3B8;">
                            No leads yet. Once visitors submit forms, they appear here.
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?php
}


/* ============================================================
   3. SETTINGS PAGE
   ============================================================ */

function vaahan_settings_page() {

    if ( isset( $_POST['vaahan_save_settings'] ) && wp_verify_nonce( $_POST['_wpnonce'], 'vaahan_settings' ) ) {
        update_option( 'vaahan_policybazaar_api_key', sanitize_text_field( $_POST['vaahan_policybazaar_api_key'] ?? '' ) );
        update_option( 'vaahan_hdfc_api_key',         sanitize_text_field( $_POST['vaahan_hdfc_api_key']         ?? '' ) );
        update_option( 'vaahan_admin_email',           sanitize_email(      $_POST['vaahan_admin_email']           ?? '' ) );
        echo '<div class="notice notice-success"><p>Settings saved.</p></div>';
    }

    ?>
    <div class="wrap">
        <h1>🔧 Vaahan Settings</h1>
        <form method="post">
            <?php wp_nonce_field( 'vaahan_settings' ); ?>

            <h2>Partner API Keys</h2>
            <p style="color:#94A3B8;font-size:0.875rem;">
                Add API keys once partner agreements are signed. Leave blank until then.
            </p>
            <table class="form-table">
                <tr>
                    <th><label for="vaahan_policybazaar_api_key">PolicyBazaar API Key</label></th>
                    <td>
                        <input type="password" id="vaahan_policybazaar_api_key" name="vaahan_policybazaar_api_key"
                               value="<?php echo esc_attr( get_option( 'vaahan_policybazaar_api_key' ) ); ?>"
                               class="regular-text">
                    </td>
                </tr>
                <tr>
                    <th><label for="vaahan_hdfc_api_key">HDFC Bank API Key</label></th>
                    <td>
                        <input type="password" id="vaahan_hdfc_api_key" name="vaahan_hdfc_api_key"
                               value="<?php echo esc_attr( get_option( 'vaahan_hdfc_api_key' ) ); ?>"
                               class="regular-text">
                    </td>
                </tr>
            </table>

            <h2>Notifications</h2>
            <table class="form-table">
                <tr>
                    <th><label for="vaahan_admin_email">Lead Notification Email</label></th>
                    <td>
                        <input type="email" id="vaahan_admin_email" name="vaahan_admin_email"
                               value="<?php echo esc_attr( get_option( 'vaahan_admin_email', get_option( 'admin_email' ) ) ); ?>"
                               class="regular-text">
                        <p class="description">Email address to receive new lead notifications.</p>
                    </td>
                </tr>
            </table>

            <input type="submit" name="vaahan_save_settings" class="button button-primary" value="Save Settings">
        </form>
    </div>
    <?php
}


/* ============================================================
   4. EXPORT LEADS TO CSV
   ============================================================ */

function vaahan_export_leads_csv() {
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorised' );
    if ( ! wp_verify_nonce( $_GET['nonce'] ?? '', 'vaahan_export' ) ) wp_die( 'Nonce failed' );

    global $wpdb;
    $table = $wpdb->prefix . 'vaahan_leads';
    $leads = $wpdb->get_results( "SELECT * FROM $table ORDER BY created_at DESC", ARRAY_A );

    header( 'Content-Type: text/csv' );
    header( 'Content-Disposition: attachment; filename="vaahan-leads-' . date('Y-m-d') . '.csv"' );

    $output = fopen( 'php://output', 'w' );
    if ( $leads ) {
        fputcsv( $output, array_keys( $leads[0] ) ); // Headers
        foreach ( $leads as $row ) {
            fputcsv( $output, $row );
        }
    }
    fclose( $output );
    exit;
}
add_action( 'wp_ajax_vaahan_export_leads', 'vaahan_export_leads_csv' );
