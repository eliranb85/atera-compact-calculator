<?php
/**
 * Plugin Name: Atera Compact Calculator
 * Description: Dynamic Gutenberg block and REST API for Atera compact savings calculator.
 * Author: Atera
 * Version: 1.0.0
 * Text Domain: atera-compact-calculator
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ATERA_CC_FILE', __FILE__ );
define( 'ATERA_CC_DIR', plugin_dir_path( __FILE__ ) );
define( 'ATERA_CC_URL', plugins_url( '/', __FILE__ ) );
define( 'ATERA_CC_VERSION', '1.0.0' );

require_once ATERA_CC_DIR . 'includes/class-atera-rest.php';

add_action( 'init', function () {
	// Fonts stylesheet (you will add actual font files under assets/fonts)
	wp_register_style(
		'atera-cc-fonts',
		ATERA_CC_URL . 'assets/css/fonts.css',
		[],
		ATERA_CC_VERSION
	);

	// Frontend styles
	wp_register_style(
		'atera-cc-style',
		ATERA_CC_URL . 'blocks/atera-compact-calculator/style.css',
		[],
		ATERA_CC_VERSION
	);

	// Editor script
	wp_register_script(
		'atera-cc-editor',
		ATERA_CC_URL . 'blocks/atera-compact-calculator/index.js',
		[ 'wp-blocks', 'wp-element', 'wp-i18n', 'wp-components', 'wp-block-editor' ],
		ATERA_CC_VERSION,
		true
	);

	// Frontend script
	wp_register_script(
		'atera-cc-view',
		ATERA_CC_URL . 'blocks/atera-compact-calculator/view.js',
		[ 'wp-element' ],
		ATERA_CC_VERSION,
		true
	);

	register_block_type(
		__DIR__ . '/blocks/atera-compact-calculator',
		[
			'render_callback' => function ( $attributes, $content ) {
				wp_enqueue_style( 'atera-cc-fonts' );
				wp_enqueue_style( 'atera-cc-style' );
				wp_enqueue_script( 'atera-cc-view' );

				$attrs = wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );

				ob_start();
				?>
				<div class="atera-compact-calculator" data-attrs="<?php echo esc_attr( $attrs ); ?>" 
					data-show-email-desktop="<?php echo esc_attr( isset( $attributes['showEmailFieldDesktop'] ) && $attributes['showEmailFieldDesktop'] === false ? 'false' : 'true' ); ?>"
					data-show-email-mobile="<?php echo esc_attr( isset( $attributes['showEmailFieldMobile'] ) && $attributes['showEmailFieldMobile'] === false ? 'false' : 'true' ); ?>">
					<div class="atera-cc atera-cc__grid" aria-live="polite">
						<div class="atera-cc__intro">
							<h2 class="atera-cc__headline"></h2>
							<p class="atera-cc__headline-sub" hidden></p>
						</div>
						<div class="atera-cc__panel atera-cc__panel--calc" role="group" aria-label="<?php echo esc_attr__( 'Calculator sliders', 'atera-compact-calculator' ); ?>">
							<div class="atera-cc__panel-header">
								<div class="atera-cc__panel-title" style="<?php
									echo 'font-size: ' . esc_attr( ( isset( $attributes['panelTitleFontSize'] ) ? $attributes['panelTitleFontSize'] : 12 ) ) . 'px;';
									echo 'color: ' . esc_attr( isset( $attributes['panelTitleColor'] ) ? $attributes['panelTitleColor'] : '#475569' ) . ';';
									echo 'font-weight: ' . ( isset( $attributes['panelTitleBold'] ) && $attributes['panelTitleBold'] ? 'bold' : 'normal' ) . ';';
								?>"></div>
							</div>
							<div class="atera-cc__sliders">
								<!-- sliders injected by JS -->
							</div>
						</div>
						<aside class="atera-cc__panel atera-cc__panel--result" aria-live="polite">
							<div class="atera-cc__save-label"></div>
							<div class="atera-cc__save-value"></div>
							<div class="atera-cc__save-sub"></div>
							<div class="atera-cc__email-wrapper">
								<input type="email" class="atera-cc__email" placeholder="<?php echo esc_attr__( 'Enter your work email', 'atera-compact-calculator' ); ?>" aria-label="<?php echo esc_attr__( 'Enter your work email', 'atera-compact-calculator' ); ?>">
								<div class="atera-cc__thank-you" style="display: none;"><?php echo esc_html__( 'Thank you', 'atera-compact-calculator' ); ?></div>
							</div>
							<?php
							$cta_url = isset( $attributes['ctaUrl'] ) ? trim( $attributes['ctaUrl'] ) : '';
							if ( $cta_url ) {
								?>
								<a class="atera-cc__cta" href="<?php echo esc_url( $cta_url ); ?>" role="button"></a>
								<?php
							} else {
								?>
								<button class="atera-cc__cta" type="button"></button>
								<?php
							}
							?>
							<div class="atera-cc__cta-note"><?php echo esc_html( isset( $attributes['ctaNote'] ) && $attributes['ctaNote'] ? $attributes['ctaNote'] : __( 'No credit card required', 'atera-compact-calculator' ) ); ?></div>
							<div class="atera-cc__costs">
								<div class="atera-cc__costs-title"></div>
								<div class="atera-cc__costs-row">
									<span class="atera-cc__costs-name atera-cc__costs-name--atera"></span>
									<span class="atera-cc__costs-val atera-cc__costs-val--atera"></span>
								</div>
								<div class="atera-cc__costs-row">
									<span class="atera-cc__costs-name atera-cc__costs-name--provider"></span>
									<span class="atera-cc__costs-val atera-cc__costs-val--provider"></span>
								</div>
							</div>
							<div class="atera-cc__footnote" hidden></div>
						</aside>
					</div>
				</div>
				<?php
				return ob_get_clean();
			},
			'style'         => 'atera-cc-style',
			'editor_script' => 'atera-cc-editor',
			'script'        => 'atera-cc-view',
		]
	);
} );

// Enqueue view.js and fonts in editor as well
add_action( 'enqueue_block_editor_assets', function () {
	wp_enqueue_style( 'atera-cc-fonts' );
	wp_enqueue_script( 'atera-cc-view' );
} );


