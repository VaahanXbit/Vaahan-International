<?php
/**
 * Vaahan Core — Widgets
 * includes/widgets.php
 *
 * Custom sidebar and footer widgets.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

/* ============================================================
   NEWSLETTER WIDGET
   Embeds newsletter signup in sidebars / footers
   ============================================================ */

class Vaahan_Newsletter_Widget extends WP_Widget {

    public function __construct() {
        parent::__construct(
            'vaahan_newsletter',
            'Vaahan — Newsletter Signup',
            array( 'description' => 'Newsletter signup widget for Vaahan International.' )
        );
    }

    public function widget( $args, $instance ) {
        echo $args['before_widget'];
        ?>
        <div class="vaahan-newsletter-widget">
            <h4><?php echo esc_html( $instance['title'] ?? 'Get Weekly Car Guides' ); ?></h4>
            <p><?php echo esc_html( $instance['subtitle'] ?? 'One feature explained every week. Free.' ); ?></p>
            <form id="vaahan-newsletter-form" class="vaahan-nl-form">
                <input type="email" placeholder="your@email.com" required class="vaahan-nl-input">
                <button type="submit" class="vaahan-btn-primary">Subscribe →</button>
            </form>
            <div id="vaahan-nl-success" style="display:none;color:#16A34A;font-size:0.85rem;margin-top:0.5rem;">
                ✓ You're in. First guide coming this week.
            </div>
        </div>
        <?php
        echo $args['after_widget'];
    }

    public function form( $instance ) {
        ?>
        <p>
            <label>Title</label>
            <input class="widefat" type="text" name="<?php echo $this->get_field_name('title'); ?>"
                   value="<?php echo esc_attr( $instance['title'] ?? '' ); ?>">
        </p>
        <p>
            <label>Subtitle</label>
            <input class="widefat" type="text" name="<?php echo $this->get_field_name('subtitle'); ?>"
                   value="<?php echo esc_attr( $instance['subtitle'] ?? '' ); ?>">
        </p>
        <?php
    }

    public function update( $new_instance, $old_instance ) {
        return array(
            'title'    => sanitize_text_field( $new_instance['title'] ),
            'subtitle' => sanitize_text_field( $new_instance['subtitle'] ),
        );
    }
}

function vaahan_register_widgets() {
    register_widget( 'Vaahan_Newsletter_Widget' );
}
add_action( 'widgets_init', 'vaahan_register_widgets' );
