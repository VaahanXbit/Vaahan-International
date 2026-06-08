<?php
/**
 * Vaahan Core — Shortcodes
 * includes/shortcodes.php
 *
 * Usage examples in articles:
 *   [vaahan_verdict result="yes" text="Get ABS. Non-negotiable."]
 *   [vaahan_callout]Important point about this feature[/vaahan_callout]
 *   [vaahan_lead_form type="insurance"]
 *   [vaahan_toc]
 *   [vaahan_feature_box title="What is ABS?" icon="🛡️"]Content here[/vaahan_feature_box]
 */

if ( ! defined( 'ABSPATH' ) ) exit;


/* ============================================================
   1. VERDICT BOX
   Shows a clear yes/no/depends recommendation at end of articles
   Usage: [vaahan_verdict result="yes" text="Get ABS. Non-negotiable."]
   ============================================================ */

function vaahan_shortcode_verdict( $atts ) {
    $atts = shortcode_atts( array(
        'result' => 'depends',
        'text'   => '',
    ), $atts, 'vaahan_verdict' );

    $result = sanitize_text_field( $atts['result'] );
    $text   = sanitize_text_field( $atts['text'] );

    $config = array(
        'yes'     => array( 'icon' => '✅', 'label' => 'Verdict: Buy It',      'class' => 'verdict-yes' ),
        'no'      => array( 'icon' => '❌', 'label' => 'Verdict: Skip It',     'class' => 'verdict-no' ),
        'depends' => array( 'icon' => '⚠️', 'label' => 'Verdict: It Depends',  'class' => 'verdict-depends' ),
    );

    $c = isset( $config[ $result ] ) ? $config[ $result ] : $config['depends'];

    ob_start();
    ?>
    <div class="vaahan-verdict <?php echo esc_attr( $c['class'] ); ?>">
        <div class="vaahan-verdict-header">
            <span class="vaahan-verdict-icon"><?php echo $c['icon']; ?></span>
            <span class="vaahan-verdict-label"><?php echo esc_html( $c['label'] ); ?></span>
        </div>
        <?php if ( $text ) : ?>
            <p class="vaahan-verdict-text"><?php echo esc_html( $text ); ?></p>
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'vaahan_verdict', 'vaahan_shortcode_verdict' );


/* ============================================================
   2. CALLOUT BOX
   Highlighted information box inside articles
   Usage: [vaahan_callout type="info"]Text here[/vaahan_callout]
   Types: info (default), warning, success
   ============================================================ */

function vaahan_shortcode_callout( $atts, $content = '' ) {
    $atts = shortcode_atts( array(
        'type'  => 'info',
        'title' => '',
    ), $atts, 'vaahan_callout' );

    $type  = sanitize_text_field( $atts['type'] );
    $title = sanitize_text_field( $atts['title'] );

    $icons = array(
        'info'    => '💡',
        'warning' => '⚠️',
        'success' => '✅',
    );

    $icon = isset( $icons[ $type ] ) ? $icons[ $type ] : '💡';

    ob_start();
    ?>
    <div class="vaahan-callout vaahan-callout-<?php echo esc_attr( $type ); ?>">
        <?php if ( $title ) : ?>
            <div class="vaahan-callout-title"><?php echo $icon . ' ' . esc_html( $title ); ?></div>
        <?php endif; ?>
        <div class="vaahan-callout-content">
            <?php echo wp_kses_post( do_shortcode( $content ) ); ?>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'vaahan_callout', 'vaahan_shortcode_callout' );


/* ============================================================
   3. LEAD FORM EMBED
   Embeds a lead capture form inline in articles
   Usage: [vaahan_lead_form type="insurance"]
   Types: insurance, auto_loan, general
   ============================================================ */

function vaahan_shortcode_lead_form( $atts ) {
    $atts = shortcode_atts( array(
        'type'  => 'general',
        'title' => '',
        'cta'   => 'Get Free Quote',
    ), $atts, 'vaahan_lead_form' );

    $type  = sanitize_text_field( $atts['type'] );
    $title = sanitize_text_field( $atts['title'] );
    $cta   = sanitize_text_field( $atts['cta'] );

    // WPForms IDs — update these after creating forms in WordPress admin
    $form_ids = array(
        'insurance' => 1, // TODO: Update with actual WPForms form ID
        'auto_loan' => 2, // TODO: Update with actual WPForms form ID
        'general'   => 3, // TODO: Update with actual WPForms form ID
    );

    $form_id = isset( $form_ids[ $type ] ) ? $form_ids[ $type ] : $form_ids['general'];

    $titles = array(
        'insurance' => '🛡️ Get Free Car Insurance Quote',
        'auto_loan' => '💰 Check Your Car Loan Eligibility',
        'general'   => '📬 Have a Question? Ask Us',
    );

    $display_title = $title ?: ( isset( $titles[ $type ] ) ? $titles[ $type ] : $titles['general'] );

    $subtitles = array(
        'insurance' => 'Compare quotes from top insurers. Free. No spam.',
        'auto_loan' => 'Check eligibility in 2 minutes. No credit score impact.',
        'general'   => 'Ask about any car feature. We reply within 24 hours.',
    );

    $subtitle = isset( $subtitles[ $type ] ) ? $subtitles[ $type ] : '';

    ob_start();
    ?>
    <div class="vaahan-lead-form-wrapper vaahan-lead-form-<?php echo esc_attr( $type ); ?>">
        <h3><?php echo esc_html( $display_title ); ?></h3>
        <?php if ( $subtitle ) : ?>
            <p><?php echo esc_html( $subtitle ); ?></p>
        <?php endif; ?>
        <?php
        // Render WPForms form
        if ( function_exists( 'wpforms_display' ) ) {
            wpforms_display( $form_id, false, true );
        } else {
            // Fallback if WPForms not active
            echo '<p style="color:rgba(255,255,255,0.5);font-size:0.85rem;">Form loading... If you see this message, please contact us at hello@vaahan-international.com</p>';
        }
        ?>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'vaahan_lead_form', 'vaahan_shortcode_lead_form' );


/* ============================================================
   4. TABLE OF CONTENTS PLACEHOLDER
   JS in vaahan.js auto-generates content
   Usage: [vaahan_toc]
   ============================================================ */

function vaahan_shortcode_toc( $atts ) {
    $atts = shortcode_atts( array(
        'title' => 'In This Article',
    ), $atts, 'vaahan_toc' );

    ob_start();
    ?>
    <div class="vaahan-toc">
        <div class="vaahan-toc-title">📋 <?php echo esc_html( $atts['title'] ); ?></div>
        <!-- JS in vaahan.js populates this automatically -->
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'vaahan_toc', 'vaahan_shortcode_toc' );


/* ============================================================
   5. FEATURE BOX
   Structured info box — used to explain what a feature is
   Usage: [vaahan_feature_box title="What is ABS?" icon="🛡️"]Content[/vaahan_feature_box]
   ============================================================ */

function vaahan_shortcode_feature_box( $atts, $content = '' ) {
    $atts = shortcode_atts( array(
        'title' => '',
        'icon'  => '⚙️',
    ), $atts, 'vaahan_feature_box' );

    ob_start();
    ?>
    <div class="vaahan-feature-box">
        <?php if ( $atts['title'] ) : ?>
            <div class="vaahan-feature-box-header">
                <span class="vaahan-feature-box-icon"><?php echo $atts['icon']; ?></span>
                <h4 class="vaahan-feature-box-title"><?php echo esc_html( $atts['title'] ); ?></h4>
            </div>
        <?php endif; ?>
        <div class="vaahan-feature-box-content">
            <?php echo wp_kses_post( do_shortcode( $content ) ); ?>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'vaahan_feature_box', 'vaahan_shortcode_feature_box' );


/* ============================================================
   6. COMPARISON TABLE
   Quick yes/no comparison table for feature verdicts
   Usage: [vaahan_compare feature="ABS" 
           pro1="Steering control in emergency"
           pro2="Useful on wet roads"
           con1="Does not reduce braking distance"
           con2="Limited benefit on loose gravel"]
   ============================================================ */

function vaahan_shortcode_compare( $atts ) {
    $atts = shortcode_atts( array(
        'feature' => '',
        'pro1'    => '', 'pro2' => '', 'pro3' => '',
        'con1'    => '', 'con2' => '', 'con3' => '',
    ), $atts, 'vaahan_compare' );

    $pros = array_filter( array( $atts['pro1'], $atts['pro2'], $atts['pro3'] ) );
    $cons = array_filter( array( $atts['con1'], $atts['con2'], $atts['con3'] ) );

    if ( ! $pros && ! $cons ) return '';

    ob_start();
    ?>
    <div class="vaahan-compare-table">
        <?php if ( $atts['feature'] ) : ?>
            <div class="vaahan-compare-title"><?php echo esc_html( $atts['feature'] ); ?> — Quick Summary</div>
        <?php endif; ?>
        <div class="vaahan-compare-grid">
            <?php if ( $pros ) : ?>
            <div class="vaahan-compare-col vaahan-compare-pros">
                <div class="vaahan-compare-col-header">✅ What it does</div>
                <ul>
                    <?php foreach ( $pros as $pro ) : ?>
                        <li><?php echo esc_html( $pro ); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php endif; ?>
            <?php if ( $cons ) : ?>
            <div class="vaahan-compare-col vaahan-compare-cons">
                <div class="vaahan-compare-col-header">❌ What it doesn't do</div>
                <ul>
                    <?php foreach ( $cons as $con ) : ?>
                        <li><?php echo esc_html( $con ); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php endif; ?>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'vaahan_compare', 'vaahan_shortcode_compare' );
