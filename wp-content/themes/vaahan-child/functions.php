<?php
/**
 * Vaahan Child Theme — functions.php
 *
 * All custom functionality for the Vaahan International theme.
 * Rule: Never edit Astra parent theme files. Everything goes here.
 *
 * @package VaahanChild
 * @version 1.0.0
 */

// Block direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}


/* ============================================================
   1. ENQUEUE STYLES & SCRIPTS
   ============================================================ */

function vaahan_child_enqueue_assets() {

    // Load Astra parent theme stylesheet first
    wp_enqueue_style(
        'astra-parent-style',
        get_template_directory_uri() . '/style.css',
        array(),
        wp_get_theme( 'astra' )->get( 'Version' )
    );

    // Load Vaahan child theme stylesheet
    wp_enqueue_style(
        'vaahan-child-style',
        get_stylesheet_directory_uri() . '/style.css',
        array( 'astra-parent-style' ),
        wp_get_theme()->get( 'Version' )
    );

    // Google Fonts — Inter
    wp_enqueue_style(
        'vaahan-google-fonts',
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
        array(),
        null
    );

    // Child theme custom JS
    wp_enqueue_script(
        'vaahan-child-scripts',
        get_stylesheet_directory_uri() . '/assets/js/vaahan.js',
        array( 'jquery' ),
        '1.0.0',
        true // Load in footer
    );

    // Pass data to JS (for AJAX, nonces, etc.)
    wp_localize_script( 'vaahan-child-scripts', 'vaahanData', array(
        'ajaxUrl' => admin_url( 'admin-ajax.php' ),
        'nonce'   => wp_create_nonce( 'vaahan_nonce' ),
        'siteUrl' => get_site_url(),
    ));
}
add_action( 'wp_enqueue_scripts', 'vaahan_child_enqueue_assets' );


/* ============================================================
   2. THEME SETUP
   ============================================================ */

function vaahan_child_theme_setup() {

    // Allow translations
    load_child_theme_textdomain( 'vaahan-child', get_stylesheet_directory() . '/languages' );

    // Add theme support
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'title-tag' );
    add_theme_support( 'html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ));

    // Custom image sizes for article cards
    add_image_size( 'vaahan-card',     800, 450, true );  // Article card thumbnail
    add_image_size( 'vaahan-featured', 1200, 630, true ); // Featured / OG image
    add_image_size( 'vaahan-thumb',    400, 300, true );  // Small thumbnail
}
add_action( 'after_setup_theme', 'vaahan_child_theme_setup' );


/* ============================================================
   3. CUSTOM NAVIGATION MENUS
   ============================================================ */

function vaahan_register_menus() {
    register_nav_menus( array(
        'primary'  => __( 'Primary Navigation', 'vaahan-child' ),
        'footer'   => __( 'Footer Navigation', 'vaahan-child' ),
        'mobile'   => __( 'Mobile Navigation', 'vaahan-child' ),
    ));
}
add_action( 'init', 'vaahan_register_menus' );


/* ============================================================
   4. CUSTOM POST TYPES
   ============================================================ */

/**
 * Register 'Car Feature' custom post type.
 * Used for structured feature explainer articles.
 */
function vaahan_register_post_types() {

    register_post_type( 'car_feature', array(
        'labels' => array(
            'name'               => 'Car Features',
            'singular_name'      => 'Car Feature',
            'add_new'            => 'Add New Feature',
            'add_new_item'       => 'Add New Car Feature',
            'edit_item'          => 'Edit Car Feature',
            'view_item'          => 'View Car Feature',
            'search_items'       => 'Search Car Features',
            'not_found'          => 'No car features found',
            'menu_name'          => 'Car Features',
        ),
        'public'             => true,
        'publicly_queryable' => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'show_in_rest'       => true, // Enable Gutenberg editor
        'query_var'          => true,
        'rewrite'            => array( 'slug' => 'features' ),
        'capability_type'    => 'post',
        'has_archive'        => true,
        'hierarchical'       => false,
        'menu_position'      => 5,
        'menu_icon'          => 'dashicons-car',
        'supports'           => array(
            'title',
            'editor',
            'author',
            'thumbnail',
            'excerpt',
            'custom-fields',
            'revisions',
        ),
    ));
}
add_action( 'init', 'vaahan_register_post_types' );


/* ============================================================
   5. CUSTOM TAXONOMIES
   ============================================================ */

/**
 * Register 'Feature Category' taxonomy.
 * Categories: Safety Tech, Drivetrain, Connected Car, EV, Worth Paying For, Indian Road Reality
 */
function vaahan_register_taxonomies() {

    register_taxonomy( 'feature_category', array( 'post', 'car_feature' ), array(
        'labels' => array(
            'name'              => 'Feature Categories',
            'singular_name'     => 'Feature Category',
            'search_items'      => 'Search Categories',
            'all_items'         => 'All Categories',
            'edit_item'         => 'Edit Category',
            'update_item'       => 'Update Category',
            'add_new_item'      => 'Add New Category',
            'menu_name'         => 'Feature Categories',
        ),
        'hierarchical'      => true,
        'show_ui'           => true,
        'show_in_rest'      => true,
        'show_admin_column' => true,
        'query_var'         => true,
        'rewrite'           => array( 'slug' => 'category' ),
    ));
}
add_action( 'init', 'vaahan_register_taxonomies' );


/* ============================================================
   6. CUSTOM META BOXES (Article Fields)
   ============================================================ */

/**
 * Add custom fields to posts and car_feature post type.
 * Fields: Read Time, Verdict (Yes/No/Depends), Feature Rating
 */
function vaahan_add_meta_boxes() {

    $screens = array( 'post', 'car_feature' );

    add_meta_box(
        'vaahan_article_details',
        'Vaahan Article Details',
        'vaahan_article_details_callback',
        $screens,
        'side',
        'high'
    );
}
add_action( 'add_meta_boxes', 'vaahan_add_meta_boxes' );

function vaahan_article_details_callback( $post ) {
    wp_nonce_field( 'vaahan_article_details_nonce', 'vaahan_nonce_field' );

    $read_time  = get_post_meta( $post->ID, '_vaahan_read_time', true );
    $verdict    = get_post_meta( $post->ID, '_vaahan_verdict', true );
    $rating     = get_post_meta( $post->ID, '_vaahan_rating', true );
    ?>
    <table class="form-table">
        <tr>
            <td><label><strong>Read Time (mins)</strong></label></td>
            <td>
                <input type="number" name="vaahan_read_time"
                       value="<?php echo esc_attr( $read_time ); ?>"
                       min="1" max="60" style="width:60px;" />
            </td>
        </tr>
        <tr>
            <td><label><strong>Verdict</strong></label></td>
            <td>
                <select name="vaahan_verdict">
                    <option value="">— Select —</option>
                    <option value="yes"     <?php selected( $verdict, 'yes' ); ?>>✅ Yes — Buy It</option>
                    <option value="no"      <?php selected( $verdict, 'no' ); ?>>❌ No — Skip It</option>
                    <option value="depends" <?php selected( $verdict, 'depends' ); ?>>⚠️ Depends</option>
                </select>
            </td>
        </tr>
        <tr>
            <td><label><strong>Feature Rating (1–5)</strong></label></td>
            <td>
                <input type="number" name="vaahan_rating"
                       value="<?php echo esc_attr( $rating ); ?>"
                       min="1" max="5" style="width:60px;" />
            </td>
        </tr>
    </table>
    <?php
}

function vaahan_save_article_details( $post_id ) {

    // Security checks
    if ( ! isset( $_POST['vaahan_nonce_field'] ) ) return;
    if ( ! wp_verify_nonce( $_POST['vaahan_nonce_field'], 'vaahan_article_details_nonce' ) ) return;
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
    if ( ! current_user_can( 'edit_post', $post_id ) ) return;

    // Save fields
    if ( isset( $_POST['vaahan_read_time'] ) ) {
        update_post_meta( $post_id, '_vaahan_read_time', absint( $_POST['vaahan_read_time'] ) );
    }
    if ( isset( $_POST['vaahan_verdict'] ) ) {
        update_post_meta( $post_id, '_vaahan_verdict', sanitize_text_field( $_POST['vaahan_verdict'] ) );
    }
    if ( isset( $_POST['vaahan_rating'] ) ) {
        update_post_meta( $post_id, '_vaahan_rating', absint( $_POST['vaahan_rating'] ) );
    }
}
add_action( 'save_post', 'vaahan_save_article_details' );


/* ============================================================
   7. SCHEMA MARKUP (SEO)
   ============================================================ */

/**
 * Add Article schema markup to single posts.
 * This helps Google display rich results.
 */
function vaahan_add_article_schema() {

    if ( ! is_single() ) return;

    global $post;

    $schema = array(
        '@context'         => 'https://schema.org',
        '@type'            => 'Article',
        'headline'         => get_the_title(),
        'description'      => get_the_excerpt(),
        'datePublished'    => get_the_date( 'c' ),
        'dateModified'     => get_the_modified_date( 'c' ),
        'author'           => array(
            '@type' => 'Organization',
            'name'  => 'Vaahan International',
            'url'   => get_site_url(),
        ),
        'publisher'        => array(
            '@type' => 'Organization',
            'name'  => 'Vaahan International',
            'url'   => get_site_url(),
        ),
        'mainEntityOfPage' => array(
            '@type' => '@id',
            '@id'   => get_permalink(),
        ),
    );

    // Add featured image if exists
    if ( has_post_thumbnail() ) {
        $img = wp_get_attachment_image_src( get_post_thumbnail_id(), 'vaahan-featured' );
        if ( $img ) {
            $schema['image'] = array(
                '@type'  => 'ImageObject',
                'url'    => $img[0],
                'width'  => $img[1],
                'height' => $img[2],
            );
        }
    }

    echo '<script type="application/ld+json">'
        . wp_json_encode( $schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES )
        . '</script>' . "\n";
}
add_action( 'wp_head', 'vaahan_add_article_schema' );


/* ============================================================
   8. CUSTOM EXCERPT
   ============================================================ */

function vaahan_custom_excerpt_length( $length ) {
    return 30; // words
}
add_filter( 'excerpt_length', 'vaahan_custom_excerpt_length' );

function vaahan_custom_excerpt_more( $more ) {
    return '...';
}
add_filter( 'excerpt_more', 'vaahan_custom_excerpt_more' );


/* ============================================================
   9. SECURITY HARDENING
   ============================================================ */

// Remove WordPress version from head (security)
remove_action( 'wp_head', 'wp_generator' );

// Remove unnecessary meta tags
remove_action( 'wp_head', 'wlwmanifest_link' );
remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'wp_shortlink_wp_head' );

// Disable XML-RPC (security)
add_filter( 'xmlrpc_enabled', '__return_false' );

// Disable file editing from WP admin (security)
if ( ! defined( 'DISALLOW_FILE_EDIT' ) ) {
    define( 'DISALLOW_FILE_EDIT', true );
}


/* ============================================================
   10. ADMIN CUSTOMISATION
   ============================================================ */

// Add Vaahan branding to admin login page
function vaahan_login_logo() {
    ?>
    <style>
        .login h1 a {
            background-image: url('<?php echo get_stylesheet_directory_uri(); ?>/assets/images/logo.png') !important;
            background-size: contain !important;
            width: 200px !important;
            height: 60px !important;
        }
    </style>
    <?php
}
add_action( 'login_enqueue_scripts', 'vaahan_login_logo' );

// Add custom dashboard widget
function vaahan_dashboard_widget() {
    wp_add_dashboard_widget(
        'vaahan_quick_links',
        '🚗 Vaahan Quick Links',
        'vaahan_dashboard_widget_content'
    );
}
add_action( 'wp_dashboard_setup', 'vaahan_dashboard_widget' );

function vaahan_dashboard_widget_content() {
    echo '<p><strong>Vaahan International</strong> — Content Management</p>';
    echo '<ul>';
    echo '<li><a href="' . admin_url( 'post-new.php' ) . '">✏️ Write New Article</a></li>';
    echo '<li><a href="' . admin_url( 'edit.php' ) . '">📄 All Articles</a></li>';
    echo '<li><a href="' . admin_url( 'admin.php?page=rank-math' ) . '">📈 Rank Math SEO</a></li>';
    echo '<li><a href="https://analytics.google.com" target="_blank">📊 Google Analytics</a></li>';
    echo '<li><a href="https://search.google.com/search-console" target="_blank">🔍 Search Console</a></li>';
    echo '</ul>';
}


/* ============================================================
   END OF functions.php
   ============================================================ */
